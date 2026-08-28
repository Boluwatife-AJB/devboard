use std::sync::Arc;

use anyhow::Context;
use async_graphql::http::ALL_WEBSOCKET_PROTOCOLS;
use async_graphql_axum::{GraphQLProtocol, GraphQLWebSocket};
use axum::{
    Extension, Router,
    extract::{State, WebSocketUpgrade},
    http::{HeaderName, HeaderValue, Method, header},
    middleware,
    response::IntoResponse,
    routing::{get, post},
};
use devboard_cache::{MessageBus, OrgMembershipCache};
use devboard_email::{
    EmailProvider,
    provider::{LogEmailProvider, ResendEmailProvider},
};
use devboard_presence::PresenceService;
use migration::{Migrator, MigratorTrait};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

use devboard_auth::JwtService;
use devboard_config::AppConfig;
use devboard_db::{DbConnectOptions, connect};
use devboard_graphql::{
    DevBoardSchema, build_schema,
    context::{AuthenticatedUser, Services},
};
use devboard_repository::{
    OrgMembershipRepository, PgAttachmentRepository, PgCommentRepository, PgInvitationRepository,
    PgNotificationRepository, PgOrgMembershipRepository, PgOrganizationRepository,
    PgProjectRepository, PgTaskRepository, PgTeamRepository, PgUserRepository,
    messaging::pg::{PgChannelRepository, PgDmRepository, PgMessageRepository},
};
use devboard_service::{
    AttachmentService, AuthService, CommentService, DashboardService, MessagingService,
    MessagingServiceDeps, NotificationService, ProjectService, TaskService, TeamService, retention,
    spawn_due_soon_checker, spawn_email_digest_job, unfurl,
};

mod auth_routes;
use auth_routes::auth_router;

#[derive(Clone)]
struct AppState {
    schema: DevBoardSchema,
    auth_service: Arc<AuthService>,
    membership_cache: OrgMembershipCache,
    org_membership_repo: Arc<dyn OrgMembershipRepository>,
    messaging_service: Arc<MessagingService>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = AppConfig::load().context("failed to load application config")?;

    devboard_graphql::error::configure_error_mode(config.environment.is_production());
    auth_routes::configure_rest_error_mode(config.environment.is_production());

    tracing::info!(environment = ?config.environment, "error reporting mode configured");

    init_tracing(&config.observability.log_filter);

    tracing::info!(version = env!("CARGO_PKG_VERSION"), "starting devboard");

    let db = connect(DbConnectOptions {
        url: config.database.url.clone(),
        max_connections: config.database.max_connections,
        min_connections: config.database.min_connections,
    })
    .await
    .context("failed to connect to database")?;

    Migrator::up(&db, None)
        .await
        .context("failed to run database migrations")?;

    let cache = devboard_cache::connect_cache(&config.redis.url)
        .await
        .context("failed to connect to Redis")?;

    let membership_cache = devboard_cache::OrgMembershipCache::new(cache.pool.clone());

    let email_provider: Arc<dyn EmailProvider> = if config.email.resend_api_key == "dev" {
        tracing::warn!("RESEND_API_KEY is 'dev' - invite emails will be logged, not sent");
        Arc::new(LogEmailProvider)
    } else {
        Arc::new(ResendEmailProvider::new(
            &config.email.resend_api_key,
            config.email.from_address.clone(),
        ))
    };

    let message_bus = Arc::new(MessageBus::new(cache.pool.clone(), cache.client));
    let presence_service = Arc::new(PresenceService::new(cache.pool));

    let user_repo = Arc::new(PgUserRepository::new(db.clone()));
    let task_repo = Arc::new(PgTaskRepository::new(db.clone()));
    let project_repo = Arc::new(PgProjectRepository::new(db.clone()));
    let team_repo = Arc::new(PgTeamRepository::new(db.clone()));
    let org_repo = Arc::new(PgOrganizationRepository::new(db.clone()));
    let org_membership_repo = Arc::new(PgOrgMembershipRepository::new(db.clone()));
    let invitation_repo = Arc::new(PgInvitationRepository::new(db.clone()));
    let comment_repo = Arc::new(PgCommentRepository::new(db.clone()));
    let attachment_repo = Arc::new(PgAttachmentRepository::new(db.clone()));
    let channel_repo = Arc::new(PgChannelRepository::new(db.clone()));
    let message_repo = Arc::new(PgMessageRepository::new(db.clone()));
    let dm_repo = Arc::new(PgDmRepository::new(db.clone()));
    let notification_repo = Arc::new(PgNotificationRepository::new(db.clone()));

