use async_graphql::{Context, ID, Object};

use devboard_domain::{OrganizationId, ProjectId, TaskId, UserId};

use crate::{
    context::ContextExt,
    error::IntoGraphQLResult,
    inputs::{
        AssignTaskInput, AuthPayloadGql, CreateProjectInput, CreateTaskInput, LoginInput,
        RegisterInput, UpdateTaskStatusInput,
    },
    resolvers::query::parse_id,
    types::{GqlProject, GqlTask},
};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn register(
        &self,
        ctx: &Context<'_>,
        input: RegisterInput,
    ) -> async_graphql::Result<AuthPayloadGql> {
        let services = ctx.services()?;

        let org_id = parse_id::<OrganizationId>(&input.organization_id)?;

        let payload = services
            .auth_service
            .register(input.email, input.display_name, input.password, org_id)
            .await
            .map_gql_err()?;

        Ok(AuthPayloadGql {
            access_token: payload.access_token,
            user: payload.user.into(),
        })
    }

    async fn login(
        &self,
        ctx: &Context<'_>,
        input: LoginInput,
    ) -> async_graphql::Result<AuthPayloadGql> {
        let services = ctx.services()?;

        let org_id = parse_id::<OrganizationId>(&input.organization_id)?;

        let payload = services
            .auth_service
            .login(input.email, input.password, org_id)
            .await
            .map_gql_err()?;

        Ok(AuthPayloadGql {
            access_token: payload.access_token,
            user: payload.user.into(),
        })
    }

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
            .create_task(
                project_id,
                auth.user_id,
                input.title,
                input.description,
                priority,
                assignee_id,
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
}
