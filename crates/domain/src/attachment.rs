use std::str::FromStr;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{AttachmentId, TaskId, UserId};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AttachmentKind {
    Link,
    GithubIssue,
    GithubPr,
}

impl AttachmentKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            AttachmentKind::Link => "LINK",
            AttachmentKind::GithubIssue => "GITHUB_ISSUE",
            AttachmentKind::GithubPr => "GithubPr",
        }
    }
}

impl FromStr for AttachmentKind {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "LINK" => Ok(Self::Link),
            "GITHUB_ISSUE" => Ok(Self::GithubIssue),
            "GITHUB_PR" => Ok(Self::GithubPr),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskAttachment {
    pub id: AttachmentId,
    pub task_id: TaskId,
    pub added_by: UserId,
    pub kind: AttachmentKind,
    pub label: String,
    pub url: String,
    pub created_at: DateTime<Utc>,
}
