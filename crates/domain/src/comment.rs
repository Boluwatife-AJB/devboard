use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::ids::{CommentId, TaskId, UserId};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
  pub id: CommentId,
  pub task_id: TaskId,
  pub author_id: UserId,
  pub body: String, 
  pub created_at: DateTime<Utc>,
  pub edited_at: Option<DateTime<Utc>>,
}

impl Comment {
    pub fn is_edited(&self) -> bool {
      self.edited_at.is_some()
    }
}