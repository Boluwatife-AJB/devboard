use std::sync::Arc;

use devboard_auth::Claims;
use devboard_domain::UserId;
use devboard_service::{AuthService, ProjectService, TaskService};

#[derive(Clone)]
pub struct Services {
  pub auth_service: Arc<AuthService>,
  pub task_service: Arc<TaskService>,
  pub project_service: Arc<ProjectService>
}

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
  pub user_id: UserId,
  pub claims: Claims,
}

impl AuthenticatedUser {
    pub fn from_claims(claims: Claims) -> Result<Self, devboard_auth::AuthError> {
      let user_id = claims.user_id()?;
      Ok(Self { user_id, claims })
    }
}

pub trait ContextExt {
    fn services(&self) -> async_graphql::Result<&Services>;
    fn authenticated_user(&self) -> async_graphql::Result<&AuthenticatedUser>;
    fn maybe_authenticated_user(&self) -> Option<&AuthenticatedUser>;
}

impl ContextExt for async_graphql::Context<'_> {
    fn services(&self) -> async_graphql::Result<&Services> {
        self.data::<Services>()
    }

    fn authenticated_user(&self) -> async_graphql::Result<&AuthenticatedUser> {
        self.data::<AuthenticatedUser>().map_err(|_| {
          crate::error::to_graphql_error(
            devboard_service::ServiceError::Unauthenticated,
          )
        })
    }

    fn maybe_authenticated_user(&self) -> Option<&AuthenticatedUser> {
        self.data_opt::<AuthenticatedUser>()
    }
}