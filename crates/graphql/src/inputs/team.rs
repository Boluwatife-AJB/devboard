use async_graphql::{ID, InputObject};

use crate::types::team::GqlTeamRole;

#[derive(InputObject)]
pub struct CreateTeamInput {
    pub name: String,
}

#[derive(InputObject)]
pub struct AddTeamMemberInput {
    pub team_id: ID,
    pub user_id: ID,
    pub role: Option<GqlTeamRole>,
}

#[derive(InputObject)]
pub struct RemoveTeamMemberInput {
    pub team_id: ID,
    pub user_id: ID,
}
