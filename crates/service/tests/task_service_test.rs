use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use async_trait::async_trait;

use devboard_domain::{
    OrganizationId, ProjectId, ProjectMembership, ProjectRole, Task, TaskId, TaskPriority,
    TaskStatus, Team, TeamId, TeamMembership, TeamRole, UserId,
};
use devboard_repository::task::CreateTaskParams;
use devboard_repository::{ProjectRepository, RepositoryError, TaskRepository, TeamRepository};
use devboard_service::EventBus;

struct FakeTaskRepo {
    tasks: Mutex<HashMap<TaskId, Task>>,
}

impl FakeTaskRepo {
    fn new() -> Self {
        Self {
            tasks: Mutex::new(HashMap::new()),
        }
    }
}

#[async_trait]
impl TaskRepository for FakeTaskRepo {
    async fn find_by_id(&self, id: TaskId) -> Result<Option<Task>, RepositoryError> {
        Ok(self.tasks.lock().unwrap().get(&id).cloned())
    }

    async fn find_by_ids(&self, ids: Vec<TaskId>) -> Result<Vec<Task>, RepositoryError> {
        let tasks = self.tasks.lock().unwrap();
        Ok(ids.iter().filter_map(|id| tasks.get(id).cloned()).collect())
    }

    async fn find_by_project(
        &self,
        project_id: ProjectId,
        status: Option<TaskStatus>,
    ) -> Result<Vec<Task>, RepositoryError> {
        let tasks = self.tasks.lock().unwrap();
        Ok(tasks
            .values()
            .filter(|t| t.project_id == project_id)
            .filter(|t| status.map_or(true, |s| t.status == s))
            .cloned()
            .collect())
    }

    async fn create(&self, params: CreateTaskParams) -> Result<Task, RepositoryError> {
        use chrono::Utc;
        let task = Task {
            id: params.id,
            project_id: params.project_id,
            task_number: params.task_number,
            title: params.title,
            description: params.description,
            status: params.status,
            priority: params.priority,
            reporter_id: params.reporter_id,
            assignee_id: params.assignee_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        self.tasks.lock().unwrap().insert(params.id, task.clone());
        Ok(task)
    }

    async fn update_status(&self, id: TaskId, status: TaskStatus) -> Result<Task, RepositoryError> {
        let mut tasks = self.tasks.lock().unwrap();
        let task = tasks.get_mut(&id).ok_or(RepositoryError::NotFound)?;
        task.status = status;
        Ok(task.clone())
    }

    async fn update_priority(
        &self,
        id: TaskId,
        priority: TaskPriority,
    ) -> Result<Task, RepositoryError> {
        let mut tasks = self.tasks.lock().unwrap();
        let task = tasks.get_mut(&id).ok_or(RepositoryError::NotFound)?;
        task.priority = priority;
        Ok(task.clone())
    }

    async fn assign(
        &self,
        id: TaskId,
        assignee_id: Option<UserId>,
    ) -> Result<Task, RepositoryError> {
        let mut tasks = self.tasks.lock().unwrap();
        let task = tasks.get_mut(&id).ok_or(RepositoryError::NotFound)?;
        task.assignee_id = assignee_id;
        Ok(task.clone())
    }

    async fn find_by_project_paginated(
        &self,
        project_id: ProjectId,
        status: Option<TaskStatus>,
        after_id: Option<uuid::Uuid>,
        limit: u64,
    ) -> Result<(Vec<Task>, bool), RepositoryError> {
        let mut tasks: Vec<Task> = self
            .tasks
            .lock()
            .unwrap()
            .values()
            .filter(|t| t.project_id == project_id)
            .filter(|t| status.as_ref().is_none_or(|s| t.status == *s))
            .cloned()
            .collect();

        tasks.sort_by_key(|t| t.task_number);

        if let Some(after_id) = after_id {
            let after_num = self
                .tasks
                .lock()
                .unwrap()
                .get(&TaskId::from(after_id))
                .map(|t| t.task_number);

            if let Some(after_num) = after_num {
                tasks = tasks
                    .iter()
                    .filter(|t| t.task_number > after_num)
                    .cloned()
                    .collect();
            }
        }

        let has_more = tasks.len() as u64 > limit;
        tasks.truncate(limit as usize);
        Ok((tasks, has_more))
    }

    async fn delete(&self, id: TaskId) -> Result<(), RepositoryError> {
        self.tasks
            .lock()
            .unwrap()
            .remove(&id)
            .ok_or(RepositoryError::NotFound)?;
        Ok(())
    }
}

struct FakeProjectRepo {
    projects: Mutex<HashMap<ProjectId, devboard_domain::Project>>,
    memberships: Mutex<HashMap<(ProjectId, UserId), ProjectMembership>>,
    counters: Mutex<HashMap<ProjectId, i32>>,
}

impl FakeProjectRepo {
    fn new_with_project(project: devboard_domain::Project) -> Self {
        let mut projects = HashMap::new();
        let id = project.id;
        projects.insert(id, project);
        Self {
            projects: Mutex::new(projects),
            memberships: Mutex::new(HashMap::new()),
            counters: Mutex::new(HashMap::new()),
        }
    }

