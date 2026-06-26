use async_graphql::{InputObject, SimpleObject};
use base64::engine::{general_purpose::STANDARD, Engine};

use crate::types::GqlTask;

#[derive(Default, InputObject)]
pub struct ConnectionArgs {
  pub first: Option<i32>,
  pub after: Option<String>,
  pub last: Option<i32>,
  pub before: Option<String>
}

impl ConnectionArgs {
    pub fn limit(&self) -> u64 {
      self.first
        .or(self.last)
        .map(|n| n.clamp(1, 100) as u64)
        .unwrap_or(20)
    }
}


#[derive(SimpleObject, Clone)]
pub struct PageInfo {
  pub has_next_page: bool,
  pub has_previous_page: bool,
  pub start_cursor: Option<String>,
  pub end_cursor: Option<String>
}

#[derive(SimpleObject, Clone)]
pub struct TaskEdge {
  pub cursor: String,
  pub node: GqlTask
}

#[derive(SimpleObject, Clone)]
pub struct TaskConnection {
  pub edges: Vec<TaskEdge>,
  pub page_info: PageInfo,
  pub total_count: i64,
}

pub fn encode_cursor(id: &str) -> String {
  STANDARD.encode(format!("cursor:{id}"))
}

pub fn decode_cursor(cursor: &str) -> Option<String> {
  let decode = STANDARD.decode(cursor).ok()?;
  let s = String::from_utf8(decode).ok()?;
  s.strip_prefix("cursor:").map(|s| s.to_string())
}