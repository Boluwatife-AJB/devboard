use async_graphql::{Enum, ID, SimpleObject};
use chrono::{DateTime, Utc};
use devboard_domain::{Notification, NotificationKind};

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlNotificationKind {
    TaskAssigned,
    TaskDueSoon,
    TaskStatusChanged,
    TaskCreated,
    Mention,
    TaskComment,
    ChannelMessage,
    DmThreadMessage,
    InviteReceived,
    Announcement,
}

impl From<NotificationKind> for GqlNotificationKind {
    fn from(k: NotificationKind) -> Self {
        match k {
            NotificationKind::TaskAssigned => Self::TaskAssigned,
            NotificationKind::TaskDueSoon => Self::TaskDueSoon,
            NotificationKind::TaskStatusChanged => Self::TaskStatusChanged,
            NotificationKind::TaskCreated => Self::TaskCreated,
            NotificationKind::Mention => Self::Mention,
            NotificationKind::TaskComment => Self::TaskComment,
            NotificationKind::ChannelMessage => Self::ChannelMessage,
            NotificationKind::DmThreadMessage => Self::DmThreadMessage,
            NotificationKind::InviteReceived => Self::InviteReceived,
            NotificationKind::Announcement => Self::Announcement,
        }
    }
}

impl From<GqlNotificationKind> for NotificationKind {
    fn from(k: GqlNotificationKind) -> Self {
        match k {
            GqlNotificationKind::TaskAssigned => Self::TaskAssigned,
            GqlNotificationKind::TaskDueSoon => Self::TaskDueSoon,
            GqlNotificationKind::TaskStatusChanged => Self::TaskStatusChanged,
            GqlNotificationKind::TaskCreated => Self::TaskCreated,
            GqlNotificationKind::Mention => Self::Mention,
            GqlNotificationKind::TaskComment => Self::TaskComment,
            GqlNotificationKind::ChannelMessage => Self::ChannelMessage,
            GqlNotificationKind::DmThreadMessage => Self::DmThreadMessage,
            GqlNotificationKind::InviteReceived => Self::InviteReceived,
            GqlNotificationKind::Announcement => Self::Announcement,
        }
    }
}

#[derive(SimpleObject, Clone)]
pub struct GqlNotification {
    pub id: ID,
    pub kind: GqlNotificationKind,
    pub title: String,
    pub body: Option<String>,
    pub action_url: Option<String>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

impl From<Notification> for GqlNotification {
    fn from(n: Notification) -> Self {
        let is_read = n.is_read();
        Self {
            id: ID(n.id.to_string()),
            kind: GqlNotificationKind::from(n.kind),
            title: n.title,
            body: n.body,
            action_url: n.action_url,
            is_read,
            created_at: n.created_at,
        }
    }
}

#[derive(SimpleObject, Clone)]
pub struct GqlNotificationPreference {
    pub kind: GqlNotificationKind,
    pub in_app: bool,
    pub email: bool,
    pub push: bool,
}
