use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::ids::{OrganizationId, TeamId, UserId};

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct Team {
  pub id: TeamId,
  pub organization_id: OrganizationId,
  pub name: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMembership {
  pub team_id: TeamId,
  pub user_id: UserId,
  pub role: TeamRole,
  pub joined_at: DateTime<Utc>
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TeamRole {
  Owner,
  Admin, 
  Member
}

impl TeamRole {
  pub fn at_least(&self, other: TeamRole) -> bool {
    (*self as u8) >= (other as u8)
  }
}

impl From<TeamRole> for u8 {
  fn from(role: TeamRole) -> Self {
      match role {
        TeamRole::Member => 0,
        TeamRole::Admin => 1,
        TeamRole::Owner => 2,
      }
  }
}