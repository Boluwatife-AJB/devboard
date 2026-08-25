"use client";

import { CompletionTrendChart } from "@/components/dashboard/member/completion-trend-chart";
import { MemberQuickActionsCard } from "@/components/dashboard/member/member-quick-actions-card";
import { MyProjectsCard } from "@/components/dashboard/member/my-projects-card";
import { MyTasksCard } from "@/components/dashboard/member/my-tasks-card";
import { UpcomingEventsCard } from "@/components/dashboard/member/upcoming-events-card";
import { DashboardGreeting } from "@/components/dashboard/shared/dashboard-greeting";
import { StatsGrid } from "@/components/dashboard/shared/stats-grid";
import {
  completionTrend,
  memberProjects,
  memberQuickActions,
  memberStats,
  memberTasks,
  upcomingEvents,
} from "@/constant";

type MemberDashboardProps = {
  displayName?: string;
  organizationName?: string;
};

export function MemberDashboard({
  displayName,
  organizationName,
}: MemberDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      <DashboardGreeting
        displayName={displayName}
        organizationName={organizationName}
        subtitle="Your work today"
      />

      <StatsGrid stats={memberStats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MyTasksCard tasks={memberTasks} />
        </div>
        <div className="flex flex-col gap-6">
          <MemberQuickActionsCard actions={memberQuickActions} />
          <UpcomingEventsCard events={upcomingEvents} />
        </div>
      </div>

      <MyProjectsCard projects={memberProjects} />

      <CompletionTrendChart data={completionTrend} />
    </div>
  );
}
