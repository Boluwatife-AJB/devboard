use std::sync::Arc;

use devboard_auth::{JwtService, hash_password, verify_password};
use devboard_domain::{OrganizationId, PublicUser, UserId};
use devboard_repository::UserRepository;

use crate::error::ServiceError;

#[derive(Debug, Clone)]
pub struct AuthPayload {
  pub access_token: String,
  pub user: PublicUser,
}

pub struct AuthService {
  user_repo: Arc<dyn UserRepository>,
  jwt: Arc<JwtService>
}

impl AuthService {
    pub fn new(
      user_repo: Arc<dyn UserRepository>,
      jwt: Arc<JwtService>,
    ) -> Self {
      Self { user_repo, jwt }
    }

    #[tracing::instrument(
      skip(self, password),
      fields(email = %email)
    )]
    pub async fn register(
      &self,
      email: String,
      display_name: String,
      password: String,
      organization_id: OrganizationId,
    ) -> Result<AuthPayload, ServiceError> {
      validate_email(&email)?;
      validate_password(&password)?;

      let password_hash = hash_password(password)
        .await
        .map_err(ServiceError::from)?;

      let id = UserId::new();

      let user = self
        .user_repo
        .create(id, email, display_name, password_hash)
        .await
        .map_err(|err| match err {
          devboard_repository::RepositoryError::UniqueViolation { .. } => ServiceError::Conflict { 
            message: "an account with this email already exists".into() 
          },
          other => ServiceError::from(other)
        })?;

      let token = self
        .jwt
        .issue(user.id, organization_id)
        .map_err(ServiceError::from)?;

      Ok(AuthPayload { 
        access_token: token, 
        user: PublicUser::from(user) 
      })
    }

    #[tracing::instrument(
      skip(self, password),
      fields(email = %email)
    )]
    pub async fn login(
      &self,
      email: String,
      password: String,
      organization_id: OrganizationId,
    ) -> Result<AuthPayload, ServiceError> {
      let user = self
        .user_repo
        .find_by_email(&email)
        .await
        .map_err(ServiceError::from)?
        .ok_or(ServiceError::InvalidCredentials)?;

      verify_password(password, user.password_hash.clone())
        .await
        .map_err(|_| ServiceError::InvalidCredentials)?;

      let token = self
        .jwt
        .issue(user.id, organization_id)
        .map_err(ServiceError::from)?;

      Ok(AuthPayload { access_token: token, user: PublicUser::from(user) })
    }

    pub fn verify_token(
      &self,
      token: &str,
    ) -> Result<devboard_auth::Claims, ServiceError> {
      self.jwt.verify(token).map_err(ServiceError::from)
    }
}

fn validate_email(email: &str) -> Result<(), ServiceError> {
  if email.is_empty() {
    return Err(ServiceError::Validation { 
      field: "email".into(), 
      message: "email is required".into() 
    });
  }

  if !email.contains('@') || !email.contains('.') {
    return Err(ServiceError::Validation { 
      field: "email".into(), 
      message: "email format is invalid".into() 
    });
  }

  Ok(())
}

fn validate_password(password: &str) -> Result<(), ServiceError> {
  if password.len() < 8 {
    return Err(ServiceError::Validation { 
      field: "password".into(), 
      message: "password must be at least 8 characters".into() 
    });
  }
  Ok(())
}