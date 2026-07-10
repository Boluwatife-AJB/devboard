use std::sync::Arc;

use async_graphql::{Schema, dataloader::DataLoader};

use devboard_repository::UserRepository;
use devboard_service::{
    AttachmentService, AuthService, CommentService, EventBus, ProjectService, TaskService,
    TeamService,
};

use crate::{
    UserLoader,
    context::Services,
    resolvers::{MutationRoot, QueryRoot, SubscriptionRoot},
};

pub type DevBoardSchema = Schema<QueryRoot, MutationRoot, SubscriptionRoot>;

pub fn build_schema(
    auth_service: Arc<AuthService>,
    task_service: Arc<TaskService>,
    project_service: Arc<ProjectService>,
    comment_service: Arc<CommentService>,
    attachment_service: Arc<AttachmentService>,
    team_service: Arc<TeamService>,
    user_repo: Arc<dyn UserRepository>,
    event_bus: EventBus,
) -> DevBoardSchema {
    let services = Services {
        auth_service,
        task_service,
        project_service,
        comment_service,
        attachment_service,
        team_service,
    };

    let user_loader = DataLoader::new(UserLoader::new(user_repo), tokio::spawn);

    Schema::build(QueryRoot, MutationRoot, SubscriptionRoot)
        .data(services)
        .data(user_loader)
        .data(event_bus)
        .finish()
}
