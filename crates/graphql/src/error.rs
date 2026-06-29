use async_graphql::{Error, ErrorExtensions};
use devboard_service::ServiceError;

pub fn to_graphql_error(err: ServiceError) -> Error {
    let (message, code) = match &err {
        ServiceError::Unauthenticated => ("Authentication required".into(), "UNAUTHENTICATED"),
        ServiceError::InvalidCredentials => ("Invalid credentials".into(), "INVALID_CREDENTIALS"),
        ServiceError::TokenExpired => ("Token expired".into(), "TOKEN_EXPIRED"),
        ServiceError::InvalidToken => ("Invalid token".into(), "INVALID_TOKEN"),
        ServiceError::Forbidden { reason } => (format!("Forbidden: {reason}"), "FORBIDDEN"),
        ServiceError::UserNotFound { .. }
        | ServiceError::ProjectNotFound { .. }
        | ServiceError::TaskNotFound { .. }
        | ServiceError::CommentNotFound { .. }
        | ServiceError::TeamNotFound { .. }
        | ServiceError::OrganizationNotFound { .. } => (err.to_string(), "NOT_FOUND"),
        ServiceError::Conflict { message } => (message.clone(), "CONFLICT"),
        ServiceError::Validation { field, message } => {
            (format!("{field}: {message}"), "VALIDATION_ERROR")
        }
        ServiceError::Internal(_) | ServiceError::Repository(_) => {
            tracing::error!(error = %err, "internal service error");
            ("An internal error occurred".into(), "INTERNAL_ERROR")
        }
    };

    Error::new(message).extend_with(|_, e| e.set("code", code))
}

pub trait IntoGraphQLResult<T> {
    fn map_gql_err(self) -> async_graphql::Result<T>;
}

impl<T> IntoGraphQLResult<T> for Result<T, ServiceError> {
    fn map_gql_err(self) -> async_graphql::Result<T> {
        self.map_err(to_graphql_error)
    }
}
