use devboard_domain::{
    ChannelId, DmMessage, DmThreadId, Message, MessageId, OrganizationId, PresenceStatus, UserId,
};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};

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
}

impl MessageBus {
    pub fn new(pool: CachePool) -> Self {
        Self { pool }
    }

    pub async fn publish(&self, event: &MessagingEvent) -> Result<(), CacheError> {
        let mut conn = self.pool.clone();

        let topic = match event {
            MessagingEvent::ChannelMessage { channel_id, .. }
            | MessagingEvent::ChannelMessageEdited { channel_id, .. }
            | MessagingEvent::ChannelMessageDeleted { channel_id, .. }
            | MessagingEvent::ReactionUpdated { channel_id, .. } => channel_topic(*channel_id),
            MessagingEvent::DmReceived { thread_id, .. } => dm_topic(*thread_id),
            MessagingEvent::PresenceChanged { user_id, .. } => {
                format!("presence:user:{}", user_id)
            }
        };

        let payload = serde_json::to_string(event).map_err(CacheError::Serialization)?;

        conn.publish::<_, _, ()>(&topic, &payload).await?;
        Ok(())
    }
}
