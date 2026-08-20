use async_trait::async_trait;
use chrono::{DateTime, Utc};
use devboard_db::entities::notification;
use devboard_domain::{
    Notification, NotificationId, NotificationKind, NotificationPreference, OrganizationId,
    PushSubscription, UserId,
};

use crate::RepositoryError;
use std::str::FromStr;
pub mod pg;

#[derive(Debug)]
pub struct CreateNotification {
    pub id: NotificationId,
    pub recipient_id: UserId,
    pub organization_id: OrganizationId,
    pub kind: NotificationKind,
    pub title: String,
    pub body: Option<String>,
    pub action_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug)]
pub struct ListNotifications {
    pub recipient_id: UserId,
    pub organization_id: OrganizationId,
    pub unread_only: bool,
    pub limit: u64,
    pub before_id: Option<NotificationId>,
}

#[derive(Debug)]
pub struct SavePushSubscription {
    pub user_id: UserId,
    pub endpoint: String,
    pub p256dh: String,
    pub auth: String,
    pub user_agent: Option<String>,
}

#[async_trait]
pub trait NotificationRepository: Send + Sync {
    async fn create(
        &self,
        notification: CreateNotification,
    ) -> Result<Notification, RepositoryError>;

    async fn list(
        &self,
        list_notifications: ListNotifications,
    ) -> Result<Vec<Notification>, RepositoryError>;

    async fn unread_count(
        &self,
        recipient_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<u64, RepositoryError>;

    async fn mark_as_read(
        &self,
        id: NotificationId,
        recipient_id: UserId,
    ) -> Result<(), RepositoryError>;

    async fn mark_all_as_read(
        &self,
        recipient_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<u64, RepositoryError>;

    async fn find_pending_email(
        &self,
        after: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<Notification>, RepositoryError>;

    async fn mark_email_sent(&self, ids: Vec<NotificationId>) -> Result<(), RepositoryError>;

    async fn get_preferences(
        &self,
        user_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<Vec<NotificationPreference>, RepositoryError>;

    async fn update_preferences(
        &self,
        preferences: NotificationPreference,
    ) -> Result<NotificationPreference, RepositoryError>;

    async fn get_push_subscriptions(
        &self,
        user_id: UserId,
    ) -> Result<Vec<PushSubscription>, RepositoryError>;

    async fn save_push_subscription(
        &self,
        push_subscription: SavePushSubscription,
    ) -> Result<(), RepositoryError>;

    async fn delete_push_subscription(
        &self,
        user_id: UserId,
        endpoint: String,
    ) -> Result<(), RepositoryError>;
}

pub(crate) fn model_to_domain(model: notification::Model) -> Result<Notification, RepositoryError> {
    let kind =
        NotificationKind::from_str(&model.kind).map_err(|_| RepositoryError::InvalidData {
            message: format!("Invalid notification kind: {}", model.kind),
        })?;

    Ok(Notification {
        id: NotificationId::from(model.id),
        recipient_id: UserId::from(model.recipient_id),
        organization_id: OrganizationId::from(model.organization_id),
        kind,
        title: model.title,
        body: model.body,
        action_url: model.action_url,
        metadata: model.metadata,
        read_at: model.read_at.map(Into::into),
        email_sent_at: model.email_sent_at.map(Into::into),
        created_at: model.created_at.into(),
    })
}
