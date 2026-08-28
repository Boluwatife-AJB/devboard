use std::sync::Arc;

use chrono::{DateTime, Utc};
use devboard_domain::{
    Action, OrgMembership, ProjectId, ProjectRole, Task, TaskId, TaskPriority, TaskStatus, UserId,
    effective_project_role,
};
use devboard_repository::{
    ProjectRepository, TaskRepository, TeamRepository, task::CreateTaskParams,
};

use crate::{
    authorize, error::ServiceError, event_bus::EventBus, events::TaskEvent, load_project_context,
};

#[derive(Debug)]
pub struct CreateTaskCommand {
    pub project_id: ProjectId,
    pub reporter_id: UserId,
    pub title: String,
    pub description: Option<String>,
    pub priority: TaskPriority,
    pub assignee_id: Option<UserId>,
    pub due_date: Option<DateTime<Utc>>,
}

pub struct TaskService {
    task_repo: Arc<dyn TaskRepository>,
    project_repo: Arc<dyn ProjectRepository>,
    team_repo: Arc<dyn TeamRepository>,
    event_bus: EventBus,
}

impl TaskService {
    pub fn new(
        task_repo: Arc<dyn TaskRepository>,
        project_repo: Arc<dyn ProjectRepository>,
        team_repo: Arc<dyn TeamRepository>,
        event_bus: EventBus,
    ) -> Self {
        Self {
            task_repo,
            project_repo,
            team_repo,
            event_bus,
        }
    }

