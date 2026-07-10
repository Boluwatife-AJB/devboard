use async_trait::async_trait;
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
};
use uuid::Uuid;

use devboard_db::entities::organization::{self, Entity as OrgEntity};
use devboard_domain::{Organization, OrganizationId};

use crate::{
    RepositoryError,
    organization::{OrganizationRepository, model_to_domain},
};

pub struct PgOrganizationRepository {
    db: DatabaseConnection,
}

impl PgOrganizationRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl OrganizationRepository for PgOrganizationRepository {
    #[tracing::instrument(skip(self), fields(org_id = %id))]
    async fn find_by_id(
        &self,
        id: OrganizationId,
    ) -> Result<Option<Organization>, RepositoryError> {
        let model = OrgEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(slug = %slug))]
    async fn find_by_slug(&self, slug: &str) -> Result<Option<Organization>, RepositoryError> {
        let model = OrgEntity::find()
            .filter(organization::Column::Slug.eq(slug))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(org_id = %id, slug = %slug))]
    async fn create(
        &self,
        id: OrganizationId,
        name: String,
        slug: String,
    ) -> Result<Organization, RepositoryError> {
        let now = Utc::now();

        let active = organization::ActiveModel {
            id: ActiveValue::Set(Uuid::from(id)),
            name: ActiveValue::Set(name),
            slug: ActiveValue::Set(slug),
            created_at: ActiveValue::Set(now.into()),
            updated_at: ActiveValue::Set(now.into()),
        };

        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }

    #[tracing::instrument(skip(self), fields(org_id = %id))]
    async fn update_name(
        &self,
        id: OrganizationId,
        name: String,
    ) -> Result<Organization, RepositoryError> {
        let model = OrgEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: organization::ActiveModel = model.into();
        active.name = ActiveValue::Set(name);
        active.updated_at = ActiveValue::Set(Utc::now().into());

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(updated)
    }

    #[tracing::instrument(skip(self), fields(org_id = %id))]
    async fn delete(&self, id: OrganizationId) -> Result<(), RepositoryError> {
        let result = OrgEntity::delete_by_id(Uuid::from(id))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }

        Ok(())
    }
}
