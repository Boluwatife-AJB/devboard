"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { ApiEventOccurrence, ApiProject, ApiTeam } from "@/types";
import { ScrollArea } from "../ui/scroll-area";
import { EventDayGroup } from "./event-day-group";
import { EventEmptyState } from "./event-empty-state";
import { groupEventsByDay } from "./lib/group-events";

type EventListProps = {
  events: ApiEventOccurrence[];
  isLoading: boolean;
  isError: boolean;
  filtered: boolean;
  teams: ApiTeam[];
  projects: ApiProject[];
  canCreate: boolean;
  canManage: boolean;
  onCreateClick: () => void;
};

export function EventList({
  events,
  isLoading,
  isError,
  filtered,
  teams,
  projects,
  canCreate,
  canManage,
  onCreateClick,
}: EventListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-36 w-full rounded-xs" />
        <Skeleton className="h-36 w-full rounded-xs" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load events. Try refreshing the page.
      </p>
    );
  }

  const groups = groupEventsByDay(events);

  if (groups.length === 0) {
    return (
      <EventEmptyState
        filtered={filtered}
        canCreate={canCreate}
        onCreateClick={onCreateClick}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ScrollArea className="h-150">
        {groups.map((group) => (
          <EventDayGroup
            key={group.id}
            title={group.title}
            count={group.count}
            events={group.events}
            teams={teams}
            projects={projects}
            canManage={canManage}
          />
        ))}
      </ScrollArea>
    </div>
  );
}
