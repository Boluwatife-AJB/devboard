use async_graphql::{Context, ID, Object, Subscription};
use devboard_domain::{
    ChannelId, ChannelKind, DmMessageId, DmThreadId, MessageId, OrganizationId, UserId,
};
use devboard_service::EventBus;
use futures_util::Stream;
use tokio_stream::StreamExt;

use crate::{
    context::ContextExt,
    error::IntoGraphQLResult,
    inputs::{
        CreateChannelInput, DeleteMessageInput, EditMessageInput, MarkChannelAsReadInput,
        ReactionInput, SendDmInput, SendMessageInput,
    },
    resolvers::query::parse_id,
    types::{
        GqlChannel, GqlDmMessage, GqlDmThread, GqlMessage, GqlMessageEvent, GqlReactionSummary,
        GqlUserPresence,
    },
};

pub struct MessagingQuery;

#[Object]
impl MessagingQuery {
    async fn channels(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<GqlChannel>> {
        let auth = ctx.authenticated_user()?;
        let org = auth.require_org()?;
        let services = ctx.services()?;

        let channels = services
            .messaging_service
            .list_channels(org.organization_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(channels.into_iter().map(GqlChannel::from).collect())
    }

    async fn channel_messages(
        &self,
        ctx: &Context<'_>,
        channel_id: ID,
        before_id: Option<ID>,
        limit: Option<u64>,
    ) -> async_graphql::Result<Vec<GqlMessage>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let channel_id = parse_id::<ChannelId>(&channel_id)?;
        let before_id = before_id.map(|id| parse_id::<MessageId>(&id)).transpose()?;
        let limit = limit.unwrap_or(50);

        let messages = services
            .messaging_service
            .list_messages(channel_id, auth.user_id, before_id, limit)
            .await
            .map_gql_err()?;

        Ok(messages.into_iter().map(GqlMessage::from).collect())
    }

    async fn dm_threads(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<GqlDmThread>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let threads = services
            .messaging_service
            .list_dm_threads(auth.user_id)
            .await
            .map_gql_err()?;

        Ok(threads.into_iter().map(GqlDmThread::from).collect())
    }

    async fn dm_messages(
        &self,
        ctx: &Context<'_>,
        thread_id: ID,
        before_id: Option<ID>,
        limit: Option<u64>,
    ) -> async_graphql::Result<Vec<GqlDmMessage>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let thread_id = parse_id::<DmThreadId>(&thread_id)?;
        let before_id = before_id
            .map(|id| parse_id::<DmMessageId>(&id))
            .transpose()?;

        let messages = services
            .messaging_service
            .list_dm_messages(thread_id, auth.user_id, before_id, limit.unwrap_or(50))
            .await
            .map_gql_err()?;

        Ok(messages.into_iter().map(GqlDmMessage::from).collect())
    }
}

pub struct MessagingMutation;

#[Object]
impl MessagingMutation {
    async fn create_channel(
        &self,
        ctx: &Context<'_>,
        input: CreateChannelInput,
    ) -> async_graphql::Result<GqlChannel> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;
        let org = auth.require_org()?;

        let channel_kind = input
            .kind
            .map(ChannelKind::from)
            .unwrap_or(ChannelKind::Open);

        let channel = services
            .messaging_service
            .create_channel(
                org.organization_id,
                auth.user_id,
                input.slug,
                input.name,
                input.description,
                channel_kind,
            )
            .await
            .map_gql_err()?;

