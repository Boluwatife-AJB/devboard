use std::sync::Arc;

use anyhow::Context;
use async_graphql::http::ALL_WEBSOCKET_PROTOCOLS;
use async_graphql_axum::{GraphQLProtocol, GraphQLWebSocket};
use axum::{
  Extension, 
  Router, 
  extract::{State, WebSocketUpgrade}, 
  http::Method, 
  middleware, 
  response::IntoResponse, 
  routing::{get, post} 
};
use tower_http::{
  cors::{Any, CorsLayer}, 
  trace::TraceLayer
};
use tracing_subscriber::{
  util::SubscriberInitExt,
  layer::SubscriberExt, 
  EnvFilter, 
};
use migration::{Migrator, MigratorTrait};

use devboard_auth::JwtService;
use devboard_config::AppConfig;
use devboard_db::{DbConnectOptions, connect};
use devboard_graphql::{DevBoardSchema, build_schema, context::AuthenticatedUser};
use devboard_repository::{
  PgProjectRepository, PgTaskRepository, 
  PgTeamRepository, PgUserRepository
};
use devboard_service::{AuthService, ProjectService, TaskService};

mod auth_routes;
use auth_routes::auth_router;

#[derive(Clone)]
struct AppState {
    schema: DevBoardSchema,
    auth_service: Arc<AuthService>
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = AppConfig::load()
        .context("failed to load application config")?;

    init_tracing(&config.observability.log_filter);

    tracing::info!(
        version = env!("CARGO_PKG_VERSION"),
        "starting devboard"
    );

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
    
     

    let user_repo = Arc::new(PgUserRepository::new(db.clone()));
    let task_repo = Arc::new(PgTaskRepository::new(db.clone()));
    let project_repo = Arc::new(PgProjectRepository::new(db.clone()));
    let team_repo = Arc::new(PgTeamRepository::new(db.clone()));

    let jwt_service = Arc::new(JwtService::new(
        &config.auth.jwt_secret,
        config.auth.access_token_minutes
    ));

    let auth_service = Arc::new(AuthService::new(
        user_repo.clone(), 
        jwt_service.clone()
    ));

    let event_bus = devboard_service::EventBus::new();

    let task_service = Arc::new(TaskService::new(
        task_repo,
        project_repo.clone(),
        team_repo.clone(),
        event_bus.clone()
    ));

    let project_service = Arc::new(ProjectService::new(
        project_repo.clone(),
        team_repo.clone(),
    ));

    let schema = build_schema(
        auth_service.clone(), 
        task_service, 
        project_service, 
        user_repo,
        event_bus
    );

    let state = AppState {
        schema,
        auth_service,
    };

    let app = build_router(state);

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

fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS, Method::DELETE])
        .allow_headers(Any)
        .allow_origin(Any);

    Router::new()
        .merge(auth_router())
        .route("/graphql", post(graphql_handler))
        .route("/graphql/ws", get(graphql_ws_handler))
        .route("/playground", get(playground_handler))
        .route("/health", get(health_handler))
        .layer(middleware::from_fn_with_state(
          state.clone(), 
        jwt_middleware,
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
            GraphQLWebSocket::new(
                socket,
                schema,
                protocol
            )
            .serve()
        })

    // ws.on_upgrade(move |socket| {
    //     async_graphql_axum::GraphQLWebSocket::new(
    //       socket,
    //       schema, 
    //       async_graphql::http::WebSocketProtocols::GraphQLWS,
    //       )
    //       .serve()
    // })
}

async fn playground_handler() -> impl IntoResponse {
  axum::response::Html(async_graphql::http::playground_source(
    async_graphql::http::GraphQLPlaygroundConfig::new("/graphql")
        .subscription_endpoint("/graphql/ws")
  ))
}

async fn health_handler() -> impl IntoResponse {
  axum::Json(serde_json::json!({
    "status": "ok",
    "version": env!("CARGO_PKG_VERSION"),
  }))
}

async fn jwt_middleware(
  State(state): State<AppState>,
  mut req: axum::extract::Request,
  next: axum::middleware::Next,
) -> axum::response::Response {
  use devboard_graphql::context::AuthenticatedUser;

  if let Some(auth_header) = req
    .headers()
    .get(axum::http::header::AUTHORIZATION)
    .and_then(|v| v.to_str().ok())
    .and_then(|v| v.strip_prefix("Bearer "))
  {
    match state.auth_service.verify_token(auth_header) {
        Ok(claims) => {
          if let Ok(auth_user) = AuthenticatedUser::from_claims(claims) 
          {
            req.extensions_mut().insert(auth_user);
          }
        }
        Err(err) => {
          tracing::debug!(
            error = %err,
            "invalid or expired JWT - continuing unauthenticated"
          );
        }
    }
  }

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