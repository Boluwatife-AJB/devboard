use std::sync::Arc;

use devboard_domain::MessageEmbed;
use devboard_repository::messaging::MessageRepository;
use tokio::sync::mpsc;

use crate::messaging::UnfurlJob;

fn extract_urls(body: &str) -> Vec<String> {
    body.split_whitespace()
        .filter(|word| word.starts_with("http") || word.starts_with("https"))
        .take(5)
        .map(|s| s.trim_matches(|c: char| !c.is_alphanumeric()).to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

async fn fetch_og_metadata(url: &str) -> Option<MessageEmbed> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .user_agent("Devboard/1.0 (link preview bot)")
        .build()
        .ok()?;

    let response = client.get(url).send().await.ok()?;
    let html = response.text().await.ok()?;

    let title = extract_meta_content(&html, "og:title").or_else(|| extract_title_tag(&html));
    let description = extract_meta_content(&html, "og:description");
    let image_url = extract_meta_content(&html, "og:image");
    let site_name = extract_meta_content(&html, "og:site_name");

    Some(MessageEmbed::LinkPreview {
        url: url.to_string(),
        title,
        description,
        image_url,
        site_name,
    })
}

fn extract_meta_content(html: &str, property: &str) -> Option<String> {
    let search = format!("property=\"{}\"", property);
    let pos = html.find(&search)?;
    let after = &html[pos..];
    let content_pos = after.find("content=\"")?;
    let start = content_pos + 9;
    let end = after[start..].find('"')?;
    Some(after[start..start + end].to_string())
}

fn extract_title_tag(html: &str) -> Option<String> {
    let start = html.find("<title>")? + 7;
    let end = html[start..].find("</title>")?;
    Some(html[start..start + end].trim().to_string())
}

fn detect_github_embed(url: &str) -> Option<MessageEmbed> {
    if !url.contains("github.com") {
        return None;
    }

    if url.contains("/commit/") {
        let parts: Vec<&str> = url.split('/').collect();
        if parts.len() >= 7 {
            let repo = format!("{}/{}/{}", parts[3], parts[4], parts[5]);
            let sha = parts[6].to_string();
            return Some(MessageEmbed::GitHubCommit {
                repo,
                sha: sha[..8.min(sha.len())].to_string(),
                message: "View commit details".to_string(),
                url: url.to_string(),
            });
        }
    }

    if url.contains("/issues/") {
        let parts: Vec<&str> = url.split('/').collect();
        if parts.len() >= 7 {
            let repo = format!("{}/{}/{}", parts[3], parts[4], parts[5]);
            let issue_number = parts[6].to_string();
            return Some(MessageEmbed::GitHubIssue {
                repo,
                number: issue_number,
                title: "GitHub Issue".to_string(),
                state: "open".to_string(),
                url: url.to_string(),
            });
        }
    }

    if url.contains("/pull/") {
        let parts: Vec<&str> = url.split('/').collect();
        if parts.len() >= 7 {
            let repo = format!("{}/{}/{}", parts[3], parts[4], parts[5]);
            let pull_number = parts[6].to_string();
            return Some(MessageEmbed::GitHubPr {
                repo,
                number: pull_number,
                title: "GitHub Pull Request".to_string(),
                state: "open".to_string(),
                url: url.to_string(),
            });
        }
    }

    None
}

pub fn spawn_unfurl_worker(message_repo: Arc<dyn MessageRepository>) -> mpsc::Sender<UnfurlJob> {
    let (tx, mut rx) = mpsc::channel::<UnfurlJob>(256);

    tokio::spawn(async move {
        tracing::info!("unfurl worker started");

        while let Some(job) = rx.recv().await {
            let repo = message_repo.clone();
            let message_id = job.message_id;
            let body = job.body;

            tokio::spawn(async move {
                let urls = extract_urls(&body);

                if urls.is_empty() {
                    return;
                }

                let mut embeds = Vec::new();

                for url in &urls {
                    if let Some(embed) = detect_github_embed(url) {
                        embeds.push(embed);
                    } else if let Some(embed) = fetch_og_metadata(url).await {
                        embeds.push(embed);
                    }
                }

                if embeds.is_empty() {
                    return;
                }

                if let Err(e) = repo.update_embeds(message_id, embeds).await {
                    tracing::warn!(
                      message_id = %message_id,
                      error = %e,
                      "failed to store message embeds"
                    );
                } else {
                    tracing::debug!(
                      message_id = %message_id,
                      "message embeds stored successfully"
                    );
                }
            });
        }

        tracing::info!("unfurl worker stopped");
    });

    tx
}
