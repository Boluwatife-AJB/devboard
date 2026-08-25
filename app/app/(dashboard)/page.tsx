"use client";

import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { MemberDashboard } from "@/components/dashboard/member/member-dashboard";
import { DashboardGreetingSkeleton } from "@/components/dashboard/shared/dashboard-greeting";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardGreetingSkeleton />
      <Skeleton className="h-28 w-full rounded-xs" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-xs xl:col-span-2" />
        <Skeleton className="h-72 rounded-xs" />
      </div>
    </div>
  );
}

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
