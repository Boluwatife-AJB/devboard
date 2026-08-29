use crate::{
    OrgMembership, OrgRole, TeamRole,
    project::{ProjectMembership, ProjectRole},
    team::TeamMembership,
};

#[derive(Debug, Clone)]
pub struct EffectiveContext {
    pub org: OrgMembership,
    pub team: Option<TeamMembership>,
    pub project: Option<ProjectMembership>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Action {
    // Org
    InviteOrgMember,
    ChangeOrgMemberRole,
    CreateTeam,
    ViewOrgDashboard,
    // Team
    UpdateTeam,
    DeleteTeam,
    ManageTeamMembers,
    AssignTeamRole,
    // Project
    CreateProject,
    UpdateProject,
    DeleteProject,
    ManageProjectMembers,
    ViewProject,
    // Task
    CreateTask,
    UpdateTask,
    DeleteTask,
    AssignTask,
    // Messaging
    CreateChannel,
    ManageChannelMembers,
    EditChannelInfo,
    // Event
    CreateEvent,
    UpdateEvent,
    DeleteEvent,
}

pub fn effective_project_role(
    team: Option<&TeamMembership>,
    project: Option<&ProjectMembership>,
) -> Option<ProjectRole> {
    let baseline = team.map(|tm| ProjectRole::from(tm.role));

    match (project.and_then(|pm| pm.role_override), baseline) {
        (Some(override_role), Some(base)) => {
            if override_role.at_least(base) {
                Some(base)
            } else {
                Some(override_role)
            }
        }
        (Some(override_role), None) => Some(override_role),
        (None, base) => base,
    }
}

pub fn can(ctx: &EffectiveContext, action: Action) -> bool {
    let org = ctx.org.role;
    let team = ctx.team.as_ref().map(|tm| tm.role);
    let project = effective_project_role(ctx.team.as_ref(), ctx.project.as_ref());

    match action {
        Action::CreateTeam => org.at_least(OrgRole::OrgAdmin),
        Action::DeleteTeam => {
            org.at_least(OrgRole::OrgAdmin) || team.is_some_and(|r| r == TeamRole::Owner)
        }
        Action::ManageTeamMembers | Action::UpdateTeam => {
            org.at_least(OrgRole::OrgAdmin) || team.is_some_and(|r| r.at_least(TeamRole::Admin))
        }
        Action::CreateProject => {
            org.at_least(OrgRole::OrgAdmin) || team.is_some_and(|r| r.at_least(TeamRole::Admin))
        }
        Action::DeleteProject => {
            org.at_least(OrgRole::OrgAdmin)
                || project.is_some_and(|r| r.at_least(ProjectRole::Owner))
        }
        Action::ManageProjectMembers | Action::UpdateProject => {
            org.at_least(OrgRole::OrgAdmin)
                || project.is_some_and(|r| r.at_least(ProjectRole::Admin))
        }
        Action::ViewProject => project.is_some_and(|r| r.at_least(ProjectRole::Viewer)),
        Action::CreateTask | Action::AssignTask => {
            project.is_some_and(|r| r.at_least(ProjectRole::Contributor))
        }
        Action::UpdateTask => project.is_some_and(|r| r.at_least(ProjectRole::Contributor)),
        Action::DeleteTask => project.is_some_and(|r| r.at_least(ProjectRole::Admin)),
        Action::InviteOrgMember
        | Action::ViewOrgDashboard
        | Action::CreateChannel
        | Action::ManageChannelMembers
        | Action::EditChannelInfo => org.at_least(OrgRole::OrgAdmin),
        Action::ChangeOrgMemberRole => org == OrgRole::OrgOwner,
        Action::AssignTeamRole => {
            org.at_least(OrgRole::OrgAdmin) || team.is_some_and(|r| r.at_least(TeamRole::Admin))
        }
        Action::CreateEvent | Action::UpdateEvent | Action::DeleteEvent => {
            org.at_least(OrgRole::OrgAdmin)
        }
    }
}

pub fn can_invite_with_role(caller: OrgRole, invited_role: OrgRole) -> bool {
    if !caller.at_least(OrgRole::OrgAdmin) {
        return false;
    }

    match invited_role {
        OrgRole::OrgMember => true,
        OrgRole::OrgAdmin => caller == OrgRole::OrgOwner,
        OrgRole::OrgOwner => false,
    }
}

pub fn can_assign_org_role(assigner: OrgRole, new_role: OrgRole) -> bool {
    match assigner {
        OrgRole::OrgOwner => matches!(new_role, OrgRole::OrgAdmin | OrgRole::OrgMember),
        OrgRole::OrgAdmin => new_role == OrgRole::OrgMember,
        OrgRole::OrgMember => false,
    }
}

pub fn can_assign_team_role(
    assigner: &EffectiveContext,
    target_is_self: bool,
    new_role: TeamRole,
) -> bool {
    if target_is_self {
        return false;
    }
    if assigner.org.role.at_least(OrgRole::OrgAdmin) {
        return true;
    }
    let Some(assigner_team) = assigner.team.as_ref() else {
        return false;
    };
    if !assigner_team.role.at_least(TeamRole::Admin) {
        return false;
    }
    if assigner_team.role == TeamRole::Admin {
        return new_role == TeamRole::Member;
    }
    new_role.at_least(TeamRole::Admin)
        && assigner_team.role.at_least(new_role)
        && new_role != TeamRole::Owner
}

pub fn resolve_project_role(
    team_membership: Option<&TeamMembership>,
    project_membership: Option<&ProjectMembership>,
) -> Option<ProjectRole> {
    effective_project_role(team_membership, project_membership)
}

pub fn has_project_permission(
    team_membership: Option<&TeamMembership>,
    project_membership: Option<&ProjectMembership>,
    required: ProjectRole,
) -> bool {
    effective_project_role(team_membership, project_membership)
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

    use crate::OrganizationId;

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

    fn org_membership(role: OrgRole) -> OrgMembership {
        OrgMembership {
            organization_id: OrganizationId::new(),
            user_id: user_id(),
            role,
            display_name: "".to_string(),
            avatar_url: None,
            joined_at: Utc::now(),
        }
    }

    fn org_ctx(role: OrgRole) -> EffectiveContext {
        EffectiveContext {
            org: org_membership(role),
            team: None,
            project: None,
        }
    }

    #[test]
    fn project_override_beats_team_role() {
        let tm = team_membership(TeamRole::Member);
        let pm = project_membership(Some(ProjectRole::Admin));
        assert_eq!(
            resolve_project_role(Some(&tm), Some(&pm)),
            Some(ProjectRole::Contributor)
        )
    }

    #[test]
    fn project_override_cannot_exceed_team_baseline() {
        let tm = team_membership(TeamRole::Member);
        let pm = project_membership(Some(ProjectRole::Admin));
        assert_eq!(
            effective_project_role(Some(&tm), Some(&pm)),
            Some(ProjectRole::Contributor)
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

    #[test]
    fn org_admin_can_invite_member_but_not_admin() {
        assert!(can_invite_with_role(OrgRole::OrgAdmin, OrgRole::OrgMember));
        assert!(!can_invite_with_role(OrgRole::OrgAdmin, OrgRole::OrgAdmin));
        assert!(!can_invite_with_role(OrgRole::OrgAdmin, OrgRole::OrgOwner));
    }

    #[test]
    fn org_owner_can_invite_admin_and_member() {
        assert!(can_invite_with_role(OrgRole::OrgOwner, OrgRole::OrgMember));
        assert!(can_invite_with_role(OrgRole::OrgOwner, OrgRole::OrgAdmin));
        assert!(!can_invite_with_role(OrgRole::OrgOwner, OrgRole::OrgOwner));
    }

    #[test]
    fn org_member_cannot_invite() {
        assert!(!can_invite_with_role(
            OrgRole::OrgMember,
            OrgRole::OrgMember
        ));
    }

    #[test]
    fn only_org_owner_can_assign_org_admin() {
        assert!(can_assign_org_role(OrgRole::OrgOwner, OrgRole::OrgAdmin));
        assert!(can_assign_org_role(OrgRole::OrgOwner, OrgRole::OrgMember));
        assert!(!can_assign_org_role(OrgRole::OrgAdmin, OrgRole::OrgAdmin));
        assert!(can_assign_org_role(OrgRole::OrgAdmin, OrgRole::OrgMember));
    }

    #[test]
    fn org_admin_can_manage_channel_members_and_edit_channel_info() {
        let ctx = org_ctx(OrgRole::OrgAdmin);
        assert!(can(&ctx, Action::ManageChannelMembers));
        assert!(can(&ctx, Action::EditChannelInfo));
    }

    #[test]
    fn org_member_cannot_manage_channel_members_or_edit_channel_info() {
        let ctx = org_ctx(OrgRole::OrgMember);
        assert!(!can(&ctx, Action::ManageChannelMembers));
        assert!(!can(&ctx, Action::EditChannelInfo));
    }
}
