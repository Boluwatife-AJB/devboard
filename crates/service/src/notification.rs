use std::sync::Arc;

use chrono::{DateTime, Utc};
use devboard_domain::{
    ChannelId, DmThreadId, Notification, NotificationId, NotificationKind, NotificationPreference,
    OrganizationId, ProjectId, PushSubscription, TaskId, UserId,
};
use devboard_email::EmailProvider;
use devboard_repository::{
    NotificationRepository,
    notification::{CreateNotification, ListNotifications, SavePushSubscription},
};
use serde_json::json;
use tokio::sync::broadcast;

use crate::ServiceError;

#[derive(Debug, Clone)]
pub struct NotificationEvent {
    pub recipient_id: UserId,
    pub notification: Notification,
}

struct NotifyParams {
    recipient_id: UserId,
    organization_id: OrganizationId,
    kind: NotificationKind,
    title: String,
    body: Option<String>,
    action_url: Option<String>,
    metadata: Option<serde_json::Value>,
}

pub struct NotificationService {
    repo: Arc<dyn NotificationRepository>,
    email_provider: Arc<dyn EmailProvider>,
    tx: broadcast::Sender<NotificationEvent>,
    vapid_public: String,
    vapid_private: String,
    vapid_subject: String,
    app_base_url: String,
}

impl NotificationService {
    pub fn new(
        repo: Arc<dyn NotificationRepository>,
        email_provider: Arc<dyn EmailProvider>,
        vapid_public: String,
        vapid_private: String,
        vapid_subject: String,
        app_base_url: String,
    ) -> (Self, broadcast::Receiver<NotificationEvent>) {
        let (tx, rx) = broadcast::channel(512);
        (
            Self {
                repo,
                email_provider,
                tx,
                vapid_public,
                vapid_private,
                vapid_subject,
                app_base_url,
            },
            rx,
        )
    }

    pub fn subscribe(&self) -> broadcast::Receiver<NotificationEvent> {
        self.tx.subscribe()
    }

    pub async fn list(
        &self,
        list_notifications: ListNotifications,
    ) -> Result<Vec<Notification>, ServiceError> {
        self.repo
            .list(ListNotifications {
                recipient_id: list_notifications.recipient_id,
                organization_id: list_notifications.organization_id,
                unread_only: list_notifications.unread_only,
                limit: list_notifications.limit,
                before_id: list_notifications.before_id,
            })
            .await
            .map_err(ServiceError::from)
    }

