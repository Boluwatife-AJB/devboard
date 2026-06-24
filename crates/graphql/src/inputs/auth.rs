use async_graphql::{ID, InputObject, SimpleObject};

use crate::GqlUser;

#[derive(InputObject)]
pub struct RegisterInput {
  pub email: String,
  pub display_name: String,
  pub password: String,
  pub organization_id: ID,
}

#[derive(InputObject)]
pub struct LoginInput {
  pub email: String,
  pub password: String,
  pub organization_id: ID,
}

#[derive(SimpleObject)]
pub struct AuthPayloadGql {
  pub access_token: String,
  pub user: GqlUser
}