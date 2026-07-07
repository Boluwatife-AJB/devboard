import { TaskPriority, TaskStatus } from "@/types";

export type KanbanStatusColumn = {
  id: TaskStatus;
  name: string;
  color: string;
};

/** Kanban columns keyed by the backend TaskStatus enum. */
export const taskStatusColumns: KanbanStatusColumn[] = [
  { id: "BACKLOG", name: "Backlog", color: "#C2C6D6" },
  { id: "TODO", name: "To Do", color: "#ADC6FF" },
  { id: "IN_PROGRESS", name: "In Progress", color: "#ADC6FF" },
  { id: "IN_REVIEW", name: "In Review", color: "#C2C6D6" },
  { id: "DONE", name: "Done", color: "#016630" },
  { id: "CANCELLED", name: "Cancelled", color: "#FF6B6B" },
];

export function getStatusColumn(status: TaskStatus) {
  return taskStatusColumns.find((column) => column.id === status);
}

export const priorityStyles: Record<TaskPriority, string> = {
  LOW: "text-[#C2C6D6]",
  MEDIUM: "text-[#ADC6FF]",
  HIGH: "text-[#FFB690]",
  URGENT: "text-[#FF6B6B]",
};

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const avatarColors = ["#F97316", "#4D8EFF", "#22C55E", "#EC4899", "#A855F7"];

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function avatarColorOf(seed: string) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function formatRelativeTime(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatActivityTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
