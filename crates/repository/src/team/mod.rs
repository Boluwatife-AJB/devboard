pub mod pg;

use async_trait::async_trait;
use devboard_domain::{OrganizationId, Team, TeamId, TeamMembership, TeamRole, UserId};
use crate::error::RepositoryError;


#[async_trait]
pub trait TeamRepository: Send + Sync {
  async fn find_by_id(
    &self,
    id: TeamId,
  ) -> Result<Option<Team>, RepositoryError>;

  async fn find_by_organization(
    &self,
    org_id: OrganizationId,
  ) -> Result<Vec<Team>, RepositoryError>;

  async fn create(
    &self,
    id: TeamId,
    organization_id: OrganizationId,
    name: String
  ) -> Result<Team, RepositoryError>;

  async fn add_member(
    &self,
    team_id: TeamId,
    user_id: UserId,
    role: TeamRole,
  ) -> Result<TeamMembership, RepositoryError>;

  async fn get_membership(
    &self,
    team_id: TeamId,
    user_id: UserId,
  ) -> Result<Option<TeamMembership>, RepositoryError>;
}

pub(crate) fn model_to_domain(
  model: devboard_db::entities::team::Model,
) -> Result<Team, RepositoryError> {
  Ok(Team { 
    id: devboard_domain::TeamId::from(model.id), organization_id: devboard_domain::OrganizationId::from(
      model.organization_id
    ), 
    name: model.name, created_at: model.created_at.into(), updated_at: model.updated_at.into() 
  })
}

pub(crate) fn membership_to_domain(
  model: devboard_db::entities::team_membership::Model,
) -> Result<TeamMembership, RepositoryError> {
  Ok(TeamMembership { 
    team_id: devboard_domain::TeamId::from(model.team_id), user_id: devboard_domain::UserId::from(model.user_id), role: str_to_team_role(&model.role)?, 
    joined_at: model.joined_at.into() 
  })
}

pub(crate) fn str_to_team_role(
  s: &str 
) -> Result<TeamRole, RepositoryError> {
  match s {
    "OWNER" => Ok(TeamRole::Owner),
    "ADMIN" => Ok(TeamRole::Admin),
    "MEMBER" => Ok(TeamRole::Member),
    other => Err(RepositoryError::InvalidData { 
      message: format!("unknown team role: {other:?}") 
    })
  }
}

pub(crate) fn team_role_to_str(role: &TeamRole) -> &'static str {
  match role {
    TeamRole::Admin => "ADMIN",
    TeamRole::Owner => "OWNER",
    TeamRole::Member => "MEMBER"
  }
}