    let unfurl_tx = unfurl::spawn_unfurl_worker(message_repo.clone());

    let jwt_service = Arc::new(JwtService::new(
        &config.auth.jwt_secret,
        config.auth.access_token_minutes,
    ));

    let auth_service = Arc::new(AuthService::new(
        user_repo.clone(),
        org_repo.clone(),
        org_membership_repo.clone(),
        invitation_repo.clone(),
        email_provider.clone(),
        jwt_service,
        config.email.app_base_url.clone(),
    ));

    let event_bus = devboard_service::EventBus::new();

    let task_service = Arc::new(TaskService::new(
        task_repo.clone(),
        project_repo.clone(),
        team_repo.clone(),
        event_bus.clone(),
    ));

    let project_service = Arc::new(ProjectService::new(project_repo.clone(), team_repo.clone()));

    let team_service = Arc::new(TeamService::new(
        team_repo.clone(),
        org_membership_repo.clone(),
    ));

    let comment_service = Arc::new(CommentService::new(
        comment_repo.clone(),
        task_repo.clone(),
        project_repo.clone(),
        team_repo.clone(),
    ));

    let attachment_service = Arc::new(AttachmentService::new(
        attachment_repo.clone(),
        task_repo.clone(),
        project_repo.clone(),
        team_repo.clone(),
    ));

    let (notification_service, _notification_rx) = NotificationService::new(
        notification_repo.clone(),
        email_provider.clone(),
        config.vapid.public_key.clone(),
        config.vapid.private_key.clone(),
        config.vapid.subject.clone(),
        config.email.app_base_url.clone(),
    );
    let notification_service = Arc::new(notification_service);

    let messaging_service = Arc::new(MessagingService::new(MessagingServiceDeps {
        channel_repo: channel_repo.clone(),
        message_repo: message_repo.clone(),
        dm_repo: dm_repo.clone(),
        org_member_repo: org_membership_repo.clone(),
        user_repo: user_repo.clone(),
        message_bus: message_bus.clone(),
        presence: presence_service,
        notification_service: notification_service.clone(),
        unfurl_tx,
    }));

    retention::spawn_retention_job(channel_repo.clone());

    let dashboard_service = Arc::new(DashboardService::new(
        user_repo.clone(),
        org_repo.clone(),
        project_repo.clone(),
        task_repo.clone(),
        invitation_repo.clone(),
        project_service.clone(),
    ));

    let services = Services {
        auth_service: auth_service.clone(),
        task_service,
        project_service,
        comment_service,
        attachment_service,
        team_service,
        messaging_service: messaging_service.clone(),
        notification_service: notification_service.clone(),
        dashboard_service,
    };

    let schema = build_schema(
        services,
        user_repo,
        comment_repo,
        attachment_repo,
        event_bus,
        message_bus,
    );

    let state = AppState {
        schema,
        auth_service: auth_service.clone(),
        membership_cache,
        org_membership_repo: org_membership_repo.clone(),
        messaging_service: messaging_service.clone(),
    };

    spawn_due_soon_checker(task_repo.clone(), notification_service.clone());
    spawn_email_digest_job(notification_repo.clone(), notification_service.clone());

    let app = build_router(state, &config.email.app_base_url);

    let address = config.server.address();
    let listener = tokio::net::TcpListener::bind(&address)
        .await
        .with_context(|| format!("failed to bind to {address}"))?;

    tracing::info!(address = %address, "devboard listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .context("server error")?;

    tracing::info!("devboard shut down gracefully");

    Ok(())
}

fn build_router(state: AppState, app_base_url: &str) -> Router {
    let origin = HeaderValue::from_str(app_base_url).expect("APP_BASE_URL must be a valid origin");
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS, Method::DELETE])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
            HeaderName::from_static("x-organization-id"),
        ])
        .allow_origin(origin);

    Router::new()
        .merge(auth_router())
        .route("/graphql", post(graphql_handler))
        .route("/graphql/ws", get(graphql_ws_handler))
        .route("/playground", get(playground_handler))
        .route("/health", get(health_handler))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn graphql_handler(
    State(state): State<AppState>,
    auth_user: Option<Extension<AuthenticatedUser>>,
    req: async_graphql_axum::GraphQLRequest,
) -> async_graphql_axum::GraphQLResponse {
    let mut request = req.into_inner();

    if let Some(Extension(user)) = auth_user {
        request = request.data(user)
    }

    state.schema.execute(request).await.into()
}

