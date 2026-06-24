use async_graphql::{ID, InputObject};

use crate::types::{GqlTaskPriority, GqlTaskStatus};

#[derive(InputObject)]
pub struct CreateTaskInput {
  pub project_id: ID,
  pub title: String,
  pub description: Option<String>,
  pub priority: Option<GqlTaskPriority>,
  pub assignee_id: Option<ID>
}

#[derive(InputObject)]
pub struct UpdateTaskStatusInput {
  pub task_id: ID,
  pub project_id: ID,
  pub status: GqlTaskStatus
}

#[derive(InputObject)]
pub struct AssignTaskInput {
  pub task_id: ID,
  pub project_id: ID,
  pub assignee_id: Option<ID>
}