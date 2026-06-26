use async_trait::async_trait;
use chrono::Utc;
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, QuerySelect,
};
use uuid::Uuid;

use devboard_db::entities::task::{self, Entity as TaskEntity};
use devboard_domain::{ProjectId, Task, TaskId, TaskPriority, TaskStatus, UserId};

use crate::error::RepositoryError;
use super::{
  model_to_domain, status_to_str, priority_to_str, TaskRepository, 
};


pub struct PgTaskRepository {
  db: DatabaseConnection,
}

impl PgTaskRepository {
    pub fn new(db: DatabaseConnection) -> Self {
      Self { db }
    }
}

#[async_trait]
impl TaskRepository for PgTaskRepository {
    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn find_by_id(
      &self,
      id: TaskId,
    ) -> Result<Option<Task>, RepositoryError> {
      let model = TaskEntity::find_by_id(Uuid::from(id))
        .one(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      model.map(model_to_domain).transpose()
    }
    
    #[tracing::instrument(skip(self), fields(count = ids.len()))]
    async fn find_by_ids(
      &self,
      ids: Vec<TaskId>,
    ) -> Result<Vec<Task>, RepositoryError> {
      let uuids: Vec<Uuid> = ids.into_iter().map(Uuid::from).collect();

      let models = TaskEntity::find()
        .filter(task::Column::Id.is_in(uuids))
        .all(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;
      
      models.into_iter().map(model_to_domain).collect()
    }
    
    #[tracing::instrument(skip(self), fields(project_id = %project_id))]
    async fn find_by_project(
      &self,
      project_id: ProjectId,
      status: Option<TaskStatus>,
    ) -> Result<Vec<Task>, RepositoryError> {
      let mut query = TaskEntity::find()
        .filter(task::Column::ProjectId.eq(Uuid::from(project_id)));

      if let Some(s) = status {
        query = query.filter(task::Column::Status.eq(status_to_str(&s)));
      }

      let models = query
        .all(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(
        skip(self),
        fields(
            task_id = %id,
            project_id = %project_id,
            reporter_id = %reporter_id
        )
    )]
    async fn create(
      &self,
      id: TaskId,
      project_id: ProjectId,
      task_number: i32,
      title: String,
      description: Option<String>,
      status: TaskStatus,
      priority: TaskPriority,
      reporter_id: UserId,
      assignee_id: Option<UserId>
    ) -> Result<Task, RepositoryError> {
      let now = Utc::now();

      let active_model = task::ActiveModel {
        id: ActiveValue::Set(Uuid::from(id)),
        project_id: ActiveValue::Set(Uuid::from(project_id)),
        task_number: ActiveValue::Set(task_number),
        title: ActiveValue::Set(title),
        description: ActiveValue::Set(description),
        status: ActiveValue::Set(status_to_str(&status).to_string()),
        priority: ActiveValue::Set(priority_to_str(&priority).to_string()),
        reporter_id: ActiveValue::Set(Uuid::from(reporter_id)),
        assignee_id: ActiveValue::Set(
          assignee_id.map(Uuid::from)
        ),
        created_at: ActiveValue::Set(now.into()),
        updated_at: ActiveValue::Set(now.into()),
      };

      let model = active_model
        .insert(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      model_to_domain(model)
    }

    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn update_status(
      &self,
      id: TaskId,
      status: TaskStatus,
    ) -> Result<Task, RepositoryError> {
      let model = TaskEntity::find_by_id(Uuid::from(id))
        .one(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?
        .ok_or(RepositoryError::NotFound)?;

      let mut active: task::ActiveModel = model.into();
      active.status = ActiveValue::Set(status_to_str(&status).to_string());
      active.updated_at = ActiveValue::Set(Utc::now().into());

      let updated = active
        .update(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      model_to_domain(updated)
    }

    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn update_priority(
        &self,
        id: TaskId,
        priority: TaskPriority,
    ) -> Result<Task, RepositoryError> {
      let model = TaskEntity::find_by_id(Uuid::from(id))
        .one(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?
        .ok_or(RepositoryError::NotFound)?;

      let mut active: task::ActiveModel = model.into();
      active.priority = ActiveValue::Set(priority_to_str(&priority).to_string());
      active.updated_at = ActiveValue::Set(Utc::now().into());

      let updated = active
        .update(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      model_to_domain(updated)      
    }

    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn assign(
      &self,
      id: TaskId,
      assignee_id: Option<UserId>,
    ) -> Result<Task, RepositoryError> {
      let model = TaskEntity::find_by_id(Uuid::from(id))
        .one(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?
        .ok_or(RepositoryError::NotFound)?;

      let mut active: task::ActiveModel = model.into();
      active.assignee_id = ActiveValue::Set(assignee_id.map(Uuid::from));
      active.updated_at = ActiveValue::Set(Utc::now().into());

      let updated = active
        .update(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      model_to_domain(updated)
    }

    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn delete(&self, id: TaskId) -> Result<(), RepositoryError> {
      let result = TaskEntity::delete_by_id(Uuid::from(id))
        .exec(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      if result.rows_affected == 0 {
        return Err(RepositoryError::NotFound);
      }

      Ok(())
    }

    async fn find_by_project_paginated(
      &self,
      project_id: ProjectId,
      status: Option<TaskStatus>,
      after_id: Option<uuid::Uuid>,
      limit: u64
    ) -> Result<(Vec<Task>, bool), RepositoryError> {
      let mut query = TaskEntity::find()
        .filter(task::Column::ProjectId.eq(Uuid::from(project_id)))
        .order_by_asc(task::Column::TaskNumber);

      if let Some(s) = status {
        query = query.filter(
          task::Column::Status.eq(status_to_str(&s))
        );
      }

      if let Some(after_uuid) = after_id {
        let cursor_task = TaskEntity::find_by_id(after_uuid)
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if let Some(ct) = cursor_task {
          query = query.filter(
            task::Column::TaskNumber.gt(ct.task_number)
          );
        }
      }

      let models = query
        .limit(limit + 1)
        .all(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      let has_more = models.len() as u64 > limit;
      let models: Vec<_> = models
        .into_iter()
        .take(limit as usize)
        .collect();

      let task = models
        .into_iter()
        .map(model_to_domain)
        .collect::<Result<Vec<_>, _>>()?;

      Ok((task, has_more))
    }
}
