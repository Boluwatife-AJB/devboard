use async_trait::async_trait;
use chrono::Utc;
use devboard_db::entities::{
    channel::{self, Entity as ChannelEntity},
    channel_member::{self, Entity as ChannelMemberEntity},
    dm_message::{self, Entity as DmMessageEntity},
    dm_thread::{self, Entity as DmThreadEntity},
    message::{self, Entity as MessageEntity},
    message_reaction,
};
use devboard_domain::{
    Channel, ChannelId, ChannelKind, ChannelMember, DmMessage, DmMessageId, DmThread, DmThreadId,
    Message, MessageEmbed, MessageId, OrganizationId, ReactionSummary, UserId,
};
use migration::prelude::serde_json;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend,
    EntityTrait, QueryFilter, QueryOrder, QuerySelect, Statement,
};
use uuid::Uuid;

use crate::{
    RepositoryError,
    messaging::{
        ChannelRepository, CreateChannelParams, CreateMessageParams, DmRepository,
        MessageRepository,
    },
};

fn channel_kind_to_str(k: &ChannelKind) -> &'static str {
    match k {
        ChannelKind::Open => "OPEN",
        ChannelKind::Private => "PRIVATE",
    }
}

fn str_to_channel_kind(s: &str) -> Result<ChannelKind, RepositoryError> {
    match s {
        "OPEN" => Ok(ChannelKind::Open),
        "PRIVATE" => Ok(ChannelKind::Private),
        other => Err(RepositoryError::InvalidData {
            message: format!("unknown channel kind: {other}"),
        }),
    }
}

fn channel_model_to_domain(m: channel::Model) -> Result<Channel, RepositoryError> {
    Ok(Channel {
        id: ChannelId::from(m.id),
        organization_id: OrganizationId::from(m.organization_id),
        created_by: UserId::from(m.created_by),
        slug: m.slug,
        name: m.name,
        description: m.description,
        kind: str_to_channel_kind(&m.kind)?,
        created_at: m.created_at.into(),
        updated_at: m.updated_at.into(),
    })
}

fn message_model_to_domain(m: message::Model) -> Result<Message, RepositoryError> {
    let embeds: Vec<MessageEmbed> = m
        .embeds
        .map(|v| {
            serde_json::from_value(v).map_err(|e| RepositoryError::InvalidData {
                message: format!("invalid embeds JSON: {e}"),
            })
        })
        .transpose()?
        .unwrap_or_default();

    Ok(Message {
        id: MessageId::from(m.id),
        channel_id: ChannelId::from(m.channel_id),
        author_id: UserId::from(m.author_id),
        body: m.body,
        embeds,
        edited_at: m.edited_at.map(Into::into),
        created_at: m.created_at.into(),
    })
}

fn dm_message_model_to_domain(m: dm_message::Model) -> DmMessage {
    DmMessage {
        id: DmMessageId::from(m.id),
        thread_id: DmThreadId::from(m.thread_id),
        author_id: UserId::from(m.author_id),
        body: m.body,
        edited_at: m.edited_at.map(Into::into),
        read_by_recipient_at: m.read_by_recipient_at.map(Into::into),
        created_at: m.created_at.into(),
    }
}

// Channel Repo impl
pub struct PgChannelRepository {
    db: DatabaseConnection,
}

impl PgChannelRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl ChannelRepository for PgChannelRepository {
    async fn find_by_id(&self, id: ChannelId) -> Result<Option<Channel>, RepositoryError> {
        let model = ChannelEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(channel_model_to_domain).transpose()
    }

