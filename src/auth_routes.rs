use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

use axum::{
    Extension, Json, Router,
    extract::{FromRef, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use devboard_domain::{OrgRole, OrganizationId, PresenceStatus};
use devboard_graphql::context::AuthenticatedUser;
use serde::{Deserialize, Serialize};

use devboard_service::{
    AuthPayload, AuthService, MessagingService, ServiceError, auth::RegistrationIntent,
};

static EXPOSE_REST_INTERNALS: AtomicBool = AtomicBool::new(true);

pub fn configure_rest_error_mode(is_production: bool) {
    EXPOSE_REST_INTERNALS.store(!is_production, Ordering::Relaxed);
}

fn _service_error_response(err: ServiceError) -> (StatusCode, Json<ErrorResponse>) {
    let expose = EXPOSE_REST_INTERNALS.load(Ordering::Relaxed);

    match &err {
        ServiceError::InvalidCredentials => (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Invalid email or password".into(),
                code: "INVALID_CREDENTIALS".into(),
            }),
        ),
        ServiceError::Unauthenticated => (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Authentication required".into(),
                code: "UNAUTHENTICATED".into(),
            }),
        ),
        ServiceError::Forbidden { .. } => (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "You do not have permission to perform this action".into(),
                code: "FORBIDDEN".into(),
            }),
        ),
        ServiceError::Conflict { message } => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: message.clone(),
                code: "CONFLICT".into(),
            }),
        ),
        ServiceError::Validation { field, message } => (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse {
                error: format!("{field}: {message}"),
                code: "VALIDATION_ERROR".into(),
            }),
        ),
        ServiceError::UserNotFound { .. }
        | ServiceError::ProjectNotFound { .. }
        | ServiceError::TaskNotFound { .. } => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "The requested resource was not found".into(),
                code: "NOT_FOUND".into(),
            }),
        ),
        other => {
            tracing::error!(
                error = %other,
                error_debug = ?other,
                "internal error in REST handler"
            );

            if expose {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: other.to_string(),
                        code: "INTERNAL_ERROR".into(),
                    }),
                )
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "An unexpected error occurred. \
                        Please try again later."
                            .into(),
                        code: "INTERNAL_ERROR".into(),
                    }),
                )
            }
        }
    }
}

use crate::AppState;

impl FromRef<AppState> for Arc<AuthService> {
    fn from_ref(state: &AppState) -> Self {
        state.auth_service.clone()
    }
}

impl FromRef<AppState> for Arc<MessagingService> {
    fn from_ref(state: &AppState) -> Self {
        state.messaging_service.clone()
    }
}

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

#[derive(Deserialize)]
pub struct InvitePreviewQuery {
    pub token: String,
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
        .route("/auth/invite", post(create_invite))
        .route("/auth/invite/preview", get(preview_invite))
        .route("/auth/accept-invite", post(accept_invite_existing))
        .route("/presence/heartbeat", post(presence_heartbeat))
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
    auth_user: Option<Extension<AuthenticatedUser>>,
    Json(body): Json<InviteRequest>,
) -> impl IntoResponse {
    let Some(Extension(auth_user)) = auth_user else {
        return service_error_to_response(ServiceError::Unauthenticated).into_response();
    };
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
        Ok(result) => (
            StatusCode::ACCEPTED,
            Json(serde_json::json!({
                "message": if result.email_sent {
                    "invite sent"
                } else {
                    "invite created"
                },
                "inviteUrl": result.invite_url,
                "emailSent": result.email_sent,
            })),
        )
            .into_response(),
        Err(err) => service_error_to_response(err).into_response(),
    }
}

async fn preview_invite(
    State(auth_service): State<Arc<AuthService>>,
    Query(query): Query<InvitePreviewQuery>,
) -> impl IntoResponse {
    if query.token.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "token is required".into(),
                code: "MISSING_TOKEN".into(),
            }),
        )
            .into_response();
    }

    match auth_service.preview_invite(&query.token).await {
        Ok(preview) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "email": preview.email,
                "orgName": preview.org_name,
                "role": preview.role,
                "expiresAt": preview.expires_at,
            })),
        )
            .into_response(),
        Err(err) => service_error_to_response(err).into_response(),
    }
}

async fn accept_invite_existing(
    State(auth_service): State<Arc<AuthService>>,
    auth_user: Option<Extension<AuthenticatedUser>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let Some(Extension(auth_user)) = auth_user else {
        return service_error_to_response(ServiceError::Unauthenticated).into_response();
    };
    let token = match body["token"].as_str() {
        Some(t) => t.to_string(),
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "token is required".into(),
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

async fn presence_heartbeat(
    State(messaging_service): State<Arc<MessagingService>>,
    auth_user: Option<Extension<AuthenticatedUser>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let Some(Extension(auth_user)) = auth_user else {
        return service_error_to_response(ServiceError::Unauthenticated).into_response();
    };

    let Some(membership) = auth_user.org_membership.as_ref() else {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "X-Organization-Id header is required".into(),
                code: "MISSING_ORG".into(),
            }),
        )
            .into_response();
    };

    let status = match body["status"].as_str() {
        Some("AWAY") => PresenceStatus::Away,
        Some("ONLINE") => PresenceStatus::Online,
        Some("OFFLINE") => PresenceStatus::Offline,
        _ => PresenceStatus::Online,
    };

    match messaging_service
        .heartbeat(auth_user.user_id, membership.organization_id, status)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
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
        ServiceError::UserNotFound { .. } | ServiceError::InvitationNotFound { .. } => {
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
            code: code.into(),
        }),
    )
}
