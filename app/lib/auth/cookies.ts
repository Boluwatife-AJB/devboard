import Cookies from "js-cookie";
import type { AuthOrganization } from "@/types";
import { parseOrgRole } from "../rbac/roles";

export const ACCESS_TOKEN_COOKIE = "devboard_access_token";
export const ORG_ID_COOKIE = "devboard_org_id";
export const ORG_ROLE_COOKIE = "devboard_org_role";
export const ORGS_COOKIE = "devboard_organizations_cookie";
export const ORGS_STORAGE_KEY = "devboard_organizations";

type OrgCookieEntry = Pick<AuthOrganization, "id" | "role">;

function writeOrgsCookie(orgs: AuthOrganization[]) {
  const compact: OrgCookieEntry[] = orgs.map(({ id, role }) => ({ id, role }));
  Cookies.set(ORGS_COOKIE, JSON.stringify(compact), {
    sameSite: "lax",
    expires: 5,
  });
}

export function setAccessToken(token: string) {
  Cookies.set(ACCESS_TOKEN_COOKIE, token, {
    expires: 5,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function getAccessToken() {
  return Cookies.get(ACCESS_TOKEN_COOKIE);
}

export function setSelectedOrgId(orgId: string) {
  Cookies.set(ORG_ID_COOKIE, orgId, { sameSite: "lax" });
  syncOrgRoleCookie();
}

export function getSelectedOrgId() {
  return Cookies.get(ORG_ID_COOKIE);
}

export function setOrganizations(orgs: AuthOrganization[]) {
  localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(orgs));
  writeOrgsCookie(orgs);
  syncOrgRoleCookie();
}

export function getOrganizations(): AuthOrganization[] {
  const raw = localStorage.getItem(ORGS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function syncOrgRoleCookie() {
  const orgId = getSelectedOrgId();
  if (!orgId) {
    Cookies.remove(ORG_ROLE_COOKIE);
    return;
  }

  const org = getOrganizations().find((item) => item.id === orgId);
  const role = parseOrgRole(org?.role);
  if (role) {
    Cookies.set(ORG_ROLE_COOKIE, role, { sameSite: "lax" });
  } else {
    Cookies.remove(ORG_ROLE_COOKIE);
  }
}

/** Keeps auth cookies aligned with localStorage after login or org switch. */
export function syncSelectedOrgContext() {
  const orgs = getOrganizations();
  if (orgs.length > 0) {
    writeOrgsCookie(orgs);
  }
  syncOrgRoleCookie();
}

export function clearAuth() {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  Cookies.remove(ORG_ID_COOKIE);
  Cookies.remove(ORG_ROLE_COOKIE);
  Cookies.remove(ORGS_COOKIE);
  localStorage.removeItem(ORGS_STORAGE_KEY);
}
