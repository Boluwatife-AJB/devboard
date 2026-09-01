"use client";

import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { MemberDashboard } from "@/components/dashboard/member/member-dashboard";
import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-states";
import { useMyOrgProfile } from "@/hooks/use-my-org-profile";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";

export default function DashboardPage() {
  const { data: profile, isPending: profilePending } = useMyOrgProfile();
  const { organization, ready, isAdmin } = useSelectedOrganization();

  if (!ready || profilePending) {
    return <DashboardSkeleton />;
  }

  const shared = {
    displayName: profile?.displayName,
    organizationName: organization?.name,
  };

  if (isAdmin) {
    return <AdminDashboard {...shared} />;
  }

  return <MemberDashboard {...shared} />;
}
