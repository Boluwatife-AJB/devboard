pub mod pg;

use std::collections::HashMap;

use crate::error::RepositoryError;
use async_trait::async_trait;
use devboard_domain::{Comment, CommentId, TaskId, UserId};

#[async_trait]
pub trait CommentRepository: Send + Sync {
    async fn find_by_id(&self, id: CommentId) -> Result<Option<Comment>, RepositoryError>;

    async fn find_by_task(&self, task_id: TaskId) -> Result<Vec<Comment>, RepositoryError>;

    /// Returns comment counts keyed by task id. Tasks with zero comments are omitted.
    async fn count_by_task_ids(
        &self,
        task_ids: Vec<TaskId>,
    ) -> Result<HashMap<TaskId, i64>, RepositoryError>;

    async fn create(
        &self,
        id: CommentId,
        task_id: TaskId,
        author_id: UserId,
        body: String,
    ) -> Result<Comment, RepositoryError>;

    async fn update_body(&self, id: CommentId, body: String) -> Result<Comment, RepositoryError>;

    async fn delete(&self, id: CommentId) -> Result<(), RepositoryError>;
}

pub(crate) fn model_to_domain(
    model: devboard_db::entities::comment::Model,
) -> Result<Comment, RepositoryError> {
    Ok(Comment {
        id: devboard_domain::CommentId::from(model.id),
        task_id: devboard_domain::TaskId::from(model.task_id),
        author_id: devboard_domain::UserId::from(model.author_id),
        body: model.body,
        created_at: model.created_at.into(),
        edited_at: model.edited_at.map(Into::into),
    })
}
