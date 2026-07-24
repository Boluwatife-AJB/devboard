use async_graphql::{Context, ID, MergedSubscription, Subscription};
use devboard_cache::{MessageBus, MessagingEvent};
use tokio_stream::{Stream, StreamExt, wrappers::errors::BroadcastStreamRecvError};

use devboard_domain::{ChannelId, DmThreadId, MessageId, ProjectId};
use devboard_service::{EventBus, TaskEvent};

use crate::{
    context::ContextExt,
    error::IntoGraphQLResult,
    resolvers::query::parse_id,
    types::{
        GqlDmMessage, GqlMessageEvent, GqlPresenceStatus, GqlReactionEvent, GqlTask,
        GqlUserPresence, TaskEventKind, TaskUpdatedEvent,
    },
};

#[derive(Default)]
pub struct CoreSubscription;

#[Subscription]
impl CoreSubscription {
    async fn task_updated<'ctx>(
        &self,
        ctx: &Context<'ctx>,
        project_id: ID,
    ) -> async_graphql::Result<impl Stream<Item = TaskUpdatedEvent> + 'ctx> {
        let auth = ctx.authenticated_user()?;

        let project_id: ProjectId = project_id
            .parse::<uuid::Uuid>()
            .map(ProjectId::from)
            .map_err(|_| async_graphql::Error::new("invalid project ID"))?;

        let services = ctx.services()?;

        let project = services
            .project_service
            .get_project(project_id, auth.user_id)
            .await
            .map_err(crate::error::to_graphql_error)?;

        let project_key = project.key.clone();

        let event_bus = ctx.data::<EventBus>()?;
        let receiver = event_bus.subscribe_tasks();

        let stream =
            tokio_stream::wrappers::BroadcastStream::new(receiver).filter_map(move |result| {
                match result {
                    Ok(event) => {
                        if event.project_id() != project_id {
                            return None;
                        }
                        Some(task_event_to_gql(event, &project_key))
                    }
                    Err(BroadcastStreamRecvError::Lagged(n)) => {
                        tracing::warn!(
                            skipped = n,
                            "subscription subscriber lagged, events skipped"
                        );
                        None
                    }
                }
            });

        Ok(stream)
    }
}

fn task_event_to_gql(event: TaskEvent, project_key: &str) -> TaskUpdatedEvent {
    match event {
        TaskEvent::Created { project_id, task } => {
            let _project_key = String::new();
            TaskUpdatedEvent {
                kind: TaskEventKind::Created,
                task: Some(GqlTask {
                    inner: task.clone(),
                    project_key: project_key.to_string(),
                }),
                task_id: ID(task.id.to_string()),
                project_id: ID(project_id.to_string()),
            }
        }
        TaskEvent::Updated { project_id, task } => TaskUpdatedEvent {
            kind: TaskEventKind::Updated,
            task: Some(GqlTask {
                inner: task.clone(),
                project_key: project_key.to_string(),
            }),
            task_id: ID(task.id.to_string()),
            project_id: ID(project_id.to_string()),
        },
        TaskEvent::Deleted {
            project_id,
            task_id,
        } => TaskUpdatedEvent {
            kind: TaskEventKind::Deleted,
            task: None,
            task_id: ID(task_id.to_string()),
            project_id: ID(project_id.to_string()),
        },
    }
}

#[derive(Default)]
pub struct MessagingSubscriptionFields;

#[Subscription]
impl MessagingSubscriptionFields {
    async fn channel_messages<'ctx>(
        &self,
        ctx: &Context<'ctx>,
        channel_id: ID,
    ) -> async_graphql::Result<impl Stream<Item = GqlMessageEvent> + 'ctx> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let channel_id_parsed = parse_id::<ChannelId>(&channel_id)?;

        services
            .messaging_service
            .list_messages(channel_id_parsed, auth.user_id, None, 1)
            .await
            .map_gql_err()?;

        let _message_bus = ctx.data::<MessageBus>()?;

        let event_bus = ctx.data::<EventBus>()?;
        let receiver = event_bus.subscribe_tasks();

        let stream = tokio_stream::wrappers::BroadcastStream::new(receiver)
            .filter_map(move |_result| None::<GqlMessageEvent>);

        Ok(stream)
    }

    async fn message_reactions<'ctx>(
        &self,
        ctx: &Context<'ctx>,
        message_id: ID,
    ) -> async_graphql::Result<impl Stream<Item = GqlReactionEvent> + 'ctx> {
        let _auth = ctx.authenticated_user()?;

        let _message_id_parsed = parse_id::<MessageId>(&message_id)?;

        let event_bus = ctx.data::<EventBus>()?;
        let receiver = event_bus.subscribe_tasks();

        let stream = tokio_stream::wrappers::BroadcastStream::new(receiver)
            .filter_map(move |_result| None::<GqlReactionEvent>);

        Ok(stream)
    }

    async fn dm_received<'ctx>(
        &self,
        ctx: &Context<'ctx>,
        thread_id: ID,
    ) -> async_graphql::Result<impl Stream<Item = GqlDmMessage> + 'ctx> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let thread_id_parsed = parse_id::<DmThreadId>(&thread_id)?;

        services
            .messaging_service
            .list_dm_messages(thread_id_parsed, auth.user_id, None, 1)
            .await
            .map_gql_err()?;

        let event_bus = ctx.data::<EventBus>()?;
        let receiver = event_bus.subscribe_tasks();

        let stream = tokio_stream::wrappers::BroadcastStream::new(receiver)
            .filter_map(move |_| None::<GqlDmMessage>);

        Ok(stream)
    }

    async fn presence<'ctx>(
        &self,
        ctx: &Context<'ctx>,
    ) -> async_graphql::Result<impl Stream<Item = GqlUserPresence> + 'ctx> {
        let auth = ctx.authenticated_user()?;
        let org_id = auth.require_org()?.organization_id;

        let message_bus = ctx.data::<std::sync::Arc<MessageBus>>()?.clone();
        let redis_stream = message_bus
            .subscribe_org_presence(org_id)
            .await
            .map_err(|err| async_graphql::Error::new(err.to_string()))?;

        let stream = redis_stream.filter_map(|event| match event {
            MessagingEvent::PresenceChanged {
                user_id, status, ..
            } => Some(GqlUserPresence {
                user_id: ID(user_id.to_string()),
                status: GqlPresenceStatus::from(status),
            }),
            _ => None,
        });

        Ok(stream)
    }
}

#[derive(MergedSubscription, Default)]
pub struct SubscriptionRoot(pub CoreSubscription, pub MessagingSubscriptionFields);
