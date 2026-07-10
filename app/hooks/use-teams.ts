"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

/** Organization member directory, used to pick users to add to a team. */
export function useOrgMembers() {
  return useQuery({
    queryKey: teamKeys.orgMembers,
    queryFn: async () => {
      const data = await graphqlRequest<{ orgMembers: ApiOrgMember[] }>(
        ORG_MEMBERS_QUERY,
      );
      return data.orgMembers;
    },
  });
}

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
    },
  });
}

export function useAddTeamMember(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<AddTeamMemberInput, "teamId">) => {
      const data = await graphqlRequest<{ addTeamMember: ApiTeamMember }>(
        ADD_TEAM_MEMBER_MUTATION,
        { input: { ...input, teamId } },
      );
      return data.addTeamMember;
    },
    onSuccess: (member) => {
      queryClient.setQueryData<ApiTeamMember[]>(
        teamKeys.members(teamId),
        (members) => (members ? [...members, member] : [member]),
      );
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
        { input: { teamId, userId } },
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
