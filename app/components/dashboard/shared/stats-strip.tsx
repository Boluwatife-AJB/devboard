"use client";

import type { Icon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

function StatItem({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: number;
  hint: string;
  icon: Icon;
  tone?: StatTone;
  className?: string;
}) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 px-4 py-1 first:pl-0 last:pr-0",
        className,
      )}
    >
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
    </div>
  );
}

type StatsStripProps = {
  stats: DashboardStat[];
};

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <Card className="rounded-xs py-4">
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="rounded-xs bg-muted/20 p-3 ring-1 ring-foreground/5"
            >
              <StatItem {...stat} className="px-0" />
            </div>
          ))}
        </div>

        <div className="hidden md:flex md:items-stretch">
          {stats.map((stat, index) => (
            <div key={stat.id} className="flex min-w-0 flex-1 items-stretch">
              {index > 0 && (
                <Separator orientation="vertical" className="mx-1 h-auto" />
              )}
              <StatItem {...stat} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
