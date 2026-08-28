use std::sync::Arc;

use devboard_domain::{
    Action, OrgMembership, OrgRole, OrganizationId, Team, TeamId, TeamMembership, TeamRole, UserId,
    can_assign_team_role,
};
use devboard_repository::{OrgMembershipRepository, TeamRepository};

use crate::{
    authorize, authz::org_context, error::ServiceError, load_team_context, require_team_in_org,
};

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

    #[tracing::instrument(skip(self), fields(org_id = %caller_org.organization_id))]
    pub async fn create_team(
        &self,
        caller_org: &OrgMembership,
        name: String,
    ) -> Result<Team, ServiceError> {
        validate_team_name(&name)?;

        authorize(&org_context(caller_org), Action::CreateTeam)?;

        let org_id = caller_org.organization_id;
        let caller_id = caller_org.user_id;

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
        caller_org: &OrgMembership,
        team_id: TeamId,
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

        require_team_in_org(&self.team_repo, team_id, caller_org.organization_id).await?;

        let ctx =
            load_team_context(caller_org, &self.team_repo, team_id, caller_org.user_id).await?;
        authorize(&ctx, Action::UpdateTeam)?;

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
        require_team_in_org(&self.team_repo, team_id, org_id).await?;

        self.team_repo
            .list_members(team_id)
            .await
            .map_err(ServiceError::from)
    }

    #[tracing::instrument(
        skip(self, caller_org),
        fields(team_id = %team_id, user_id = %user_id)
    )]
    pub async fn add_member(
        &self,
        caller_org: &OrgMembership,
        team_id: TeamId,
        user_id: UserId,
        role: TeamRole,
    ) -> Result<TeamMembership, ServiceError> {
        require_team_in_org(&self.team_repo, team_id, caller_org.organization_id).await?;

        let ctx =
            load_team_context(caller_org, &self.team_repo, team_id, caller_org.user_id).await?;
        authorize(&ctx, Action::ManageTeamMembers)?;

        if !can_assign_team_role(&ctx, user_id == caller_org.user_id, role) {
            return Err(ServiceError::Forbidden {
                reason: "not authorized to assign this role".into(),
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
        skip(self, caller_org),
        fields(team_id = %team_id, user_id = %user_id)
    )]
    pub async fn remove_member(
        &self,
        caller_org: &OrgMembership,
        team_id: TeamId,
        user_id: UserId,
    ) -> Result<(), ServiceError> {
        require_team_in_org(&self.team_repo, team_id, caller_org.organization_id).await?;

        let ctx =
            load_team_context(caller_org, &self.team_repo, team_id, caller_org.user_id).await?;
        authorize(&ctx, Action::ManageTeamMembers)?;

        let target_membership = self
            .team_repo
            .get_membership(team_id, user_id)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::UserNotFound {
                id: user_id.to_string(),
            })?;

        if target_membership.role == TeamRole::Owner && caller_org.user_id != user_id {
            let caller_is_owner = ctx.team.as_ref().is_some_and(|m| m.role == TeamRole::Owner);
            let caller_is_org_admin = caller_org.role.at_least(OrgRole::OrgAdmin);
            if !caller_is_owner && !caller_is_org_admin {
                return Err(ServiceError::Forbidden {
                    reason: "only a team owner or org admin can remove a team owner".into(),
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
