use std::sync::Arc;

use async_graphql::{Schema, dataloader::DataLoader};

use devboard_repository::UserRepository;
use devboard_service::EventBus;

use crate::{
    UserLoader,
    context::Services,
    resolvers::{MutationRoot, QueryRoot, SubscriptionRoot},
};

pub type DevBoardSchema = Schema<QueryRoot, MutationRoot, SubscriptionRoot>;

pub fn build_schema(
    services: Services,
    user_repo: Arc<dyn UserRepository>,
    event_bus: EventBus,
) -> DevBoardSchema {
    let user_loader = DataLoader::new(UserLoader::new(user_repo), tokio::spawn);

    Schema::build(QueryRoot, MutationRoot, SubscriptionRoot)
        .data(services)
        .data(user_loader)
        .data(event_bus)
        .finish()
}
