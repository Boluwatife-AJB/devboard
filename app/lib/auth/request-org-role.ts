import type { NextRequest } from "next/server";
import {
  ORG_ID_COOKIE,
  ORG_ROLE_COOKIE,
  ORGS_COOKIE,
} from "@/lib/auth/cookies";
import { parseOrgRole } from "@/lib/rbac/roles";

type OrgCookieEntry = {
  id: string;
  role: string;
};

export function getRequestOrgRole(request: NextRequest): string | undefined {
  const explicitRole = request.cookies.get(ORG_ROLE_COOKIE)?.value;
  if (explicitRole) {
    return parseOrgRole(explicitRole) ?? explicitRole;
  }

  const orgId = request.cookies.get(ORG_ID_COOKIE)?.value;
  const orgsRaw = request.cookies.get(ORGS_COOKIE)?.value;
  if (!orgId || !orgsRaw) {
    return undefined;
  }

  try {
    const orgs = JSON.parse(orgsRaw) as OrgCookieEntry[];
    return orgs.find((org) => org.id === orgId)?.role;
  } catch {
    return undefined;
  }
}
