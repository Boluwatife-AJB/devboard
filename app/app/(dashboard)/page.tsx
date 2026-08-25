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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xs" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-xs xl:col-span-2" />
        <Skeleton className="h-64 rounded-xs" />
      </div>
      <Skeleton className="h-72 w-full rounded-xs" />
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
