pub mod pg;

use async_trait::async_trait;
use devboard_domain::{
    OrganizationId, Project, ProjectId, ProjectMembership, ProjectRole, TeamId, UserId,
};

use crate::error::RepositoryError;

#[async_trait]
pub trait ProjectRepository: Send + Sync {
    async fn find_by_id(&self, id: ProjectId) -> Result<Option<Project>, RepositoryError>;

    async fn find_by_ids(&self, ids: Vec<ProjectId>) -> Result<Vec<Project>, RepositoryError>;

    async fn find_by_organization(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<Project>, RepositoryError>;

    async fn create(
        &self,
        id: ProjectId,
        organization_id: OrganizationId,
        team_id: TeamId,
        name: String,
        key: String,
        description: Option<String>,
    ) -> Result<Project, RepositoryError>;

    async fn next_task_number(&self, project_id: ProjectId) -> Result<i32, RepositoryError>;

    async fn add_member(
        &self,
        project_id: ProjectId,
        user_id: UserId,
        role_override: Option<ProjectRole>,
    ) -> Result<ProjectMembership, RepositoryError>;

    async fn get_membership(
        &self,
        project_id: ProjectId,
        user_id: UserId,
    ) -> Result<Option<ProjectMembership>, RepositoryError>;

    async fn delete(&self, id: ProjectId) -> Result<(), RepositoryError>;
}

pub(crate) fn model_to_domain(
    model: devboard_db::entities::project::Model,
) -> Result<Project, RepositoryError> {
    Ok(Project {
        id: devboard_domain::ProjectId::from(model.id),
        organization_id: devboard_domain::OrganizationId::from(model.organization_id),
        team_id: devboard_domain::TeamId::from(model.team_id),
        name: model.name,
        key: model.key,
        description: model.description,
        next_task_number: model.next_task_number,
        created_at: model.created_at.into(),
        updated_at: model.updated_at.into(),
    })
}

pub(crate) fn membership_to_domain(
    model: devboard_db::entities::project_membership::Model,
) -> Result<ProjectMembership, RepositoryError> {
    let role_override = model
        .role_override
        .as_deref()
        .map(str_to_project_role)
        .transpose()?;

    Ok(ProjectMembership {
        project_id: devboard_domain::ProjectId::from(model.project_id),
        user_id: devboard_domain::UserId::from(model.user_id),
        role_override,
        added_at: model.added_at.into(),
    })
}

pub(crate) fn str_to_project_role(s: &str) -> Result<ProjectRole, RepositoryError> {
    match s {
        "OWNER" => Ok(ProjectRole::Owner),
        "ADMIN" => Ok(ProjectRole::Admin),
        "CONTRIBUTOR" => Ok(ProjectRole::Contributor),
        "VIEWER" => Ok(ProjectRole::Viewer),
        other => Err(RepositoryError::InvalidData {
            message: format!("unknown project role: {other:?}"),
        }),
    }
}

pub(crate) fn project_role_to_str(role: &ProjectRole) -> &'static str {
    match role {
        ProjectRole::Owner => "OWNER",
        ProjectRole::Admin => "ADMIN",
        ProjectRole::Contributor => "CONTRIBUTOR",
        ProjectRole::Viewer => "VIEWER",
    }
}
