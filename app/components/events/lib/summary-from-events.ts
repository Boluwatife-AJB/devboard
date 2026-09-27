import {
  CalendarBlankIcon,
  ClockIcon,
  PulseIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  endOfWeek,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from "date-fns";
import type { ApiEventOccurrence, DashboardStat } from "@/types";

export function buildEventSummaryStats(
  events: ApiEventOccurrence[],
  now = new Date(),
): DashboardStat[] {
  const active = events.filter((e) => e.status === "SCHEDULED");
  const todayCount = active.filter((e) =>
    isSameDay(parseISO(e.startsAt), now),
  ).length;

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekCount = active.filter((e) =>
    isWithinInterval(parseISO(e.startsAt), { start: weekStart, end: weekEnd }),
  ).length;

  const standups = active.filter((e) => e.eventType === "STANDUP").length;
  const meetings = active.filter(
    (e) => e.eventType === "TEAM_MEETING" || e.eventType === "PROJECT_MEETING",
  ).length;

  const next = active
    .filter((e) => parseISO(e.startsAt) >= now)
    .sort(
      (a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime(),
    )[0];

  return [
    {
      id: "today",
      label: "Today",
      value: todayCount,
      hint: next
        ? `Next: ${next.title}`
        : todayCount
          ? "On your calendar today"
          : "No events today",
      icon: ClockIcon,
      tone: todayCount ? "accent" : "default",
    },
    {
      id: "week",
      label: "This week",
      value: weekCount,
      hint: "Mon–Sun upcoming",
      icon: CalendarBlankIcon,
    },
    {
      id: "standups",
      label: "Standups",
      value: standups,
      hint: "In the selected range",
      icon: UsersThreeIcon,
      tone: standups ? "accent" : "default",
    },
    {
      id: "meetings",
      label: "Meetings",
      value: meetings,
      hint: "Team & project meetings",
      icon: PulseIcon,
    },
  ];
}
