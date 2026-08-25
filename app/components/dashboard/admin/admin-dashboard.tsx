"use client";

import { AdminQuickActionsCard } from "@/components/dashboard/admin/admin-quick-actions-card";
import { AttentionRequiredCard } from "@/components/dashboard/admin/attention-required-card";
import { RiskDeadlinesCard } from "@/components/dashboard/admin/risk-deadlines-card";
import { WorkloadAreaChart } from "@/components/dashboard/admin/workload-area-chart";
import { DashboardGreeting } from "@/components/dashboard/shared/dashboard-greeting";
import { StatsGrid } from "@/components/dashboard/shared/stats-grid";
import {
  adminQuickActions,
  adminStats,
  attentionItems,
  riskTasks,
  workloadData,
} from "@/constant";

type AdminDashboardProps = {
  displayName?: string;
  organizationName?: string;
};

export function AdminDashboard({
  displayName,
  organizationName,
}: AdminDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      <DashboardGreeting
        displayName={displayName}
        organizationName={organizationName}
        subtitle="Organization overview"
      />

      <StatsGrid stats={adminStats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <AttentionRequiredCard items={attentionItems} />
        </div>
        <div className="xl:col-span-2">
          <RiskDeadlinesCard tasks={riskTasks} />
        </div>
      </div>

      <WorkloadAreaChart data={workloadData} />

      <AdminQuickActionsCard actions={adminQuickActions} />
    </div>
  );
}
