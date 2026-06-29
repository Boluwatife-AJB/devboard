use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{
    ids::{OrganizationId, ProjectId, TeamId, UserId},
    team::TeamRole,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: ProjectId,
    pub organization_id: OrganizationId,
    pub team_id: TeamId,
    pub name: String,
    pub key: String,
    pub description: Option<String>,
    pub next_task_number: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMembership {
    pub project_id: ProjectId,
    pub user_id: UserId,
    pub role_override: Option<ProjectRole>,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProjectRole {
    Owner,
    Admin,
    Contributor,
    Viewer,
}

impl ProjectRole {
    pub fn at_least(&self, other: ProjectRole) -> bool {
        u8::from(*self) >= u8::from(other)
    }
}

impl From<ProjectRole> for u8 {
    fn from(role: ProjectRole) -> Self {
        match role {
            ProjectRole::Owner => 3,
            ProjectRole::Admin => 2,
            ProjectRole::Contributor => 1,
            ProjectRole::Viewer => 0,
        }
    }
}

impl From<TeamRole> for ProjectRole {
    fn from(role: TeamRole) -> Self {
        match role {
            TeamRole::Owner => ProjectRole::Owner,
            TeamRole::Admin => ProjectRole::Admin,
            TeamRole::Member => ProjectRole::Contributor,
        }
    }
}
