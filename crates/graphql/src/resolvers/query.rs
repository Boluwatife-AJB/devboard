use async_graphql::{Context, ID, MergedObject, Object};
use devboard_domain::{
    ChannelId, DmMessageId, DmThreadId, MessageId, NotificationId, ProjectId, TaskId, TaskStatus,
    TeamId,
};
use devboard_repository::notification::ListNotifications;

use crate::{
    GqlUser,
    context::ContextExt,
    error::IntoGraphQLResult,
    types::{
        GqlAttachment, GqlChannel, GqlChannelMember, GqlComment, GqlDmMessage, GqlDmThread,
        GqlInvitation, GqlMessage, GqlMyDashboard, GqlNotification, GqlNotificationKind,
        GqlNotificationPreference, GqlOrgDashboard, GqlOrgMember, GqlOrgMemberProfile,
        GqlOrgSummary, GqlProject, GqlTask, GqlTaskStatus, GqlTeam, GqlTeamMember, GqlUserPresence,
        pagination::{
            ConnectionArgs, PageInfo, TaskConnection, TaskEdge, decode_cursor, encode_cursor,
        },
    },
};

#[derive(Default)]
pub struct CoreQuery;

#[Object]
impl CoreQuery {
    async fn me(&self, ctx: &Context<'_>) -> async_graphql::Result<GqlUser> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let user = services
            .auth_service
            .get_user(auth.user_id)
            .await
            .map_gql_err()?;

        Ok(GqlUser::from(user))
    }

    async fn project(&self, ctx: &Context<'_>, id: ID) -> async_graphql::Result<GqlProject> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let project_id = parse_id::<ProjectId>(&id)?;

        let membership = auth.require_org()?;
        let project = services
            .project_service
            .get_project(&membership, project_id)
            .await
            .map_gql_err()?;

        Ok(GqlProject::from(project))
    }

    async fn projects(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<GqlProject>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;

        let projects = services
            .project_service
            .list_projects(&membership)
            .await
            .map_gql_err()?;

        Ok(projects.into_iter().map(GqlProject::from).collect())
    }

    async fn teams(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<GqlTeam>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;

        let teams = services
            .team_service
            .list_teams(membership.organization_id)
            .await
            .map_gql_err()?;

        Ok(teams.into_iter().map(|t| GqlTeam { inner: t }).collect())
    }

    async fn team_members(
        &self,
        ctx: &Context<'_>,
        team_id: ID,
    ) -> async_graphql::Result<Vec<GqlTeamMember>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;
        let team_id = parse_id::<TeamId>(&team_id)?;

        let members = services
            .team_service
            .list_members(team_id, membership.organization_id)
            .await
            .map_gql_err()?;

