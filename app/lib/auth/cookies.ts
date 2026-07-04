import Cookies from "js-cookie";
import type { AuthOrganization } from "@/types";

const ACCESS_TOKEN = "devboard_access_token";
const ORG_ID = "devboard_org_id";
const ORGS = "devboard_organizations";

export function setAccessToken(token: string) {
  Cookies.set(ACCESS_TOKEN, token, {
    expires: 5 * 24 * 60 * 60, // 5 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function getAccessToken() {
  return Cookies.get(ACCESS_TOKEN);
}

export function setSelectedOrgId(orgId: string) {
  Cookies.set(ORG_ID, orgId, { sameSite: "lax" });
}

export function getSelectedOrgId() {
  return Cookies.get(ORG_ID);
}

export function setOrganizations(orgs: AuthOrganization[]) {
  localStorage.setItem(ORGS, JSON.stringify(orgs));
}
export function getOrganizations(): AuthOrganization[] {
  const raw = localStorage.getItem(ORGS);
  return raw ? JSON.parse(raw) : [];
}

export function clearAuth() {
  Cookies.remove(ACCESS_TOKEN);
  Cookies.remove(ORG_ID);
  localStorage.removeItem(ORGS);
}
