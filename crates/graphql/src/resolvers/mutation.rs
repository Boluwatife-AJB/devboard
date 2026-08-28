use async_graphql::{Context, ID, MergedObject, Object};

use devboard_domain::{
    AttachmentId, AttachmentKind, ChannelId, ChannelKind, CommentId, DmMessageId, DmThreadId,
    InvitationId, MessageId, NotificationId, NotificationPreference, OrgRole::OrgAdmin,
    OrganizationId, ProjectId, TaskId, TeamId, UserId,
};
use devboard_service::{ServiceError, task::CreateTaskCommand};

use crate::{
    context::ContextExt,
    error::IntoGraphQLResult,
    inputs::{
        AddAttachmentInput, AddChannelMemberInput, AddProjectMemberInput, AddTeamMemberInput,
        AssignTaskInput, CreateChannelInput, CreateProjectInput, CreateTaskInput, CreateTeamInput,
        DeleteDmInput, DeleteMessageInput, EditDmInput, EditMessageInput, MarkChannelAsReadInput,
        ReactionInput, RegisterPushSubscriptionInput, RemoveChannelMemberInput,
        SendAnnouncementInput, SendDmInput, SendMessageInput, UnregisterPushSubscriptionInput,
        UpdateNotificationPreferencesInput, UpdateTaskStatusInput,
        comment::{CreateCommentInput, EditCommentInput},
        project::UpdateProjectInput,
        task::UpdateTaskDueDateInput,
    },
    resolvers::query::parse_id,
    types::{
        GqlAttachment, GqlChannel, GqlComment, GqlDmMessage, GqlDmThread, GqlMessage,
        GqlNotificationKind, GqlNotificationPreference, GqlProject, GqlReactionSummary, GqlTask,
        GqlTeam,
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

        let membership = auth.require_org()?;
        let team_id = parse_id::<TeamId>(&input.team_id)?;

        let project = services
            .project_service
            .create_project(
                &membership,
                team_id,
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

        let membership = auth.require_org()?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;

        let project = services
            .project_service
            .update_project(&membership, project_id, input.name, input.description)
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

        let membership = auth.require_org()?;
        let project_id = parse_id::<ProjectId>(&project_id)?;

        services
            .project_service
            .delete_project(&membership, project_id)
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

        let membership = auth.require_org()?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;
        let user_id = parse_id::<UserId>(&input.user_id)?;
        let role = input.role_override.map(devboard_domain::ProjectRole::from);

        services
            .project_service
            .add_member(&membership, project_id, user_id, role)
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
            .create_team(&membership, input.name)
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

        let membership = auth.require_org()?;
        services
            .team_service
            .update_team(&membership, team_id, name)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn add_team_member(
        &self,
        ctx: &Context<'_>,
        input: AddTeamMemberInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;
        let team_id = parse_id::<TeamId>(&input.team_id)?;
        let user_id = parse_id::<UserId>(&input.user_id)?;
        let role = input
            .role
            .map(devboard_domain::TeamRole::from)
            .unwrap_or(devboard_domain::TeamRole::Member);

        services
            .team_service
            .add_member(&membership, team_id, user_id, role)
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

        let membership = auth.require_org()?;
        let team_id = parse_id::<TeamId>(&team_id)?;
        let user_id = parse_id::<UserId>(&user_id)?;

        services
            .team_service
            .remove_member(&membership, team_id, user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    // Invitation Mutations
    /// Revokes a pending invitation. Requires OrgAdmin.
    async fn revoke_invitation(
        &self,
        ctx: &Context<'_>,
        invitation_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;
        let invitation_id = parse_id::<InvitationId>(&invitation_id)?;

        services
            .auth_service
            .revoke_invitation(auth.user_id, membership.organization_id, invitation_id)
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

        let membership = auth.require_org()?;
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
            .get_project(&membership, project_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .create_task(
                &membership,
                CreateTaskCommand {
                    project_id,
                    reporter_id: auth.user_id,
                    title: input.title,
                    description: input.description,
                    priority,
                    assignee_id,
                    due_date: input.due_date,
                },
            )
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

        let membership = auth.require_org()?;
        let task_id = parse_id::<TaskId>(&input.task_id)?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;
        let new_status = devboard_domain::TaskStatus::from(input.status);

        let project = services
            .project_service
            .get_project(&membership, project_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .update_status(&membership, task_id, project_id, new_status)
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

        let membership = auth.require_org()?;
        let project = services
            .project_service
            .get_project(&membership, project_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .update_due_date(&membership, task_id, project_id, input.due_date)
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

        let membership = auth.require_org()?;
        let task_id = parse_id::<TaskId>(&input.task_id)?;
        let project_id = parse_id::<ProjectId>(&input.project_id)?;
        let assignee_id = input
            .assignee_id
            .map(|id| parse_id::<UserId>(&id))
            .transpose()?;

        let project = services
            .project_service
            .get_project(&membership, project_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .assign_task(&membership, task_id, project_id, assignee_id)
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

        let membership = auth.require_org()?;
        let task_id = parse_id::<TaskId>(&task_id)?;
        let project_id = parse_id::<ProjectId>(&project_id)?;

        services
            .task_service
            .delete_task(&membership, task_id, project_id)
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

    async fn add_channel_member(
        &self,
        ctx: &Context<'_>,
        input: AddChannelMemberInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let org_id = auth.require_org()?.organization_id;
        let services = ctx.services()?;

        services
            .messaging_service
            .add_channel_member(
                parse_id::<ChannelId>(&input.channel_id)?,
                auth.user_id,
                parse_id::<UserId>(&input.user_id)?,
                org_id,
            )
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn leave_channel(
        &self,
        ctx: &Context<'_>,
        channel_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let org_id = auth.require_org()?.organization_id;
        let services = ctx.services()?;

        services
            .messaging_service
            .leave_channel(parse_id::<ChannelId>(&channel_id)?, auth.user_id, org_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn remove_channel_member(
        &self,
        ctx: &Context<'_>,
        input: RemoveChannelMemberInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let org_id = auth.require_org()?.organization_id;
        let services = ctx.services()?;

        services
            .messaging_service
            .remove_channel_member(
                parse_id::<ChannelId>(&input.channel_id)?,
                auth.user_id,
                parse_id::<UserId>(&input.user_id)?,
                org_id,
            )
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
                auth.require_org()?.organization_id,
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

    async fn edit_dm(
        &self,
        ctx: &Context<'_>,
        input: EditDmInput,
    ) -> async_graphql::Result<GqlDmMessage> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let message = services
            .messaging_service
            .edit_dm(
                parse_id::<DmMessageId>(&input.message_id)?,
                auth.user_id,
                input.body,
            )
            .await
            .map_gql_err()?;

        Ok(GqlDmMessage::from(message))
    }

    async fn delete_dm(
        &self,
        ctx: &Context<'_>,
        input: DeleteDmInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        services
            .messaging_service
            .delete_dm(parse_id::<DmMessageId>(&input.message_id)?, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn clear_channel_messages(
        &self,
        ctx: &Context<'_>,
        channel_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        services
            .messaging_service
            .clear_channel_for_user(parse_id::<ChannelId>(&channel_id)?, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn clear_dm_messages(
        &self,
        ctx: &Context<'_>,
        thread_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        services
            .messaging_service
            .clear_dm_for_user(parse_id::<DmThreadId>(&thread_id)?, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }
}

#[derive(Default)]
pub struct NotificationMutationFields;

#[Object]
impl NotificationMutationFields {
    async fn mark_notification_read(
        &self,
        ctx: &Context<'_>,
        notification_id: ID,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        services
            .notification_service
            .mark_as_read(parse_id::<NotificationId>(&notification_id)?, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn mark_all_notifications_read(&self, ctx: &Context<'_>) -> async_graphql::Result<i32> {
        let auth = ctx.authenticated_user()?;
        let org = auth.require_org()?;
        let services = ctx.services()?;

        let count = services
            .notification_service
            .mark_all_as_read(auth.user_id, org.organization_id)
            .await
            .map_gql_err()?;

        Ok(count as i32)
    }

    async fn update_notification_preferences(
        &self,
        ctx: &Context<'_>,
        input: UpdateNotificationPreferencesInput,
    ) -> async_graphql::Result<GqlNotificationPreference> {
        let auth = ctx.authenticated_user()?;
        let org = auth.require_org()?;
        let services = ctx.services()?;

        let preference = services
            .notification_service
            .update_preferences(NotificationPreference {
                user_id: auth.user_id,
                organization_id: org.organization_id,
                kind: input.kind.into(),
                in_app: input.in_app,
                email: input.email,
                push: input.push,
            })
            .await
            .map_gql_err()?;

        Ok(GqlNotificationPreference {
            kind: GqlNotificationKind::from(preference.kind),
            in_app: preference.in_app,
            email: preference.email,
            push: preference.push,
        })
    }

    async fn register_push_subscription(
        &self,
        ctx: &Context<'_>,
        input: RegisterPushSubscriptionInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        services
            .notification_service
            .register_push(
                auth.user_id,
                input.endpoint,
                input.p256dh,
                input.auth,
                input.user_agent,
            )
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn unregister_push_subscription(
        &self,
        ctx: &Context<'_>,
        input: UnregisterPushSubscriptionInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        services
            .notification_service
            .unregister_push(auth.user_id, input.endpoint)
            .await
            .map_gql_err()?;

        Ok(true)
    }

    async fn send_announcement(
        &self,
        ctx: &Context<'_>,
        input: SendAnnouncementInput,
    ) -> async_graphql::Result<bool> {
        let auth = ctx.authenticated_user()?;
        let org = auth.require_org()?;
        let services = ctx.services()?;

        if !org.role.at_least(OrgAdmin) {
            return Err(crate::error::to_graphql_error(ServiceError::Forbidden {
                reason: "requires OrgAdmin to send announcements".into(),
            }));
        }

        let recipients = input
            .recipient_ids
            .iter()
            .map(parse_id::<UserId>)
            .collect::<async_graphql::Result<Vec<_>>>()?;

        for recipient_id in recipients {
            let _ = services
                .notification_service
                .notify_announcement(
                    recipient_id,
                    org.organization_id,
                    input.title.clone(),
                    input.body.clone(),
                    input.action_url.clone(),
                )
                .await;
        }

        Ok(true)
    }
}

#[derive(MergedObject, Default)]
pub struct MutationRoot(
    pub CoreMutation,
    pub MessagingMutationFields,
    pub NotificationMutationFields,
);
