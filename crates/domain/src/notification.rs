use std::str::FromStr;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{NotificationId, OrganizationId, UserId};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
pub enum NotificationKind {
    TaskAssigned,
    TaskDueSoon,
    TaskStatusChanged,
    TaskCreated,
    TaskComment,
    Mention,
    ChannelMessage,
    DmThreadMessage,
    InviteReceived,
    Announcement,
}

impl NotificationKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::TaskAssigned => "TASK_ASSIGNED",
            Self::TaskDueSoon => "TASK_DUE_SOON",
            Self::TaskStatusChanged => "TASK_STATUS_CHANGED",
            Self::TaskCreated => "TASK_CREATED",
            Self::TaskComment => "TASK_COMMENT",
            Self::Mention => "MENTION",
            Self::ChannelMessage => "CHANNEL_MESSAGE",
            Self::DmThreadMessage => "DM_THREAD_MESSAGE",
            Self::InviteReceived => "INVITE_RECEIVED",
            Self::Announcement => "ANNOUNCEMENT",
        }
    }

    pub fn default_email(&self) -> bool {
        matches!(
            self,
            Self::TaskAssigned
                | Self::TaskDueSoon
                | Self::Mention
                | Self::InviteReceived
                | Self::Announcement
        )
    }

    pub fn default_push(&self) -> bool {
        matches!(
            self,
            Self::TaskAssigned | Self::Mention | Self::InviteReceived | Self::DmThreadMessage
        )
    }
}

impl FromStr for NotificationKind {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "TASK_ASSIGNED" => Ok(Self::TaskAssigned),
            "TASK_DUE_SOON" => Ok(Self::TaskDueSoon),
            "TASK_STATUS_CHANGED" => Ok(Self::TaskStatusChanged),
            "TASK_CREATED" => Ok(Self::TaskCreated),
            "TASK_COMMENT" => Ok(Self::TaskComment),
            "MENTION" => Ok(Self::Mention),
            "CHANNEL_MESSAGE" => Ok(Self::ChannelMessage),
            "DM_THREAD_MESSAGE" => Ok(Self::DmThreadMessage),
            "INVITE_RECEIVED" => Ok(Self::InviteReceived),
            "ANNOUNCEMENT" => Ok(Self::Announcement),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: NotificationId,
    pub recipient_id: UserId,
    pub organization_id: OrganizationId,
    pub kind: NotificationKind,
    pub title: String,
    pub body: Option<String>,
    pub action_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub read_at: Option<DateTime<Utc>>,
    pub email_sent_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl Notification {
    pub fn is_read(&self) -> bool {
        self.read_at.is_some()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationPreference {
    pub user_id: UserId,
    pub organization_id: OrganizationId,
    pub kind: NotificationKind,
    pub in_app: bool,
    pub email: bool,
    pub push: bool,
}

pub struct PushSubscription {
    pub id: UserId,
    pub user_id: UserId,
    pub endpoint: String,
    pub p256dh: String,
    pub auth: String,
    pub user_agent: Option<String>,
}
