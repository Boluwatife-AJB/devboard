use async_trait::async_trait;
use chrono::{DateTime, Utc};
use devboard_domain::{
    Channel, ChannelId, ChannelKind, ChannelMember, DmMessage, DmMessageId, DmThread, DmThreadId,
    Message, MessageEmbed, MessageId, OrganizationId, ReactionSummary, UserId,
};

pub mod pg;

use crate::RepositoryError;

#[derive(Debug)]
pub struct CreateChannelParams {
    pub id: ChannelId,
    pub org_id: OrganizationId,
    pub created_by: UserId,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub kind: ChannelKind,
}

#[derive(Debug)]
pub struct CreateMessageParams {
    pub id: MessageId,
    pub channel_id: ChannelId,
    pub author_id: UserId,
    pub body: String,
}

// Channel Repo
#[async_trait]
pub trait ChannelRepository: Send + Sync {
    async fn find_by_id(&self, id: ChannelId) -> Result<Option<Channel>, RepositoryError>;

    async fn find_by_organization(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<Channel>, RepositoryError>;

    async fn find_member_channels(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<Vec<Channel>, RepositoryError>;

    async fn create(&self, params: CreateChannelParams) -> Result<Channel, RepositoryError>;

    async fn add_member(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
    ) -> Result<ChannelMember, RepositoryError>;

    async fn remove_member(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
    ) -> Result<(), RepositoryError>;

    async fn get_member(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
    ) -> Result<Option<ChannelMember>, RepositoryError>;

    async fn list_members(
        &self,
        channel_id: ChannelId,
    ) -> Result<Vec<ChannelMember>, RepositoryError>;

    async fn update_last_read(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
        message_id: MessageId,
    ) -> Result<(), RepositoryError>;

    async fn delete_beyond_retention(
        &self,
        channel_id: ChannelId,
        retain_count: i64,
    ) -> Result<u64, RepositoryError>;

    async fn get_cleared_at(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
    ) -> Result<Option<DateTime<Utc>>, RepositoryError>;

    async fn set_cleared_at(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
        cleared_at: DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
}

// Message Repo
#[async_trait]
pub trait MessageRepository: Send + Sync {
    async fn find_by_id(&self, id: MessageId) -> Result<Option<Message>, RepositoryError>;

    async fn find_by_channel(
        &self,
        channel_id: ChannelId,
        before_id: Option<MessageId>,
        limit: u64,
        after_created_at: Option<DateTime<Utc>>,
    ) -> Result<Vec<Message>, RepositoryError>;

    async fn create(&self, params: CreateMessageParams) -> Result<Message, RepositoryError>;

    async fn update_body(&self, id: MessageId, body: String) -> Result<Message, RepositoryError>;

    async fn update_embeds(
        &self,
        id: MessageId,
        embeds: Vec<MessageEmbed>,
    ) -> Result<Message, RepositoryError>;

    async fn delete(&self, id: MessageId) -> Result<(), RepositoryError>;

    async fn get_reactions(
        &self,
        message_id: MessageId,
        viewer_id: UserId,
    ) -> Result<Vec<ReactionSummary>, RepositoryError>;

    async fn add_reaction(
        &self,
        message_id: MessageId,
        user_id: UserId,
        emoji: String,
    ) -> Result<(), RepositoryError>;

    async fn remove_reaction(
        &self,
        message_id: MessageId,
        user_id: UserId,
        emoji: String,
    ) -> Result<(), RepositoryError>;

    async fn unread_count(
        &self,
        channel_id: ChannelId,
        last_read_message_id: Option<MessageId>,
    ) -> Result<u64, RepositoryError>;
}

// DM repo
#[async_trait]
pub trait DmRepository: Send + Sync {
    async fn find_thread(
        &self,
        user_a: UserId,
        user_b: UserId,
        org_id: OrganizationId,
    ) -> Result<Option<DmThread>, RepositoryError>;

    async fn find_thread_by_id(&self, id: DmThreadId) -> Result<Option<DmThread>, RepositoryError>;

    async fn find_user_threads(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<Vec<DmThread>, RepositoryError>;

    async fn create_thread(
        &self,
        id: DmThreadId,
        org_id: OrganizationId,
        user_a: UserId,
        user_b: UserId,
    ) -> Result<DmThread, RepositoryError>;

    async fn find_messages(
        &self,
        thread_id: DmThreadId,
        before_id: Option<DmMessageId>,
        limit: u64,
        after_created_at: Option<DateTime<Utc>>,
    ) -> Result<Vec<DmMessage>, RepositoryError>;

    async fn find_message_by_id(
        &self,
        id: DmMessageId,
    ) -> Result<Option<DmMessage>, RepositoryError>;

    async fn create_message(
        &self,
        id: DmMessageId,
        thread_id: DmThreadId,
        author_id: UserId,
        body: String,
    ) -> Result<DmMessage, RepositoryError>;

    async fn edit_message(
        &self,
        id: DmMessageId,
        body: String,
    ) -> Result<DmMessage, RepositoryError>;

    async fn delete_message(&self, id: DmMessageId) -> Result<(), RepositoryError>;

    async fn mark_read(
        &self,
        thread_id: DmThreadId,
        reader_id: UserId,
    ) -> Result<(), RepositoryError>;

    async fn unread_count(
        &self,
        thread_id: DmThreadId,
        reader_id: UserId,
    ) -> Result<u64, RepositoryError>;

    async fn get_cleared_at(
        &self,
        thread_id: DmThreadId,
        user_id: UserId,
    ) -> Result<Option<DateTime<Utc>>, RepositoryError>;

    async fn set_cleared_at(
        &self,
        thread_id: DmThreadId,
        user_id: UserId,
        cleared_at: DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
}
