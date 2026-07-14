use std::sync::Arc;

use async_graphql::{Schema, dataloader::DataLoader};

use devboard_repository::{AttachmentRepository, CommentRepository, UserRepository};
use devboard_service::EventBus;

use crate::{
    AttachmentCountLoader, CommentCountLoader, UserLoader,
    context::Services,
    resolvers::{MutationRoot, QueryRoot, SubscriptionRoot},
};

pub type DevBoardSchema = Schema<QueryRoot, MutationRoot, SubscriptionRoot>;

pub fn build_schema(
    services: Services,
    user_repo: Arc<dyn UserRepository>,
    comment_repo: Arc<dyn CommentRepository>,
    attachment_repo: Arc<dyn AttachmentRepository>,
    event_bus: EventBus,
) -> DevBoardSchema {
    let user_loader = DataLoader::new(UserLoader::new(user_repo), tokio::spawn);
    let comment_count_loader =
        DataLoader::new(CommentCountLoader::new(comment_repo), tokio::spawn);
    let attachment_count_loader =
        DataLoader::new(AttachmentCountLoader::new(attachment_repo), tokio::spawn);

    Schema::build(QueryRoot, MutationRoot, SubscriptionRoot)
        .data(services)
        .data(user_loader)
        .data(comment_count_loader)
        .data(attachment_count_loader)
        .data(event_bus)
        .finish()
}
