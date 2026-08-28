"use client";

import { useCallback, useMemo } from "react";
import type { Action } from "@/lib/rbac/actions";
import { canInviteWithRole, canOrg } from "@/lib/rbac/policy";
import { type OrgRole, parseOrgRole } from "@/lib/rbac/roles";
import { useSelectedOrganization } from "./use-selected-organization";

export function useOrgAuthz() {
  const { organization, ready } = useSelectedOrganization();
  const role = useMemo(
    () => parseOrgRole(organization?.role),
    [organization?.role],
  );

  const can = useCallback(
    (action: Action) => (role ? canOrg(role, action) : false),
    [role],
  );

  const canInviteRole = useCallback(
    (invitedRole: OrgRole) =>
      role ? canInviteWithRole(role, invitedRole) : false,
    [role],
  );

  return { ready, role, can, canInviteRole };
}
