"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import { ME_QUERY } from "@/lib/graphql/documents";
import type { ApiUser } from "@/types";

export const meKeys = {
  current: ["me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: meKeys.current,
    queryFn: async () => {
      const data = await graphqlRequest<{ me: ApiUser }>(ME_QUERY);
      return data.me;
    },
    staleTime: 5 * 60 * 1000,
  });
}
