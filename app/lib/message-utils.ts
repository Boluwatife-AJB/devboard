import type { DisplayMessage, PresenceStatus, UiPresence } from "@/types";

export function toUiPresence(status: PresenceStatus | undefined): UiPresence {
  if (status === "ONLINE") return "online";
  if (status === "AWAY") return "away";
  return "offline";
}

export function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function groupMessagesByDay(messages: DisplayMessage[]) {
  const groups: { label: string; messages: DisplayMessage[] }[] = [];
  for (const message of messages) {
    const label = formatDayLabel(message.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.messages.push(message);
    } else {
      groups.push({ label, messages: [message] });
    }
  }
  return groups;
}

export function canEditMessage(createdAt: string, windowMs = 15 * 60 * 1000) {
  return Date.now() - new Date(createdAt).getTime() <= windowMs;
}
