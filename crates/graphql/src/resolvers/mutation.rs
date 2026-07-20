use async_graphql::{Context, ID, MergedObject, Object};

use devboard_domain::{
    AttachmentId, AttachmentKind, ChannelId, ChannelKind, CommentId, DmThreadId, MessageId,
    OrganizationId, ProjectId, TaskId, TeamId, UserId,
};
use devboard_service::task::CreateTaskCommand;

use crate::{
    context::ContextExt,
    error::IntoGraphQLResult,
    inputs::{
        AddAttachmentInput, AddProjectMemberInput, AssignTaskInput, CreateChannelInput,
        CreateProjectInput, CreateTaskInput, CreateTeamInput, DeleteMessageInput, EditMessageInput,
        MarkChannelAsReadInput, ReactionInput, SendDmInput, SendMessageInput,
        UpdateTaskStatusInput,
        comment::{CreateCommentInput, EditCommentInput},
        project::UpdateProjectInput,
        task::UpdateTaskDueDateInput,
    },
    resolvers::query::parse_id,
    types::{
        GqlAttachment, GqlChannel, GqlComment, GqlDmMessage, GqlDmThread, GqlMessage, GqlProject,
        GqlReactionSummary, GqlTask, GqlTeam, GqlTeamRole,
    },
};

#[derive(Default)]
pub struct CoreMutation;

#[Object]
impl CoreMutation {
    // Project Mutations
    async fn create_project(
        &self,
        ctx: &Context<'_>,
        input: CreateProjectInput,
    ) -> async_graphql::Result<GqlProject> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let team_id = parse_id::<devboard_domain::TeamId>(&input.team_id)?;
        let org_id = parse_id::<OrganizationId>(&input.organization_id)?;

        let project = services
            .project_service
            .create_project(
                org_id,
                team_id,
                auth.user_id,
                input.name,
                input.key,
                input.description,
            )
            .await
            .map_gql_err()?;

