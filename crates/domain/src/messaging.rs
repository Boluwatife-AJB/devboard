use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{ChannelId, DmMessageId, DmThreadId, MessageId, OrganizationId, UserId};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ChannelKind {
    Open,
    Private,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Channel {
    pub id: ChannelId,
    pub organization_id: OrganizationId,
    pub created_by: UserId,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub kind: ChannelKind,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelMember {
    pub channel_id: ChannelId,
    pub user_id: UserId,
    pub joined_at: DateTime<Utc>,
    pub last_read_message_id: Option<MessageId>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MessageEmbed {
    LinkPreview {
        url: String,
        title: Option<String>,
        description: Option<String>,
        image_url: Option<String>,
        site_name: Option<String>,
    },
    GitHubCommit {
        repo: String,
        sha: String,
        message: String,
        url: String,
    },
    GitHubIssue {
        repo: String,
        number: String,
        title: String,
        state: String,
        url: String,
    },
    GitHubPr {
        repo: String,
        number: String,
        title: String,
        state: String,
        url: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: MessageId,
    pub channel_id: ChannelId,
    pub author_id: UserId,
    pub body: String,
    pub embeds: Vec<MessageEmbed>,
    pub edited_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl Message {
    pub fn is_edited(&self) -> bool {
        self.edited_at.is_none()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReactionSummary {
    pub emoji: String,
    pub count: u32,
    pub reacted_by_me: bool,
}

pub const ALLOWED_REACTIONS: &[&str] = &[
    "👍", "❤️", "🚀", "👀", "👎", "🤔", "👏", "✅", "😂", "🎉", "🔥",
];

pub fn is_allowed_reaction(emoji: &str) -> bool {
    ALLOWED_REACTIONS.contains(&emoji)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DmThread {
    pub id: DmThreadId,
    pub participant_a: UserId,
    pub participant_b: UserId,
    pub created_at: DateTime<Utc>,
}

impl DmThread {
    pub fn other_participant(&self, me: UserId) -> Option<UserId> {
        if self.participant_a == me {
            Some(self.participant_b)
        } else if self.participant_b == me {
            Some(self.participant_a)
        } else {
            None
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DmMessage {
    pub id: DmMessageId,
    pub thread_id: DmThreadId,
    pub author_id: UserId,
    pub body: String,
    pub edited_at: Option<DateTime<Utc>>,
    pub read_by_recipient_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl DmMessage {
    pub fn is_read(&self) -> bool {
        self.read_by_recipient_at.is_some()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PresenceStatus {
    Online,
    Away,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPresence {
    pub user_id: UserId,
    pub status: PresenceStatus,
    pub last_seen: DateTime<Utc>,
}
