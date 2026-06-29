use async_trait::async_trait;
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
};

use devboard_db::entities::comment::{self, Entity as CommentEntity};
use devboard_domain::{Comment, CommentId, TaskId, UserId};
use uuid::Uuid;

use super::{CommentRepository, model_to_domain};
use crate::RepositoryError;

pub struct PgCommentRepository {
    db: DatabaseConnection,
}

impl PgCommentRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl CommentRepository for PgCommentRepository {
    #[tracing::instrument(skip(self), fields(comment_id = %id))]
    async fn find_by_id(&self, id: CommentId) -> Result<Option<Comment>, RepositoryError> {
        let model = CommentEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(task_id = %task_id))]
    async fn find_by_task(&self, task_id: TaskId) -> Result<Vec<Comment>, RepositoryError> {
        let models = CommentEntity::find()
            .filter(comment::Column::TaskId.eq(Uuid::from(task_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    async fn create(
        &self,
        id: CommentId,
        task_id: TaskId,
        author_id: UserId,
        body: String,
    ) -> Result<Comment, RepositoryError> {
        let now = Utc::now();

        let active_model = comment::ActiveModel {
            id: ActiveValue::Set(Uuid::from(id)),
            task_id: ActiveValue::Set(Uuid::from(task_id)),
            author_id: ActiveValue::Set(Uuid::from(author_id)),
            body: ActiveValue::Set(body),
            created_at: ActiveValue::Set(now.into()),
            edited_at: ActiveValue::Set(None),
        };

        let model = active_model
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }

    async fn update_body(&self, id: CommentId, body: String) -> Result<Comment, RepositoryError> {
        let model = CommentEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: comment::ActiveModel = model.into();
        active.body = ActiveValue::Set(body);
        active.edited_at = ActiveValue::Set(Some(Utc::now().into()));

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(updated)
    }

    async fn delete(&self, id: CommentId) -> Result<(), RepositoryError> {
        let result = CommentEntity::delete_by_id(Uuid::from(id))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }

        Ok(())
    }
}
