"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAccessToken,
  getOrganizations,
  getSelectedOrgId,
  resolveInitialOrgId,
  setOrganizations,
  setSelectedOrgId,
} from "@/lib/auth/cookies";
import { isOrgAdminOrOwner } from "@/lib/dashboard-utils";
import { graphqlRequest } from "@/lib/graphql/client";
import { MY_ORGANIZATIONS_QUERY } from "@/lib/graphql/documents";
import { resetWsClient } from "@/lib/graphql/ws";
import type { AuthOrganization } from "@/types";

export const orgKeys = {
  organizations: ["my-organizations"] as const,
  profile: ["my-org-profile"] as const,
};

type OrgContextValue = {
  organizations: AuthOrganization[];
  organization: AuthOrganization | null;
  ready: boolean;
  isAdmin: boolean;
  wsGeneration: number;
  switchOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [organizations, setOrganizationsState] = useState<AuthOrganization[]>(
    [],
  );
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [wsGeneration, setWsGeneration] = useState(0);

  const { data: fetchedOrganizations, isSuccess } = useQuery({
    queryKey: orgKeys.organizations,
    queryFn: async () => {
      const data = await graphqlRequest<{
        myOrganizations: AuthOrganization[];
      }>(MY_ORGANIZATIONS_QUERY);
      return data.myOrganizations;
    },
    enabled: Boolean(getAccessToken()),
    staleTime: 60_000,
  });

  const applyOrganizations = useCallback((orgs: AuthOrganization[]) => {
    setOrganizations(orgs);
    setOrganizationsState(orgs);

    const nextOrgId = resolveInitialOrgId(orgs);
    if (nextOrgId) {
      setSelectedOrgId(nextOrgId);
      setSelectedOrgIdState(nextOrgId);
    } else {
      setSelectedOrgIdState(null);
    }
  }, []);

  useEffect(() => {
    if (!isSuccess || !fetchedOrganizations) return;
    applyOrganizations(fetchedOrganizations);
    setReady(true);
  }, [isSuccess, fetchedOrganizations, applyOrganizations]);

  useEffect(() => {
    if (isSuccess) return;
    const cached = getOrganizations();
    if (cached.length === 0) return;

    setOrganizationsState(cached);
    setSelectedOrgIdState(getSelectedOrgId() ?? resolveInitialOrgId(cached));
    setReady(true);
  }, [isSuccess]);

  const organization = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  const switchOrganization = useCallback(
    (orgId: string) => {
      if (orgId === selectedOrgId) return;

      setSelectedOrgId(orgId);
      setSelectedOrgIdState(orgId);
      resetWsClient();
      setWsGeneration((value) => value + 1);
      queryClient.clear();
      router.push("/");
    },
    [queryClient, router, selectedOrgId],
  );

  const refreshOrganizations = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: orgKeys.organizations });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      organizations,
      organization,
      ready,
      isAdmin: isOrgAdminOrOwner(organization?.role),
      wsGeneration,
      switchOrganization,
      refreshOrganizations,
    }),
    [
      organizations,
      organization,
      ready,
      wsGeneration,
      switchOrganization,
      refreshOrganizations,
    ],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within OrgProvider");
  }
  return context;
}
