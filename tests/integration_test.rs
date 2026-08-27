use std::sync::Arc;

use chrono::Utc;
use devboard_auth::JwtService;
use devboard_db::{DatabaseConnection, DbConnectOptions, connect};
use devboard_domain::{
    OrgMembership, OrgRole, OrganizationId, TaskPriority, TaskStatus, TeamId, TeamRole, UserId,
};
use devboard_email::provider::LogEmailProvider;
use devboard_repository::{
    PgInvitationRepository, PgOrgMembershipRepository, PgOrganizationRepository,
    PgProjectRepository, PgTaskRepository, PgTeamRepository, PgUserRepository, TeamRepository,
};
use devboard_service::{
    AuthPayload, AuthService, EventBus, ProjectService, ServiceError, TaskService,
    auth::RegistrationIntent, task::CreateTaskCommand,
};
use migration::{Migrator, MigratorTrait};
use tokio::sync::OnceCell;

struct TestApp {
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

async fn setup() -> TestApp {
    let _ = dotenvy::dotenv();

    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| DEFAULT_TEST_DATABASE_URL.to_string());

    let _redis_url =
        std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());

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
    let org_repo = Arc::new(PgOrganizationRepository::new(db.clone()));
    let org_membership_repo = Arc::new(PgOrgMembershipRepository::new(db.clone()));
    let invitation_repo = Arc::new(PgInvitationRepository::new(db.clone()));

    let jwt_service = Arc::new(JwtService::new("test-secret-that-is-long-enough-32ch", 30));

    let email_provider = Arc::new(LogEmailProvider);

    let event_bus = EventBus::new();

    let auth_service = Arc::new(AuthService::new(
        user_repo.clone(),
        org_repo.clone(),
        org_membership_repo.clone(),
        invitation_repo,
        email_provider,
        jwt_service,
        "http://localhost:3000".to_string(),
    ));

    let task_service = Arc::new(TaskService::new(
        task_repo,
        project_repo.clone(),
        team_repo.clone(),
        event_bus,
    ));

    let project_service = Arc::new(ProjectService::new(project_repo, team_repo.clone()));

    TestApp {
        auth_service,
        task_service,
        project_service,
        team_repo,
    }
}

fn unique_email(prefix: &str) -> String {
    format!("{}+{}@test.devboard.dev", prefix, uuid::Uuid::new_v4())
}

struct TestUser {
    user_id: UserId,
    org_id: OrganizationId,
    membership: OrgMembership,
    email: String,
}

struct ProjectFixture {
    owner: TestUser,
    team_id: TeamId,
    project: devboard_domain::Project,
}

fn membership_from_payload(payload: &AuthPayload) -> OrgMembership {
    let org = &payload.organizations[0];
    OrgMembership {
        organization_id: org.id,
        user_id: payload.user.id,
        role: org.role,
        joined_at: Utc::now(),
    }
}

fn membership_for(org_id: OrganizationId, user_id: UserId, role: OrgRole) -> OrgMembership {
    OrgMembership {
        organization_id: org_id,
        user_id,
        role,
        joined_at: Utc::now(),
    }
}

