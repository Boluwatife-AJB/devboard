use std::sync::Arc;

use devboard_domain::{
    Action, EffectiveContext, OrgMembership, OrganizationId, Project, ProjectId, Team, TeamId,
    UserId, can,
};
use devboard_repository::{ProjectRepository, TeamRepository};

use crate::ServiceError;

pub fn org_context(org: &OrgMembership) -> EffectiveContext {
    EffectiveContext {
        org: org.clone(),
        team: None,
        project: None,
    }
}

pub fn authorize(ctx: &EffectiveContext, action: Action) -> Result<(), ServiceError> {
    if can(ctx, action) {
        Ok(())
    } else {
        Err(ServiceError::Forbidden {
            reason: format!("not authorized to perform {:?}", action),
        })
    }
}

pub async fn load_team_context(
    org: &OrgMembership,
    team_repo: &Arc<dyn TeamRepository>,
    team_id: TeamId,
    caller_id: UserId,
) -> Result<EffectiveContext, ServiceError> {
    let team_membership = team_repo
        .get_membership(team_id, caller_id)
        .await
        .map_err(ServiceError::from)?;

    Ok(EffectiveContext {
        org: org.clone(),
        team: team_membership,
        project: None,
    })
}

pub async fn load_project_context(
    org: &OrgMembership,
    team_repo: &Arc<dyn TeamRepository>,
    project_repo: &Arc<dyn ProjectRepository>,
    project_id: ProjectId,
    caller_id: UserId,
) -> Result<(EffectiveContext, Project), ServiceError> {
    let project = project_repo.find_by_id(project_id).await?.ok_or_else(|| {
        ServiceError::ProjectNotFound {
            id: project_id.to_string(),
        }
    })?;

    if project.organization_id != org.organization_id {
        return Err(ServiceError::ProjectNotFound {
            id: project_id.to_string(),
        });
    }

    let (team_m, project_m) = tokio::try_join!(
        team_repo.get_membership(project.team_id, caller_id),
        project_repo.get_membership(project_id, caller_id)
    )?;

    let ctx = EffectiveContext {
        org: org.clone(),
        team: team_m,
        project: project_m,
    };
    Ok((ctx, project))
}

pub async fn require_team_in_org(
    team_repo: &Arc<dyn TeamRepository>,
    team_id: TeamId,
    org_id: OrganizationId,
) -> Result<Team, ServiceError> {
    let team = team_repo
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
