import type { ApiOrgMember } from "@/types";

export function orgMemberDisplayName(
  member: Pick<ApiOrgMember, "displayName" | "userId"> & {
    user?: { email?: string } | null;
  },
): string {
  if (member.displayName.trim()) return member.displayName;
  if (member.user?.email)
    return member.user.email.split("@")[0] ?? member.userId;
  return member.userId.slice(0, 8);
}

export function orgMemberAvatarUrl(
  member: Pick<ApiOrgMember, "avatarUrl">,
): string | null {
  return member.avatarUrl?.trim() || null;
}
