use async_graphql::{Enum, ID, SimpleObject};

use crate::types::GqlTask;

#[derive(SimpleObject, Clone)]
pub struct TaskUpdatedEvent {
  pub kind: TaskEventKind,
  pub task: Option<GqlTask>,
  pub task_id: ID,
  pub project_id: ID
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum TaskEventKind {
  Created,
  Updated,
  Deleted
}