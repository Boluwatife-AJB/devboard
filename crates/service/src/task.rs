use std::sync::Arc;

use devboard_domain::{
    ProjectId, ProjectRole, Task, TaskId, TaskPriority, TaskStatus, UserId, has_project_permission,
};
use devboard_repository::{ProjectRepository, TaskRepository, TeamRepository};

use crate::{error::ServiceError, event_bus::EventBus, events::TaskEvent};

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

    #[tracing::instrument(
      skip(self),
      fields(task_id = %task_id, caller_id = %caller_id)
    )]
    pub async fn get_task(
        &self,
        task_id: TaskId,
        caller_id: UserId,
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

        self.require_project_permission(caller_id, project_id, ProjectRole::Viewer)
            .await?;

        Ok(task)
    }

    #[tracing::instrument(
      skip(self),
      fields(project_id = %project_id, caller_id = %caller_id)
    )]
    pub async fn list_tasks(
        &self,
        project_id: ProjectId,
        caller_id: UserId,
        status_filter: Option<TaskStatus>,
    ) -> Result<Vec<Task>, ServiceError> {
        self.require_project_permission(caller_id, project_id, ProjectRole::Viewer)
            .await?;

        self.task_repo
            .find_by_project(project_id, status_filter)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
      skip(self),
      fields(project_id = %project_id, caller_id = %caller_id)
    )]
    pub async fn list_tasks_paginated(
        &self,
        project_id: ProjectId,
        caller_id: UserId,
        status_filter: Option<TaskStatus>,
        after_id: Option<uuid::Uuid>,
        limit: u64,
    ) -> Result<(Vec<Task>, bool), ServiceError> {
        self.require_project_permission(caller_id, project_id, ProjectRole::Viewer)
            .await?;

        self.task_repo
            .find_by_project_paginated(project_id, status_filter, after_id, limit)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
      skip(self),
      fields(
        project_id = %project_id,
        reporter_id = %reporter_id,
      )
    )]
    pub async fn create_task(
        &self,
        project_id: ProjectId,
        reporter_id: UserId,
        title: String,
        description: Option<String>,
        priority: TaskPriority,
        assignee_id: Option<UserId>,
    ) -> Result<Task, ServiceError> {
        validate_task_title(&title)?;

        self.require_project_permission(reporter_id, project_id, ProjectRole::Contributor)
            .await?;

        let task_number = self
            .project_repo
            .next_task_number(project_id)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::ProjectNotFound {
                    id: project_id.to_string(),
                },
                other => ServiceError::from(other),
            })?;

        let task_id = TaskId::new();

        let task = self
            .task_repo
            .create(
                task_id,
                project_id,
                task_number,
                title,
                description,
                TaskStatus::Backlog,
                priority,
                reporter_id,
                assignee_id,
            )
            .await?;

        self.event_bus.publish_task(TaskEvent::Created {
            project_id,
            task: task.clone(),
        });

        Ok(task)
    }

    #[tracing::instrument(
      skip(self),
      fields(task_id = %task_id, caller_id = %caller_id)
    )]
    pub async fn update_status(
        &self,
        task_id: TaskId,
        caller_id: UserId,
        project_id: ProjectId,
        new_status: TaskStatus,
    ) -> Result<Task, ServiceError> {
        self.require_project_permission(caller_id, project_id, ProjectRole::Contributor)
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
      skip(self),
      fields(task_id = %task_id, caller_id = %caller_id)
    )]
    pub async fn assign_task(
        &self,
        task_id: TaskId,
        caller_id: UserId,
        project_id: ProjectId,
        assignee_id: Option<UserId>,
    ) -> Result<Task, ServiceError> {
        self.require_project_permission(caller_id, project_id, ProjectRole::Contributor)
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
      skip(self),
      fields(task_id = %task_id, caller_id = %caller_id)
    )]
    pub async fn delete_task(
        &self,
        task_id: TaskId,
        caller_id: UserId,
        project_id: ProjectId,
    ) -> Result<(), ServiceError> {
        self.require_project_permission(caller_id, project_id, ProjectRole::Admin)
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

    async fn require_project_permission(
        &self,
        caller_id: UserId,
        project_id: ProjectId,
        required: ProjectRole,
    ) -> Result<(), ServiceError> {
        let project = self
            .project_repo
            .find_by_id(project_id)
            .await?
            .ok_or_else(|| ServiceError::ProjectNotFound {
                id: project_id.to_string(),
            })?;

        let (team_membership, project_membership) = tokio::try_join!(
            self.team_repo.get_membership(project.team_id, caller_id),
            self.project_repo.get_membership(project_id, caller_id)
        )?;

        let authorized = has_project_permission(
            team_membership.as_ref(),
            project_membership.as_ref(),
            required,
        );

        if !authorized {
            return Err(ServiceError::Forbidden {
                reason: format!("requires {:?} access to project {}", required, project_id),
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
