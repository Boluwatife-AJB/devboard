"use client";

import { useOrg } from "@/context/org-context";

export function useSelectedOrganization() {
  const { organization, ready, isAdmin } = useOrg();
  return { organization, ready, isAdmin };
}
