"use client";

import { AdminQuickActionsCard } from "@/components/dashboard/admin/admin-quick-actions-card";
import { AttentionRequiredCard } from "@/components/dashboard/admin/attention-required-card";
import { RiskDeadlinesCard } from "@/components/dashboard/admin/risk-deadlines-card";
import { WorkloadAreaChart } from "@/components/dashboard/admin/workload-area-chart";
import { DashboardGreeting } from "@/components/dashboard/shared/dashboard-greeting";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardSkeleton,
  shouldShowDashboardEmpty,
} from "@/components/dashboard/shared/dashboard-states";
import { StatsGrid } from "@/components/dashboard/shared/stats-grid";
import { adminQuickActions } from "@/constant";
import { useOrgDashboard } from "@/hooks/use-dashboard";
import {
  mapAdminStats,
  mapAttention,
  mapRiskTasks,
} from "@/lib/dashboard/dashboard-mappers";

type AdminDashboardProps = {
  displayName?: string;
  organizationName?: string;
};

export function AdminDashboard({
  displayName,
  organizationName,
}: AdminDashboardProps) {
  const { data, isPending, isError, error, refetch } = useOrgDashboard();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <DashboardErrorState
        error={error}
        onRetry={() => {
          void refetch();
        }}
        title="Could not load organization dashboard"
      />
    );
  }

  if (!data) {
    return null;
  }

  const greeting = (
    <DashboardGreeting
      displayName={data.greetingName || displayName}
      organizationName={data.organizationName || organizationName}
      subtitle="Organization overview"
    />
  );

  if (shouldShowDashboardEmpty(data.emptyState)) {
    return (
      <div className="flex flex-col gap-8">
        {greeting}
        <DashboardEmptyState emptyState={data.emptyState} canCreateProject />
      </div>
    );
  }

  const stats = mapAdminStats(data);
  const attention = mapAttention(data.attention);
  const riskTasks = mapRiskTasks(data.riskTasks);

  return (
    <div className="flex flex-col gap-8">
      {greeting}

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <AttentionRequiredCard items={attention} />
        </div>
        <div className="xl:col-span-2">
          <RiskDeadlinesCard tasks={riskTasks} />
        </div>
      </div>

      <WorkloadAreaChart data={data.workloadByTeam} />

      <AdminQuickActionsCard actions={adminQuickActions} />
    </div>
  );
}