        Ok(GqlChannel::from(channel))
    }

    async fn join_channel(&self, ctx: &Context<'_>, channel_id: ID) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;
        let org = auth.require_org()?;

        let channel_id = parse_id::<ChannelId>(&channel_id)?;

        services
            .messaging_service
            .join_channel(channel_id, auth.user_id, org.organization_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn send_message(
        &self,
        ctx: &Context<'_>,
        input: SendMessageInput,
    ) -> async_graphql::Result<GqlMessage> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let channel_id = parse_id::<ChannelId>(&input.channel_id)?;

        let message = services
            .messaging_service
            .send_message(channel_id, auth.user_id, input.body)
            .await
            .map_gql_err()?;

        Ok(GqlMessage::from(message))
    }

    async fn edit_message(
        &self,
        ctx: &Context<'_>,
        input: EditMessageInput,
    ) -> async_graphql::Result<GqlMessage> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let message_id = parse_id::<MessageId>(&input.message_id)?;

        let message = services
            .messaging_service
            .edit_message(message_id, auth.user_id, input.body)
            .await
            .map_gql_err()?;

        Ok(GqlMessage::from(message))
    }

    async fn delete_message(
        &self,
        ctx: &Context<'_>,
        input: DeleteMessageInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let message_id = parse_id::<MessageId>(&input.message_id)?;
        let org_id = parse_id::<OrganizationId>(&input.org_id)?;

        services
            .messaging_service
            .delete_message(message_id, auth.user_id, org_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn add_reaction(
        &self,
        ctx: &Context<'_>,
        input: ReactionInput,
    ) -> async_graphql::Result<Vec<GqlReactionSummary>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let message_id = parse_id::<MessageId>(&input.message_id)?;

        let reactions = services
            .messaging_service
            .add_reaction(message_id, auth.user_id, input.emoji)
            .await
            .map_gql_err()?;

        Ok(reactions
            .into_iter()
            .map(GqlReactionSummary::from)
            .collect())
    }

    async fn remove_reaction(
        &self,
        ctx: &Context<'_>,
        input: ReactionInput,
    ) -> async_graphql::Result<Vec<GqlReactionSummary>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let message_id = parse_id::<MessageId>(&input.message_id)?;

        let reactions = services
            .messaging_service
            .remove_reaction(message_id, auth.user_id, input.emoji)
            .await
            .map_gql_err()?;

        Ok(reactions
            .into_iter()
            .map(GqlReactionSummary::from)
            .collect())
    }

    async fn mark_channel_read(
        &self,
        ctx: &Context<'_>,
        input: MarkChannelAsReadInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let channel_id = parse_id::<ChannelId>(&input.channel_id)?;
        let last_message_id = parse_id::<MessageId>(&input.last_message_id)?;

        services
            .messaging_service
            .mark_channel_read(channel_id, auth.user_id, last_message_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn open_dm(
        &self,
        ctx: &Context<'_>,
        other_user_id: ID,
    ) -> async_graphql::Result<GqlDmThread> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;
        let org = auth.require_org()?;

        let other_id = parse_id::<UserId>(&other_user_id)?;

        let thread = services
            .messaging_service
            .get_or_create_dm_thread(auth.user_id, other_id, org.organization_id)
            .await
            .map_gql_err()?;

        Ok(GqlDmThread::from(thread))
    }

    async fn send_dm(
        &self,
        ctx: &Context<'_>,
        input: SendDmInput,
    ) -> async_graphql::Result<GqlDmMessage> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let thread_id = parse_id::<DmThreadId>(&input.thread_id)?;

        let message = services
            .messaging_service
            .send_dm(thread_id, auth.user_id, input.body)
            .await
            .map_gql_err()?;

        Ok(GqlDmMessage::from(message))
    }

    async fn mark_dm_read(&self, ctx: &Context<'_>, thread_id: ID) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let thread_id = parse_id::<DmThreadId>(&thread_id)?;

        services
            .messaging_service
            .mark_dm_read(thread_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }
}

pub struct MessagingSubscription;

#[Subscription]
impl MessagingSubscription {
    async fn channel_messages(
        &self,
        ctx: &Context<'_>,
        channel_id: ID,
    ) -> async_graphql::Result<impl Stream<Item = GqlMessageEvent>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let channel_id = parse_id::<ChannelId>(&channel_id)?;

        services
            .messaging_service
            .list_messages(channel_id, auth.user_id, None, 1)
            .await
            .map_gql_err()?;

        let event_bus = ctx.data::<EventBus>()?;
        let receiver = event_bus.subscribe_tasks();

        let stream = tokio_stream::wrappers::BroadcastStream::new(receiver)
            .filter_map(move |_| None::<GqlMessageEvent>);

        Ok(stream)
    }

    async fn presence(
        &self,
        ctx: &Context<'_>,
    ) -> async_graphql::Result<impl Stream<Item = GqlUserPresence>> {
        let _auth = ctx.authenticated_user()?;

        let event_bus = ctx.data::<EventBus>()?;
        let receiver = event_bus.subscribe_tasks();

        let stream = tokio_stream::wrappers::BroadcastStream::new(receiver)
            .filter_map(|_| None::<GqlUserPresence>);

        Ok(stream)
    }

    async fn dm_received(
        &self,
        ctx: &Context<'_>,
        thread_id: ID,
    ) -> async_graphql::Result<impl Stream<Item = GqlDmMessage>> {
        let _auth = ctx.authenticated_user()?;
        let _thread_id = parse_id::<DmThreadId>(&thread_id)?;

        let event_bus = ctx.data::<EventBus>()?;
        let receiver = event_bus.subscribe_tasks();

        let stream = tokio_stream::wrappers::BroadcastStream::new(receiver)
            .filter_map(move |_| None::<GqlDmMessage>);

        Ok(stream)
    }
}