    pub async fn unread_count(
        &self,
        recipient_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<u64, ServiceError> {
        self.repo
            .unread_count(recipient_id, organization_id)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn mark_as_read(
        &self,
        id: NotificationId,
        recipient_id: UserId,
    ) -> Result<(), ServiceError> {
        self.repo
            .mark_as_read(id, recipient_id)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn mark_all_as_read(
        &self,
        recipient_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<u64, ServiceError> {
        self.repo
            .mark_all_as_read(recipient_id, organization_id)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn get_preferences(
        &self,
        user_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<Vec<NotificationPreference>, ServiceError> {
        self.repo
            .get_preferences(user_id, organization_id)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn update_preferences(
        &self,
        preferences: NotificationPreference,
    ) -> Result<NotificationPreference, ServiceError> {
        let preferences = NotificationPreference {
            user_id: preferences.user_id,
            organization_id: preferences.organization_id,
            kind: preferences.kind,
            in_app: preferences.in_app,
            email: preferences.email,
            push: preferences.push,
        };
        self.repo
            .update_preferences(preferences)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn register_push(
        &self,
        user_id: UserId,
        endpoint: String,
        p256dh: String,
        auth: String,
        user_agent: Option<String>,
    ) -> Result<(), ServiceError> {
        self.repo
            .save_push_subscription(SavePushSubscription {
                user_id,
                endpoint,
                p256dh,
                auth,
                user_agent,
            })
            .await
            .map_err(ServiceError::from)
    }

    pub async fn unregister_push(
        &self,
        user_id: UserId,
        endpoint: String,
    ) -> Result<(), ServiceError> {
        self.repo
            .delete_push_subscription(user_id, endpoint)
            .await
            .map_err(ServiceError::from)
    }

    // Internal creation APIs
    #[tracing::instrument(skip(self, params), fields(recipient_id = %params.recipient_id, kind = %params.kind.as_str()))]
    async fn notify(&self, params: NotifyParams) -> Result<(), ServiceError> {
        let preferences = self
            .repo
            .get_preferences(params.recipient_id, params.organization_id)
            .await
            .map_err(ServiceError::from)?;

        let preference = preferences.iter().find(|p| p.kind == params.kind);

        let in_app = preference.map(|p| p.in_app).unwrap_or(true);
        let send_email = preference
            .map(|p| p.email)
            .unwrap_or(params.kind.default_email());
        let send_push = preference
            .map(|p| p.push)
            .unwrap_or(params.kind.default_push());

        if !in_app && send_email {
            self.dispatch_email_notification(
                params.recipient_id,
                &params.title,
                params.body.as_deref(),
                params.action_url.as_deref(),
            )
            .await;
            return Ok(());
        }

        let notification = self
            .repo
            .create(CreateNotification {
                id: NotificationId::new(),
                recipient_id: params.recipient_id,
                organization_id: params.organization_id,
                kind: params.kind,
                title: params.title.clone(),
                body: params.body.clone(),
                action_url: params.action_url.clone(),
                metadata: params.metadata,
            })
            .await
            .map_err(ServiceError::from)?;

        let _ = self.tx.send(NotificationEvent {
            recipient_id: params.recipient_id,
            notification: notification.clone(),
        });

        if send_email {
            let _svc = self.email_provider.clone();
            let _t = params.title.clone();
            let _b = params.body.clone();
            let _url = params.action_url.clone();
            tokio::spawn(async move {
                tracing::debug!("email notification dispatched (placeholder)");
            });
        }

        if send_push {
            let subscriptions = self
                .repo
                .get_push_subscriptions(notification.recipient_id)
                .await
                .map_err(ServiceError::from)?;

            if !subscriptions.is_empty() {
                let title_clone = params.title.clone();
                let body_clone = params.body.clone();
                let url_clone = params.action_url.clone();
                let vapid_pub = self.vapid_public.clone();
                let vapid_priv = self.vapid_private.clone();
                let vapid_subj = self.vapid_subject.clone();
                let _base_url = self.app_base_url.clone();

                tokio::spawn(async move {
                    send_web_push(
                        subscriptions,
                        &title_clone,
                        body_clone.as_deref(),
                        url_clone.as_deref(),
                        &vapid_pub,
                        &vapid_priv,
                        &vapid_subj,
                    )
                    .await;
                });
            }
        }

        Ok(())
    }

    pub async fn notify_task_assigned(
        &self,
        assignee_id: UserId,
        org_id: OrganizationId,
        task_title: &str,
        task_id: TaskId,
        project_key: &str,
        project_id: ProjectId,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id: assignee_id,
            organization_id: org_id,
            kind: NotificationKind::TaskAssigned,
            title: format!("Task were assigned to {}-{}", project_key, task_id),
            body: Some(format!("Task: {}", task_title)),
            action_url: Some(format!(
                "{}/projects/{}/tasks/{}",
                self.app_base_url, project_id, task_id
            )),
            metadata: Some(json!({
              "task_id": task_id.to_string(),
              "project_key": project_key,
            })),
        })
        .await
    }

    pub async fn notify_task_status_changed(
        &self,
        recipient_id: UserId,
        org_id: OrganizationId,
        task_title: &str,
        task_id: TaskId,
        project_key: &str,
        new_status: &str,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id,
            organization_id: org_id,
            kind: NotificationKind::TaskStatusChanged,
            title: format!("Task status changed for {}", new_status),
            body: Some(format!("\"{}\" moved to {}", task_title, new_status)),
            action_url: Some(format!("{}/tasks/{}", self.app_base_url, task_id)),
            metadata: Some(json!({
              "task_id": task_id.to_string(),
              "new_status": new_status,
              "project_key": project_key,
            })),
        })
        .await
    }

    pub async fn notify_task_due_soon(
        &self,
        assignee_id: UserId,
        org_id: OrganizationId,
        task_title: &str,
        task_id: TaskId,
        project_key: &str,
        due_at: DateTime<Utc>,
    ) -> Result<(), ServiceError> {
        let hours_remaining = (due_at - Utc::now()).num_hours().max(0);
        self.notify(NotifyParams {
            recipient_id: assignee_id,
            organization_id: org_id,
            kind: NotificationKind::TaskDueSoon,
            title: format!("Task due in {} hours", hours_remaining),
            body: Some(format!(
                "\"{}\" due in {} hours",
                task_title, hours_remaining
            )),
            action_url: Some(format!("{}/tasks/{}", self.app_base_url, task_id)),
            metadata: Some(json!({
              "task_id": task_id.to_string(),
              "project_key": project_key,
              "due_at": due_at.to_rfc3339(),
            })),
        })
        .await
    }

    pub async fn notify_task_created(
        &self,
        recipient_id: UserId,
        org_id: OrganizationId,
        task_title: &str,
        task_id: TaskId,
        project_key: &str,
        project_name: &str,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id,
            organization_id: org_id,
            kind: NotificationKind::TaskCreated,
            title: format!("Task created: {}", task_title),
            body: Some(format!("\"{}\" created", task_title)),
            action_url: Some(format!(
                "{}/projects/{}/tasks/{}",
                self.app_base_url, project_key, task_id
            )),
            metadata: Some(json!({
              "task_id": task_id.to_string(),
              "project_name": project_name,
              "project_key": project_key,
            })),
        })
        .await
    }

    pub async fn notify_task_comment(
        &self,
        recipient_id: UserId,
        org_id: OrganizationId,
        task_title: &str,
        task_id: TaskId,
        project_key: &str,
        commenter_name: &str,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id,
            organization_id: org_id,
            kind: NotificationKind::TaskComment,
            title: format!("New comment on {}", task_title),
            body: Some(format!(
                "\"{}\" commented on {}",
                commenter_name, task_title
            )),
            action_url: Some(format!(
                "{}/projects/{}/tasks/{}",
                self.app_base_url, project_key, task_id
            )),
            metadata: Some(json!({
              "task_id": task_id.to_string(),
              "project_key": project_key,
            })),
        })
        .await
    }