        Ok(GqlProject::from(project))
    }

    async fn update_project(
        &self,
        ctx: &Context<'_>,
        input: UpdateProjectInput,
    ) -> async_graphql::Result<GqlProject> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let project_id = parse_id::<ProjectId>(&input.project_id)?;

        let project = services
            .project_service
            .update_project(project_id, auth.user_id, input.name, input.description)
            .await
            .map_gql_err()?;

        Ok(GqlProject::from(project))
    }

    async fn delete_project(
        &self,
        ctx: &Context<'_>,
        project_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let project_id = parse_id::<ProjectId>(&project_id)?;

        services
            .project_service
            .delete_project(project_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn add_project_member(
        &self,
        ctx: &Context<'_>,
        input: AddProjectMemberInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let project_id = parse_id::<ProjectId>(&input.project_id)?;
        let user_id = parse_id::<UserId>(&input.user_id)?;
        let role = input.role_override.map(devboard_domain::ProjectRole::from);

        services
            .project_service
            .add_member(project_id, auth.user_id, user_id, role)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    // Team Mutations
    async fn create_team(
        &self,
        ctx: &Context<'_>,
        input: CreateTeamInput,
    ) -> async_graphql::Result<GqlTeam> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;

        let team = services
            .team_service
            .create_team(membership.organization_id, auth.user_id, input.name)
            .await
            .map_gql_err()?;

        Ok(GqlTeam { inner: team })
    }

    async fn update_team(
        &self,
        ctx: &Context<'_>,
        team_id: ID,
        name: String,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let team_id = parse_id::<TeamId>(&team_id)?;

        services
            .team_service
            .update_team(team_id, auth.user_id, name)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn add_team_member(
        &self,
        ctx: &Context<'_>,
        team_id: ID,
        user_id: ID,
        role: GqlTeamRole,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let team_id = parse_id::<TeamId>(&team_id)?;
        let user_id = parse_id::<UserId>(&user_id)?;
        let role = devboard_domain::TeamRole::from(role);

        services
            .team_service
            .add_member(team_id, auth.user_id, user_id, role)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn remove_team_member(
        &self,
        ctx: &Context<'_>,
        team_id: ID,
        user_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let team_id = parse_id::<TeamId>(&team_id)?;
        let user_id = parse_id::<UserId>(&user_id)?;

        services
            .team_service
            .remove_member(team_id, auth.user_id, user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    // Task Mutations
    async fn create_task(
        &self,
        ctx: &Context<'_>,
        input: CreateTaskInput,
    ) -> async_graphql::Result<GqlTask> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let project_id = parse_id::<ProjectId>(&input.project_id)?;
        let assignee_id = input
            .assignee_id
            .map(|id| parse_id::<UserId>(&id))
            .transpose()?;

        let priority = input
            .priority
            .map(devboard_domain::TaskPriority::from)
            .unwrap_or(devboard_domain::TaskPriority::Medium);

        let project = services
            .project_service
            .get_project(project_id, auth.user_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .create_task(CreateTaskCommand {
                project_id,
                reporter_id: auth.user_id,
                title: input.title,
                description: input.description,
                priority,
                assignee_id,
                due_date: input.due_date,
            })
            .await
            .map_gql_err()?;

        Ok(GqlTask {
            inner: task,
            project_key: project.key,
        })
    }

    async fn update_task_status(
        &self,
        ctx: &Context<'_>,
        input: UpdateTaskStatusInput,
    ) -> async_graphql::Result<GqlTask> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&input.task_id)?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;
        let new_status = devboard_domain::TaskStatus::from(input.status);

        let project = services
            .project_service
            .get_project(project_id, auth.user_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .update_status(task_id, auth.user_id, project_id, new_status)
            .await
            .map_gql_err()?;

        Ok(GqlTask {
            inner: task,
            project_key: project.key,
        })
    }

    async fn update_task_due_date(
        &self,
        ctx: &Context<'_>,
        input: UpdateTaskDueDateInput,
    ) -> async_graphql::Result<GqlTask> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&input.task_id)?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;

        let project = services
            .project_service
            .get_project(project_id, auth.user_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .update_due_date(task_id, auth.user_id, project_id, input.due_date)
            .await
            .map_gql_err()?;

        Ok(GqlTask {
            inner: task,
            project_key: project.key,
        })
    }

    async fn assign_task(
        &self,
        ctx: &Context<'_>,
        input: AssignTaskInput,
    ) -> async_graphql::Result<GqlTask> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&input.task_id)?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;
        let assignee_id = input
            .assignee_id
            .map(|id| parse_id::<UserId>(&id))
            .transpose()?;

        let project = services
            .project_service
            .get_project(project_id, auth.user_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .assign_task(task_id, auth.user_id, project_id, assignee_id)
            .await
            .map_gql_err()?;

        Ok(GqlTask {
            inner: task,
            project_key: project.key,
        })
    }

    async fn delete_task(
        &self,
        ctx: &Context<'_>,
        task_id: ID,
        project_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&task_id)?;
        let project_id = parse_id::<ProjectId>(&project_id)?;

        services
            .task_service
            .delete_task(task_id, auth.user_id, project_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    // Comment mutations
    async fn create_comment(
        &self,
        ctx: &Context<'_>,
        input: CreateCommentInput,
    ) -> async_graphql::Result<GqlComment> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&input.task_id)?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;

        let content = services
            .comment_service
            .create_comment(task_id, project_id, auth.user_id, input.body)
            .await
            .map_gql_err()?;

        Ok(GqlComment::from(content))
    }

    async fn edit_comment(
        &self,
        ctx: &Context<'_>,
        input: EditCommentInput,
    ) -> async_graphql::Result<GqlComment> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let comment_id = parse_id::<CommentId>(&input.comment_id)?;

        let comment = services
            .comment_service
            .edit_comment(comment_id, auth.user_id, input.body)
            .await
            .map_gql_err()?;

        Ok(GqlComment::from(comment))
    }

    async fn delete_comment(
        &self,
        ctx: &Context<'_>,
        comment_id: ID,
        project_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let comment_id = parse_id::<CommentId>(&comment_id)?;
        let project_id = parse_id::<ProjectId>(&project_id)?;

        services
            .comment_service
            .delete_comment(comment_id, project_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    // Attachment mutations
    async fn add_attachment(
        &self,
        ctx: &Context<'_>,
        input: AddAttachmentInput,
    ) -> async_graphql::Result<GqlAttachment> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&input.task_id)?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;
        let kind = AttachmentKind::from(input.kind);

        let attachment = services
            .attachment_service
            .add_attachment(
                task_id,
                project_id,
                auth.user_id,
                kind,
                input.label,
                input.url,
            )
            .await
            .map_gql_err()?;

        Ok(GqlAttachment::from(attachment))
    }

    async fn remove_attachment(
        &self,
        ctx: &Context<'_>,
        attachment_id: ID,
        project_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let attachment_id = parse_id::<AttachmentId>(&attachment_id)?;
        let project_id = parse_id::<ProjectId>(&project_id)?;

        services
            .attachment_service
            .remove_attachment(attachment_id, project_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }
}

#[derive(Default)]
pub struct MessagingMutationFields;

#[Object]
impl MessagingMutationFields {
    async fn create_channel(
        &self,
        ctx: &Context<'_>,
        input: CreateChannelInput,
    ) -> async_graphql::Result<GqlChannel> {
        let auth = ctx.authenticated_user()?;
        let org_id = auth.require_org()?.organization_id;
        let services = ctx.services()?;

        let channel_kind = input
            .kind
            .map(ChannelKind::from)
            .unwrap_or(ChannelKind::Open);

        let channel = services
            .messaging_service
            .create_channel(
                org_id,
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
        let org_id = auth.require_org()?.organization_id;
        let services = ctx.services()?;

        services
            .messaging_service
            .join_channel(parse_id::<ChannelId>(&channel_id)?, auth.user_id, org_id)
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

        let message = services
            .messaging_service
            .send_message(
                parse_id::<ChannelId>(&input.channel_id)?,
                auth.user_id,
                input.body,
            )
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

        let message = services
            .messaging_service
            .edit_message(
                parse_id::<MessageId>(&input.message_id)?,
                auth.user_id,
                input.body,
            )
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

        services
            .messaging_service
            .delete_message(
                parse_id::<MessageId>(&input.message_id)?,
                auth.user_id,
                parse_id::<OrganizationId>(&input.org_id)?,
            )
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

        let reactions = services
            .messaging_service
            .add_reaction(
                parse_id::<MessageId>(&input.message_id)?,
                auth.user_id,
                input.emoji,
            )
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

        let reactions = services
            .messaging_service
            .remove_reaction(
                parse_id::<MessageId>(&input.message_id)?,
                auth.user_id,
                input.emoji,
            )
            .await
            .map_gql_err()?;

        Ok(reactions
            .into_iter()
            .map(GqlReactionSummary::from)
            .collect())
    }

    async fn mark_channel_as_read(
        &self,
        ctx: &Context<'_>,
        input: MarkChannelAsReadInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        services
            .messaging_service
            .mark_channel_read(
                parse_id::<ChannelId>(&input.channel_id)?,
                auth.user_id,
                parse_id::<MessageId>(&input.last_message_id)?,
            )
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
        let org_id = auth.require_org()?.organization_id;

        let thread = services
            .messaging_service
            .get_or_create_dm_thread(auth.user_id, parse_id::<UserId>(&other_user_id)?, org_id)
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

        let message = services
            .messaging_service
            .send_dm(
                parse_id::<DmThreadId>(&input.thread_id)?,
                auth.user_id,
                input.body,
            )
            .await
            .map_gql_err()?;

        Ok(GqlDmMessage::from(message))
    }

    async fn mark_dm_as_read(
        &self,
        ctx: &Context<'_>,
        thread_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        services
            .messaging_service
            .mark_dm_read(parse_id::<DmThreadId>(&thread_id)?, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }
}

#[derive(MergedObject, Default)]
pub struct MutationRoot(pub CoreMutation, pub MessagingMutationFields);
