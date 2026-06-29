use crate::{
    project::{ProjectMembership, ProjectRole},
    team::TeamMembership,
};

pub fn resolve_project_role(
    team_membership: Option<&TeamMembership>,
    project_membership: Option<&ProjectMembership>,
) -> Option<ProjectRole> {
    match (project_membership, team_membership) {
        (Some(pm), _) if pm.role_override.is_some() => pm.role_override,

        (_, Some(tm)) => Some(ProjectRole::from(tm.role)),

        (Some(_), None) => None,

        (None, None) => None,
    }
}

pub fn has_project_permission(
    team_membership: Option<&TeamMembership>,
    project_membership: Option<&ProjectMembership>,
    required: ProjectRole,
) -> bool {
    resolve_project_role(team_membership, project_membership)
        .map(|role| role.at_least(required))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        ids::{ProjectId, TeamId, UserId},
        team::TeamRole,
    };
    use chrono::Utc;
    use uuid::Uuid;

    fn user_id() -> UserId {
        UserId(Uuid::new_v4())
    }
    fn team_id() -> TeamId {
        TeamId(Uuid::new_v4())
    }
    fn project_id() -> ProjectId {
        ProjectId(Uuid::new_v4())
    }

    fn team_membership(role: TeamRole) -> TeamMembership {
        TeamMembership {
            team_id: team_id(),
            user_id: user_id(),
            role,
            joined_at: Utc::now(),
        }
    }

    fn project_membership(override_role: Option<ProjectRole>) -> ProjectMembership {
        ProjectMembership {
            project_id: project_id(),
            user_id: user_id(),
            role_override: override_role,
            added_at: Utc::now(),
        }
    }

    #[test]
    fn project_override_beats_team_role() {
        let tm = team_membership(TeamRole::Member);
        let pm = project_membership(Some(ProjectRole::Admin));
        assert_eq!(
            resolve_project_role(Some(&tm), Some(&pm)),
            Some(ProjectRole::Admin)
        )
    }

    #[test]
    fn team_owner_maps_to_project_owner() {
        let tm = team_membership(TeamRole::Owner);
        assert_eq!(
            resolve_project_role(Some(&tm), None),
            Some(ProjectRole::Owner)
        )
    }

    #[test]
    fn team_member_maps_to_project_contributor() {
        let tm = team_membership(TeamRole::Member);
        assert_eq!(
            resolve_project_role(Some(&tm), None),
            Some(ProjectRole::Contributor)
        )
    }

    #[test]
    fn no_membership_means_no_access() {
        assert_eq!(resolve_project_role(None, None), None);
    }

    #[test]
    fn project_member_without_override_and_no_team_has_no_access() {
        let pm = project_membership(None);
        assert_eq!(resolve_project_role(None, Some(&pm)), None);
    }

    // !FIXME: This test fails
    #[test]
    fn has_permission_respects_minimum_role() {
        let tm = team_membership(TeamRole::Member);
        assert!(has_project_permission(Some(&tm), None, ProjectRole::Viewer));
        assert!(has_project_permission(
            Some(&tm),
            None,
            ProjectRole::Contributor
        ));
        assert!(!has_project_permission(Some(&tm), None, ProjectRole::Admin));
        assert!(!has_project_permission(Some(&tm), None, ProjectRole::Owner));
    }
}