    pub async fn notify_mention(
        &self,
        mentioned_user_id: UserId,
        org_id: OrganizationId,
        mentioned_by: &str,
        context: &str,
        action_url: &str,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id: mentioned_user_id,
            organization_id: org_id,
            kind: NotificationKind::Mention,
            title: format!("You were mentioned by {}", mentioned_by),
            body: Some(context.to_string()),
            action_url: Some(action_url.to_string()),
            metadata: None,
        })
        .await
    }

    pub async fn notify_channel_mention(
        &self,
        mentioned_user_id: UserId,
        org_id: OrganizationId,
        mentioned_by: &str,
        context: &str,
        channel_id: ChannelId,
    ) -> Result<(), ServiceError> {
        let action_url = format!("{}/messages?channel_id={}", self.app_base_url, channel_id);
        self.notify_mention(
            mentioned_user_id,
            org_id,
            mentioned_by,
            context,
            &action_url,
        )
        .await
    }

    pub async fn notify_channel_message(
        &self,
        recipient_id: UserId,
        org_id: OrganizationId,
        channel_name: &str,
        sender_name: &str,
        preview: &str,
        channel_id: ChannelId,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id,
            organization_id: org_id,
            kind: NotificationKind::ChannelMessage,
            title: format!("New message in #{} from {}", channel_name, sender_name),
            body: Some(preview.chars().take(100).collect::<String>()),
            action_url: Some(format!(
                "{}/messages?channel_id={}",
                self.app_base_url, channel_id
            )),
            metadata: Some(json!({
              "channel_id": channel_id.to_string(),
            })),
        })
        .await
    }

    pub async fn notify_dm_message(
        &self,
        recipient_id: UserId,
        org_id: OrganizationId,
        sender_name: &str,
        preview: &str,
        thread_id: DmThreadId,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id,
            organization_id: org_id,
            kind: NotificationKind::DmThreadMessage,
            title: format!("New message from {}", sender_name),
            body: Some(preview.chars().take(100).collect::<String>()),
            action_url: Some(format!("{}/dms/{}", self.app_base_url, thread_id)),
            metadata: None,
        })
        .await
    }

    pub async fn notify_invite_received(
        &self,
        recipient_id: UserId,
        org_id: OrganizationId,
        org_name: &str,
        invited_by: &str,
        invite_url: String,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id,
            organization_id: org_id,
            kind: NotificationKind::InviteReceived,
            title: format!("You were invited to {} by {}", org_name, invited_by),
            body: Some(format!("Click to join {}", org_name)),
            action_url: Some(invite_url),
            metadata: Some(json!({"org_name": org_name})),
        })
        .await
    }

    pub async fn notify_announcement(
        &self,
        recipient_id: UserId,
        org_id: OrganizationId,
        announcement_title: String,
        announcement_body: String,
        action_url: Option<String>,
    ) -> Result<(), ServiceError> {
        self.notify(NotifyParams {
            recipient_id,
            organization_id: org_id,
            kind: NotificationKind::Announcement,
            title: announcement_title,
            body: Some(announcement_body),
            action_url,
            metadata: None,
        })
        .await
    }

    async fn dispatch_email_notification(
        &self,
        _recipient_id: UserId,
        _title: &str,
        _body: Option<&str>,
        _action_url: Option<&str>,
    ) {
        tracing::debug!("email notification enqueued");
    }
}

async fn send_web_push(
    subscriptions: Vec<PushSubscription>,
    title: &str,
    body: Option<&str>,
    url: Option<&str>,
    vapid_public: &str,
    vapid_private: &str,
    vapid_subject: &str,
) {
    let payload = serde_json::json!({
      "title": title,
      "body": body.unwrap_or(""),
      "url": url.unwrap_or("/"),
      "icon": "/icon-192.png",
      "badge": "/icon-192.png",
    });

    let payload_str = match serde_json::to_string(&payload) {
        Ok(s) => s,
        Err(e) => {
            tracing::warn!(
              error = %e,
              "failed to serialize push payload"
            );
            return;
        }
    };

    for subscription in subscriptions {
        let endpoint = subscription.endpoint.clone();
        let _p256dh = subscription.p256dh.clone();
        let _auth = subscription.auth.clone();
        let _payload = payload_str.clone();
        let _vp_pub = vapid_public.to_string();
        let _vp_priv = vapid_private.to_string();
        let _vp_subj = vapid_subject.to_string();

        tokio::spawn(async move {
            tracing::debug!(
              endpoint = %endpoint,
              "sending web push to endpoint"
            );
        });
    }
}
