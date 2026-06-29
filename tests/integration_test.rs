use std::sync::Arc;

use chrono::Utc;
use devboard_auth::JwtService;
use devboard_db::{DatabaseConnection, DbConnectOptions, connect, entities::organization};
use devboard_domain::{OrganizationId, ProjectRole, TaskPriority, TaskStatus, TeamId, TeamRole};
use devboard_repository::{
    PgProjectRepository, PgTaskRepository, PgTeamRepository, PgUserRepository, TeamRepository,
};
use devboard_service::{AuthService, EventBus, ProjectService, TaskService};
use migration::{Migrator, MigratorTrait};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use tokio::sync::OnceCell;
use uuid::Uuid;

struct TestApp {
    pub db: DatabaseConnection,
    pub auth_service: Arc<AuthService>,
    pub task_service: Arc<TaskService>,
    pub project_service: Arc<ProjectService>,
    pub team_repo: Arc<PgTeamRepository>,
}

/// Default URL for `docker compose up` (port 5433 avoids clashing with other local Postgres on 5432).
const DEFAULT_TEST_DATABASE_URL: &str = "postgres://devboard:devboard@localhost:5433/devboard_test";

static MIGRATED: OnceCell<()> = OnceCell::const_new();

async fn run_migrations(db: &DatabaseConnection) {
    MIGRATED
        .get_or_init(|| async {
            Migrator::up(db, None).await.expect("migrations failed");
        })
        .await;
}

async fn ensure_organization(db: &DatabaseConnection, org_id: OrganizationId) {
    if organization::Entity::find_by_id(Uuid::from(org_id))
        .one(db)
        .await
        .expect("failed to query organization")
        .is_some()
    {
        return;
    }

    let now = Utc::now();
    organization::ActiveModel {
        id: ActiveValue::Set(Uuid::from(org_id)),
        name: ActiveValue::Set("Integration Test Org".into()),
        slug: ActiveValue::Set(format!("itest-{}", Uuid::from(org_id))),
        created_at: ActiveValue::Set(now.into()),
        updated_at: ActiveValue::Set(now.into()),
        ..Default::default()
    }
    .insert(db)
    .await
    .expect("failed to insert organization");
}

async fn setup() -> TestApp {
    let _ = dotenvy::dotenv();

    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| DEFAULT_TEST_DATABASE_URL.to_string());

    let db = connect(DbConnectOptions {
        url: database_url,
        max_connections: 5,
        min_connections: 1,
    })
    .await
    .expect("failed to connect to test database");

    run_migrations(&db).await;

    let user_repo = Arc::new(PgUserRepository::new(db.clone()));
    let task_repo = Arc::new(PgTaskRepository::new(db.clone()));
    let project_repo = Arc::new(PgProjectRepository::new(db.clone()));
    let team_repo = Arc::new(PgTeamRepository::new(db.clone()));

    let jwt_service = Arc::new(JwtService::new("test-secret-that-is-long-enough-32ch", 30));

    let event_bus = EventBus::new();

    let auth_service = Arc::new(AuthService::new(user_repo.clone(), jwt_service));

    let task_service = Arc::new(TaskService::new(
        task_repo,
        project_repo.clone(),
        team_repo.clone(),
        event_bus,
    ));

    let project_service = Arc::new(ProjectService::new(project_repo, team_repo.clone()));

    TestApp {
        db,
        auth_service,
        task_service,
        project_service,
        team_repo,
    }
}

#[tokio::test]
#[ignore = "requires running Postgres — run with: cargo test --test integration_test -- --ignored"]
async fn test_register_and_login() {
    let app = setup().await;
    let org_id = OrganizationId::new();
    let email = format!("integration-{}@test.com", Uuid::new_v4());

    let payload = app
        .auth_service
        .register(
            email.clone(),
            "Integration User".into(),
            "password123".into(),
            org_id,
        )
        .await
        .expect("registration should succeed");

    assert!(!payload.access_token.is_empty());
    assert_eq!(payload.user.email, email);

    let login = app
        .auth_service
        .login(email.clone(), "password123".into(), org_id)
        .await
        .expect("login should succeed");

    assert!(!login.access_token.is_empty());

    let bad_login = app
        .auth_service
        .login(email, "wrongpassword".into(), org_id)
        .await;

    assert!(matches!(
        bad_login,
        Err(devboard_service::ServiceError::InvalidCredentials)
    ));
}

#[tokio::test]
#[ignore = "requires running Postgres — run with: cargo test --test integration_test -- --ignored"]
async fn test_create_project_and_task_flow() {
    let app = setup().await;
    let org_id = OrganizationId::new();

    ensure_organization(&app.db, org_id).await;

    let user = app
        .auth_service
        .register(
            format!("user-{}@test.com", Uuid::new_v4()),
            "Test User".into(),
            "password123".into(),
            org_id,
        )
        .await
        .expect("registration should succeed");

    let user_id = user.user.id;
    let team_id = TeamId::new();

    app.team_repo
        .create(team_id, org_id, "Test Team".into())
        .await
        .expect("team should be created");

    app.team_repo
        .add_member(team_id, user_id, TeamRole::Admin)
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
            None,
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
            None,
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
            None,
        )
        .await
        .expect("task creation should succeed");

    assert_eq!(t1.task_number, 1);
    assert_eq!(t2.task_number, 2);
    assert_eq!(t1.status, TaskStatus::Backlog);

    let updated = app
        .task_service
        .update_status(t1.id, user_id, project.id, TaskStatus::InProgress)
        .await
        .expect("status update should succeed");

    assert_eq!(updated.status, TaskStatus::InProgress);

    let viewer = app
        .auth_service
        .register(
            format!("viewer-{}@test.com", Uuid::new_v4()),
            "Viewer".into(),
            "password123".into(),
            org_id,
        )
        .await
        .expect("viewer registration should succeed");

    let viewer_id = viewer.user.id;

    app.project_service
        .add_member(project.id, user_id, viewer_id, Some(ProjectRole::Viewer))
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
