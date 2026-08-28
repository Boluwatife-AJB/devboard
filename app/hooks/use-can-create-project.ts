"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMe } from "@/hooks/use-me";
import { useOrgAuthz } from "@/hooks/use-org-authz";
import { teamKeys, useTeams } from "@/hooks/use-teams";
import { graphqlRequest } from "@/lib/graphql/client";
import { TEAM_MEMBERS_QUERY } from "@/lib/graphql/documents";
import { canCreateProject } from "@/lib/rbac/policy";
import { orgAtLeast } from "@/lib/rbac/roles";
import type { ApiTeamMember, TeamRole } from "@/types";

export function useCanCreateProject() {
  const { data: me } = useMe();
  const { role, ready: orgReady } = useOrgAuthz();
  const { data: teams, isPending: teamsPending } = useTeams();

  const isOrgAdmin = role !== null && orgAtLeast(role, "ORG_ADMIN");

  const membershipQueries = useQueries({
    queries: (teams ?? []).map((team) => ({
      queryKey: teamKeys.members(team.id),
      queryFn: async () => {
        const data = await graphqlRequest<{ teamMembers: ApiTeamMember[] }>(
          TEAM_MEMBERS_QUERY,
          { teamId: team.id },
        );
        return data.teamMembers;
      },
      enabled: Boolean(me?.id && orgReady && !isOrgAdmin && teams?.length),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const teamRoles = useMemo((): TeamRole[] => {
    if (!me?.id || isOrgAdmin) {
      return [];
    }

    const roles: TeamRole[] = [];
    for (const query of membershipQueries) {
      const membership = query.data?.find((member) => member.userId === me.id);
      if (membership) {
        roles.push(membership.role);
      }
    }
    return roles;
  }, [isOrgAdmin, me?.id, membershipQueries]);

  const membershipsReady =
    isOrgAdmin ||
    !teams?.length ||
    membershipQueries.every((query) => query.isFetched);

  const canCreate = useMemo(() => {
    if (!orgReady || !membershipsReady) {
      return false;
    }
    return canCreateProject(role, teamRoles);
  }, [orgReady, membershipsReady, role, teamRoles]);

  return {
    canCreate,
    ready: orgReady && !teamsPending && membershipsReady,
  };
}
