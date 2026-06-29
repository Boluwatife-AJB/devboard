pub mod pg;

use async_trait::async_trait;

use devboard_domain::{ids::UserId, user::User};

use crate::error::RepositoryError;

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: UserId) -> Result<Option<User>, RepositoryError>;

    async fn find_by_ids(&self, ids: Vec<UserId>) -> Result<Vec<User>, RepositoryError>;

    async fn find_by_email(&self, email: &str) -> Result<Option<User>, RepositoryError>;

    async fn create(
        &self,
        id: UserId,
        email: String,
        display_name: String,
        password_hash: String,
    ) -> Result<User, RepositoryError>;

    async fn update_display_name(
        &self,
        id: UserId,
        display_name: String,
    ) -> Result<User, RepositoryError>;

    async fn delete(&self, id: UserId) -> Result<(), RepositoryError>;
}

pub(crate) fn model_to_domain(
    model: devboard_db::entities::user::Model,
) -> Result<User, RepositoryError> {
    Ok(User {
        id: UserId::from(model.id),
        email: model.email,
        display_name: model.display_name,
        password_hash: model.password_hash,
        created_at: model.created_at.into(),
        updated_at: model.updated_at.into(),
    })
}
