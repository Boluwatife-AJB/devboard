use std::sync::Arc;

use axum::{
    Extension, Json, Router, extract::State, http::StatusCode, response::IntoResponse,
    routing::post,
};
use devboard_domain::{OrgRole, OrganizationId};
use devboard_graphql::context::AuthenticatedUser;
use serde::{Deserialize, Serialize};

use devboard_service::{AuthPayload, AuthService, ServiceError, auth::RegistrationIntent};

use crate::AppState;

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub display_name: String,
    pub password: String,
    pub create_org: Option<CreateOrgRequest>,
    pub invite_token: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateOrgRequest {
    pub name: String,
    pub slug: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct InviteRequest {
    pub email: String,
    pub role: String,
    pub org_id: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub token_type: String,
    pub user: UserResponse,
    pub organizations: Vec<OrgResponse>,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub display_name: String,
}

#[derive(Serialize)]
pub struct OrgResponse {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub role: String,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub code: String,
}

pub fn auth_router(auth_service: Arc<AuthService>) -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/invite", post(create_invite))
        .route("/auth/accept-invite", post(accept_invite_existing))
        .with_state(auth_service)
}

async fn register(
    State(auth_service): State<Arc<AuthService>>,
    Json(body): Json<RegisterRequest>,
) -> impl IntoResponse {
    let intent = match (body.create_org, body.invite_token) {
        (Some(org), None) => RegistrationIntent::CreateOrganization {
            name: org.name,
            slug: org.slug,
        },
        (None, Some(token)) => RegistrationIntent::AcceptInvite { token },
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "provide exactly one of: create_org, invite_token".into(),
                    code: "INVALID_REQUEST".into(),
                }),
            )
                .into_response();
        }
    };

    match auth_service
        .register(body.email, body.display_name, body.password, intent)
        .await
    {
        Ok(payload) => (
            StatusCode::CREATED,
            Json(auth_response_from_payload(payload)),
        )
            .into_response(),
        Err(err) => service_error_to_response(err).into_response(),
    }
}

async fn login(
    State(auth_service): State<Arc<AuthService>>,
    Json(body): Json<LoginRequest>,
) -> impl IntoResponse {
    match auth_service.login(body.email, body.password).await {
        Ok(payload) => (StatusCode::OK, Json(auth_response_from_payload(payload))).into_response(),
        Err(err) => service_error_to_response(err).into_response(),
    }
}

async fn create_invite(
    State(auth_service): State<Arc<AuthService>>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Json(body): Json<InviteRequest>,
) -> impl IntoResponse {
    let org_id = match body.org_id.parse::<uuid::Uuid>() {
        Ok(id) => OrganizationId::from(id),
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid org ID".into(),
                    code: "INVALID_ORG_ID".into(),
                }),
            )
                .into_response();
        }
    };

    let role = match body.role.as_str() {
        "ORG_ADMIN" => OrgRole::OrgAdmin,
        "ORG_MEMBER" => OrgRole::OrgMember,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid role - must be ORG_ADMIN or ORG_MEMBER".into(),
                    code: "INVALID_ROLE".into(),
                }),
            )
                .into_response();
        }
    };

    match auth_service
        .create_invite(auth_user.user_id, org_id, body.email, role)
        .await
    {
        Ok(_) => (
            StatusCode::ACCEPTED,
            Json(serde_json::json!({ "message": "invite sent" })),
        )
            .into_response(),
        Err(err) => service_error_to_response(err).into_response(),
    }
}

async fn accept_invite_existing(
    State(auth_service): State<Arc<AuthService>>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let token = match body["token"].as_str() {
        Some(t) => t.to_string(),
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "token is require".into(),
                    code: "MISSING_TOKEN".into(),
                }),
            )
                .into_response();
        }
    };

    match auth_service
        .accept_invite_for_existing_user(auth_user.user_id, &token)
        .await
    {
        Ok(org) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "message": "invitation accepted",
                "organization": {
                    "id": org.id.to_string(),
                    "name": org.name,
                    "slug": org.slug,
                    "role": format!("{:?}", org.role),
                }
            })),
        )
            .into_response(),
        Err(err) => service_error_to_response(err).into_response(),
    }
}

fn auth_response_from_payload(payload: AuthPayload) -> AuthResponse {
    AuthResponse {
        access_token: payload.access_token,
        token_type: "Bearer".into(),
        user: UserResponse {
            id: payload.user.id.to_string(),
            email: payload.user.email,
            display_name: payload.user.display_name,
        },
        organizations: payload
            .organizations
            .into_iter()
            .map(|o| OrgResponse {
                id: o.id.to_string(),
                name: o.name,
                slug: o.slug,
                role: format!("{:?}", o.role),
            })
            .collect(),
    }
}

fn service_error_to_response(err: ServiceError) -> (StatusCode, Json<ErrorResponse>) {
    let (status, code) = match &err {
        ServiceError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "INVALID_CREDENTIALS"),
        ServiceError::Unauthenticated => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED"),
        ServiceError::Forbidden { .. } => (StatusCode::FORBIDDEN, "FORBIDDEN"),
        ServiceError::Conflict { .. } => (StatusCode::CONFLICT, "CONFLICT"),
        ServiceError::Validation { .. } => (StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR"),
        ServiceError::UserNotFound { .. } => (StatusCode::NOT_FOUND, "NOT_FOUND"),
        _ => {
            tracing::error!(error = %err, "internal error in auth handler");
            (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR")
        }
    };

    (
        status,
        Json(ErrorResponse {
            error: err.to_string(),
            code: code.into(),
        }),
    )
}
