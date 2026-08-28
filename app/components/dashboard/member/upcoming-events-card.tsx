"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UpcomingEvent } from "@/types";

type UpcomingEventsCardProps = {
  events: UpcomingEvent[];
};

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarBlankIcon className="size-4 text-muted-foreground" />
          Next 14 Days
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 pt-2">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3 py-3">
            <span className="w-14 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {event.dateLabel}
            </span>
            <div className="w-px shrink-0 self-stretch bg-border" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-medium text-foreground">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
