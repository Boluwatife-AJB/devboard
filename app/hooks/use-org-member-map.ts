"use client";

import { useMemo } from "react";
import { orgMemberAvatarUrl, orgMemberDisplayName } from "@/lib/org-members";
import type { ApiOrgMember } from "@/types";
import { useMyOrgProfile } from "./use-my-org-profile";
import { useOrgMembers } from "./use-teams";

export type OrgMemberView = {
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
};

export function useOrgMemberMap() {
  const { data: members = [] } = useOrgMembers();
  const { data: profile } = useMyOrgProfile();

  return useMemo(() => {
    const map = new Map<string, OrgMemberView>();

    for (const member of members) {
      map.set(member.userId, toMemberView(member));
    }

    if (profile) {
      map.set(profile.userId, {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        email: profile.email,
      });
    }

    return map;
  }, [members, profile]);
}

export function memberDisplayName(
  map: Map<string, OrgMemberView>,
  userId: string,
): string {
  return map.get(userId)?.displayName ?? "Unknown user";
}

export function memberAvatarUrl(
  map: Map<string, OrgMemberView>,
  userId: string,
): string | null {
  return map.get(userId)?.avatarUrl ?? null;
}

function toMemberView(member: ApiOrgMember): OrgMemberView {
  return {
    displayName: orgMemberDisplayName(member),
    avatarUrl: orgMemberAvatarUrl(member),
    email: member.user?.email ?? null,
  };
}
