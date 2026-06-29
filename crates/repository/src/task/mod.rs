pub mod pg;
use async_trait::async_trait;
use devboard_domain::{ProjectId, Task, TaskId, TaskPriority, TaskStatus, UserId};

use crate::error::RepositoryError;

#[derive(Debug)]
pub struct CreateTaskParams {
    pub id: TaskId,
    pub project_id: ProjectId,
    pub task_number: i32,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub reporter_id: UserId,
    pub assignee_id: Option<UserId>,
}

#[async_trait]
pub trait TaskRepository: Send + Sync {
    async fn find_by_id(&self, id: TaskId) -> Result<Option<Task>, RepositoryError>;

    async fn find_by_ids(&self, id: Vec<TaskId>) -> Result<Vec<Task>, RepositoryError>;

    async fn find_by_project(
        &self,
        project_id: ProjectId,
        status: Option<TaskStatus>,
    ) -> Result<Vec<Task>, RepositoryError>;

    async fn create(&self, params: CreateTaskParams) -> Result<Task, RepositoryError>;

    async fn update_status(&self, id: TaskId, status: TaskStatus) -> Result<Task, RepositoryError>;

    async fn update_priority(
        &self,
        id: TaskId,
        priority: TaskPriority,
    ) -> Result<Task, RepositoryError>;

    async fn assign(
        &self,
        id: TaskId,
        assignee_id: Option<UserId>,
    ) -> Result<Task, RepositoryError>;

    async fn delete(&self, id: TaskId) -> Result<(), RepositoryError>;

    async fn find_by_project_paginated(
        &self,
        project_id: ProjectId,
        status: Option<TaskStatus>,
        after_id: Option<uuid::Uuid>,
        limit: u64,
    ) -> Result<(Vec<Task>, bool), RepositoryError>;
}

pub(crate) fn status_to_str(status: &TaskStatus) -> &'static str {
    match status {
        TaskStatus::Backlog => "BACKLOG",
        TaskStatus::Todo => "TODO",
        TaskStatus::InProgress => "IN_PROGRESS",
        TaskStatus::InReview => "IN_REVIEW",
        TaskStatus::Done => "DONE",
        TaskStatus::Cancelled => "CANCELLED",
    }
}

pub(crate) fn str_to_status(s: &str) -> Result<TaskStatus, RepositoryError> {
    match s {
        "BACKLOG" => Ok(TaskStatus::Backlog),
        "TODO" => Ok(TaskStatus::Todo),
        "IN_PROGRESS" => Ok(TaskStatus::InProgress),
        "IN_REVIEW" => Ok(TaskStatus::InReview),
        "DONE" => Ok(TaskStatus::Done),
        "CANCELLED" => Ok(TaskStatus::Cancelled),
        other => Err(RepositoryError::InvalidData {
            message: format!("unknown task status in database: {other:?}"),
        }),
    }
}

pub(crate) fn priority_to_str(priority: &TaskPriority) -> &'static str {
    match priority {
        TaskPriority::Low => "LOW",
        TaskPriority::Medium => "MEDIUM",
        TaskPriority::High => "HIGH",
        TaskPriority::Urgent => "URGENT",
    }
}

pub(crate) fn str_to_priority(s: &str) -> Result<TaskPriority, RepositoryError> {
    match s {
        "LOW" => Ok(TaskPriority::Low),
        "MEDIUM" => Ok(TaskPriority::Medium),
        "HIGH" => Ok(TaskPriority::High),
        "URGENT" => Ok(TaskPriority::Urgent),
        other => Err(RepositoryError::InvalidData {
            message: format!("unknown task priority in database: {other:?}"),
        }),
    }
}

pub(crate) fn model_to_domain(
    model: devboard_db::entities::task::Model,
) -> Result<Task, RepositoryError> {
    Ok(Task {
        id: devboard_domain::TaskId::from(model.id),
        project_id: devboard_domain::ProjectId::from(model.project_id),
        task_number: model.task_number,
        title: model.title,
        description: model.description,
        status: str_to_status(&model.status)?,
        priority: str_to_priority(&model.priority)?,
        assignee_id: model.assignee_id.map(UserId::from),
        reporter_id: UserId::from(model.reporter_id),
        created_at: model.created_at.into(),
        updated_at: model.updated_at.into(),
    })
}
