use devboard_domain::{
    ChannelId, DmMessage, DmThreadId, Message, MessageId, OrganizationId, PresenceStatus, UserId,
};
use futures_util::StreamExt;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use tokio_stream::Stream;

use crate::{CacheError, CachePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MessagingEvent {
    ChannelMessage {
        channel_id: ChannelId,
        message: Message,
    },
    ChannelMessageEdited {
        channel_id: ChannelId,
        message: Message,
    },
    ChannelMessageDeleted {
        channel_id: ChannelId,
        message_id: MessageId,
    },
    ReactionUpdated {
        channel_id: ChannelId,
        message_id: MessageId,
    },
    DmReceived {
        thread_id: DmThreadId,
        message: DmMessage,
    },
    PresenceChanged {
        org_id: OrganizationId,
        user_id: UserId,
        status: PresenceStatus,
    },
}

pub fn channel_topic(channel_id: ChannelId) -> String {
    format!("msg:channel:{}", channel_id)
}

pub fn dm_topic(thread_id: DmThreadId) -> String {
    format!("msg:dm:{}", thread_id)
}

pub fn org_presence_topic(org_id: OrganizationId) -> String {
    format!("presence:org:{}", org_id)
}

pub struct MessageBus {
    pool: CachePool,
    client: redis::Client,
}

impl MessageBus {
    pub fn new(pool: CachePool, client: redis::Client) -> Self {
        Self { pool, client }
    }

    pub async fn publish(&self, event: &MessagingEvent) -> Result<(), CacheError> {
        let mut conn = self.pool.clone();

        let topic = match event {
            MessagingEvent::ChannelMessage { channel_id, .. }
            | MessagingEvent::ChannelMessageEdited { channel_id, .. }
            | MessagingEvent::ChannelMessageDeleted { channel_id, .. }
            | MessagingEvent::ReactionUpdated { channel_id, .. } => channel_topic(*channel_id),
            MessagingEvent::DmReceived { thread_id, .. } => dm_topic(*thread_id),
            MessagingEvent::PresenceChanged { org_id, .. } => org_presence_topic(*org_id),
        };

        let payload = serde_json::to_string(event).map_err(CacheError::Serialization)?;

        conn.publish::<_, _, ()>(&topic, &payload).await?;
        Ok(())
    }

    /// Subscribe to an org presence channel. Owns a dedicated Redis pub/sub connection.
    pub async fn subscribe_org_presence(
        &self,
        org_id: OrganizationId,
    ) -> Result<impl Stream<Item = MessagingEvent> + Send + 'static + use<>, CacheError> {
        let topic = org_presence_topic(org_id);
        let (mut sink, mut stream) = self
            .client
            .get_async_pubsub()
            .await
            .map_err(CacheError::Connection)?
            .split();

        sink.subscribe(&topic)
            .await
            .map_err(CacheError::Connection)?;

        Ok(async_stream::stream! {
            // Keep sink alive for the lifetime of the subscription.
            let _sink = sink;
            while let Some(msg) = stream.next().await {
                let Ok(payload) = msg.get_payload::<String>() else {
                    continue;
                };
                match serde_json::from_str::<MessagingEvent>(&payload) {
                    Ok(event) => yield event,
                    Err(err) => {
                        tracing::warn!(error = %err, "invalid messaging event payload");
                    }
                }
            }
        })
    }
}
