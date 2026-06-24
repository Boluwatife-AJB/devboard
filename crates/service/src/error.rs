use thiserror::Error;

use devboard_auth::AuthError;
use devboard_repository::RepositoryError;

#[derive(Debug, Error)]
pub enum ServiceError {
  #[error("authentication required")]
  Unauthenticated,

  #[error("invalid credentials")]
  InvalidCredentials,

  #[error("token expired")]
  TokenExpired,

  #[error("invalid token")]
  InvalidToken,

  #[error("forbidden: {reason}")]
  Forbidden { reason: String },

  #[error("user not found: {id}")]
  UserNotFound { id: String },

  #[error("organization not found: {id}")]
  OrganizationNotFound { id: String },

  #[error("team not found: {id}")]
  TeamNotFound { id: String },

  #[error("project not found: {id}")]
  ProjectNotFound { id: String },

  #[error("task not found: {id}")]
  TaskNotFound { id: String },

  #[error("comment not found: {id}")]
  CommentNotFound { id: String },

  #[error("conflict: {message}")]
  Conflict {message: String},

  #[error("validation error: {field} - {message}")]
  Validation {field: String, message: String},

  #[error("internal error: {0}")]
  Internal(String),

  #[error(transparent)]
  Repository(RepositoryError)
}

impl From<AuthError> for ServiceError {
    fn from(err: AuthError) -> Self {
        match err {
            AuthError::InvalidCredentials => ServiceError::InvalidCredentials,
            AuthError::TokenExpired => ServiceError::TokenExpired,
            AuthError::InvalidToken => ServiceError::InvalidToken,
            AuthError::TokenMissing => ServiceError::Unauthenticated,
            AuthError::HashingFailed | AuthError::HashingPanic => ServiceError::Internal(
              err.to_string(),
            ),
        }
    }
}

impl From<RepositoryError> for ServiceError {
    fn from(err: RepositoryError) -> Self {
        match err {
            RepositoryError::NotFound => {
              ServiceError::Internal(
                "unexpected not found at repository layer".into(),
              )
            }
            RepositoryError::UniqueViolation { constraint } => {
              ServiceError::Conflict { 
                message: format!(
                  "a record with this value already exists ({})", constraint
                ), 
              }
            }
            RepositoryError::ForeignKeyViolation => ServiceError::Conflict { 
              message: "referenced record does not exist".into()
            },
            other => ServiceError::Repository(other)
        }
    }
}