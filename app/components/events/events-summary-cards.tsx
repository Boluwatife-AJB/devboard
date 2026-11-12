"use client";

import { StatsGrid } from "@/components/dashboard/shared/stats-grid";
import type { DashboardStat } from "@/types";

type EventsSummaryCardsProps = {
  stats: DashboardStat[];
};

export function EventsSummaryCards({ stats }: EventsSummaryCardsProps) {
  return <StatsGrid stats={stats} />;
}
