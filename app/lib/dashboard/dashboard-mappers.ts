import {
  CalendarBlankIcon,
  ClipboardTextIcon,
  UserCirclePlusIcon,
  UserIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { format, parseISO } from "date-fns";
import type {
  ApiDashboardTaskItem,
  ApiMyDashboard,
  ApiOrgDashboard,
  AttentionItem,
  CompletionPoint,
  DashboardStat,
  MemberProject,
  MemberTask,
  MemberTaskStatus,
  RiskTask,
  RiskTaskStatus,
} from "@/types";
import { formatDate } from "../task-ui";

function dueLabel(dueDate: string | null, isOverdue: boolean) {
  if (!dueDate) return "No due date";
  if (isOverdue) return `Overdue (${formatDate(dueDate)})`;
  return formatDate(dueDate);
}

function toMemberTaskStatus(task: ApiDashboardTaskItem): MemberTaskStatus {
  if (task.isOverdue) return "OVERDUE";
  if (task.status === "IN_PROGRESS" || task.status === "IN_REVIEW") {
    return "IN_PROGRESS";
  }
  return "TODO";
}

export function mapMyTasks(tasks: ApiDashboardTaskItem[]): MemberTask[] {
  return tasks.map((task) => ({
    id: task.id,
    key: task.key,
    title: task.title,
    status: toMemberTaskStatus(task),
    dueLabel: dueLabel(task.dueDate, task.isOverdue),
  }));
}

function toRiskStatus(task: ApiDashboardTaskItem): RiskTaskStatus {
  if (task.isOverdue) return "Blocked";
  if (task.status === "IN_PROGRESS" || task.status === "IN_REVIEW") {
    return "In Progress";
  }
  return "Todo";
}

export function mapRiskTasks(tasks: ApiDashboardTaskItem[]): RiskTask[] {
  return tasks.map((task) => ({
    id: task.id,
    key: task.key,
    title: task.title,
    status: toRiskStatus(task),
    dueLabel: dueLabel(task.dueDate, task.isOverdue),
    overdue: task.isOverdue,
  }));
}

export function mapMemberProjects(
  projects: ApiMyDashboard["myProjects"],
): MemberProject[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    tag: project.key,
    openTasks: project.openTasks,
    // TODO: Not in dashboard API, hide avatars or fetch later
    members: [],
  }));
}

export function mapCompletionTrend(
  points: ApiMyDashboard["completionTrend"],
): CompletionPoint[] {
  return points.map((p) => ({
    day: format(parseISO(p.day), "MMM d"),
    completed: p.completed,
  }));
}

export function mapMemberStats(data: ApiMyDashboard): DashboardStat[] {
  const s = data.stats;
  return [
    {
      id: "assigned",
      label: "Assigned to Me",
      value: s.tasksAssignedToMe,
      hint: s.tasksInProgress
        ? `${s.tasksInProgress} in progress`
        : "No active work",
      icon: ClipboardTextIcon,
      tone: "accent",
    },
    {
      id: "due-week",
      label: "Due This Week",
      value: s.tasksDueThisWeek,
      hint: "Upcoming deadlines",
      icon: CalendarBlankIcon,
    },
    {
      id: "overdue",
      label: "Overdue",
      value: s.overdueTasks,
      hint: s.overdueTasks ? "Needs attention" : "You're all caught up",
      icon: WarningCircleIcon,
      tone: s.overdueTasks ? "warning" : "default",
    },
  ];
}

export function mapAdminStats(data: ApiOrgDashboard): DashboardStat[] {
  const s = data.stats;
  return [
    {
      id: "overdue",
      label: "Overdue",
      value: s.overdueTasks,
      hint: "Needs owner follow-up",
      icon: WarningCircleIcon,
      tone: s.overdueTasks ? "warning" : "default",
    },
    {
      id: "unassigned",
      label: "Unassigned",
      value: s.unassignedTasks,
      hint: `${s.unassignedUrgentTasks} marked critical`,
      icon: UserIcon,
    },
    {
      id: "pending-invites",
      label: "Pending Invites",
      value: s.pendingInvites,
      hint: "Awaiting acceptance",
      icon: UserCirclePlusIcon,
    },
    {
      id: "open-tasks",
      label: "Open Tasks",
      value: s.openTasks,
      hint: `${s.movedThisWeek} moved this week`,
      icon: ClipboardTextIcon,
    },
  ];
}
export function mapAttention(
  items: ApiOrgDashboard["attention"],
): AttentionItem[] {
  return items.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    actionLabel: i.actionLabel,
  }));
}
