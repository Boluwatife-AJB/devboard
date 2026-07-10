use std::sync::Arc;

use devboard_domain::{
    OrgMembership, OrgRole, OrganizationId, Team, TeamId, TeamMembership, TeamRole, UserId,
};
use devboard_repository::{OrgMembershipRepository, TeamRepository};

use crate::error::ServiceError;

pub struct TeamService {
    team_repo: Arc<dyn TeamRepository>,
    org_membership_repo: Arc<dyn OrgMembershipRepository>,
}

impl TeamService {
    pub fn new(
        team_repo: Arc<dyn TeamRepository>,
        org_membership_repo: Arc<dyn OrgMembershipRepository>,
    ) -> Self {
        Self {
            team_repo,
            org_membership_repo,
        }
    }

    #[tracing::instrument(skip(self), fields(org_id = %org_id))]
    pub async fn list_teams(&self, org_id: OrganizationId) -> Result<Vec<Team>, ServiceError> {
        self.team_repo
            .find_by_organization(org_id)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(skip(self), fields(org_id = %org_id, caller_id = %caller_id))]
    pub async fn create_team(
        &self,
        org_id: OrganizationId,
        caller_id: UserId,
        name: String,
    ) -> Result<Team, ServiceError> {
        validate_team_name(&name)?;

        let team = self
            .team_repo
            .create(TeamId::new(), org_id, name.trim().to_string())
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::UniqueViolation { .. } => {
                    ServiceError::Conflict {
                        message: "a team with this name already exists in the organization".into(),
                    }
                }
                other => ServiceError::from(other),
            })?;

        self.team_repo
            .add_member(team.id, caller_id, TeamRole::Owner)
            .await
            .map_err(ServiceError::from)?;

        Ok(team)
    }

    #[tracing::instrument(skip(self), fields(team_id = %team_id))]
    pub async fn update_team(
        &self,
        team_id: TeamId,
        caller_id: UserId,
        name: String,
    ) -> Result<Team, ServiceError> {
        if name.trim().is_empty() {
            return Err(ServiceError::Validation {
                field: "name".into(),
                message: "team name cannot be empty".into(),
            });
        }
        if name.len() > 100 {
            return Err(ServiceError::Validation {
                field: "name".into(),
                message: "team name cannot exceed 100 characters".into(),
            });
        }

        let membership = self
            .team_repo
            .get_membership(team_id, caller_id)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::Forbidden {
                reason: "you are not a member of this team".into(),
            })?;

        if !membership.role.at_least(TeamRole::Admin) {
            return Err(ServiceError::Forbidden {
                reason: "requires team Admin role to update team details".into(),
            });
        }

        self.team_repo
            .update(team_id, name)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::TeamNotFound {
                    id: team_id.to_string(),
                },
                other => ServiceError::from(other),
            })
    }

    #[tracing::instrument(skip(self), fields(team_id = %team_id, org_id = %org_id))]
    pub async fn list_members(
        &self,
        team_id: TeamId,
        org_id: OrganizationId,
    ) -> Result<Vec<TeamMembership>, ServiceError> {
        self.get_team_in_org(team_id, org_id).await?;

        self.team_repo
            .list_members(team_id)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
        skip(self, caller),
        fields(team_id = %team_id, user_id = %user_id, caller_id = %caller)
    )]
    pub async fn add_member(
        &self,
        team_id: TeamId,
        caller: UserId,
        user_id: UserId,
        role: TeamRole,
    ) -> Result<TeamMembership, ServiceError> {
        let caller_membership = self
            .team_repo
            .get_membership(team_id, caller)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::Forbidden {
                reason: "you are not a member of this team".into(),
            })?;

        if !caller_membership.role.at_least(TeamRole::Admin) {
            return Err(ServiceError::Forbidden {
                reason: "requires team Admin role to add members".into(),
            });
        }

        if role.at_least(caller_membership.role) && role != caller_membership.role {
            return Err(ServiceError::Forbidden {
                reason: "cannot assign a role higher than your own".into(),
            });
        }

        self.team_repo
            .add_member(team_id, user_id, role)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::UniqueViolation { .. } => {
                    ServiceError::Conflict {
                        message: "user is already a member of this team".into(),
                    }
                }
                other => ServiceError::from(other),
            })
    }

    #[tracing::instrument(
        skip(self, caller),
        fields(team_id = %team_id, user_id = %user_id, caller_id = %caller)
    )]
    pub async fn remove_member(
        &self,
        team_id: TeamId,
        caller: UserId,
        user_id: UserId,
    ) -> Result<(), ServiceError> {
        let caller_membership = self
            .team_repo
            .get_membership(team_id, caller)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::Forbidden {
                reason: "you are not a member of this team".into(),
            })?;

        if !caller_membership.role.at_least(TeamRole::Admin) {
            return Err(ServiceError::Forbidden {
                reason: "requires team Admin role to remove members".into(),
            });
        }

        let target_membership = self
            .team_repo
            .get_membership(team_id, user_id)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::UserNotFound {
                id: user_id.to_string(),
            })?;

        if target_membership.role == TeamRole::Owner && caller != user_id {
            if caller_membership.role != TeamRole::Owner {
                return Err(ServiceError::Forbidden {
                    reason: "only a team owner can remove a team owner".into(),
                });
            }
        }

        self.team_repo
            .remove_member(team_id, user_id)
            .await
            .map_err(ServiceError::from)
    }

    /// Organization member directory, used to pick users when managing teams.
    #[tracing::instrument(skip(self), fields(org_id = %org_id))]
    pub async fn list_org_members(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<OrgMembership>, ServiceError> {
        self.org_membership_repo
            .list_by_org(org_id)
            .await
            .map_err(ServiceError::from)
    }

    async fn get_team_in_org(
        &self,
        team_id: TeamId,
        org_id: OrganizationId,
    ) -> Result<Team, ServiceError> {
        let team = self
            .team_repo
            .find_by_id(team_id)
            .await
            .map_err(ServiceError::from)?
            .ok_or_else(|| ServiceError::TeamNotFound {
                id: team_id.to_string(),
            })?;

        if team.organization_id != org_id {
            return Err(ServiceError::TeamNotFound {
                id: team_id.to_string(),
            });
        }

        Ok(team)
    }

    /// Caller must be a team Admin/Owner, or an org Admin/Owner.
    async fn _require_team_admin(
        &self,
        team_id: TeamId,
        caller: &OrgMembership,
    ) -> Result<(), ServiceError> {
        if caller.role.at_least(OrgRole::OrgAdmin) {
            return Ok(());
        }

        let membership = self
            .team_repo
            .get_membership(team_id, caller.user_id)
            .await
            .map_err(ServiceError::from)?;

        if membership.is_some_and(|m| m.role.at_least(TeamRole::Admin)) {
            return Ok(());
        }

        Err(ServiceError::Forbidden {
            reason: "requires team Admin role to manage team members".into(),
        })
    }
}

fn validate_team_name(name: &str) -> Result<(), ServiceError> {
    let name = name.trim();
    if name.is_empty() {
        return Err(ServiceError::Validation {
            field: "name".into(),
            message: "team name is required".into(),
        });
    }
    if name.len() > 100 {
        return Err(ServiceError::Validation {
            field: "name".into(),
            message: "team name must be 100 characters or fewer".into(),
        });
    }
    Ok(())
}
