use std::collections::HashMap;
use std::sync::Arc;

use async_graphql::dataloader::Loader;
use async_trait::async_trait;

use devboard_domain::{PublicUser, UserId};
use devboard_repository::UserRepository;

pub struct UserLoader {
  repo: Arc<dyn UserRepository>,
}

impl UserLoader {
    pub fn new(repo: Arc<dyn UserRepository>) -> Self {
      Self { repo }
    }
}

#[async_trait]
impl Loader<UserId> for UserLoader {
  type Value = PublicUser;
  type Error = Arc<devboard_repository::RepositoryError>;

  async fn load(
    &self,
    keys: &[UserId]
  ) -> Result<HashMap<UserId, Self::Value>, Self::Error> {
    let users = self
        .repo
        .find_by_ids(keys.to_vec())
        .await
        .map_err(Arc::new)?;

    Ok(users
        .into_iter()
        .map(|u| {
          let id = u.id;
          (id, PublicUser::from(u))
        })
        .collect()
      )
  }  
}