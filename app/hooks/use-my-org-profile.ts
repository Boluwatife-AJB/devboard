"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgKeys } from "@/context/org-context";
import { teamKeys } from "@/hooks/use-teams";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  MY_ORG_PROFILE_QUERY,
  UPDATE_ORG_PROFILE_MUTATION,
} from "@/lib/graphql/documents";
import type { ApiOrgMemberProfile } from "@/types";

type UpdateOrgProfileInput = {
  displayName: string;
  avatarUrl?: string | null;
};

export function useMyOrgProfile() {
  return useQuery({
    queryKey: orgKeys.profile,
    queryFn: async () => {
      const data = await graphqlRequest<{ myOrgProfile: ApiOrgMemberProfile }>(
        MY_ORG_PROFILE_QUERY,
      );
      return data.myOrgProfile;
    },
  });
}

export function useUpdateOrgProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrgProfileInput) => {
      const data = await graphqlRequest<{
        updateOrgProfile: ApiOrgMemberProfile;
      }>(UPDATE_ORG_PROFILE_MUTATION, { input });
      return data.updateOrgProfile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(orgKeys.profile, profile);
      queryClient.invalidateQueries({ queryKey: teamKeys.orgMembers });
    },
  });
}
