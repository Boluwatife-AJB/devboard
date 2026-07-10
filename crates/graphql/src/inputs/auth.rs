use async_graphql::{InputObject, SimpleObject};

use crate::GqlUser;

#[derive(InputObject)]
pub struct RegisterInput {
    pub email: String,
    pub display_name: String,
    pub password: String,
    pub create_org: Option<CreateOrgInput>,
    pub invite_token: Option<String>,
}

#[derive(InputObject)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(SimpleObject)]
pub struct AuthPayloadGql {
    pub access_token: String,
    pub user: GqlUser,
}

#[derive(InputObject)]
pub struct CreateOrgInput {
    pub name: String,
    pub slug: String,
}
