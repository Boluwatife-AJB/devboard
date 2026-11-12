import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import type { ApiEventOccurrence } from "@/types";

export type EventDayGroup = {
  id: string;
  title: string;
  count: number;
  events: ApiEventOccurrence[];
};

export function groupEventsByDay(
  events: ApiEventOccurrence[],
  now = new Date(),
): EventDayGroup[] {
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const today: ApiEventOccurrence[] = [];
  const thisWeek: ApiEventOccurrence[] = [];
  const laterBuckets = new Map<string, ApiEventOccurrence[]>();

  for (const event of events) {
    if (event.status === "CANCELLED") continue;
    const start = parseISO(event.startsAt);

    if (isSameDay(start, now)) {
      today.push(event);
      continue;
    }

    if (
      isWithinInterval(start, { start: weekStart, end: weekEnd }) &&
      start >= todayStart
    ) {
      thisWeek.push(event);
      continue;
    }

    if (start < todayStart) continue;

    const key = format(start, "yyyy-MM-dd");
    const list = laterBuckets.get(key) ?? [];
    list.push(event);
    laterBuckets.set(key, list);
  }

  const groups: EventDayGroup[] = [];

  if (today.length > 0) {
    groups.push({
      id: "today",
      title: `Today · ${format(now, "EEEE, MMM d, yyyy")}`,
      count: today.length,
      events: today,
    });
  }

  if (thisWeek.length > 0) {
    groups.push({
      id: "this-week",
      title: "This Week",
      count: thisWeek.length,
      events: thisWeek,
    });
  }

  const sortedLaterKeys = [...laterBuckets.keys()].sort();
  for (const key of sortedLaterKeys) {
    const dayEvents = laterBuckets.get(key) ?? [];
    const day = parseISO(key);
    groups.push({
      id: key,
      title: format(day, "EEEE, MMM d, yyyy"),
      count: dayEvents.length,
      events: dayEvents,
    });
  }

  return groups;
}

export function defaultEventsRange(now = new Date()) {
  const from = startOfDay(now).toISOString();
  const to = endOfDay(addDays(now, 60)).toISOString();
  return { from, to };
}

export function formatEventTimeRange(
  startsAt: string,
  endsAt: string,
  timeZone: string,
) {
  try {
    const start = parseISO(startsAt);
    const end = parseISO(endsAt);
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    });
    return `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  } catch {
    return `${format(parseISO(startsAt), "h:mm a")} – ${format(parseISO(endsAt), "h:mm a")}`;
  }
}

export function toUpcomingEventCard(
  event: ApiEventOccurrence,
): UpcomingEventLike {
  const start = parseISO(event.startsAt);
  return {
    id: event.id,
    dateLabel: format(start, "MMM d").toUpperCase(),
    title: event.title,
    time: formatEventTimeRange(event.startsAt, event.endsAt, event.timezone),
  };
}

type UpcomingEventLike = {
  id: string;
  dateLabel: string;
  title: string;
  time: string;
};
