import { Action } from "./actions";
import {
  type OrgRole,
  orgAtLeast,
  type ProjectRole,
  projectAtLeast,
  type TeamRole,
  teamAtLeast,
} from "./roles";

export function canOrg(role: OrgRole, action: Action): boolean {
  switch (action) {
    case Action.InviteOrgMember:
    case Action.ViewOrgDashboard:
    case Action.CreateTeam:
    case Action.CreateChannel:
    case Action.ManageChannelMembers:
    case Action.EditChannelInfo:
      return orgAtLeast(role, "ORG_ADMIN");

    case Action.ChangeOrgMemberRole:
      return role === "ORG_OWNER";

    default:
      return false;
  }
}

export function canCreateProject(
  orgRole: OrgRole | null,
  teamRoles: TeamRole[],
): boolean {
  if (orgRole && orgAtLeast(orgRole, "ORG_ADMIN")) {
    return true;
  }
  return teamRoles.some((role) => canTeam(role, Action.CreateProject));
}

export function canInviteWithRole(caller: OrgRole, invited: OrgRole): boolean {
  if (!orgAtLeast(caller, "ORG_ADMIN")) return false;
  if (invited === "ORG_MEMBER") return true;
  if (invited === "ORG_ADMIN") return caller === "ORG_OWNER";
  return false;
}

export function canTeam(role: TeamRole, action: Action): boolean {
  switch (action) {
    case Action.CreateProject:
    case Action.UpdateProject:
    case Action.DeleteProject:
    case Action.ManageProjectMembers:
    case Action.ViewProject:
      return teamAtLeast(role, "ADMIN");
    case Action.CreateTask:
    case Action.UpdateTask:
    case Action.DeleteTask:
    case Action.AssignTask:
      return teamAtLeast(role, "MEMBER");
    default:
      return false;
  }
}

export function canProject(role: ProjectRole, action: Action): boolean {
  switch (action) {
    case Action.UpdateProject:
    case Action.DeleteProject:
    case Action.ManageProjectMembers:
      return projectAtLeast(role, "ADMIN");
    case Action.CreateTask:
    case Action.DeleteTask:
    case Action.AssignTask:
    case Action.UpdateTask:
      return projectAtLeast(role, "CONTRIBUTOR");
    case Action.ViewProject:
      return projectAtLeast(role, "VIEWER");
    default:
      return false;
  }
}
