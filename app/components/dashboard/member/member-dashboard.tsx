"use client";

import { CompletionTrendChart } from "@/components/dashboard/member/completion-trend-chart";
import { MemberQuickActionsCard } from "@/components/dashboard/member/member-quick-actions-card";
import { MyProjectsCard } from "@/components/dashboard/member/my-projects-card";
import { MyTasksCard } from "@/components/dashboard/member/my-tasks-card";
import { UpcomingEventsCard } from "@/components/dashboard/member/upcoming-events-card";
import { DashboardGreeting } from "@/components/dashboard/shared/dashboard-greeting";
import { StatsStrip } from "@/components/dashboard/shared/stats-strip";
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

      <StatsStrip stats={memberStats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <MyTasksCard tasks={memberTasks} />
          <MyProjectsCard projects={memberProjects} />
        </div>
        <div className="flex flex-col gap-6">
          <MemberQuickActionsCard actions={memberQuickActions} />
          <UpcomingEventsCard events={upcomingEvents} />
          <CompletionTrendChart data={completionTrend} />
        </div>
      </div>
    </div>
  );
}
