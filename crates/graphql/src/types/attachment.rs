use async_graphql::{Enum, ID, SimpleObject};
use chrono::{DateTime, Utc};
use devboard_domain::{AttachmentKind, TaskAttachment};

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlAttachmentKind {
    Link,
    GithubIssue,
    GithubPr,
}

impl From<AttachmentKind> for GqlAttachmentKind {
    fn from(k: AttachmentKind) -> Self {
        match k {
            AttachmentKind::Link => Self::Link,
            AttachmentKind::GithubIssue => Self::GithubIssue,
            AttachmentKind::GithubPr => Self::GithubPr,
        }
    }
}

impl From<GqlAttachmentKind> for AttachmentKind {
    fn from(k: GqlAttachmentKind) -> Self {
        match k {
            GqlAttachmentKind::Link => Self::Link,
            GqlAttachmentKind::GithubIssue => Self::GithubIssue,
            GqlAttachmentKind::GithubPr => Self::GithubPr,
        }
    }
}

#[derive(SimpleObject)]
pub struct GqlAttachment {
    pub id: ID,
    pub task_id: ID,
    pub added_by: ID,
    pub kind: GqlAttachmentKind,
    pub label: String,
    pub url: String,
    pub created_at: DateTime<Utc>,
}

impl From<TaskAttachment> for GqlAttachment {
    fn from(a: TaskAttachment) -> Self {
        Self {
            id: ID(a.id.to_string()),
            task_id: ID(a.task_id.to_string()),
            added_by: ID(a.added_by.to_string()),
            kind: GqlAttachmentKind::from(a.kind),
            label: a.label,
            url: a.url,
            created_at: a.created_at,
        }
    }
}