        Ok(members
            .into_iter()
            .map(|m| GqlTeamMember { inner: m })
            .collect())
    }

    async fn org_members(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<GqlOrgMember>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;

        let members = services
            .team_service
            .list_org_members(membership.organization_id)
            .await
            .map_gql_err()?;

        Ok(members
            .into_iter()
            .map(|m| GqlOrgMember { inner: m })
            .collect())
    }

    /// Pending invitations for the current org. Requires OrgAdmin.
    async fn pending_invitations(
        &self,
        ctx: &Context<'_>,
    ) -> async_graphql::Result<Vec<GqlInvitation>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;

        let invitations = services
            .auth_service
            .list_pending_invitations(auth.user_id, membership.organization_id)
            .await
            .map_gql_err()?;

        Ok(invitations
            .into_iter()
            .map(|view| GqlInvitation {
                inner: view.invitation,
                invite_url: view.invite_url,
            })
            .collect())
    }

    async fn tasks(
        &self,
        ctx: &Context<'_>,
        project_id: ID,
        status: Option<GqlTaskStatus>,
    ) -> async_graphql::Result<Vec<GqlTask>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let membership = auth.require_org()?;
        let project_id = parse_id::<ProjectId>(&project_id)?;
        let status_filter = status.map(TaskStatus::from);

        let project = services
            .project_service
            .get_project(&membership, project_id)
            .await
            .map_gql_err()?;

        let tasks = services
            .task_service
            .list_tasks(&membership, project_id, status_filter)
            .await
            .map_gql_err()?;

        Ok(tasks
            .into_iter()
            .map(|t| GqlTask {
                project_key: project.key.clone(),
                inner: t,
            })
            .collect())
    }

    async fn task(
        &self,
        ctx: &Context<'_>,
        id: ID,
        project_id: ID,
    ) -> async_graphql::Result<GqlTask> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&id)?;
        let project_id = parse_id::<ProjectId>(&project_id)?;

        let membership = auth.require_org()?;
        let project = services
            .project_service
            .get_project(&membership, project_id)
            .await
            .map_gql_err()?;

        let task = services
            .task_service
            .get_task(&membership, task_id, project_id)
            .await
            .map_gql_err()?;

        Ok(GqlTask {
            inner: task,
            project_key: project.key,
        })
    }

    async fn tasks_paginated(
        &self,
        ctx: &Context<'_>,
        project_id: ID,
        status: Option<GqlTaskStatus>,
        args: ConnectionArgs,
    ) -> async_graphql::Result<TaskConnection> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let project_id = parse_id::<ProjectId>(&project_id)?;
        let status_filter = status.map(TaskStatus::from);
        let limit = args.limit();

        let after_id = args
            .after
            .as_deref()
            .and_then(decode_cursor)
            .and_then(|s| s.parse::<uuid::Uuid>().ok());

        let membership = auth.require_org()?;
        let project = services
            .project_service
            .get_project(&membership, project_id)
            .await
            .map_gql_err()?;

        let (tasks, has_next) = services
            .task_service
            .list_tasks_paginated(&membership, project_id, status_filter, after_id, limit)
            .await
            .map_gql_err()?;

        let edges: Vec<TaskEdge> = tasks
            .into_iter()
            .map(|t| {
                let cursor = encode_cursor(&t.id.to_string());
                TaskEdge {
                    cursor,
                    node: GqlTask {
                        inner: t,
                        project_key: project.key.clone(),
                    },
                }
            })
            .collect();

        let start_cursor = edges.first().map(|e| e.cursor.clone());
        let end_cursor = edges.last().map(|e| e.cursor.clone());

        Ok(TaskConnection {
            page_info: PageInfo {
                has_next_page: has_next,
                has_previous_page: args.after.is_some(),
                start_cursor,
                end_cursor,
            },
            total_count: edges.len() as i64,
            edges,
        })
    }

    async fn comments(
        &self,
        ctx: &Context<'_>,
        task_id: ID,
        project_id: ID,
    ) -> async_graphql::Result<Vec<GqlComment>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&task_id)?;
        let project_id = parse_id::<ProjectId>(&project_id)?;

        let comments = services
            .comment_service
            .list_comments(task_id, project_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(comments.into_iter().map(GqlComment::from).collect())
    }
    async fn attachments(
        &self,
        ctx: &Context<'_>,
        task_id: ID,
        project_id: ID,
    ) -> async_graphql::Result<Vec<GqlAttachment>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let task_id = parse_id::<TaskId>(&task_id)?;
        let project_id = parse_id::<ProjectId>(&project_id)?;

        let attachments = services
            .attachment_service
            .list_attachments(task_id, project_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(attachments.into_iter().map(GqlAttachment::from).collect())
    }

    async fn my_dashboard(&self, ctx: &Context<'_>) -> async_graphql::Result<GqlMyDashboard> {
        let auth = ctx.authenticated_user()?;
        let membership = auth.require_org()?;
        let summary = ctx
            .services()?
            .dashboard_service
            .my_dashboard(auth.user_id, membership)
            .await
            .map_gql_err()?;

        Ok(GqlMyDashboard::from(summary))
    }

    async fn org_dashboard(&self, ctx: &Context<'_>) -> async_graphql::Result<GqlOrgDashboard> {
        let auth = ctx.authenticated_user()?;
        let membership = auth.require_org()?;
        let summary = ctx
            .services()?
            .dashboard_service
            .org_dashboard(auth.user_id, membership)
            .await
            .map_gql_err()?;
        Ok(GqlOrgDashboard::from(summary))
    }

    async fn my_organizations(
        &self,
        ctx: &Context<'_>,
    ) -> async_graphql::Result<Vec<GqlOrgSummary>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let orgs = services
            .profile_service
            .list_my_organizations(auth.user_id)
            .await
            .map_gql_err()?;

        Ok(orgs.into_iter().map(GqlOrgSummary::from).collect())
    }

    async fn my_org_profile(
        &self,
        ctx: &Context<'_>,
    ) -> async_graphql::Result<GqlOrgMemberProfile> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;
        let membership = auth.require_org()?;

        let profile = services
            .profile_service
            .get_my_org_profile(auth.user_id, membership.organization_id)
            .await
            .map_gql_err()?;

        Ok(GqlOrgMemberProfile::from(profile))
    }
}

pub fn parse_id<T: From<uuid::Uuid>>(id: &ID) -> async_graphql::Result<T> {
    id.parse::<uuid::Uuid>()
        .map(T::from)
        .map_err(|_| async_graphql::Error::new(format!("invalid ID format: {}", id.as_str())))
}

#[derive(Default)]
pub struct MessagingQueryFields;

