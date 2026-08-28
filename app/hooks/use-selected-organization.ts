"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/hooks/use-me";
import {
  getSelectedOrganization,
  isOrgAdminOrOwner,
} from "@/lib/dashboard-utils";
import type { AuthOrganization } from "@/types";

/**
 * Reads the selected org from cookies/localStorage after mount.
 * Re-syncs when `useMe` refetches (org switcher clears the query cache).
 */
export function useSelectedOrganization() {
  const { dataUpdatedAt } = useMe();
  const [organization, setOrganization] = useState<AuthOrganization | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  // dataUpdatedAt is intentional: org switch clears the cache and bumps this.
  // biome-ignore lint/correctness/useExhaustiveDependencies: sync on me refetch
  useEffect(() => {
    setOrganization(getSelectedOrganization());
    setReady(true);
  }, [dataUpdatedAt]);

  return {
    organization,
    ready,
    isAdmin: isOrgAdminOrOwner(organization?.role),
  };
}
