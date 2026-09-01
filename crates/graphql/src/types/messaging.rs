use async_graphql::{Context, Enum, ID, Object, SimpleObject, dataloader::DataLoader};
use chrono::{DateTime, Utc};
use devboard_domain::{
    Channel, ChannelKind, ChannelMember, DmMessage, DmThread, DmThreadId, Message, MessageEmbed,
    PresenceStatus, ReactionSummary, UserPresence,
};

use crate::{GqlUser, UserLoader, context::ContextExt, error::IntoGraphQLResult};

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlChannelKind {
    Open,
    Private,
}

impl From<ChannelKind> for GqlChannelKind {
    fn from(k: ChannelKind) -> Self {
        match k {
            ChannelKind::Open => Self::Open,
            ChannelKind::Private => Self::Private,
        }
    }
}

impl From<GqlChannelKind> for ChannelKind {
    fn from(k: GqlChannelKind) -> Self {
        match k {
            GqlChannelKind::Open => Self::Open,
            GqlChannelKind::Private => Self::Private,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlPresenceStatus {
    Online,
    Away,
    Offline,
}

impl From<PresenceStatus> for GqlPresenceStatus {
    fn from(s: PresenceStatus) -> Self {
        match s {
            PresenceStatus::Online => Self::Online,
            PresenceStatus::Away => Self::Away,
            PresenceStatus::Offline => Self::Offline,
        }
    }
}

#[derive(Clone)]
pub struct GqlChannelMember {
    pub inner: ChannelMember,
}

impl From<ChannelMember> for GqlChannelMember {
    fn from(m: ChannelMember) -> Self {
        Self { inner: m }
    }
}

#[Object]
impl GqlChannelMember {
    async fn channel_id(&self) -> ID {
        ID(self.inner.channel_id.to_string())
    }
    async fn user_id(&self) -> ID {
        ID(self.inner.user_id.to_string())
    }
    async fn joined_at(&self) -> DateTime<Utc> {
        self.inner.joined_at
    }
    async fn user(&self, ctx: &Context<'_>) -> async_graphql::Result<Option<GqlUser>> {
        let loader = ctx.data::<DataLoader<UserLoader>>()?;
        let user = loader.load_one(self.inner.user_id).await?;
        Ok(user.map(GqlUser::from))
    }
}

#[derive(Clone)]
pub struct GqlChannel {
    pub inner: Channel,
    pub is_member: bool,
}

#[Object]
impl GqlChannel {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }
    async fn slug(&self) -> &str {
        &self.inner.slug
    }
    async fn name(&self) -> &str {
        &self.inner.name
    }
    async fn description(&self) -> Option<&str> {
        self.inner.description.as_deref()
    }
    async fn kind(&self) -> GqlChannelKind {
        GqlChannelKind::from(self.inner.kind)
    }
    async fn created_at(&self) -> DateTime<Utc> {
        self.inner.created_at
    }
    async fn is_member(&self) -> bool {
        self.is_member
    }
    async fn unread_count(&self, ctx: &Context<'_>) -> async_graphql::Result<u64> {
        if !self.is_member {
            return Ok(0);
        }
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;
        services
            .messaging_service
            .get_unread_count(self.inner.id, auth.user_id)
            .await
            .map_gql_err()
    }
}

impl GqlChannel {
    pub fn from_channel(channel: Channel, is_member: bool) -> Self {
        Self {
            inner: channel,
            is_member,
        }
    }
}

impl From<Channel> for GqlChannel {
    fn from(c: Channel) -> Self {
        // Default: treat as member (e.g. channel just created by caller).
        Self::from_channel(c, true)
    }
}

#[derive(SimpleObject, Clone)]
pub struct GqlMessageEmbed {
    pub kind: String,
    pub url: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub site_name: Option<String>,
    pub repo: Option<String>,
    pub sha: Option<String>,
    pub number: Option<u64>,
    pub state: Option<String>,
}

impl From<MessageEmbed> for GqlMessageEmbed {
    fn from(e: MessageEmbed) -> Self {
        match e {
            MessageEmbed::LinkPreview {
                url,
                title,
                description,
                image_url,
                site_name,
            } => Self {
                kind: "LINK_PREVIEW".into(),
                url,
                title,
                description,
                image_url,
                site_name,
                repo: None,
                sha: None,
                number: None,
                state: None,
            },
            MessageEmbed::GitHubCommit {
                repo,
                sha,
                message,
                url,
            } => Self {
                kind: "GITHUB_COMMIT".into(),
                url,
                title: Some(message),
                description: None,
                image_url: None,
                site_name: Some("GitHub".into()),
                repo: Some(repo),
                sha: Some(sha),
                number: None,
                state: None,
            },
            MessageEmbed::GitHubIssue {
                repo,
                number,
                title,
                state,
                url,
            } => Self {
                kind: "GITHUB_ISSUE".into(),
                url,
                title: Some(title),
                description: None,
                image_url: None,
                site_name: Some("GitHub".into()),
                repo: Some(repo),
                sha: None,
                number: number.parse().ok(),
                state: Some(state),
            },
            MessageEmbed::GitHubPr {
                repo,
                number,
                title,
                state,
                url,
            } => Self {
                kind: "GITHUB_PR".into(),
                url,
                title: Some(title),
                description: None,
                image_url: None,
                site_name: Some("GitHub".into()),
                repo: Some(repo),
                sha: None,
                number: number.parse().ok(),
                state: Some(state),
            },
        }
    }
}

#[derive(SimpleObject, Clone)]
pub struct GqlReactionSummary {
    pub emoji: String,
    pub count: u64,
    pub reacted_by_me: bool,
}

impl From<ReactionSummary> for GqlReactionSummary {
    fn from(r: ReactionSummary) -> Self {
        Self {
            emoji: r.emoji,
            count: r.count as u64,
            reacted_by_me: r.reacted_by_me,
        }
    }
}

#[derive(Clone)]
pub struct GqlMessage {
    pub inner: Message,
}

#[Object]
impl GqlMessage {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }
    async fn channel_id(&self) -> ID {
        ID(self.inner.channel_id.to_string())
    }
    async fn author_id(&self) -> ID {
        ID(self.inner.author_id.to_string())
    }
    async fn created_at(&self) -> DateTime<Utc> {
        self.inner.created_at
    }
    async fn edited_at(&self) -> Option<DateTime<Utc>> {
        self.inner.edited_at
    }
    async fn is_edited(&self) -> bool {
        self.inner.is_edited()
    }
    async fn body(&self) -> &str {
        &self.inner.body
    }
    async fn embeds(&self) -> Vec<GqlMessageEmbed> {
        self.inner
            .embeds
            .iter()
            .cloned()
            .map(GqlMessageEmbed::from)
            .collect()
    }

    async fn reactions(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<GqlReactionSummary>> {
        use crate::context::ContextExt;
        use crate::error::IntoGraphQLResult;

        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;
        let reactions = services
            .messaging_service
            .get_reactions(self.inner.id, auth.user_id)
            .await
            .map_gql_err()?;
        Ok(reactions
            .into_iter()
            .map(GqlReactionSummary::from)
            .collect())
    }
}

impl From<Message> for GqlMessage {
    fn from(m: Message) -> Self {
        Self { inner: m }
    }
}

#[derive(Clone)]
pub struct GqlDmThread {
    pub id: ID,
    pub organization_id: ID,
    pub participant_a: ID,
    pub participant_b: ID,
    pub created_at: DateTime<Utc>,
}

#[Object]
impl GqlDmThread {
    async fn id(&self) -> &ID {
        &self.id
    }
    async fn participant_a(&self) -> &ID {
        &self.participant_a
    }
    async fn participant_b(&self) -> &ID {
        &self.participant_b
    }
    async fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }
    async fn unread_count(&self, ctx: &Context<'_>) -> async_graphql::Result<u64> {
        let auth = ctx.authenticated_user()?;
        let org = auth.require_org()?;
        let services = ctx.services()?;
        let thread_id = crate::resolvers::query::parse_id::<DmThreadId>(&self.id)?;
        let unread_count = services
            .messaging_service
            .get_unread_dm_count(thread_id, auth.user_id, org.organization_id)
            .await
            .map_gql_err()?;
        Ok(unread_count)
    }
}

impl From<DmThread> for GqlDmThread {
    fn from(t: DmThread) -> Self {
        Self {
            id: ID(t.id.to_string()),
            organization_id: ID(t.organization_id.to_string()),
            participant_a: ID(t.participant_a.to_string()),
            participant_b: ID(t.participant_b.to_string()),
            created_at: t.created_at,
        }
    }
}

#[derive(SimpleObject, Clone)]
pub struct GqlDmMessage {
    pub id: ID,
    pub thread_id: ID,
    pub author_id: ID,
    pub created_at: DateTime<Utc>,
    pub body: String,
    pub is_edited: bool,
    pub is_read: bool,
    pub read_by_recipient_at: Option<DateTime<Utc>>,
    pub edited_at: Option<DateTime<Utc>>,
}

impl From<DmMessage> for GqlDmMessage {
    fn from(m: DmMessage) -> Self {
        let is_edited = m.edited_at.is_some();
        let is_read = m.is_read();
        Self {
            id: ID(m.id.to_string()),
            thread_id: ID(m.thread_id.to_string()),
            author_id: ID(m.author_id.to_string()),
            created_at: m.created_at,
            body: m.body,
            is_edited,
            is_read,
            read_by_recipient_at: m.read_by_recipient_at,
            edited_at: m.edited_at,
        }
    }
}

#[derive(SimpleObject, Clone)]
pub struct GqlUserPresence {
    pub user_id: ID,
    pub status: GqlPresenceStatus,
    // TODO: Add last_seen_at
    // pub last_seen_at: DateTime<Utc>,
}

impl From<UserPresence> for GqlUserPresence {
    fn from(p: UserPresence) -> Self {
        Self {
            user_id: ID(p.user_id.to_string()),
            status: GqlPresenceStatus::from(p.status),
        }
    }
}

#[derive(SimpleObject, Clone)]
pub struct GqlMessageEvent {
    pub kind: String, // NEW | EDITED | DELETED | REACTIONS
    pub channel_id: ID,
    pub message: Option<GqlMessage>,
    pub message_id: ID,
}

#[derive(SimpleObject, Clone)]
pub struct GqlReactionEvent {
    pub channel_id: ID,
    pub message_id: ID,
}

#[derive(SimpleObject, Clone)]
pub struct GqlDmMessageEvent {
    pub kind: String, // NEW | EDITED | DELETED
    pub thread_id: ID,
    pub message: Option<GqlDmMessage>,
    pub message_id: ID,
}