#[Object]
impl MessagingQueryFields {
    async fn channels(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<GqlChannel>> {
        let auth = ctx.authenticated_user()?;
        let org_id = auth.require_org()?.organization_id;
        let services = ctx.services()?;

        let channels = services
            .messaging_service
            .list_channels(org_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(channels
            .into_iter()
            .map(|(channel, is_member)| GqlChannel::from_channel(channel, is_member))
            .collect())
    }

    async fn channel_members(
        &self,
        ctx: &Context<'_>,
        channel_id: ID,
    ) -> async_graphql::Result<Vec<GqlChannelMember>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let channel_id = parse_id::<ChannelId>(&channel_id)?;
        let members = services
            .messaging_service
            .list_channel_members(channel_id, auth.user_id)
            .await
            .map_gql_err()?;

        Ok(members.into_iter().map(GqlChannelMember::from).collect())
    }

    async fn channel_messages(
        &self,
        ctx: &Context<'_>,
        channel_id: ID,
        before_id: Option<ID>,
        limit: Option<i32>,
    ) -> async_graphql::Result<Vec<GqlMessage>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let channel_id = parse_id::<ChannelId>(&channel_id)?;
        let before_id = before_id.map(|id| parse_id::<MessageId>(&id)).transpose()?;

        let messages = services
            .messaging_service
            .list_messages(
                channel_id,
                auth.user_id,
                before_id,
                limit.unwrap_or(50) as u64,
            )
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
        limit: Option<i32>,
    ) -> async_graphql::Result<Vec<GqlDmMessage>> {
        let auth = ctx.authenticated_user()?;
        let services = ctx.services()?;

        let thread_id = parse_id::<DmThreadId>(&thread_id)?;
        let before_id = before_id
            .map(|id| parse_id::<DmMessageId>(&id))
            .transpose()?;

        let messages = services
            .messaging_service
            .list_dm_messages(
                thread_id,
                auth.user_id,
                before_id,
                limit.unwrap_or(50) as u64,
            )
            .await
            .map_gql_err()?;

        Ok(messages.into_iter().map(GqlDmMessage::from).collect())
    }

    /// Current presence snapshot for every member of the selected organization.
    async fn org_presence(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<GqlUserPresence>> {
        let auth = ctx.authenticated_user()?;
        let org_id = auth.require_org()?.organization_id;
        let services = ctx.services()?;

        let presence = services
            .messaging_service
            .list_org_presence(auth.user_id, org_id)
            .await
            .map_gql_err()?;

        Ok(presence.into_iter().map(GqlUserPresence::from).collect())
    }
}

#[derive(Default)]
pub struct NotificationQueryFields;

#[Object]
impl NotificationQueryFields {
    async fn notifications(
        &self,
        ctx: &Context<'_>,
        unread_only: Option<bool>,
        limit: Option<i32>,
        before_id: Option<ID>,
    ) -> async_graphql::Result<Vec<GqlNotification>> {
        let auth = ctx.authenticated_user()?;
        let org = auth.require_org()?;
        let services = ctx.services()?;

        let before = before_id
            .map(|id| parse_id::<NotificationId>(&id))
            .transpose()?;

        let notifications = services
            .notification_service
            .list(ListNotifications {
                recipient_id: auth.user_id,
                organization_id: org.organization_id,
                unread_only: unread_only.unwrap_or(false),
                limit: limit.unwrap_or(50) as u64,
                before_id: before,
            })
            .await
            .map_gql_err()?;

        Ok(notifications
            .into_iter()
            .map(GqlNotification::from)
            .collect())
    }

    async fn unread_notification_count(&self, ctx: &Context<'_>) -> async_graphql::Result<i32> {
        let auth = ctx.authenticated_user()?;
        let org = auth.require_org()?;
        let services = ctx.services()?;

        let count = services
            .notification_service
            .unread_count(auth.user_id, org.organization_id)
            .await
            .map_gql_err()?;

        Ok(count as i32)
    }

    async fn notification_preferences(
        &self,
        ctx: &Context<'_>,
    ) -> async_graphql::Result<Vec<GqlNotificationPreference>> {
        let auth = ctx.authenticated_user()?;
        let org = auth.require_org()?;
        let services = ctx.services()?;

        let preferences = services
            .notification_service
            .get_preferences(auth.user_id, org.organization_id)
            .await
            .map_gql_err()?;

        Ok(preferences
            .into_iter()
            .map(|p| GqlNotificationPreference {
                kind: GqlNotificationKind::from(p.kind),
                in_app: p.in_app,
                email: p.email,
                push: p.push,
            })
            .collect())
    }
}

#[derive(MergedObject, Default)]
pub struct QueryRoot(
    pub CoreQuery,
    pub MessagingQueryFields,
    pub NotificationQueryFields,
);
