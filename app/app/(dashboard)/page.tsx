"use client";

import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { MemberDashboard } from "@/components/dashboard/member/member-dashboard";
import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-states";
import { useMe } from "@/hooks/use-me";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";

export default function DashboardPage() {
  const { data: me, isPending: mePending } = useMe();
  const { organization, ready, isAdmin } = useSelectedOrganization();

  if (!ready || mePending) {
    return <DashboardSkeleton />;
  }

  const shared = {
    displayName: me?.displayName,
    organizationName: organization?.name,
  };

  if (isAdmin) {
    return <AdminDashboard {...shared} />;
  }

  return <MemberDashboard {...shared} />;
}
