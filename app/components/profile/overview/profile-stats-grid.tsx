"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProfileStat, ProfileStatTone } from "@/types";

const toneStyles: Record<ProfileStatTone, { well: string; value: string }> = {
  default: {
    well: "bg-muted/60 text-muted-foreground",
    value: "text-foreground",
  },
  warning: {
    well: "bg-accent/15 text-accent",
    value: "text-foreground",
  },
  accent: {
    well: "bg-devboard-primary/15 text-devboard-primary",
    value: "text-foreground",
  },
};

type ProfileStatsGridProps = {
  stats: ProfileStat[];
};

export function ProfileStatsGrid({ stats }: ProfileStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const styles = toneStyles[stat.tone ?? "default"];

        return (
          <Card key={stat.id} className="rounded-xs py-4">
            <CardContent className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xs",
                  styles.well,
                )}
              >
                <Icon className="size-4" weight="duotone" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    "font-heading text-2xl font-semibold tabular-nums tracking-tight",
                    styles.value,
                  )}
                >
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
