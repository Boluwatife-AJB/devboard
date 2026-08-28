import { getOrganizations, getSelectedOrgId } from "@/lib/auth/cookies";

export function getGreetingPeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function getFirstName(displayName: string | undefined) {
  if (!displayName?.trim()) return "there";
  return displayName.trim().split(/\s+/)[0];
}

/** Normalize REST (`OrgAdmin`) and GraphQL (`ORG_ADMIN`) role strings. */
export function normalizeOrgRole(role: string) {
  return role.replaceAll("_", "").toUpperCase();
}

export function getSelectedOrganization() {
  if (typeof window === "undefined") return null;
  const orgId = getSelectedOrgId();
  if (!orgId) return null;
  return getOrganizations().find((org) => org.id === orgId) ?? null;
}

export function isOrgAdminOrOwner(role?: string | null) {
  if (!role) return false;
  const normalized = normalizeOrgRole(role);
  return normalized === "ORGOWNER" || normalized === "ORGADMIN";
}
