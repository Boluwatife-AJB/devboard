export type OrgRole = "ORG_OWNER" | "ORG_ADMIN" | "ORG_MEMBER";
export type TeamRole = "OWNER" | "ADMIN" | "MEMBER";
export type ProjectRole = "OWNER" | "ADMIN" | "CONTRIBUTOR" | "VIEWER";

const ORG_RANK: Record<OrgRole, number> = {
  ORG_OWNER: 2,
  ORG_ADMIN: 1,
  ORG_MEMBER: 0,
};

const TEAM_RANK: Record<TeamRole, number> = {
  OWNER: 2,
  ADMIN: 1,
  MEMBER: 0,
};

const PROJECT_RANK: Record<ProjectRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  CONTRIBUTOR: 1,
  VIEWER: 0,
};

export function parseOrgRole(raw?: string | null): OrgRole | null {
  if (!raw) return null;
  const normalized = raw.replaceAll("_", "").toUpperCase();
  if (normalized === "ORGOWNER") return "ORG_OWNER";
  if (normalized === "ORGADMIN") return "ORG_ADMIN";
  if (normalized === "ORGMEMBER") return "ORG_MEMBER";
  return null;
}

export function orgAtLeast(orgRole: OrgRole, targetRole: OrgRole) {
  return ORG_RANK[orgRole] >= ORG_RANK[targetRole];
}

export function teamAtLeast(teamRole: TeamRole, targetRole: TeamRole) {
  return TEAM_RANK[teamRole] >= TEAM_RANK[targetRole];
}

export function projectAtLeast(
  projectRole: ProjectRole,
  targetRole: ProjectRole,
) {
  return PROJECT_RANK[projectRole] >= PROJECT_RANK[targetRole];
}
