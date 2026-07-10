use std::sync::Arc;

use devboard_domain::{
    AttachmentId, AttachmentKind, ProjectId, ProjectRole, TaskAttachment, TaskId, UserId,
};
use devboard_repository::{
    AttachmentRepository, ProjectRepository, RepositoryError, TaskRepository, TeamRepository,
};

use crate::ServiceError;

pub struct AttachmentService {
    attachment_repo: Arc<dyn AttachmentRepository>,
    task_repo: Arc<dyn TaskRepository>,
    project_repo: Arc<dyn ProjectRepository>,
    team_repo: Arc<dyn TeamRepository>,
}

impl AttachmentService {
    pub fn new(
        attachment_repo: Arc<dyn AttachmentRepository>,
        task_repo: Arc<dyn TaskRepository>,
        project_repo: Arc<dyn ProjectRepository>,
        team_repo: Arc<dyn TeamRepository>,
    ) -> Self {
        Self {
            attachment_repo,
            task_repo,
            project_repo,
            team_repo,
        }
    }

    #[tracing::instrument(skip(self), fields(task_id = %task_id))]
    pub async fn list_attachments(
        &self,
        task_id: TaskId,
        project_id: ProjectId,
        caller_id: UserId,
    ) -> Result<Vec<TaskAttachment>, ServiceError> {
        self.require_project_permission(caller_id, project_id, ProjectRole::Viewer)
            .await?;

        self.attachment_repo
            .find_by_task(task_id)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
      skip(self),
      fields(task_id = %task_id, caller_id = %caller_id)
    )]
    pub async fn add_attachment(
        &self,
        task_id: TaskId,
        project_id: ProjectId,
        caller_id: UserId,
        kind: AttachmentKind,
        label: String,
        url: String,
    ) -> Result<TaskAttachment, ServiceError> {
        validate_url(&url)?;
        validate_label(&label)?;

        self.require_project_permission(caller_id, project_id, ProjectRole::Contributor)
            .await?;

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

        self.attachment_repo
            .create(AttachmentId::new(), task_id, caller_id, kind, label, url)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
      skip(self),
      fields(attachment_id = %attachment_id, caller_id = %caller_id)
    )]
    pub async fn remove_attachment(
        &self,
        attachment_id: AttachmentId,
        project_id: ProjectId,
        caller_id: UserId,
    ) -> Result<(), ServiceError> {
        self.require_project_permission(caller_id, project_id, ProjectRole::Contributor)
            .await?;

        self.attachment_repo
            .delete(attachment_id, caller_id)
            .await
            .map_err(|err| match err {
                RepositoryError::NotFound => ServiceError::Internal("attachment not found".into()),
                other => ServiceError::from(other),
            })
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

        let (team_m, project_m) = tokio::try_join!(
            self.team_repo.get_membership(project.team_id, caller_id),
            self.project_repo.get_membership(project_id, caller_id),
        )?;

        if !devboard_domain::has_project_permission(team_m.as_ref(), project_m.as_ref(), required) {
            return Err(ServiceError::Forbidden {
                reason: format!("requires {:?} access to project {}", required, project_id),
            });
        }

        Ok(())
    }
}

// Private Helpers
fn validate_url(url: &str) -> Result<(), ServiceError> {
    if url.is_empty() {
        return Err(ServiceError::Validation {
            field: "url".into(),
            message: "URL is required".into(),
        });
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(ServiceError::Validation {
            field: "url".into(),
            message: "URL must start with 'http://' or 'https://'".into(),
        });
    }
    if url.len() > 2048 {
        return Err(ServiceError::Validation {
            field: "url".into(),
            message: "URL cannot exceed 2048 characters".into(),
        });
    }

    Ok(())
}

fn validate_label(label: &str) -> Result<(), ServiceError> {
    if label.trim().is_empty() {
        return Err(ServiceError::Validation {
            field: "label".into(),
            message: "label is required".into(),
        });
    }
    if label.len() > 255 {
        return Err(ServiceError::Validation {
            field: "label".into(),
            message: "label cannot exceed 255 characters".into(),
        });
    }

    Ok(())
}