async fn graphql_ws_handler(
    State(state): State<AppState>,
    protocol: GraphQLProtocol,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    let schema = state.schema.clone();

    ws.protocols(ALL_WEBSOCKET_PROTOCOLS)
        .on_upgrade(move |socket| {
            GraphQLWebSocket::new(socket, schema, protocol)
                .on_connection_init(move |payload| ws_connection_init(state, payload))
                .serve()
        })
}

/// Browsers cannot set headers on WebSocket upgrade requests, so subscription
/// clients pass auth via the graphql-ws `connection_init` payload instead.
async fn ws_connection_init(
    state: AppState,
    payload: serde_json::Value,
) -> async_graphql::Result<async_graphql::Data> {
    let mut data = async_graphql::Data::default();

    let user_id = payload
        .get("Authorization")
        .and_then(|v| v.as_str())
        .and_then(|v| v.strip_prefix("Bearer "))
        .and_then(|token| state.auth_service.verify_token(token).ok())
        .and_then(|claims| claims.user_id().ok());

    let Some(user_id) = user_id else {
        // Leave the connection unauthenticated; resolvers requiring auth will reject it
        return Ok(data);
    };

    let org_id = payload
        .get("X-Organization-Id")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<uuid::Uuid>().ok())
        .map(devboard_domain::OrganizationId::from);

    let org_membership = if let Some(org_id) = org_id {
        let cached = state
            .membership_cache
            .get(user_id, org_id)
            .await
            .ok()
            .flatten();

        if let Some(membership) = cached {
            Some(membership)
        } else {
            let db_membership = state
                .org_membership_repo
                .find(user_id, org_id)
                .await
                .ok()
                .flatten();

            if let Some(ref m) = db_membership {
                let _ = state.membership_cache.set(m).await;
            }

            db_membership
        }
    } else {
        None
    };

    data.insert(AuthenticatedUser {
        user_id,
        org_membership,
    });

    Ok(data)
}

async fn playground_handler() -> impl IntoResponse {
    axum::response::Html(async_graphql::http::playground_source(
        async_graphql::http::GraphQLPlaygroundConfig::new("/graphql")
            .subscription_endpoint("/graphql/ws"),
    ))
}

async fn health_handler() -> impl IntoResponse {
    axum::Json(serde_json::json!({
      "status": "ok",
      "version": env!("CARGO_PKG_VERSION"),
    }))
}

async fn auth_middleware(
    State(state): State<AppState>,
    mut req: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    use devboard_graphql::context::AuthenticatedUser;

    let user_id = req
        .headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .and_then(|token| state.auth_service.verify_token(token).ok())
        .and_then(|claims| claims.user_id().ok());

    let Some(user_id) = user_id else {
        return next.run(req).await;
    };

    let org_id = req
        .headers()
        .get("x-organization-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<uuid::Uuid>().ok())
        .map(devboard_domain::OrganizationId::from);

    let org_membership = if let Some(org_id) = org_id {
        let cached = state
            .membership_cache
            .get(user_id, org_id)
            .await
            .ok()
            .flatten();

        if let Some(membership) = cached {
            Some(membership)
        } else {
            let db_membership = state
                .org_membership_repo
                .find(user_id, org_id)
                .await
                .ok()
                .flatten();

            if let Some(ref m) = db_membership {
                let _ = state.membership_cache.set(m).await;
            }

            db_membership
        }
    } else {
        None
    };

    let auth_user = AuthenticatedUser {
        user_id,
        org_membership,
    };

    req.extensions_mut().insert(auth_user);
    next.run(req).await
}

fn init_tracing(log_filter: &str) {
    tracing_subscriber::registry()
        .with(EnvFilter::new(log_filter))
        .with(
            tracing_subscriber::fmt::layer()
                .json()
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true)
                .pretty()
                .with_target(true),
        )
        .init();
}

async fn shutdown_signal() {
    use tokio::signal;

    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install CTRL+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
      _ = ctrl_c => {},
      _ = terminate => {},
    }

    tracing::info!("shutdown signal received");
}
