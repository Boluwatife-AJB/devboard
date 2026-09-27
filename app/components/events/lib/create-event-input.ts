import type { CreateEventFormData, CreateEventInput } from "@/types";

/** Build UTC ISO datetimes from local date + time inputs (browser local zone). */
export function buildCreateEventInput(
  data: CreateEventFormData,
): CreateEventInput {
  const startsAt = new Date(`${data.date}T${data.startTime}:00`).toISOString();
  const endsAt = new Date(`${data.date}T${data.endTime}:00`).toISOString();

  return {
    title: data.title.trim(),
    description: data.description?.trim() || null,
    eventType: data.eventType,
    audienceType: data.audienceType,
    teamId: data.audienceType === "TEAM" ? data.teamId || null : null,
    projectId: data.audienceType === "PROJECT" ? data.projectId || null : null,
    customUserIds:
      data.audienceType === "CUSTOM" ? (data.customUserIds ?? []) : null,
    startsAt,
    endsAt,
    timezone: data.timezone,
    location: data.location?.trim() || null,
    meetingUrl: data.meetingUrl?.trim() || null,
    recurrenceKind: data.recurrenceKind,
    intervalDays:
      data.recurrenceKind === "INTERVAL_DAYS"
        ? (data.intervalDays ?? null)
        : null,
  };
}

export function defaultCreateEventValues(): CreateEventFormData {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const startHour = String((now.getHours() + 1) % 24).padStart(2, "0");

  return {
    title: "",
    description: "",
    eventType: "STANDUP",
    audienceType: "ORGANIZATION",
    teamId: undefined,
    projectId: undefined,
    customUserIds: [],
    date,
    startTime: `${startHour}:00`,
    endTime: `${startHour}:30`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    location: "",
    meetingUrl: "",
    recurrenceKind: "NONE",
    intervalDays: undefined,
  };
}