    async fn require_action(
        &self,
        caller_org: &OrgMembership,
        project_id: ProjectId,
        caller_id: UserId,
        action: Action,
    ) -> Result<(), ServiceError> {
        let (ctx, _) = load_project_context(
            caller_org,
            &self.team_repo,
            &self.project_repo,
            project_id,
            caller_id,
        )
        .await?;
        authorize(&ctx, action)
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(task_id = %task_id)
    )]
    pub async fn get_task(
        &self,
        caller_org: &OrgMembership,
        task_id: TaskId,
        project_id: ProjectId,
    ) -> Result<Task, ServiceError> {
        let task = self.task_repo.find_by_id(task_id).await?.ok_or_else(|| {
            ServiceError::TaskNotFound {
                id: task_id.to_string(),
            }
        })?;

        if task.project_id != project_id {
            return Err(ServiceError::TaskNotFound {
                id: task_id.to_string(),
            });
        }

        self.require_action(
            caller_org,
            project_id,
            caller_org.user_id,
            Action::ViewProject,
        )
        .await?;

        Ok(task)
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(project_id = %project_id)
    )]
    pub async fn list_tasks(
        &self,
        caller_org: &OrgMembership,
        project_id: ProjectId,
        status_filter: Option<TaskStatus>,
    ) -> Result<Vec<Task>, ServiceError> {
        self.require_action(
            caller_org,
            project_id,
            caller_org.user_id,
            Action::ViewProject,
        )
        .await?;

        self.task_repo
            .find_by_project(project_id, status_filter)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(project_id = %project_id)
    )]
    pub async fn list_tasks_paginated(
        &self,
        caller_org: &OrgMembership,
        project_id: ProjectId,
        status_filter: Option<TaskStatus>,
        after_id: Option<uuid::Uuid>,
        limit: u64,
    ) -> Result<(Vec<Task>, bool), ServiceError> {
        self.require_action(
            caller_org,
            project_id,
            caller_org.user_id,
            Action::ViewProject,
        )
        .await?;

        self.task_repo
            .find_by_project_paginated(project_id, status_filter, after_id, limit)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
      skip(self, caller_org, cmd),
      fields(
        project_id = %cmd.project_id,
      )
    )]
    pub async fn create_task(
        &self,
        caller_org: &OrgMembership,
        cmd: CreateTaskCommand,
    ) -> Result<Task, ServiceError> {
        validate_task_title(&cmd.title)?;

        self.require_action(
            caller_org,
            cmd.project_id,
            cmd.reporter_id,
            Action::CreateTask,
        )
        .await?;

        if let Some(aid) = cmd.assignee_id {
            self.validate_assignee(caller_org, aid, cmd.project_id)
                .await?;
        }

        let task_number = self
            .project_repo
            .next_task_number(cmd.project_id)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::ProjectNotFound {
                    id: cmd.project_id.to_string(),
                },
                other => ServiceError::from(other),
            })?;

        let task_id = TaskId::new();

        let task = self
            .task_repo
            .create(CreateTaskParams {
                id: task_id,
                project_id: cmd.project_id,
                task_number,
                title: cmd.title,
                description: cmd.description,
                status: TaskStatus::Backlog,
                priority: cmd.priority,
                reporter_id: cmd.reporter_id,
                assignee_id: cmd.assignee_id,
                due_date: cmd.due_date,
            })
            .await
            .map_err(ServiceError::from)?;

        self.event_bus.publish_task(TaskEvent::Created {
            project_id: cmd.project_id,
            task: task.clone(),
        });

        Ok(task)
    }

    pub async fn update_due_date(
        &self,
        caller_org: &OrgMembership,
        task_id: TaskId,
        project_id: ProjectId,
        due_date: Option<DateTime<Utc>>,
    ) -> Result<Task, ServiceError> {
        self.require_action(
            caller_org,
            project_id,
            caller_org.user_id,
            Action::UpdateTask,
        )
        .await?;

        self.task_repo
            .update_due_date(task_id, due_date)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::TaskNotFound {
                    id: task_id.to_string(),
                },
                other => ServiceError::from(other),
            })
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(task_id = %task_id)
    )]
    pub async fn update_status(
        &self,
        caller_org: &OrgMembership,
        task_id: TaskId,
        project_id: ProjectId,
        new_status: TaskStatus,
    ) -> Result<Task, ServiceError> {
        self.require_action(
            caller_org,
            project_id,
            caller_org.user_id,
            Action::UpdateTask,
        )
        .await?;

        let task = self
            .task_repo
            .update_status(task_id, new_status)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::TaskNotFound {
                    id: task_id.to_string(),
                },
                other => ServiceError::from(other),
            })?;

        self.event_bus.publish_task(TaskEvent::Updated {
            project_id,
            task: task.clone(),
        });

        Ok(task)
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(task_id = %task_id)
    )]
    pub async fn assign_task(
        &self,
        caller_org: &OrgMembership,
        task_id: TaskId,
        project_id: ProjectId,
        assignee_id: Option<UserId>,
    ) -> Result<Task, ServiceError> {
        self.require_action(
            caller_org,
            project_id,
            caller_org.user_id,
            Action::AssignTask,
        )
        .await?;

        self.task_repo
            .assign(task_id, assignee_id)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::TaskNotFound {
                    id: task_id.to_string(),
                },
                other => ServiceError::from(other),
            })
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(task_id = %task_id)
    )]
    pub async fn delete_task(
        &self,
        caller_org: &OrgMembership,
        task_id: TaskId,
        project_id: ProjectId,
    ) -> Result<(), ServiceError> {
        self.require_action(
            caller_org,
            project_id,
            caller_org.user_id,
            Action::DeleteTask,
        )
        .await?;

        self.task_repo
            .delete(task_id)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::TaskNotFound {
                    id: task_id.to_string(),
                },
                other => ServiceError::from(other),
            })?;

        self.event_bus.publish_task(TaskEvent::Deleted {
            project_id,
            task_id,
        });

        Ok(())
    }

    async fn validate_assignee(
        &self,
        caller_org: &OrgMembership,
        assignee_id: UserId,
        project_id: ProjectId,
    ) -> Result<(), ServiceError> {
        let (ctx, _) = load_project_context(
            caller_org,
            &self.team_repo,
            &self.project_repo,
            project_id,
            assignee_id,
        )
        .await?;

        let role = effective_project_role(ctx.team.as_ref(), ctx.project.as_ref());

        if !role.is_some_and(|r| r.at_least(ProjectRole::Viewer)) {
            return Err(ServiceError::Validation {
                field: "assignee_id".into(),
                message: "assignee must be a project member".into(),
            });
        }

        Ok(())
    }
}

fn validate_task_title(title: &str) -> Result<(), ServiceError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(ServiceError::Validation {
            field: "title".into(),
            message: "title is required".into(),
        });
    }

    if title.len() > 225 {
        return Err(ServiceError::Validation {
            field: "title".into(),
            message: "title must be 255 characters or fewer".into(),
        });
    }

    Ok(())
}
