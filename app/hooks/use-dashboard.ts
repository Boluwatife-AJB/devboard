"use client";

import { type QueryClient, useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  MY_DASHBOARD_QUERY,
  ORG_DASHBOARD_QUERY,
} from "@/lib/graphql/documents";
import type { ApiMyDashboard, ApiOrgDashboard } from "@/types";

export const dashboardKeys = {
  my: ["dashboard", "my"] as const,
  org: ["dashboard", "org"] as const,
};

export function invalidateDashboardQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.my });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.org });
}

export function useMyDashboard(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.my,
    queryFn: async () => {
      const data = await graphqlRequest<{ myDashboard: ApiMyDashboard }>(
        MY_DASHBOARD_QUERY,
      );
      return data.myDashboard;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useOrgDashboard(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.org,
    queryFn: async () => {
      const data = await graphqlRequest<{ orgDashboard: ApiOrgDashboard }>(
        ORG_DASHBOARD_QUERY,
      );
      return data.orgDashboard;
    },
    enabled,
    staleTime: 60_000,
  });
}