    async fn find_by_organization(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<Channel>, RepositoryError> {
        let models = ChannelEntity::find()
            .filter(channel::Column::OrganizationId.eq(Uuid::from(org_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(channel_model_to_domain).collect()
    }

    async fn find_member_channels(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<Vec<Channel>, RepositoryError> {
        let sql = r#"
            SELECT c.*
            FROM channel c
            JOIN channel_member cm 
              ON c.id = cm.channel_id
            WHERE cm.user_id = $1 
              AND c.organization_id = $2
            ORDER BY c.name ASC
          "#;

        let rows = self
            .db
            .query_all_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(user_id).into(), Uuid::from(org_id).into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        let mut channels = Vec::with_capacity(rows.len());
        for row in rows {
            let id: Uuid = row
                .try_get("", "id")
                .map_err(RepositoryError::from_db_err)?;
            if let Some(model) = ChannelEntity::find_by_id(id)
                .one(&self.db)
                .await
                .map_err(RepositoryError::from_db_err)?
            {
                channels.push(channel_model_to_domain(model)?);
            }
        }
        Ok(channels)
    }

    async fn create(&self, params: CreateChannelParams) -> Result<Channel, RepositoryError> {
        let now = Utc::now();
        let active = channel::ActiveModel {
            id: ActiveValue::Set(Uuid::from(params.id)),
            organization_id: ActiveValue::Set(Uuid::from(params.org_id)),
            created_by: ActiveValue::Set(Uuid::from(params.created_by)),
            slug: ActiveValue::Set(params.slug),
            name: ActiveValue::Set(params.name),
            description: ActiveValue::Set(params.description),
            kind: ActiveValue::Set(channel_kind_to_str(&params.kind).to_string()),
            created_at: ActiveValue::Set(now.into()),
            updated_at: ActiveValue::Set(now.into()),
        };
        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        channel_model_to_domain(model)
    }

    async fn add_member(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
    ) -> Result<ChannelMember, RepositoryError> {
        let now = Utc::now();
        let active = channel_member::ActiveModel {
            channel_id: ActiveValue::Set(Uuid::from(channel_id)),
            user_id: ActiveValue::Set(Uuid::from(user_id)),
            joined_at: ActiveValue::Set(now.into()),
            last_read_message_id: ActiveValue::Set(None),
        };

        active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(ChannelMember {
            channel_id,
            user_id,
            joined_at: now,
            last_read_message_id: None,
        })
    }

    async fn get_member(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
    ) -> Result<Option<ChannelMember>, RepositoryError> {
        let model = ChannelMemberEntity::find_by_id((Uuid::from(channel_id), Uuid::from(user_id)))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(model.map(|m| ChannelMember {
            channel_id,
            user_id,
            joined_at: m.joined_at.into(),
            last_read_message_id: m.last_read_message_id.map(MessageId::from),
        }))
    }

    async fn list_members(
        &self,
        channel_id: ChannelId,
    ) -> Result<Vec<ChannelMember>, RepositoryError> {
        let models = ChannelMemberEntity::find()
            .filter(channel_member::Column::ChannelId.eq(Uuid::from(channel_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(models
            .into_iter()
            .map(|m| ChannelMember {
                channel_id,
                user_id: UserId::from(m.user_id),
                joined_at: m.joined_at.into(),
                last_read_message_id: m.last_read_message_id.map(MessageId::from),
            })
            .collect())
    }

    async fn update_last_read(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
        message_id: MessageId,
    ) -> Result<(), RepositoryError> {
        let sql = r#"
            UPDATE channel_member
            SET last_read_message_id = $1
            WHERE channel_id = $2 
              AND user_id = $3
          "#;

        self.db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [
                    Uuid::from(message_id).into(),
                    Uuid::from(channel_id).into(),
                    Uuid::from(user_id).into(),
                ],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }

    async fn delete_beyond_retention(
        &self,
        channel_id: ChannelId,
        retain_count: i64,
    ) -> Result<u64, RepositoryError> {
        let sql = r#"
        DELETE FROM message
        WHERE channel_id = $1
          AND id NOT IN (
            SELECT id
            FROM message
            WHERE channel_id = $1
            ORDER BY created_at DESC
            LIMIT $2
          )
      "#;

        let result = self
            .db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(channel_id).into(), retain_count.into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(result.rows_affected())
    }
}

// Message Repo impl
pub struct PgMessageRepository {
    db: DatabaseConnection,
}

impl PgMessageRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl MessageRepository for PgMessageRepository {
    async fn find_by_id(&self, id: MessageId) -> Result<Option<Message>, RepositoryError> {
        let model = MessageEntity::find_by_id(id)
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(message_model_to_domain).transpose()
    }

    async fn find_by_channel(
        &self,
        channel_id: ChannelId,
        before_id: Option<MessageId>,
        limit: u64,
    ) -> Result<Vec<Message>, RepositoryError> {
        let mut query = MessageEntity::find()
            .filter(message::Column::ChannelId.eq(Uuid::from(channel_id)))
            .order_by_desc(message::Column::CreatedAt)
            .limit(limit);

        if let Some(before) = before_id
            && let Some(cursor_msg) = MessageEntity::find_by_id(Uuid::from(before))
                .one(&self.db)
                .await
                .map_err(RepositoryError::from_db_err)?
        {
            query = query.filter(message::Column::CreatedAt.lt(cursor_msg.created_at));
        }

        let models = query
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        let mut messages: Vec<Message> = models
            .into_iter()
            .map(message_model_to_domain)
            .collect::<Result<_, _>>()?;

        messages.reverse();
        Ok(messages)
    }

    async fn create(&self, params: CreateMessageParams) -> Result<Message, RepositoryError> {
        let active = message::ActiveModel {
            id: ActiveValue::Set(Uuid::from(params.id)),
            channel_id: ActiveValue::Set(Uuid::from(params.channel_id)),
            author_id: ActiveValue::Set(Uuid::from(params.author_id)),
            body: ActiveValue::Set(params.body),
            embeds: ActiveValue::Set(None),
            edited_at: ActiveValue::Set(None),
            created_at: ActiveValue::Set(Utc::now().into()),
        };

        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        message_model_to_domain(model)
    }

    async fn update_body(&self, id: MessageId, body: String) -> Result<Message, RepositoryError> {
        let model = MessageEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: message::ActiveModel = model.into();
        active.body = ActiveValue::Set(body);
        active.edited_at = ActiveValue::Set(Some(Utc::now().into()));

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        message_model_to_domain(updated)
    }

    async fn update_embeds(
        &self,
        id: MessageId,
        embeds: Vec<MessageEmbed>,
    ) -> Result<Message, RepositoryError> {
        let model = MessageEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let embeds_json =
            serde_json::to_value(&embeds).map_err(|e| RepositoryError::InvalidData {
                message: format!("embeds serialization error: {e}"),
            })?;

        let mut active: message::ActiveModel = model.into();
        active.embeds = ActiveValue::Set(Some(embeds_json));
        active.edited_at = ActiveValue::Set(Some(Utc::now().into()));

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        message_model_to_domain(updated)
    }

    async fn delete(&self, id: MessageId) -> Result<(), RepositoryError> {
        let result = MessageEntity::delete_by_id(Uuid::from(id))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }
        Ok(())
    }

    async fn get_reactions(
        &self,
        message_id: MessageId,
        viewer_id: UserId,
    ) -> Result<Vec<ReactionSummary>, RepositoryError> {
        let sql = r#"
            SELECT 
              emoji, 
              COUNT(*) AS COUNT,
              BOOL_OR(user_id = $2) AS reacted_by_me
            FROM message_reaction
            WHERE message_id = $1
            GROUP BY emoji
            ORDER BY emoji
          "#;

        let rows = self
            .db
            .query_all_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(message_id).into(), Uuid::from(viewer_id).into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        rows.iter()
            .map(|row| {
                let emoji: String = row
                    .try_get("", "emoji")
                    .map_err(RepositoryError::from_db_err)?;
                let count: i64 = row
                    .try_get("", "count")
                    .map_err(RepositoryError::from_db_err)?;
                let reacted_by_me: bool = row
                    .try_get("", "reacted_by_me")
                    .map_err(RepositoryError::from_db_err)?;
                Ok(ReactionSummary {
                    emoji,
                    count: count as u32,
                    reacted_by_me,
                })
            })
            .collect()
    }

    async fn add_reaction(
        &self,
        message_id: MessageId,
        user_id: UserId,
        emoji: String,
    ) -> Result<(), RepositoryError> {
        let now = Utc::now();

        let active = message_reaction::ActiveModel {
            message_id: ActiveValue::Set(Uuid::from(message_id)),
            user_id: ActiveValue::Set(Uuid::from(user_id)),
            emoji: ActiveValue::Set(emoji),
            created_at: ActiveValue::Set(now.into()),
        };

        active
            .insert(&self.db)
            .await
            .map(|_| ())
            .or_else(|err| {
                if matches!(
                    err,
                    sea_orm::error::DbErr::Query(sea_orm::RuntimeErr::SqlxError(_))
                ) {
                    Ok(())
                } else {
                    Err(err)
                }
            })
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }

    async fn remove_reaction(
        &self,
        message_id: MessageId,
        user_id: UserId,
        emoji: String,
    ) -> Result<(), RepositoryError> {
        let sql = r#"
        DELETE FROM message_reaction
        WHERE message_id = $1
          AND user_id = $2
          AND emoji = $3
      "#;

        self.db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [
                    Uuid::from(message_id).into(),
                    Uuid::from(user_id).into(),
                    emoji.into(),
                ],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }

    async fn unread_count(
        &self,
        channel_id: ChannelId,
        last_read_message_id: Option<MessageId>,
    ) -> Result<u64, RepositoryError> {
        let count: i64 = match last_read_message_id {
            None => {
                let sql = r#"
                    SELECT COUNT(*) AS COUNT
                    FROM message
                    WHERE channel_id = $1
                  "#;
                let row = self
                    .db
                    .query_one_raw(Statement::from_sql_and_values(
                        DbBackend::Postgres,
                        sql,
                        [Uuid::from(channel_id).into()],
                    ))
                    .await
                    .map_err(RepositoryError::from_db_err)?
                    .ok_or(RepositoryError::NotFound)?;
                row.try_get("", "count")
                    .map_err(RepositoryError::from_db_err)?
            }
            Some(last_id) => {
                let sql = r#"
              SELECT COUNT(*) AS COUNT
              FROM message
              WHERE channel_id = $1
                AND created_at > (
                  SELECT created_at FROM message WHERE id = $2
                )
            "#;
                let row = self
                    .db
                    .query_one_raw(Statement::from_sql_and_values(
                        DbBackend::Postgres,
                        sql,
                        [Uuid::from(channel_id).into(), Uuid::from(last_id).into()],
                    ))
                    .await
                    .map_err(RepositoryError::from_db_err)?
                    .ok_or(RepositoryError::NotFound)?;
                row.try_get("", "count")
                    .map_err(RepositoryError::from_db_err)?
            }
        };
        Ok(count as u64)
    }
}

// DM Repo impl
pub struct PgDmRepository {
    db: DatabaseConnection,
}

impl PgDmRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl DmRepository for PgDmRepository {
    async fn find_thread(
        &self,
        user_a: UserId,
        user_b: UserId,
    ) -> Result<Option<DmThread>, RepositoryError> {
        let (a, b) = canonical_order(user_a, user_b);
        let sql = r#"
            SELECT * FROM dm_thread
            WHERE participant_a = $1 
              AND participant_b = $2
          "#;
        let row = self
            .db
            .query_one_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(a).into(), Uuid::from(b).into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        row.map(|r| dm_thread_from_row(&r)).transpose()
    }

    async fn find_thread_by_id(&self, id: DmThreadId) -> Result<Option<DmThread>, RepositoryError> {
        let model = DmThreadEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(model.map(|m| DmThread {
            id: DmThreadId::from(m.id),
            participant_a: UserId::from(m.participant_a),
            participant_b: UserId::from(m.participant_b),
            created_at: m.created_at.into(),
        }))
    }

    async fn find_user_threads(&self, user_id: UserId) -> Result<Vec<DmThread>, RepositoryError> {
        let sql = r#"
            SELECT * FROM dm_thread
            WHERE participant_a = $1 
              OR participant_b = $1
            ORDER BY created_at DESC
          "#;

        let rows = self
            .db
            .query_all_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(user_id).into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        rows.iter().map(dm_thread_from_row).collect()
    }

    async fn create_thread(
        &self,
        id: DmThreadId,
        user_a: UserId,
        user_b: UserId,
    ) -> Result<DmThread, RepositoryError> {
        let (a, b) = canonical_order(user_a, user_b);
        let now = Utc::now();

        let active = dm_thread::ActiveModel {
            id: ActiveValue::Set(Uuid::from(id)),
            participant_a: ActiveValue::Set(Uuid::from(a)),
            participant_b: ActiveValue::Set(Uuid::from(b)),
            created_at: ActiveValue::Set(now.into()),
        };

        active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(DmThread {
            id,
            participant_a: a,
            participant_b: b,
            created_at: now,
        })
    }

    async fn find_messages(
        &self,
        thread_id: DmThreadId,
        before_id: Option<DmMessageId>,
        limit: u64,
    ) -> Result<Vec<DmMessage>, RepositoryError> {
        let mut query = DmMessageEntity::find()
            .filter(dm_message::Column::ThreadId.eq(Uuid::from(thread_id)))
            .order_by_desc(dm_message::Column::CreatedAt)
            .limit(limit);

        if let Some(before) = before_id
            && let Some(cursor) = DmMessageEntity::find_by_id(Uuid::from(before))
                .one(&self.db)
                .await
                .map_err(RepositoryError::from_db_err)?
        {
            query = query.filter(dm_message::Column::CreatedAt.lt(cursor.created_at));
        }

        let models = query
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        let mut messages: Vec<DmMessage> =
            models.into_iter().map(dm_message_model_to_domain).collect();
        messages.reverse();
        Ok(messages)
    }

    async fn create_message(
        &self,
        id: DmMessageId,
        thread_id: DmThreadId,
        author_id: UserId,
        body: String,
    ) -> Result<DmMessage, RepositoryError> {
        let now = Utc::now();

        let active = dm_message::ActiveModel {
            id: ActiveValue::Set(Uuid::from(id)),
            thread_id: ActiveValue::Set(Uuid::from(thread_id)),
            author_id: ActiveValue::Set(Uuid::from(author_id)),
            body: ActiveValue::Set(body),
            edited_at: ActiveValue::Set(None),
            read_by_recipient_at: ActiveValue::Set(None),
            created_at: ActiveValue::Set(now.into()),
        };

        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(dm_message_model_to_domain(model))
    }

    async fn edit_message(
        &self,
        id: DmMessageId,
        body: String,
    ) -> Result<DmMessage, RepositoryError> {
        let now = Utc::now();

        let model = DmMessageEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: dm_message::ActiveModel = model.into();
        active.body = ActiveValue::Set(body);
        active.edited_at = ActiveValue::Set(Some(now.into()));

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        Ok(dm_message_model_to_domain(updated))
    }

    async fn mark_read(
        &self,
        thread_id: DmThreadId,
        reader_id: UserId,
    ) -> Result<(), RepositoryError> {
        let sql = r#"
            UPDATE dm_message
            SET read_by_recipient_at = NOW()
            WHERE thread_id = $1
              AND author_id != $2
              AND read_by_recipient_at IS NULL
          "#;

        self.db
            .execute_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(thread_id).into(), Uuid::from(reader_id).into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }
}

// Private Helpers
fn canonical_order(a: UserId, b: UserId) -> (UserId, UserId) {
    if a.0 <= b.0 { (a, b) } else { (b, a) }
}

fn dm_thread_from_row(row: &sea_orm::QueryResult) -> Result<DmThread, RepositoryError> {
    Ok(DmThread {
        id: DmThreadId::from(
            row.try_get::<Uuid>("", "id")
                .map_err(RepositoryError::from_db_err)?,
        ),
        participant_a: UserId::from(
            row.try_get::<Uuid>("", "participant_a")
                .map_err(RepositoryError::from_db_err)?,
        ),
        participant_b: UserId::from(
            row.try_get::<Uuid>("", "participant_b")
                .map_err(RepositoryError::from_db_err)?,
        ),
        created_at: row
            .try_get::<sea_orm::prelude::DateTimeWithTimeZone>("", "created_at")
            .map_err(RepositoryError::from_db_err)?
            .into(),
    })
}
