"use client";

import { CompletionTrendChart } from "@/components/dashboard/member/completion-trend-chart";
import { MemberQuickActionsCard } from "@/components/dashboard/member/member-quick-actions-card";
import { MyProjectsCard } from "@/components/dashboard/member/my-projects-card";
import { MyTasksCard } from "@/components/dashboard/member/my-tasks-card";
import { UpcomingEventsCard } from "@/components/dashboard/member/upcoming-events-card";
import { DashboardGreeting } from "@/components/dashboard/shared/dashboard-greeting";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardSkeleton,
  shouldShowDashboardEmpty,
} from "@/components/dashboard/shared/dashboard-states";
import { StatsGrid } from "@/components/dashboard/shared/stats-grid";
import { memberQuickActions } from "@/constant";
import { useMyDashboard } from "@/hooks/use-dashboard";
import {
  mapCompletionTrend,
  mapMemberProjects,
  mapMemberStats,
  mapMyTasks,
} from "@/lib/dashboard/dashboard-mappers";

type MemberDashboardProps = {
  displayName?: string;
  organizationName?: string;
};

export function MemberDashboard({
  displayName,
  organizationName,
}: MemberDashboardProps) {
  const { data, isPending, isError, error, refetch } = useMyDashboard();

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
        title="Could not load your dashboard"
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
      subtitle="Your work today"
    />
  );

  if (shouldShowDashboardEmpty(data.emptyState)) {
    return (
      <div className="flex flex-col gap-8">
        {greeting}
        <DashboardEmptyState emptyState={data.emptyState} />
      </div>
    );
  }

  const stats = mapMemberStats(data);
  const tasks = mapMyTasks(data.myTasks);
  const projects = mapMemberProjects(data.myProjects);
  const trend = mapCompletionTrend(data.completionTrend);

  return (
    <div className="flex flex-col gap-8">
      {greeting}

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MyTasksCard tasks={tasks} />
        </div>
        <div className="flex flex-col gap-6">
          <MemberQuickActionsCard actions={memberQuickActions} />
          <UpcomingEventsCard events={[]} />
        </div>
      </div>

      <MyProjectsCard projects={projects} />

      <CompletionTrendChart data={trend} />
    </div>
  );
}
