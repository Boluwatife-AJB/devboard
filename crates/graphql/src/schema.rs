use std::sync::Arc;

use async_graphql::{Schema, dataloader::DataLoader};

use devboard_repository::UserRepository;
use devboard_service::{AuthService, ProjectService, TaskService};

use crate::{
  UserLoader, 
  context::Services, 
  resolvers::{MutationRoot, QueryRoot, SubscriptionRoot}
};

pub type DevBoardSchema = Schema<QueryRoot, MutationRoot, SubscriptionRoot>;

pub fn build_schema(
  auth_service: Arc<AuthService>,
  task_service: Arc<TaskService>,
  project_service: Arc<ProjectService>,
  user_repo: Arc<dyn UserRepository>
) -> DevBoardSchema {
  let services = Services {
    auth_service,
    task_service,
    project_service
  };

  let user_loader = DataLoader::new(UserLoader::new(user_repo), tokio::spawn);

  Schema::build(QueryRoot, MutationRoot, SubscriptionRoot)
    .data(services)
    .data(user_loader)
    .finish()
}