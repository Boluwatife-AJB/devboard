

use axum::{
  Json, Router, 
  extract::State, 
  http::StatusCode, 
  response::IntoResponse, 
  routing::post
};
use serde::{Deserialize, Serialize};

use devboard_service::ServiceError;

use crate::AppState;

#[derive(Deserialize)]
pub struct RegisterRequest {
  pub email: String,
  pub display_name: String,
  pub password: String,
  pub organization_id: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
  pub email: String,
  pub password: String,
  pub organization_id: String
}

#[derive(Serialize)]
pub struct AuthResponse {
  pub access_token: String,
  pub token_type: String,
  pub user: UserResponse
}

#[derive(Serialize)]
pub struct UserResponse {
  pub id: String,
  pub email: String,
  pub display_name: String,
}

#[derive(Serialize)]
pub struct ErrorResponse {
  pub error: String,
  pub code: String,
}

pub fn auth_router() -> Router<AppState> {
  Router::new()
    .route("/auth/register", post(register))
    .route("/auth/login", post(login))
}

async fn register(
  State(state): State<AppState>,
  Json(body): Json<RegisterRequest>
) -> impl IntoResponse {
  let org_id = match body.organization_id.parse::<uuid::Uuid>() {
    Ok(id) => devboard_domain::OrganizationId::from(id),
    Err(_) => {
      return (
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse {
          error: "Invalid organization ID".into(),
          code: "INVALID_ORG_ID".into(),
        }),
      )
      .into_response();
    }
  };

  match state.auth_service
    .register(
      body.email, 
      body.display_name, 
      body.password, 
      org_id
    )
    .await
    {
      Ok(payload) => (
        StatusCode::CREATED,
        Json(AuthResponse {
          access_token: payload.access_token,
          token_type: "Bearer".into(),
          user: UserResponse { 
            id: payload.user.id.to_string(), email: payload.user.email, display_name: payload.user.display_name, 
          },
        }),
      )
      .into_response(),

      Err(err) => service_error_to_response(err).into_response()
    }
}

async fn login(
  State(state): State<AppState>,
  Json(body): Json<LoginRequest>
) -> impl IntoResponse {
  let org_id = match body.organization_id.parse::<uuid::Uuid>() {
      Ok(id) => devboard_domain::OrganizationId::from(id),
      Err(_) => {
        return (
          StatusCode::BAD_REQUEST,
          Json(ErrorResponse {
            error: "Invalid organization ID".into(),
            code: "INVALID_ORG_ID".into()
          }),
        )
        .into_response();
      }
  };

  match state.auth_service.login(body.email, body.password, org_id).await {
      Ok(payload) => (
        StatusCode::OK,
        Json(AuthResponse {
          access_token: payload.access_token,
          token_type: "Bearer".into(),
          user: UserResponse { 
            id: payload.user.id.to_string(), 
            email: payload.user.email, 
            display_name: payload.user.display_name 
          },
        }),
      )
    .into_response(),

    Err(err) => service_error_to_response(err).into_response(),
  }
}

fn service_error_to_response(
  err: ServiceError
) -> (StatusCode, Json<ErrorResponse>) {
  let (status, code) = match &err {
      ServiceError::InvalidCredentials => {
        (StatusCode::UNAUTHORIZED, "INVALID_CREDENTIALS")
      }
      ServiceError::Unauthenticated => {
        (StatusCode::UNAUTHORIZED, "UNAUTHORIZED")
      }
      ServiceError::Forbidden { .. } => {
        (StatusCode::FORBIDDEN, "FORBIDDEN")
      }
      ServiceError::Conflict { .. } => {
        (StatusCode::CONFLICT, "CONFLICT")
      }
      ServiceError::Validation { .. } => {
        (StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR")
      }
      ServiceError::UserNotFound { .. } => {
        (StatusCode::NOT_FOUND, "NOT_FOUND")
      }
      _ => {
        tracing::error!(error = %err, "internal error in auth handler");
        (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR")
      }
  };

  (
    status,
    Json(ErrorResponse { 
      error: err.to_string(), 
      code: code.into() 
    }),
  )
}