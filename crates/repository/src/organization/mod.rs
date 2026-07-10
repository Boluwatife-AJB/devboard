use async_trait::async_trait;
use devboard_domain::{Organization, OrganizationId};

use crate::RepositoryError;

pub mod pg;

#[async_trait]
pub trait OrganizationRepository: Send + Sync {
    async fn find_by_id(&self, id: OrganizationId)
    -> Result<Option<Organization>, RepositoryError>;

    async fn find_by_slug(&self, slug: &str) -> Result<Option<Organization>, RepositoryError>;

    async fn create(
        &self,
        id: OrganizationId,
        name: String,
        slug: String,
    ) -> Result<Organization, RepositoryError>;

    async fn update_name(
        &self,
        id: OrganizationId,
        name: String,
    ) -> Result<Organization, RepositoryError>;

    async fn delete(&self, id: OrganizationId) -> Result<(), RepositoryError>;
}

pub(crate) fn model_to_domain(
    model: devboard_db::entities::organization::Model,
) -> Result<Organization, RepositoryError> {
    Ok(Organization {
        id: OrganizationId::from(model.id),
        name: model.name,
        slug: model.slug,
        created_at: model.created_at.into(),
        updated_at: model.updated_at.into(),
    })
}
