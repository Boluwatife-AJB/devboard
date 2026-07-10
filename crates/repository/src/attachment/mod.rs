use async_trait::async_trait;

use devboard_db::entities::task_attachment::Model;
use devboard_domain::{AttachmentId, AttachmentKind, TaskAttachment, TaskId, UserId};

use crate::RepositoryError;

pub mod pg;

#[async_trait]
pub trait AttachmentRepository: Send + Sync {
    async fn find_by_task(&self, task_id: TaskId) -> Result<Vec<TaskAttachment>, RepositoryError>;

    async fn create(
        &self,
        id: AttachmentId,
        task_id: TaskId,
        added_by: UserId,
        kind: AttachmentKind,
        label: String,
        url: String,
    ) -> Result<TaskAttachment, RepositoryError>;

    async fn delete(&self, id: AttachmentId, requestor_id: UserId) -> Result<(), RepositoryError>;
}

pub(crate) fn model_to_domain(model: Model) -> Result<TaskAttachment, RepositoryError> {
    let kind =
        AttachmentKind::from_str(&model.kind).ok_or_else(|| RepositoryError::InvalidData {
            message: format!("unknown attachment kind: {}", model.kind),
        })?;

    Ok(TaskAttachment {
        id: AttachmentId::from(model.id),
        task_id: TaskId::from(model.task_id),
        added_by: UserId::from(model.added_by),
        kind,
        label: model.label,
        url: model.url,
        created_at: model.created_at.into(),
    })
}
