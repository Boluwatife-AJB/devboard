use std::collections::HashMap;

use async_trait::async_trait;
use chrono::Utc;
use devboard_domain::{AttachmentId, AttachmentKind, TaskAttachment, TaskId, UserId};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
    QuerySelect,
};
use uuid::Uuid;

use crate::{
    RepositoryError,
    attachment::{AttachmentRepository, model_to_domain},
};
use devboard_db::entities::task_attachment::{self, Entity as AttachmentEntity};

pub struct PgAttachmentRepository {
    db: DatabaseConnection,
}

impl PgAttachmentRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl AttachmentRepository for PgAttachmentRepository {
    #[tracing::instrument(skip(self), fields(task_id = %task_id))]
    async fn find_by_task(&self, task_id: TaskId) -> Result<Vec<TaskAttachment>, RepositoryError> {
        let models = AttachmentEntity::find()
            .filter(task_attachment::Column::TaskId.eq(Uuid::from(task_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(skip(self), fields(count = task_ids.len()))]
    async fn count_by_task_ids(
        &self,
        task_ids: Vec<TaskId>,
    ) -> Result<HashMap<TaskId, i64>, RepositoryError> {
        if task_ids.is_empty() {
            return Ok(HashMap::new());
        }

        let uuids: Vec<Uuid> = task_ids.iter().copied().map(Uuid::from).collect();
        let task_id_rows: Vec<Uuid> = AttachmentEntity::find()
            .filter(task_attachment::Column::TaskId.is_in(uuids))
            .select_only()
            .column(task_attachment::Column::TaskId)
            .into_tuple()
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        let mut counts = HashMap::new();
        for task_id in task_id_rows {
            *counts.entry(TaskId::from(task_id)).or_insert(0) += 1;
        }
        Ok(counts)
    }

    #[tracing::instrument(
      skip(self),
      fields(task_id = %task_id, added_by = %added_by)
    )]
    async fn create(
        &self,
        id: AttachmentId,
        task_id: TaskId,
        added_by: UserId,
        kind: AttachmentKind,
        label: String,
        url: String,
    ) -> Result<TaskAttachment, RepositoryError> {
        let active = task_attachment::ActiveModel {
            id: ActiveValue::Set(Uuid::from(id)),
            task_id: ActiveValue::Set(Uuid::from(task_id)),
            added_by: ActiveValue::Set(Uuid::from(added_by)),
            kind: ActiveValue::Set(kind.as_str().to_string()),
            label: ActiveValue::Set(label),
            url: ActiveValue::Set(url),
            created_at: ActiveValue::Set(Utc::now().into()),
        };

        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }

    #[tracing::instrument(
      skip(self),
      field(attachment_id = %id, requestor_id = %requestor_id)
    )]
    async fn delete(&self, id: AttachmentId, _requestor_id: UserId) -> Result<(), RepositoryError> {
        let result = AttachmentEntity::delete_by_id(Uuid::from(id))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }

        Ok(())
    }
}