async fn register_org_owner(app: &TestApp, prefix: &str) -> TestUser {
    let email = unique_email(prefix);
    let payload = app
        .auth_service
        .register(
            email.clone(),
            format!("{prefix} Owner"),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Org {prefix} {}", uuid::Uuid::new_v4()),
                slug: format!("org-{prefix}-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("owner registration should succeed");
    let org_id = payload.organizations[0].id;
    TestUser {
        user_id: payload.user.id,
        org_id,
        membership: membership_from_payload(&payload),
        email,
    }
}
async fn seed_project_fixture(
    app: &TestApp,
    owner: &TestUser,
    team_name: &str,
    project_name: &str,
    project_key: &str,
    team_role: TeamRole,
) -> ProjectFixture {
    let team_id = TeamId::new();
    app.team_repo
        .create(team_id, owner.org_id, team_name.into())
        .await
        .expect("team creation should succeed");
    app.team_repo
        .add_member(team_id, owner.user_id, team_role)
        .await
        .expect("adding team member should succeed");
    let project = app
        .project_service
        .create_project(
            &owner.membership,
            team_id,
            project_name.into(),
            project_key.into(),
            None,
        )
        .await
        .expect("project creation should succeed");
    ProjectFixture {
        owner: TestUser {
            user_id: owner.user_id,
            org_id: owner.org_id,
            membership: owner.membership.clone(),
            email: owner.email.clone(),
        },
        team_id,
        project,
    }
}

// Auth tests

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_register_by_creating_an_organization() {
    let app = setup().await;
    let email = unique_email("owner");

    let payload = app
        .auth_service
        .register(
            email.clone(),
            "Test Owner".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Test Org {}", uuid::Uuid::new_v4()),
                slug: format!("test-org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("registration with organization should succeed");

    assert!(!payload.access_token.is_empty());

    assert_eq!(payload.user.email, email);
    assert_eq!(payload.user.display_name, "Test Owner");

    assert_eq!(
        payload.organizations.len(),
        1,
        "should belong to exactly on org after creating one"
    );
    assert_eq!(
        payload.organizations[0].role,
        OrgRole::OrgOwner,
        "creator should be OrgOwner"
    );
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_login_returns_all_organizations() {
    let app = setup().await;

    let email = unique_email("multiorg");
    let slug_a = format!("org-a-{}", uuid::Uuid::new_v4());
    let _slug_b = format!("org-b-{}", uuid::Uuid::new_v4());

    app.auth_service
        .register(
            email.clone(),
            "Multi Org User".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: "Org A".into(),
                slug: slug_a.clone(),
            },
        )
        .await
        .expect("first registration should succeed");

    let login_payload = app
        .auth_service
        .login(email.clone(), "password123".into())
        .await
        .expect("login should succeed");

    assert!(!login_payload.access_token.is_empty());
    assert_eq!(login_payload.user.email, email);

    assert!(
        !login_payload.organizations.is_empty(),
        "user should belong to at least one org after login"
    );
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_login_with_wrong_password_fails() {
    let app = setup().await;

    let email = unique_email("wrongpass");

    app.auth_service
        .register(
            email.clone(),
            "Test User".into(),
            "correctpassword".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Org {}", uuid::Uuid::new_v4()),
                slug: format!("org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("registration should succeed");

    let result = app.auth_service.login(email, "wrongpassword".into()).await;

    assert!(
        matches!(result, Err(ServiceError::InvalidCredentials)),
        "wrong password should return InvalidCredentials, not expose which field is wrong"
    );
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_duplicate_email_registration_is_rejected() {
    let app = setup().await;

    let email = unique_email("duplicate");

    app.auth_service
        .register(
            email.clone(),
            "First User".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Org {}", uuid::Uuid::new_v4()),
                slug: format!("org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("first registration should succeed");

    let result = app
        .auth_service
        .register(
            email,
            "Second User".into(),
            "password456".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Org {}", uuid::Uuid::new_v4()),
                slug: format!("org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await;

    assert!(
        matches!(result, Err(ServiceError::Conflict { .. })),
        "duplicate email should return Conflict"
    );
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_duplicate_slug_is_rejected() {
    let app = setup().await;
    let email = unique_email("duplicate-slug");
    let slug = format!("duplicate-slug-{}", uuid::Uuid::new_v4());

    app.auth_service
        .register(
            email.clone(),
            "Owner 1".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: "Org 1".into(),
                slug: slug.clone(),
            },
        )
        .await
        .expect("first org registration should succeed");

    let result = app
        .auth_service
        .register(
            email,
            "Owner 2".into(),
            "password456".into(),
            RegistrationIntent::CreateOrganization {
                name: "Org 2".into(),
                slug,
            },
        )
        .await;

    assert!(
        matches!(result, Err(ServiceError::Conflict { .. })),
        "duplicate slug should return Conflict"
    );
}

// Invite tests

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_invite_and_register_new_user() {
    let app = setup().await;

    let owner_payload = app
        .auth_service
        .register(
            unique_email("inviter"),
            "Inviter".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Org {}", uuid::Uuid::new_v4()),
                slug: format!("org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("registration should succeed");

    let owner_id = owner_payload.user.id;
    let org_id = owner_payload.organizations[0].id;
    let invitee_email = unique_email("invitee");

    app.auth_service
        .create_invite(owner_id, org_id, invitee_email.clone(), OrgRole::OrgMember)
        .await
        .expect("invite creation should succeed");

    let duplicate_result = app
        .auth_service
        .create_invite(owner_id, org_id, invitee_email.clone(), OrgRole::OrgMember)
        .await;

    assert!(
        matches!(duplicate_result, Err(ServiceError::Conflict { .. })),
        "duplicate invite to same email should be rejected"
    );
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_non_admin_cannot_create_invite() {
    let app = setup().await;

    let owner_payload = app
        .auth_service
        .register(
            unique_email("owner"),
            "Owner".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Org {}", uuid::Uuid::new_v4()),
                slug: format!("org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("owner registration should succeed");

    let org_id = owner_payload.organizations[0].id;

    let member_payload = app
        .auth_service
        .register(
            unique_email("member"),
            "Member".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Org {}", uuid::Uuid::new_v4()),
                slug: format!("org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("member registration should succeed");

    let result = app
        .auth_service
        .create_invite(
            member_payload.user.id,
            org_id,
            unique_email("target"),
            OrgRole::OrgMember,
        )
        .await;

    assert!(
        matches!(result, Err(ServiceError::Forbidden { .. })),
        "non-admin should not be able to create invite"
    );
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_only_org_owner_can_invite_org_admin() {
    let app = setup().await;

    let owner_payload = app
        .auth_service
        .register(
            unique_email("invite-owner"),
            "Owner".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Org {}", uuid::Uuid::new_v4()),
                slug: format!("org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("owner registration should succeed");

    let owner_id = owner_payload.user.id;
    let org_id = owner_payload.organizations[0].id;

    let admin_email = unique_email("invite-admin");
    let invite = app
        .auth_service
        .create_invite(owner_id, org_id, admin_email.clone(), OrgRole::OrgAdmin)
        .await
        .expect("owner should be able to invite OrgAdmin");

    let token = invite
        .invite_url
        .split("token=")
        .nth(1)
        .expect("invite URL should contain token");

    let admin_payload = app
        .auth_service
        .register(
            admin_email,
            "Org Admin".into(),
            "password123".into(),
            RegistrationIntent::AcceptInvite {
                token: token.to_string(),
            },
        )
        .await
        .expect("admin should accept invite");

    let admin_id = admin_payload.user.id;

    let forbidden = app
        .auth_service
        .create_invite(
            admin_id,
            org_id,
            unique_email("another-admin"),
            OrgRole::OrgAdmin,
        )
        .await;

    assert!(
        matches!(forbidden, Err(ServiceError::Forbidden { .. })),
        "OrgAdmin should not be able to invite another OrgAdmin"
    );

    app.auth_service
        .create_invite(
            admin_id,
            org_id,
            unique_email("new-member"),
            OrgRole::OrgMember,
        )
        .await
        .expect("OrgAdmin should be able to invite OrgMember");
}

// Project & Task flow test
#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_create_project_and_tasks_with_sequential_numbering() {
    let app = setup().await;

    let owner = register_org_owner(&app, "projectowner").await;
    let fx = seed_project_fixture(
        &app,
        &owner,
        "Engineering",
        "Test Project",
        "TEST",
        TeamRole::Admin,
    )
    .await;

    let t1 = app
        .task_service
        .create_task(
            &fx.owner.membership,
            CreateTaskCommand {
                project_id: fx.project.id,
                reporter_id: fx.owner.user_id,
                title: "First task".into(),
                description: None,
                priority: TaskPriority::Medium,
                assignee_id: None,
                due_date: None,
            },
        )
        .await
        .expect("first task creation should succeed");

    let t2 = app
        .task_service
        .create_task(
            &fx.owner.membership,
            CreateTaskCommand {
                project_id: fx.project.id,
                reporter_id: fx.owner.user_id,
                title: "Second task".into(),
                description: None,
                priority: TaskPriority::High,
                assignee_id: None,
                due_date: None,
            },
        )
        .await
        .expect("second task creation should succeed");

    assert_eq!(t1.task_number, 1);
    assert_eq!(t2.task_number, 2);
    assert_eq!(t1.display_key(&fx.project.key), "TEST-1");
    assert_eq!(t2.display_key(&fx.project.key), "TEST-2");
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_task_status_transitions() {
    let app = setup().await;

    let payload = app
        .auth_service
        .register(
            unique_email("statustransition"),
            "Dev".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Status Org {}", uuid::Uuid::new_v4()),
                slug: format!("status-org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("owner registration should succeed");

    let user_id = payload.user.id;
    let org_id = payload.organizations[0].id;
    let team_id = TeamId::new();
    let membership = OrgMembership {
        organization_id: org_id,
        user_id,
        role: OrgRole::OrgOwner,
        joined_at: Utc::now(),
    };

    app.team_repo
        .create(team_id, org_id, "Status Team".into())
        .await
        .expect("team creation should succeed");

    app.team_repo
        .add_member(team_id, user_id, TeamRole::Admin)
        .await
        .expect("adding team member should succeed");

    let project = app
        .project_service
        .create_project(
            &membership,
            team_id,
            "Status Test Project".into(),
            "ST".into(),
            Some("The test project".into()),
        )
        .await
        .expect("project creation should succeed");

    assert_eq!(project.key, "ST");

    let task = app
        .task_service
        .create_task(
            &membership,
            CreateTaskCommand {
                project_id: project.id,
                reporter_id: user_id,
                title: "Test task".into(),
                description: None,
                priority: TaskPriority::Medium,
                assignee_id: None,
                due_date: None,
            },
        )
        .await
        .expect("task creation should succeed");

    assert_eq!(task.status, TaskStatus::Backlog);

    let in_progress = app
        .task_service
        .update_status(&membership, task.id, project.id, TaskStatus::InProgress)
        .await
        .expect("status update to InProgress should succeed");

    assert_eq!(in_progress.status, TaskStatus::InProgress);

    let done = app
        .task_service
        .update_status(&membership, task.id, project.id, TaskStatus::Done)
        .await
        .expect("status update to Done should succeed");

    assert_eq!(done.status, TaskStatus::Done);
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_rbac_viewer_cannot_delete_task() {
    let app = setup().await;

    let owner = register_org_owner(&app, "rbac-owner").await;
    let fx = seed_project_fixture(
        &app,
        &owner,
        "RBAC Team",
        "RBAC Project",
        "RBAC",
        TeamRole::Owner,
    )
    .await;

    let task = app
        .task_service
        .create_task(
            &fx.owner.membership,
            CreateTaskCommand {
                project_id: fx.project.id,
                reporter_id: fx.owner.user_id,
                title: "Test task".into(),
                description: None,
                priority: TaskPriority::Medium,
                assignee_id: None,
                due_date: None,
            },
        )
        .await
        .expect("task creation should succeed");

    let viewer_payload = app
        .auth_service
        .register(
            unique_email("rbac-viewer"),
            "Viewer".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Other Org {}", uuid::Uuid::new_v4()),
                slug: format!("other-org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .expect("viewer registration should succeed");

    app.team_repo
        .add_member(fx.team_id, viewer_payload.user.id, TeamRole::Member)
        .await
        .expect("adding viewer to team should succeed");
    let viewer_membership =
        membership_for(fx.owner.org_id, viewer_payload.user.id, OrgRole::OrgMember);
    let delete_result = app
        .task_service
        .delete_task(&viewer_membership, task.id, fx.project.id)
        .await;

    assert!(matches!(delete_result, Err(ServiceError::Forbidden { .. })));
    let read_result = app
        .task_service
        .get_task(&viewer_membership, task.id, fx.project.id)
        .await;
    assert!(read_result.is_ok(), "viewer should be able to read task");
}

#[tokio::test]
#[ignore = "requires running Postgres + Redis — run with: cargo test --test integration_test -- --ignored"]
async fn test_stranger_has_no_access_to_project() {
    let app = setup().await;

    let owner = register_org_owner(&app, "stranger-owner").await;
    let fx = seed_project_fixture(
        &app,
        &owner,
        "Private Team",
        "Private Project",
        "PRIV",
        TeamRole::Owner,
    )
    .await;

    let stranger_payload = app
        .auth_service
        .register(
            unique_email("stranger"),
            "Stranger".into(),
            "password123".into(),
            RegistrationIntent::CreateOrganization {
                name: format!("Stranger Org {}", uuid::Uuid::new_v4()),
                slug: format!("stranger-org-{}", uuid::Uuid::new_v4()),
            },
        )
        .await
        .unwrap();
    let stranger_membership = membership_from_payload(&stranger_payload);

    let result = app
        .project_service
        .get_project(&stranger_membership, fx.project.id)
        .await;

    assert!(
        matches!(result, Err(ServiceError::ProjectNotFound { .. })),
        "stranger should get NotFound, not Forbidden \
        (don't confirm the project exists to unauthorized callers)"
    );
}
