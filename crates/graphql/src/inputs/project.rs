use async_graphql::{ID, InputObject};

use crate::types::GqlTaskStatus;

#[derive(InputObject)]
pub struct CreateProjectInput {
    pub team_id: ID,
    pub organization_id: ID,
    pub name: String,
    pub key: String,
    pub description: Option<String>,
}

#[derive(InputObject)]
pub struct AddProjectMemberInput {
    pub project_id: ID,
    pub user_id: ID,
    pub role_override: Option<GqlTaskStatus>,
}
