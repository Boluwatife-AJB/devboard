"use client";

import type { ApiEventOccurrence, ApiProject, ApiTeam } from "@/types";
import { EventCard } from "./event-card";

type EventDayGroupProps = {
  title: string;
  count: number;
  events: ApiEventOccurrence[];
  teams: ApiTeam[];
  projects: ApiProject[];
  canManage: boolean;
};

export function EventDayGroup({
  title,
  count,
  events,
  teams,
  projects,
  canManage,
}: EventDayGroupProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {count} event{count === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            teams={teams}
            projects={projects}
            canManage={canManage}
          />
        ))}
      </div>
    </section>
  );
}
