use std::sync::atomic::{AtomicBool, Ordering};

use async_graphql::{Error, ErrorExtensions};
use devboard_service::ServiceError;

static EXPOSE_INTERNALS: AtomicBool = AtomicBool::new(true);

pub fn configure_error_mode(is_production: bool) {
    EXPOSE_INTERNALS.store(!is_production, Ordering::Relaxed);
}

fn expose_internals() -> bool {
    EXPOSE_INTERNALS.load(Ordering::Relaxed)
}

pub fn to_graphql_error(err: ServiceError) -> Error {
    let (message, code, is_internal) = classify_error(&err);

    if is_internal && !expose_internals() {
        tracing::error!(
            error = %err,
            error_debug = ?err,
            "internal error suppressed from client response"
        );

        return Error::new("something went wrong. Please try again later.").extend_with(|_, e| {
            e.set("code", "INTERNAL_ERROR");
        });
    }

    if is_internal {
        tracing::error!(
            error = %err,
            "internal error"
        );
    }

    Error::new(message).extend_with(|_, e| {
        e.set("code", code);
    })
}

fn classify_error(err: &ServiceError) -> (&str, &str, bool) {
    match err {
        ServiceError::Unauthenticated => ("Authentication required", "UNAUTHENTICATED", false),
        ServiceError::InvalidCredentials => ("Invalid credentials", "INVALID_CREDENTIALS", false),
        ServiceError::TokenExpired => (
            "Your session has expired. Please log in again.",
            "TOKEN_EXPIRED",
            false,
        ),
        ServiceError::InvalidToken => ("Invalid authentication token", "INVALID_TOKEN", false),
        ServiceError::Forbidden { .. } => (
            "You do not have permission to perform this action",
            "FORBIDDEN",
            false,
        ),
        ServiceError::UserNotFound { .. } => ("User not found", "NOT_FOUND", false),
        ServiceError::ProjectNotFound { .. } => ("Project not found", "NOT_FOUND", false),
        ServiceError::TaskNotFound { .. } => ("Task not found", "NOT_FOUND", false),
        ServiceError::CommentNotFound { .. } => ("Comment not found", "NOT_FOUND", false),
        ServiceError::TeamNotFound { .. } => ("Team not found", "NOT_FOUND", false),
        ServiceError::OrganizationNotFound { .. } => ("Organization not found", "NOT_FOUND", false),
        ServiceError::InvitationNotFound { .. } => ("Invitation not found", "NOT_FOUND", false),
        ServiceError::Conflict { message } => (message.as_str(), "CONFLICT", false),
        ServiceError::Validation { message, .. } => (message.as_str(), "VALIDATION_ERROR", false),
        ServiceError::Internal(_) | ServiceError::Repository(_) => {
            ("An internal error occurred", "INTERNAL_ERROR", true)
        }
    }
}

pub trait IntoGraphQLResult<T> {
    fn map_gql_err(self) -> async_graphql::Result<T>;
}

impl<T> IntoGraphQLResult<T> for Result<T, ServiceError> {
    fn map_gql_err(self) -> async_graphql::Result<T> {
        self.map_err(to_graphql_error)
    }
}

pub fn safe_error(
    dev_message: impl Into<String>,
    prod_message: &'static str,
    code: &'static str,
) -> Error {
    let message = if expose_internals() {
        dev_message.into()
    } else {
        prod_message.to_string()
    };
    Error::new(message).extend_with(|_, e| e.set("code", code))
}
