use std::collections::HashMap;
use std::sync::Arc;

use async_graphql::dataloader::Loader;
use async_trait::async_trait;
use devboard_domain::TaskId;
use devboard_repository::AttachmentRepository;

pub struct AttachmentCountLoader {
    repo: Arc<dyn AttachmentRepository>,
}

impl AttachmentCountLoader {
    pub fn new(repo: Arc<dyn AttachmentRepository>) -> Self {
        Self { repo }
    }
}

#[async_trait]
impl Loader<TaskId> for AttachmentCountLoader {
    type Value = i64;
    type Error = Arc<devboard_repository::RepositoryError>;

    async fn load(&self, keys: &[TaskId]) -> Result<HashMap<TaskId, Self::Value>, Self::Error> {
        self.repo
            .count_by_task_ids(keys.to_vec())
            .await
            .map_err(Arc::new)
    }
}
