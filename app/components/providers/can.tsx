"use client";

import type { ReactNode } from "react";
import { useOrgAuthz } from "@/hooks/use-org-authz";
import type { Action } from "@/lib/rbac/actions";

type CanProps = {
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({ action, children, fallback = null }: CanProps) {
  const { can, ready } = useOrgAuthz();
  if (!ready) return null;
  return can(action) ? children : fallback;
}
