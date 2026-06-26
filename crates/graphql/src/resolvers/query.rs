use async_graphql::{Context, ID, Object};
use devboard_domain::{ProjectId, TaskId, TaskStatus};

use crate::{
  GqlUser, 
  context::ContextExt, 
  error::IntoGraphQLResult, 
  types::{
    GqlProject, GqlTask, GqlTaskStatus, 
    pagination::{
      ConnectionArgs, PageInfo, TaskConnection, TaskEdge, decode_cursor, encode_cursor
    }
  }
};

pub struct QueryRoot; 

#[Object]
impl QueryRoot {
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

    async fn project(
      &self,
      ctx: &Context<'_>,
      id: ID
    ) -> async_graphql::Result<GqlProject> {
      let auth = ctx.authenticated_user()?;
      let services = ctx.services()?;

      let project_id = parse_id::<ProjectId>(&id)?;

      let project = services
        .project_service
        .get_project(project_id, auth.user_id)
        .await
        .map_gql_err()?;

      Ok(GqlProject::from(project))
    }

    async fn projects(
      &self,
      ctx: &Context<'_>
    ) -> async_graphql::Result<Vec<GqlProject>> {
      let auth = ctx.authenticated_user()?;
      let services = ctx.services()?;

      let org_id = auth
        .claims
        .organization_id()
        .map_err(|_| async_graphql::Error::new("invalid token claims"))?;

      let projects = services
        .project_service
        .list_projects(org_id, auth.user_id)
        .await
        .map_gql_err()?;

      Ok(projects.into_iter().map(GqlProject::from).collect())
    }

    async fn tasks(
      &self,
      ctx: &Context<'_>,
      project_id: ID,
      status: Option<GqlTaskStatus>,
    ) -> async_graphql::Result<Vec<GqlTask>> {
      let auth = ctx.authenticated_user()?;
      let services = ctx.services()?;

      let project_id = parse_id::<ProjectId>(&project_id)?;
      let status_filter = status.map(TaskStatus::from);

      let project = services
        .project_service
        .get_project(project_id, auth.user_id)
        .await
        .map_gql_err()?;

      let tasks = services
        .task_service
        .list_tasks(project_id, auth.user_id, status_filter)
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

      let project = services
        .project_service
        .get_project(project_id, auth.user_id)
        .await
        .map_gql_err()?;

      let task = services
        .task_service
        .get_task(task_id, auth.user_id, project_id)
        .await
        .map_gql_err()?;

      Ok(GqlTask { 
        inner: task, 
        project_key: project.key 
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

      let project = services
        .project_service
        .get_project(project_id, auth.user_id)
        .await
        .map_gql_err()?;

      let (tasks, has_next) = services
        .task_service
        .list_tasks_paginated(
          project_id,
          auth.user_id,
          status_filter,
          after_id,
          limit,
        )
        .await
        .map_gql_err()?;

      let edges: Vec<TaskEdge> = tasks
        .into_iter()
        .map(|t| {
          let cursor = encode_cursor(&t.id.to_string());
          TaskEdge {
            cursor,
            node: GqlTask { inner: t, project_key: project.key.clone() },
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
}

pub fn parse_id<T: From<uuid::Uuid>>(
  id: &ID,
) -> async_graphql::Result<T> {
  id.parse::<uuid::Uuid>()
    .map(T::from)
    .map_err(|_| {
      async_graphql::Error::new(format!(
        "invalid ID format: {}",
        id.as_str()
      ))
    })
}