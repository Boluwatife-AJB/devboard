"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateDashboardQueries } from "@/hooks/use-dashboard";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  ADD_TEAM_MEMBER_MUTATION,
  CREATE_TEAM_MUTATION,
  ORG_MEMBERS_QUERY,
  REMOVE_TEAM_MEMBER_MUTATION,
  TEAM_MEMBERS_QUERY,
  TEAMS_QUERY,
} from "@/lib/graphql/documents";
import type {
  AddTeamMemberInput,
  ApiOrgMember,
  ApiTeam,
  ApiTeamMember,
} from "@/types";

const MEMBERS_TABLE_REFETCH_MS = 3 * 60 * 1000;

export const teamKeys = {
  all: ["teams"] as const,
  members: (teamId: string) => ["teams", teamId, "members"] as const,
  orgMembers: ["org-members"] as const,
};

export function useTeams() {
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: async () => {
      const data = await graphqlRequest<{ teams: ApiTeam[] }>(TEAMS_QUERY);
      return data.teams;
    },
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: teamKeys.members(teamId),
    queryFn: async () => {
      const data = await graphqlRequest<{ teamMembers: ApiTeamMember[] }>(
        TEAM_MEMBERS_QUERY,
        { teamId },
      );
      return data.teamMembers;
    },
    enabled: Boolean(teamId),
  });
}

type OrgMembersQueryOptions = {
  refetchInterval?: number;
};

export function useOrgMembers(options?: OrgMembersQueryOptions) {
  return useQuery({
    queryKey: teamKeys.orgMembers,
    queryFn: async () => {
      const data = await graphqlRequest<{ orgMembers: ApiOrgMember[] }>(
        ORG_MEMBERS_QUERY,
      );
      return data.orgMembers;
    },
    refetchInterval: options?.refetchInterval,
  });
}

export { MEMBERS_TABLE_REFETCH_MS };

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const data = await graphqlRequest<{ createTeam: ApiTeam }>(
        CREATE_TEAM_MUTATION,
        { input },
      );
      return data.createTeam;
    },
    onSuccess: (team) => {
      queryClient.setQueryData<ApiTeam[]>(teamKeys.all, (teams) =>
        teams ? [...teams, team] : [team],
      );
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useAddTeamMember(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<AddTeamMemberInput, "teamId">) => {
      const data = await graphqlRequest<{ addTeamMember: boolean }>(
        ADD_TEAM_MEMBER_MUTATION,
        { input: { ...input, teamId } },
      );
      return data.addTeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
    },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await graphqlRequest<{ removeTeamMember: boolean }>(
        REMOVE_TEAM_MEMBER_MUTATION,
        { teamId, userId },
      );
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.setQueryData<ApiTeamMember[]>(
        teamKeys.members(teamId),
        (members) => members?.filter((member) => member.userId !== userId),
      );
    },
  });
}
