use std::sync::Arc;

use devboard_domain::{Comment, CommentId, ProjectId, ProjectRole, TaskId, UserId};
use devboard_repository::{CommentRepository, ProjectRepository, TaskRepository, TeamRepository};

use crate::ServiceError;

pub struct CommentService {
    comment_repo: Arc<dyn CommentRepository>,
    task_repo: Arc<dyn TaskRepository>,
    project_repo: Arc<dyn ProjectRepository>,
    team_repo: Arc<dyn TeamRepository>,
}

impl CommentService {
    pub fn new(
        comment_repo: Arc<dyn CommentRepository>,
        task_repo: Arc<dyn TaskRepository>,
        project_repo: Arc<dyn ProjectRepository>,
        team_repo: Arc<dyn TeamRepository>,
    ) -> Self {
        Self {
            comment_repo,
            task_repo,
            project_repo,
            team_repo,
        }
    }

    #[tracing::instrument(skip(self), fields(task_id = %task_id))]
    pub async fn list_comments(
        &self,
        task_id: TaskId,
        project_id: ProjectId,
        caller_id: UserId,
    ) -> Result<Vec<Comment>, ServiceError> {
        self.require_project_permission(caller_id, project_id, ProjectRole::Viewer)
            .await?;

        self.comment_repo
            .find_by_task(task_id)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
      skip(self, body),
      fields(task_id = %task_id, author_id = %author_id)
    )]
    pub async fn create_comment(
        &self,
        task_id: TaskId,
        project_id: ProjectId,
        author_id: UserId,
        body: String,
    ) -> Result<Comment, ServiceError> {
        validate_comment_body(&body)?;

        self.require_project_permission(author_id, project_id, ProjectRole::Contributor)
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

        self.comment_repo
            .create(CommentId::new(), task_id, author_id, body)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(skip(self, body), fields(comment_id = %comment_id, caller_id = %caller_id))]
    pub async fn edit_comment(
        &self,
        comment_id: CommentId,
        caller_id: UserId,
        body: String,
    ) -> Result<Comment, ServiceError> {
        validate_comment_body(&body)?;

        let comment = self
            .comment_repo
            .find_by_id(comment_id)
            .await?
            .ok_or_else(|| ServiceError::CommentNotFound {
                id: comment_id.to_string(),
            })?;

        if comment.author_id != caller_id {
            return Err(ServiceError::Forbidden {
                reason: "only the comment author can edit it".into(),
            });
        }

        self.comment_repo
            .update_body(comment_id, body)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::CommentNotFound {
                    id: comment_id.to_string(),
                },
                other => ServiceError::from(other),
            })
    }

    #[tracing::instrument(
      skip(self),
      fields(comment_id = %comment_id, caller_id = %caller_id)
    )]
    pub async fn delete_comment(
        &self,
        comment_id: CommentId,
        project_id: ProjectId,
        caller_id: UserId,
    ) -> Result<(), ServiceError> {
        let comment = self
            .comment_repo
            .find_by_id(comment_id)
            .await?
            .ok_or_else(|| ServiceError::CommentNotFound {
                id: comment_id.to_string(),
            })?;

        let is_author = comment.author_id == caller_id;

        if !is_author {
            self.require_project_permission(caller_id, project_id, ProjectRole::Admin)
                .await?;
        }

        self.comment_repo
            .delete(comment_id)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::CommentNotFound {
                    id: comment_id.to_string(),
                },
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

fn validate_comment_body(body: &str) -> Result<(), ServiceError> {
    let body = body.trim();
    if body.is_empty() {
        return Err(ServiceError::Validation {
            field: "body".into(),
            message: "comment body cannot be empty".into(),
        });
    }
    if body.len() > 50_000 {
        return Err(ServiceError::Validation {
            field: "body".into(),
            message: "comment body cannot be longer than 50,000 characters".into(),
        });
    }
    Ok(())
}
