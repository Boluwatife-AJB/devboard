"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { privateApi, publicApi } from "@/lib/api";
import {
  getAccessToken,
  getOrganizations,
  getSelectedOrgId,
  setAccessToken,
  setOrganizations,
  setSelectedOrgId,
} from "@/lib/auth/cookies";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  PENDING_INVITATIONS_QUERY,
  REVOKE_INVITATION_MUTATION,
} from "@/lib/graphql/documents";
import type {
  AcceptInviteResponse,
  AcceptInviteSignupFormData,
  ApiInvitation,
  AuthResponse,
  CreateInviteResponse,
  InviteMemberFormData,
  InvitePreview,
} from "@/types";

export const invitationKeys = {
  pending: ["pending-invitations"] as const,
  preview: (token: string) => ["invite-preview", token] as const,
};

/**
 * Whether the current user can manage invitations in the selected org.
 * The backend enforces this regardless; this only gates UI/queries.
 */
export function canManageInvitations(): boolean {
  if (typeof window === "undefined") return false;
  const orgId = getSelectedOrgId();
  if (!orgId) return false;
  const org = getOrganizations().find((item) => item.id === orgId);
  if (!org) return false;
  // Role may be serialized as "OrgAdmin" (REST) or "ORG_ADMIN" (GraphQL).
  const role = org.role.replaceAll("_", "").toUpperCase();
  return role === "ORGOWNER" || role === "ORGADMIN";
}

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return Boolean(getAccessToken());
}

function applyAcceptedOrganization(org: AcceptInviteResponse["organization"]) {
  const existing = getOrganizations();
  const next = existing.some((item) => item.id === org.id)
    ? existing.map((item) => (item.id === org.id ? { ...item, ...org } : item))
    : [...existing, org];
  setOrganizations(next);
  setSelectedOrgId(org.id);
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteMemberFormData) => {
      const { data } = await privateApi.post<CreateInviteResponse>(
        "/auth/invite",
        {
          email: input.email,
          role: input.role,
          org_id: getSelectedOrgId(),
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.pending });
    },
  });
}

export function usePendingInvitations(enabled = true) {
  return useQuery({
    queryKey: invitationKeys.pending,
    queryFn: async () => {
      const data = await graphqlRequest<{
        pendingInvitations: ApiInvitation[];
      }>(PENDING_INVITATIONS_QUERY);
      return data.pendingInvitations;
    },
    enabled,
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      await graphqlRequest<{ revokeInvitation: boolean }>(
        REVOKE_INVITATION_MUTATION,
        { invitationId },
      );
      return invitationId;
    },
    onSuccess: (invitationId) => {
      queryClient.setQueryData<ApiInvitation[]>(
        invitationKeys.pending,
        (invitations) =>
          invitations?.filter((invitation) => invitation.id !== invitationId),
      );
    },
  });
}

/** Public preview of a pending invite (locks email for signup). */
export function useInvitePreview(token: string, enabled = true) {
  return useQuery({
    queryKey: invitationKeys.preview(token),
    queryFn: async () => {
      const { data } = await publicApi.get<InvitePreview>(
        "/auth/invite/preview",
        {
          params: { token },
        },
      );
      return data;
    },
    enabled: enabled && Boolean(token),
    retry: false,
  });
}

/** Accept an invite while already authenticated. */
export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await privateApi.post<AcceptInviteResponse>(
        "/auth/accept-invite",
        { token },
      );
      return data;
    },
    onSuccess: (data) => {
      applyAcceptedOrganization(data.organization);
    },
  });
}

/** Register a new account and accept the invite in one request. */
export function useRegisterWithInvite(token: string) {
  return useMutation({
    mutationFn: async ({
      form,
      email,
    }: {
      form: AcceptInviteSignupFormData;
      email: string;
    }) => {
      const { data } = await publicApi.post<AuthResponse>("/auth/register", {
        email,
        display_name: form.fullName,
        password: form.password,
        invite_token: token,
      });
      return data;
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token);
      setOrganizations(data.organizations);
      if (data.organizations.length > 0) {
        setSelectedOrgId(data.organizations[0].id);
      }
    },
  });
}