    fn add_membership(&self, m: ProjectMembership) {
        self.memberships
            .lock()
            .unwrap()
            .insert((m.project_id, m.user_id), m);
    }
}

#[async_trait]
impl ProjectRepository for FakeProjectRepo {
    async fn find_by_id(
        &self,
        id: ProjectId,
    ) -> Result<Option<devboard_domain::Project>, RepositoryError> {
        Ok(self.projects.lock().unwrap().get(&id).cloned())
    }
    async fn find_by_ids(
        &self,
        ids: Vec<ProjectId>,
    ) -> Result<Vec<devboard_domain::Project>, RepositoryError> {
        let projects = self.projects.lock().unwrap();
        Ok(ids
            .iter()
            .filter_map(|id| projects.get(id).cloned())
            .collect())
    }
    async fn find_by_organization(
        &self,
        _: OrganizationId,
    ) -> Result<Vec<devboard_domain::Project>, RepositoryError> {
        Ok(self.projects.lock().unwrap().values().cloned().collect())
    }
    async fn create(
        &self,
        id: ProjectId,
        organization_id: OrganizationId,
        team_id: TeamId,
        name: String,
        key: String,
        description: Option<String>,
    ) -> Result<devboard_domain::Project, RepositoryError> {
        use chrono::Utc;
        let project = devboard_domain::Project {
            id,
            organization_id,
            team_id,
            name,
            key,
            description,
            next_task_number: 1,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        self.projects.lock().unwrap().insert(id, project.clone());
        Ok(project)
    }
    async fn next_task_number(&self, project_id: ProjectId) -> Result<i32, RepositoryError> {
        let mut counters = self.counters.lock().unwrap();
        let n = counters.entry(project_id).or_insert(0);
        *n += 1;
        Ok(*n)
    }
    async fn add_member(
        &self,
        project_id: ProjectId,
        user_id: UserId,
        role_override: Option<ProjectRole>,
    ) -> Result<ProjectMembership, RepositoryError> {
        use chrono::Utc;
        let m = ProjectMembership {
            project_id,
            user_id,
            role_override,
            added_at: Utc::now(),
        };
        self.memberships
            .lock()
            .unwrap()
            .insert((project_id, user_id), m.clone());
        Ok(m)
    }
    async fn get_membership(
        &self,
        project_id: ProjectId,
        user_id: UserId,
    ) -> Result<Option<ProjectMembership>, RepositoryError> {
        Ok(self
            .memberships
            .lock()
            .unwrap()
            .get(&(project_id, user_id))
            .cloned())
    }
    async fn delete(&self, id: ProjectId) -> Result<(), RepositoryError> {
        self.projects
            .lock()
            .unwrap()
            .remove(&id)
            .ok_or(RepositoryError::NotFound)?;
        Ok(())
    }
}

struct FakeTeamRepo {
    memberships: Mutex<HashMap<(TeamId, UserId), TeamMembership>>,
}

impl FakeTeamRepo {
    fn new() -> Self {
        Self {
            memberships: Mutex::new(HashMap::new()),
        }
    }
    fn add_membership(&self, m: TeamMembership) {
        self.memberships
            .lock()
            .unwrap()
            .insert((m.team_id, m.user_id), m);
    }
}

#[async_trait]
impl TeamRepository for FakeTeamRepo {
    async fn find_by_id(&self, _: TeamId) -> Result<Option<Team>, RepositoryError> {
        Ok(None)
    }
    async fn find_by_organization(&self, _: OrganizationId) -> Result<Vec<Team>, RepositoryError> {
        Ok(vec![])
    }
    async fn create(
        &self,
        id: TeamId,
        organization_id: OrganizationId,
        name: String,
    ) -> Result<Team, RepositoryError> {
        use chrono::Utc;
        Ok(Team {
            id,
            organization_id,
            name,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }
    async fn add_member(
        &self,
        team_id: TeamId,
        user_id: UserId,
        role: TeamRole,
    ) -> Result<TeamMembership, RepositoryError> {
        use chrono::Utc;
        let m = TeamMembership {
            team_id,
            user_id,
            role,
            joined_at: Utc::now(),
        };
        self.memberships
            .lock()
            .unwrap()
            .insert((team_id, user_id), m.clone());
        Ok(m)
    }
    async fn get_membership(
        &self,
        team_id: TeamId,
        user_id: UserId,
    ) -> Result<Option<TeamMembership>, RepositoryError> {
        Ok(self
            .memberships
            .lock()
            .unwrap()
            .get(&(team_id, user_id))
            .cloned())
    }

    async fn delete(&self, _: TeamId) -> Result<(), RepositoryError> {
        Ok(())
    }
}

fn setup() -> (
    devboard_service::TaskService,
    Arc<FakeProjectRepo>,
    Arc<FakeTeamRepo>,
    ProjectId,
    TeamId,
    UserId,
) {
    use chrono::Utc;

    let user_id = UserId::new();
    let team_id = TeamId::new();
    let org_id = OrganizationId::new();
    let project_id = ProjectId::new();

    let project = devboard_domain::Project {
        id: project_id,
        organization_id: org_id,
        team_id,
        name: "Test Project".into(),
        key: "TEST".into(),
        description: None,
        next_task_number: 1,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let project_repo = Arc::new(FakeProjectRepo::new_with_project(project));
    let team_repo = Arc::new(FakeTeamRepo::new());
    let task_repo = Arc::new(FakeTaskRepo::new());
    let event_bus = EventBus::new();

    let service = devboard_service::TaskService::new(
        task_repo,
        project_repo.clone(),
        team_repo.clone(),
        event_bus,
    );

    (
        service,
        project_repo,
        team_repo,
        project_id,
        team_id,
        user_id,
    )
}

#[tokio::test]
async fn contributor_can_create_task() {
    let (service, _project_repo, team_repo, project_id, team_id, user_id) = setup();

    team_repo.add_membership(TeamMembership {
        team_id,
        user_id,
        role: TeamRole::Member,
        joined_at: chrono::Utc::now(),
    });

    let task = service
        .create_task(
            project_id,
            user_id,
            "Fix the bug".into(),
            None,
            TaskPriority::High,
            None,
        )
        .await
        .expect("contributor should be able to create tasks");

    assert_eq!(task.title, "Fix the bug");
    assert_eq!(task.task_number, 1);
    assert_eq!(task.status, TaskStatus::Backlog);
    assert_eq!(task.reporter_id, user_id);
}

#[tokio::test]
async fn viewer_cannot_create_task() {
    let (service, project_repo, _team_repo, project_id, _team_id, user_id) = setup();

    project_repo.add_membership(ProjectMembership {
        project_id,
        user_id,
        role_override: Some(ProjectRole::Viewer),
        added_at: chrono::Utc::now(),
    });

    let result = service
        .create_task(
            project_id,
            user_id,
            "Sneaky task".into(),
            None,
            TaskPriority::Low,
            None,
        )
        .await;

    assert!(
        matches!(
            result,
            Err(devboard_service::ServiceError::Forbidden { .. })
        ),
        "viewer should not be able to create tasks"
    );
}

#[tokio::test]
async fn unauthenticated_user_cannot_create_task() {
    let (service, _project_repo, _team_repo, project_id, _team_id, _) = setup();

    let stranger = UserId::new();

    let result = service
        .create_task(
            project_id,
            stranger,
            "Ghost task".into(),
            None,
            TaskPriority::Low,
            None,
        )
        .await;

    assert!(matches!(
        result,
        Err(devboard_service::ServiceError::Forbidden { .. })
    ));
}

#[tokio::test]
async fn task_numbers_increment_sequentially() {
    let (service, _project_repo, team_repo, project_id, team_id, user_id) = setup();

    team_repo.add_membership(TeamMembership {
        team_id,
        user_id,
        role: TeamRole::Member,
        joined_at: chrono::Utc::now(),
    });

    let t1 = service
        .create_task(
            project_id,
            user_id,
            "First".into(),
            None,
            TaskPriority::Low,
            None,
        )
        .await
        .unwrap();
    let t2 = service
        .create_task(
            project_id,
            user_id,
            "Second".into(),
            None,
            TaskPriority::Low,
            None,
        )
        .await
        .unwrap();
    let t3 = service
        .create_task(
            project_id,
            user_id,
            "Third".into(),
            None,
            TaskPriority::Low,
            None,
        )
        .await
        .unwrap();

    assert_eq!(t1.task_number, 1);
    assert_eq!(t2.task_number, 2);
    assert_eq!(t3.task_number, 3);
}
