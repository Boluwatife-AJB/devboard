use std::{collections::HashMap, sync::Arc, time::Duration};

use chrono::Utc;
use devboard_domain::{Notification, UserId};
use devboard_repository::{NotificationRepository, TaskRepository};

use crate::NotificationService;

pub fn spawn_due_soon_checker(
    _task_repo: Arc<dyn TaskRepository>,
    _notification_service: Arc<NotificationService>,
) {
    tokio::spawn(async move {
        tracing::info!("Starting due soon notification checker");

        loop {
            tokio::time::sleep(Duration::from_secs(3600)).await;

            tracing::info!("Checking for tasks due soon");

            tracing::info!("due-soon check complete");
        }
    });
}

pub fn spawn_email_digest_job(
    notification_repo: Arc<dyn NotificationRepository>,
    _notification_service: Arc<NotificationService>,
) {
    tokio::spawn(async move {
        tracing::info!("Starting email digest job");

        loop {
            tokio::time::sleep(Duration::from_secs(3600)).await;

            tracing::info!("running email digest job");

            let cutoff = Utc::now() - chrono::Duration::minutes(5);

            match notification_repo.find_pending_email(cutoff, 50).await {
                Err(e) => {
                    tracing::error!(error = %e, 
              "error finding pending email digests");
                    continue;
                }
                Ok(pending) if pending.is_empty() => continue,
                Ok(pending) => {
                    let mut by_recipient: HashMap<UserId, Vec<Notification>> = HashMap::new();

                    for notification in &pending {
                        by_recipient
                            .entry(notification.recipient_id)
                            .or_default()
                            .push(notification.clone());
                    }

                    let mut sent_ids = Vec::new();

                    for (recipient_id, notifications) in by_recipient {
                        tracing::debug!(
                          recipient_id = %recipient_id,
                          count = %notifications.len(),
                          "processing email digest for recipient"
                        );

                        sent_ids.extend(notifications.iter().map(|n| n.id));
                    }

                    if !sent_ids.is_empty()
                        && let Err(e) = notification_repo.mark_email_sent(sent_ids).await
                    {
                        tracing::error!(error = %e,
                  "error marking notifications as sent");
                    }
                    tracing::info!("email digest job complete");
                }
            }
        }
    });
}
