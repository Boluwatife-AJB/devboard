use async_graphql::{ID, InputObject};

use crate::types::GqlNotificationKind;

#[derive(InputObject)]
pub struct UpdateNotificationPreferencesInput {
    pub kind: GqlNotificationKind,
    pub in_app: bool,
    pub email: bool,
    pub push: bool,
}

#[derive(InputObject)]
pub struct RegisterPushSubscriptionInput {
    pub endpoint: String,
    pub p256dh: String,
    pub auth: String,
    pub user_agent: Option<String>,
}

#[derive(InputObject)]
pub struct UnregisterPushSubscriptionInput {
    pub endpoint: String,
}

#[derive(InputObject)]
pub struct SendAnnouncementInput {
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub recipient_ids: Vec<ID>,
}
