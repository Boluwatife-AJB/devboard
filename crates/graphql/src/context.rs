use std::sync::Arc;

use async_graphql::ErrorExtensions;
use devboard_domain::{OrgMembership, UserId};
use devboard_service::{
    AttachmentService, AuthService, CommentService, ProjectService, TaskService, TeamService,
};

#[derive(Clone)]
pub struct Services {
    pub auth_service: Arc<AuthService>,
    pub task_service: Arc<TaskService>,
    pub project_service: Arc<ProjectService>,
    pub team_service: Arc<TeamService>,
    pub comment_service: Arc<CommentService>,
    pub attachment_service: Arc<AttachmentService>,
}

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user_id: UserId,
    pub org_membership: Option<OrgMembership>,
}

impl AuthenticatedUser {
    pub fn require_org(&self) -> async_graphql::Result<OrgMembership> {
        self.org_membership.clone().ok_or_else(|| {
            async_graphql::Error::new("X-Organization-Id header required")
                .extend_with(|_, e| e.set("code", "ORG_CONTEXT_REQUIRED"))
        })
    }
}

pub trait ContextExt {
    fn services(&self) -> async_graphql::Result<&Services>;
    fn authenticated_user(&self) -> async_graphql::Result<&AuthenticatedUser>;
    fn maybe_authenticated_user(&self) -> Option<&AuthenticatedUser>;
}

impl ContextExt for async_graphql::Context<'_> {
    fn services(&self) -> async_graphql::Result<&Services> {
        self.data::<Services>()
    }

    fn authenticated_user(&self) -> async_graphql::Result<&AuthenticatedUser> {
        self.data::<AuthenticatedUser>().map_err(|_| {
            crate::error::to_graphql_error(devboard_service::ServiceError::Unauthenticated)
        })
    }

    fn maybe_authenticated_user(&self) -> Option<&AuthenticatedUser> {
        self.data_opt::<AuthenticatedUser>()
    }
}
