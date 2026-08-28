import { Action } from "./actions";
import { canOrg } from "./policy";
import { parseOrgRole } from "./roles";

export const PROTECTED_ROUTE_ACTIONS: Array<{
  pattern: RegExp;
  action: Action;
}> = [
  {
    pattern: /^\/settings(?:\/|$)/,
    action: Action.InviteOrgMember,
  },
];

export function canAccessRoute(
  orgRoleRaw: string | undefined,
  pathname: string,
): boolean {
  for (const { pattern, action } of PROTECTED_ROUTE_ACTIONS) {
    if (!pattern.test(pathname)) {
      continue;
    }

    const role = parseOrgRole(orgRoleRaw);
    return role !== null && canOrg(role, action);
  }

  return true;
}
