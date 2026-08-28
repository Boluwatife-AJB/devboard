"use client";

import type { Icon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardStat, StatTone } from "@/types";

const toneStyles: Record<
  StatTone,
  { well: string; value: string; label: string }
> = {
  default: {
    well: "bg-muted/60 text-muted-foreground",
    value: "text-foreground",
    label: "text-muted-foreground",
  },
  warning: {
    well: "bg-destructive/15 text-destructive",
    value: "text-destructive",
    label: "text-destructive/80",
  },
  accent: {
    well: "bg-devboard-primary/15 text-devboard-primary",
    value: "text-foreground",
    label: "text-muted-foreground",
  },
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  hint: string;
  icon: Icon;
  tone?: StatTone;
}) {
  const styles = toneStyles[tone];

  return (
    <Card className="rounded-xs py-4 hover:-translate-y-0.5 cursor-pointer transition-transform duration-200">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-xs",
              styles.well,
            )}
          >
            <Icon className="size-4" weight="duotone" />
          </div>
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              styles.label,
            )}
          >
            {label}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p
            className={cn(
              "font-heading text-3xl font-semibold tracking-tight tabular-nums",
              styles.value,
            )}
          >
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type StatsGridProps = {
  stats: DashboardStat[];
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4",
        stats.length <= 3 && "md:grid-cols-3 xl:grid-cols-3",
        stats.length === 4 && "md:grid-cols-2 xl:grid-cols-4",
        stats.length === 5 && "md:grid-cols-3 xl:grid-cols-5",
        stats.length >= 6 && "md:grid-cols-3 xl:grid-cols-6",
      )}
    >
      {stats.map((stat) => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </div>
  );
}
