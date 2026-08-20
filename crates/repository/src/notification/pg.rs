use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend,
    EntityTrait, QueryFilter, QueryOrder, QuerySelect, Statement,
};
use std::str::FromStr;
use uuid::Uuid;

use devboard_db::entities::notification::{self, Entity as NotificationEntity};
use devboard_domain::{
    Notification, NotificationId, NotificationKind, NotificationPreference, OrganizationId,
    PushSubscription, UserId,
};

use crate::{
    RepositoryError,
    notification::{
        CreateNotification, ListNotifications, NotificationRepository, SavePushSubscription,
        model_to_domain,
    },
};

pub struct PgNotificationRepository {
    db: DatabaseConnection,
}

impl PgNotificationRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl NotificationRepository for PgNotificationRepository {
    #[tracing::instrument(
        skip(self, notification),
        fields(
            recipient_id = %notification.recipient_id,
            kind = %notification.kind.as_str()
        )
    )]
    async fn create(
        &self,
        notification: CreateNotification,
    ) -> Result<Notification, RepositoryError> {
        let active = notification::ActiveModel {
            id: ActiveValue::Set(Uuid::from(notification.id)),
            recipient_id: ActiveValue::Set(Uuid::from(notification.recipient_id)),
            organization_id: ActiveValue::Set(Uuid::from(notification.organization_id)),
            kind: ActiveValue::Set(notification.kind.as_str().to_string()),
            title: ActiveValue::Set(notification.title),
            body: ActiveValue::Set(notification.body),
            action_url: ActiveValue::Set(notification.action_url),
            metadata: ActiveValue::Set(notification.metadata),
            read_at: ActiveValue::Set(None),
            email_sent_at: ActiveValue::Set(None),
            created_at: ActiveValue::Set(Utc::now().into()),
        };

        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }

    #[tracing::instrument(skip(self))]
    async fn list(
        &self,
        list_notifications: ListNotifications,
    ) -> Result<Vec<Notification>, RepositoryError> {
        let mut query = NotificationEntity::find()
            .filter(
                notification::Column::RecipientId.eq(Uuid::from(list_notifications.recipient_id)),
            )
            .filter(
                notification::Column::OrganizationId
                    .eq(Uuid::from(list_notifications.organization_id)),
            )
            .order_by_desc(notification::Column::CreatedAt)
            .limit(list_notifications.limit);

        if list_notifications.unread_only {
            query = query.filter(notification::Column::ReadAt.is_null());
        }

        if let Some(before) = list_notifications.before_id
            && let Some(cursor) = NotificationEntity::find_by_id(Uuid::from(before))
                .one(&self.db)
                .await
                .map_err(RepositoryError::from_db_err)?
        {
            query = query.filter(notification::Column::CreatedAt.lt(cursor.created_at));
        }

        let models = query
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(skip(self))]
    async fn unread_count(
        &self,
        recipient_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<u64, RepositoryError> {
        let sql = r#"
        SELECT COUNT(*) AS count 
        FROM notification
        WHERE recipient_id = $1 
          AND organization_id = $2 
          AND read_at IS NULL
      "#;

        let row = self
            .db
            .query_one_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [
                    Uuid::from(recipient_id).into(),
                    Uuid::from(organization_id).into(),
                ],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let count: i64 = row
            .try_get("", "count")
            .map_err(RepositoryError::from_db_err)?;

        Ok(count as u64)
    }

    #[tracing::instrument(skip(self))]
    async fn mark_as_read(
        &self,
        id: NotificationId,
        recipient_id: UserId,
    ) -> Result<(), RepositoryError> {
        let sql = r#"
        UPDATE notification
        SET read_at = NOW()
        WHERE id = $1 
        AND recipient_id = $2
        AND read_at IS NULL
      "#;

        self.db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(id).into(), Uuid::from(recipient_id).into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }

    #[tracing::instrument(skip(self))]
    async fn mark_all_as_read(
        &self,
        recipient_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<u64, RepositoryError> {
        let sql = r#"
        UPDATE notification
        SET read_at = NOW()
        WHERE recipient_id = $1 
          AND organization_id = $2 
          AND read_at IS NULL
      "#;

        let result = self
            .db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [
                    Uuid::from(recipient_id).into(),
                    Uuid::from(organization_id).into(),
                ],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(result.rows_affected())
    }

    #[tracing::instrument(skip(self))]
    async fn find_pending_email(
        &self,
        after: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<Notification>, RepositoryError> {
        let models = NotificationEntity::find()
            .filter(notification::Column::EmailSentAt.is_null())
            .filter(
                notification::Column::CreatedAt
                    .lt(sea_orm::prelude::DateTimeWithTimeZone::from(after)),
            )
            .order_by_asc(notification::Column::CreatedAt)
            .limit(limit)
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(skip(self))]
    async fn mark_email_sent(&self, ids: Vec<NotificationId>) -> Result<(), RepositoryError> {
        if ids.is_empty() {
            return Ok(());
        }

        let uuids: Vec<Uuid> = ids.iter().map(|id| Uuid::from(*id)).collect();
        let sql = r#"
            UPDATE notification
            SET email_sent_at = NOW()
            WHERE id = ANY($1)
        "#;

        self.db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [uuids.into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }

    async fn get_preferences(
        &self,
        user_id: UserId,
        organization_id: OrganizationId,
    ) -> Result<Vec<NotificationPreference>, RepositoryError> {
        use devboard_db::entities::notification_preference::{self, Entity as PreferenceEntity};
        let models = PreferenceEntity::find()
            .filter(notification_preference::Column::UserId.eq(Uuid::from(user_id)))
            .filter(notification_preference::Column::OrganizationId.eq(Uuid::from(organization_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models
            .into_iter()
            .map(|m| {
                let kind = NotificationKind::from_str(&m.kind).map_err(|_| {
                    RepositoryError::InvalidData {
                        message: format!("unknown notification kind: {}", m.kind),
                    }
                })?;

                Ok(NotificationPreference {
                    user_id,
                    organization_id,
                    kind,
                    in_app: m.in_app,
                    email: m.email,
                    push: m.push,
                })
            })
            .collect()
    }

    async fn update_preferences(
        &self,
        preference: NotificationPreference,
    ) -> Result<NotificationPreference, RepositoryError> {
        let sql = r#"
    INSERT INTO notification_preference
      (user_id, organization_id, kind, in_app, email, push)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, organization_id, kind) 
    DO UPDATE SET
      in_app = EXCLUDED.in_app,
      email = EXCLUDED.email,
      push = EXCLUDED.push
    "#;

        self.db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [
                    Uuid::from(preference.user_id).into(),
                    Uuid::from(preference.organization_id).into(),
                    preference.kind.as_str().into(),
                    preference.in_app.into(),
                    preference.email.into(),
                    preference.push.into(),
                ],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(preference)
    }

    async fn get_push_subscriptions(
        &self,
        user_id: UserId,
    ) -> Result<Vec<PushSubscription>, RepositoryError> {
        use devboard_db::entities::push_subscription::{self, Entity as PushSubscriptionEntity};

        let models = PushSubscriptionEntity::find()
            .filter(push_subscription::Column::UserId.eq(Uuid::from(user_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(models
            .into_iter()
            .map(|m| PushSubscription {
                id: UserId::from(m.id),
                user_id,
                endpoint: m.endpoint,
                p256dh: m.p256dh,
                auth: m.auth,
                user_agent: Some(m.user_agent),
            })
            .collect())
    }

    async fn save_push_subscription(
        &self,
        subscription: SavePushSubscription,
    ) -> Result<(), RepositoryError> {
        let sql = r#"
      INSERT INTO push_subscription
        (id, user_id, endpoint, p256dh, auth, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, endpoint) DO NOTHING
      "#;

        self.db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [
                    Uuid::new_v4().into(),
                    Uuid::from(subscription.user_id).into(),
                    subscription.endpoint.into(),
                    subscription.p256dh.into(),
                    subscription.auth.into(),
                    subscription.user_agent.into(),
                ],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }

    async fn delete_push_subscription(
        &self,
        user_id: UserId,
        endpoint: String,
    ) -> Result<(), RepositoryError> {
        let sql = r#"
      DELETE FROM push_subscription
      WHERE user_id = $1 
        AND endpoint = $2
      "#;

        self.db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(user_id).into(), endpoint.into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }
}
