use std::sync::Arc;

use devboard_auth::JwtService;
use devboard_db::{DbConnectOptions, connect};
use devboard_domain::{OrganizationId, ProjectRole, TaskPriority, TaskStatus, TeamId, TeamRole, UserId};
use devboard_repository::{PgProjectRepository, PgTaskRepository, PgTeamRepository, PgUserRepository, TeamRepository};
use devboard_service::{AuthService, EventBus, ProjectService, TaskService};
use migration::{Migrator, MigratorTrait};


struct TestApp {
  pub auth_service: Arc<AuthService>,
  pub task_service: Arc<TaskService>,
  pub project_service: Arc<ProjectService>,
  pub team_repo: Arc<PgTeamRepository>,
  pub user_repo: Arc<PgUserRepository>
}

async fn setup() -> TestApp {
  // let _ = dotenvy::dotenv();

  let database_url = std::env::var("DATABASE_URL")
    .expect("DATABASE_URL must be set for integration tests");

  let db = connect(DbConnectOptions {
    url: database_url,
    max_connections: 5,
    min_connections: 1,
  })
  .await
  .expect("failed to connect to test database");

  Migrator::up(&db, None)
    .await
    .expect("migrations failed");

  let user_repo = Arc::new(PgUserRepository::new(db.clone()));
  let task_repo = Arc::new(PgTaskRepository::new(db.clone()));
  let project_repo = Arc::new(PgProjectRepository::new(db.clone()));
  let team_repo = Arc::new(PgTeamRepository::new(db.clone()));

  let jwt_service = Arc::new(JwtService::new(
    "test-secret-that-is-long-enough-32ch", 30
  ));

  let event_bus = EventBus::new();

  let auth_service = Arc::new(AuthService::new(
    user_repo.clone(),
    jwt_service
  ));

  let task_service = Arc::new(TaskService::new(
    task_repo,
    project_repo.clone(),
    team_repo.clone(),
    event_bus
  ));

  let project_service = Arc::new(ProjectService::new(
    project_repo,
    team_repo.clone()
  ));

  TestApp {
    auth_service,
    task_service,
    project_service,
    team_repo,
    user_repo
  }
}

#[tokio::test]
async fn test_register_and_login() {
  let app = setup().await;
  let org_id = OrganizationId::new();

  let payload = app
    .auth_service
    .register(
      "integration@test.com".into(), "Integration User".into(), "password123".into(), 
      org_id
    )
    .await
    .expect("registration should succeed");

  assert!(!payload.access_token.is_empty());
  assert_eq!(payload.user.email, "integration@test.com");

  let login = app
    .auth_service
    .login(
      "integration@test.com".into(), 
      "password123".into(), 
      org_id
    )
    .await
    .expect("login should succeed");

  assert!(!login.access_token.is_empty());

  let bad_login = app
    .auth_service
    .login(
      "integration@test.com".into(), 
      "wrongpassword".into(), 
      org_id
    )
    .await;

  assert!(matches!(
    bad_login,
    Err(devboard_service::ServiceError::InvalidCredentials)
  ));
}

#[tokio::test]
async fn test_create_project_and_task_flow() {
  let app = setup().await;
  let org_id = OrganizationId::new();

  let user = app
    .auth_service
    .register(
      format!("user-{}@test.com", uuid::Uuid::new_v4()), 
      "Test User".into(),
      "password123".into(), 
      org_id
    )
    .await
    .expect("registration should succeed");

  let user_id = user.user.id;

  let team_id = TeamId::new();
  app.team_repo
    .add_member(
      team_id, 
      user_id, 
      TeamRole::Admin
    )
    .await
    .expect("team membership should succeed");

  let project = app
    .project_service
    .create_project(
      org_id, 
      team_id, 
      user_id, 
      "Test Project".into(), 
      "TEST".into(), 
      None
    )
    .await
    .expect("project created should succeed");

    assert_eq!(project.key, "TEST");

    let t1 = app
        .task_service
        .create_task(
          project.id, 
          user_id, 
          "First task".into(), 
          None, 
          TaskPriority::Medium, 
          None
        )
        .await
        .expect("task creation should succeed");

    let t2 = app
        .task_service
        .create_task(
          project.id, 
          user_id, 
          "Second task".into(), 
          None, 
          TaskPriority::High, 
          None
        )
        .await
        .expect("task creation should succeed");

    assert_eq!(t1.task_number, 1);
    assert_eq!(t2.task_number, 2);
    assert_eq!(t1.status, TaskStatus::Backlog);

    let updated = app
        .task_service
        .update_status(
          t1.id, 
          user_id, 
          project.id, 
          TaskStatus::InProgress
        )
        .await
        .expect("status update should succeed");

    assert_eq!(updated.status, TaskStatus::InProgress);

    let viewer_id = UserId::new();
    app.project_service
        .add_member(
          project.id, 
          user_id, 
          viewer_id, 
          Some(ProjectRole::Viewer)
        )
        .await
        .expect("add member should succeed");

    let delete_result = app
        .task_service
        .delete_task(t2.id, viewer_id, project.id)
        .await;

    assert!(matches!(
      delete_result,
      Err(devboard_service::ServiceError::Forbidden { .. })
    ))
}