use async_graphql::{Context, Enum, ID, Object, dataloader::DataLoader};
use chrono::{DateTime, Utc};
use devboard_domain::{Task, TaskPriority, TaskStatus};

use crate::{GqlUser, UserLoader};

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlTaskStatus {
  Backlog,
  Todo,
  InProgress,
  InReview,
  Done,
  Cancelled
}

impl From<TaskStatus> for GqlTaskStatus {
    fn from(s: TaskStatus) -> Self {
      match s {
          TaskStatus::Backlog => Self::Backlog,
          TaskStatus::Todo => Self::Todo,
          TaskStatus::InProgress => Self::InProgress,
          TaskStatus::InReview => Self::InReview,
          TaskStatus::Done => Self::Done,
          TaskStatus::Cancelled => Self::Cancelled
      }
    }
}


impl From<GqlTaskStatus> for TaskStatus {
    fn from(s: GqlTaskStatus) -> Self {
        match s {
            GqlTaskStatus::Backlog => Self::Backlog,
            GqlTaskStatus::Todo => Self::Todo,
            GqlTaskStatus::InProgress => Self::InProgress,
            GqlTaskStatus::InReview => Self::InReview,
            GqlTaskStatus::Done => Self::Done,
            GqlTaskStatus::Cancelled => Self::Cancelled
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlTaskPriority {
    Low,
    Medium,
    High,
    Urgent
}

impl From<TaskPriority> for GqlTaskPriority {
    fn from(p: TaskPriority) -> Self {
        match p {
            TaskPriority::Low => Self::Low,
            TaskPriority::Medium => Self::Medium,
            TaskPriority::High => Self::High,
            TaskPriority::Urgent => Self::Urgent
        }
    }
}

impl From<GqlTaskPriority> for TaskPriority {
    fn from(p: GqlTaskPriority) -> Self {
        match p {
            GqlTaskPriority::Low => Self::Low,
            GqlTaskPriority::Medium => Self::Medium,
            GqlTaskPriority::High => Self::High,
            GqlTaskPriority::Urgent => Self::Urgent,
        }
    }
}

pub struct GqlTask {
  pub inner: Task,
  pub project_key: String,
}

#[Object]
impl GqlTask {
    async fn id(&self) -> ID {
      ID(self.inner.id.to_string())
    }

    async fn project_id(&self) -> ID {
      ID(self.inner.project_id.to_string())
    }

    async fn key(&self) -> String {
      self.inner.display_key(&self.project_key)
    }

    async fn task_number(&self) -> i32 {
      self.inner.task_number
    }

    async fn title(&self) -> &str {
      &self.inner.title
    }

    async fn description(&self) -> Option<&str> {
      self.inner.description.as_deref()
    }

    async fn status(&self) -> GqlTaskStatus {
      GqlTaskStatus::from(self.inner.status)
    }

    async fn priority(&self) -> GqlTaskPriority {
      GqlTaskPriority::from(self.inner.priority)
    }

    async fn assignee(
      &self,
      ctx: &Context<'_>,
    ) -> async_graphql::Result<Option<GqlUser>> {
      let Some(assignee_id) = self.inner.assignee_id else {
        return Ok(None);
      };

      let loader = ctx.data::<DataLoader<UserLoader>>()?;
      let user = loader
        .load_one(assignee_id)
        .await?;

      Ok(user.map(GqlUser::from))
    }

    async fn reporter_id(&self) -> ID {
      ID(self.inner.reporter_id.to_string())
    }

    async fn created_at(&self) -> DateTime<Utc> {
      self.inner.created_at
    }

    async fn updated_at(&self) -> DateTime<Utc> {
      self.inner.updated_at
    }

}