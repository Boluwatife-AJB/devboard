use async_trait::async_trait;
use chrono::Utc;
use sea_orm::{
  ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, ActiveModelTrait, QueryFilter
};
use uuid::Uuid;


use devboard_domain::{User, UserId};
use devboard_db::entities::user::{self, Entity as UserEntity};

use crate::error::RepositoryError;
use super::model_to_domain;
use super::UserRepository;

pub struct PgUserRepository {
  db: DatabaseConnection,
}

impl PgUserRepository {
  pub fn new(db: DatabaseConnection) -> Self {
    Self { db }
  }
}

#[async_trait]
impl UserRepository for PgUserRepository {
    #[tracing::instrument(skip(self), fields(user_id = %id))]
    async fn find_by_id(
      &self,
      id: UserId
    ) -> Result<Option<User>, RepositoryError> {
      let model = UserEntity::find_by_id(Uuid::from(id))
        .one(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(count = ids.len()))]
    async fn find_by_ids(
      &self,
      ids: Vec<UserId>
    ) -> Result<Vec<User>, RepositoryError> {
      let uuids: Vec<Uuid> = ids.into_iter().map(Uuid::from).collect();

      let models = UserEntity::find()
        .filter(user::Column::Id.is_in(uuids))
        .all(&self.db)
        .await
        .map_err(RepositoryError::from_db_err)?;

      models
        .into_iter()
        .map(model_to_domain)
        .collect::<Result<Vec<_>, _>>()
    }

    #[tracing::instrument(skip(self), fields(email = %email))]
    async fn find_by_email(
        &self,
        email: &str,
    ) -> Result<Option<User>, RepositoryError> {
        let model = UserEntity::find()
            .filter(user::Column::Email.eq(email))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self, password_hash), fields(email = %email))]
    async fn create(
        &self,
        id: UserId,
        email: String,
        display_name: String,
        password_hash: String,
    ) -> Result<User, RepositoryError> {
        let now = Utc::now();

        let active_model = user::ActiveModel {
            id: ActiveValue::Set(Uuid::from(id)),
            email: ActiveValue::Set(email),
            display_name: ActiveValue::Set(display_name),
            password_hash: ActiveValue::Set(password_hash),
            created_at: ActiveValue::Set(now.into()),
            updated_at: ActiveValue::Set(now.into()),
        };

        let model = active_model
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }


    #[tracing::instrument(skip(self), fields(user_id = %id))]
    async fn update_display_name(
        &self,
        id: UserId,
        display_name: String,
    ) -> Result<User, RepositoryError> {
        use sea_orm::EntityTrait;

        let model = UserEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: user::ActiveModel = model.into();
        active.display_name = ActiveValue::Set(display_name);
        active.updated_at = ActiveValue::Set(Utc::now().into());

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(updated)
    }

    #[tracing::instrument(skip(self), fields(user_id = %id))]
    async fn delete(&self, id: UserId) -> Result<(), RepositoryError> {
        let result = UserEntity::delete_by_id(Uuid::from(id))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }

        Ok(())
    }
}