import type { Icon } from "@phosphor-icons/react";
import {
  CalendarBlankIcon,
  ChatsCircleIcon,
  CodeIcon,
  DotsThreeOutlineIcon,
  FlaskIcon,
  LightbulbIcon,
  PaintBrushIcon,
  PresentationIcon,
  RocketLaunchIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { EventType } from "@/types";

export type EventTypeMeta = {
  label: string;
  shortLabel: string;
  icon: Icon;
  badgeClass: string;
  iconWellClass: string;
};

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  STANDUP: {
    label: "Standup",
    shortLabel: "STANDUP",
    icon: UsersThreeIcon,
    badgeClass: "bg-sky-500/15 text-sky-600",
    iconWellClass: "bg-sky-500/15 text-sky-600",
  },
  BRAINSTORM: {
    label: "Brainstorm",
    shortLabel: "BRAINSTORM",
    icon: LightbulbIcon,
    badgeClass: "bg-amber-500/15 text-amber-700",
    iconWellClass: "bg-amber-500/15 text-amber-700",
  },
  TEST: {
    label: "Test",
    shortLabel: "TEST",
    icon: FlaskIcon,
    badgeClass: "bg-violet-500/15 text-violet-600",
    iconWellClass: "bg-violet-500/15 text-violet-600",
  },
  CODE_REVIEW: {
    label: "Code review",
    shortLabel: "CODE REVIEW",
    icon: CodeIcon,
    badgeClass: "bg-emerald-500/15 text-emerald-700",
    iconWellClass: "bg-emerald-500/15 text-emerald-700",
  },
  DESIGN_REVIEW: {
    label: "Design review",
    shortLabel: "DESIGN",
    icon: PaintBrushIcon,
    badgeClass: "bg-pink-500/15 text-pink-600",
    iconWellClass: "bg-pink-500/15 text-pink-600",
  },
  PLANNING: {
    label: "Planning",
    shortLabel: "PLANNING",
    icon: CalendarBlankIcon,
    badgeClass: "bg-indigo-500/15 text-indigo-600",
    iconWellClass: "bg-indigo-500/15 text-indigo-600",
  },
  DEMO: {
    label: "Demo",
    shortLabel: "DEMO",
    icon: PresentationIcon,
    badgeClass: "bg-orange-500/15 text-orange-700",
    iconWellClass: "bg-orange-500/15 text-orange-700",
  },
  TEAM_MEETING: {
    label: "Team meeting",
    shortLabel: "MEETING",
    icon: ChatsCircleIcon,
    badgeClass: "bg-devboard-primary/15 text-devboard-primary",
    iconWellClass: "bg-devboard-primary/15 text-devboard-primary",
  },
  PROJECT_MEETING: {
    label: "Project meeting",
    shortLabel: "PROJECT",
    icon: RocketLaunchIcon,
    badgeClass: "bg-teal-500/15 text-teal-700",
    iconWellClass: "bg-teal-500/15 text-teal-700",
  },
  OTHER: {
    label: "Other",
    shortLabel: "OTHER",
    icon: DotsThreeOutlineIcon,
    badgeClass: "bg-muted text-muted-foreground",
    iconWellClass: "bg-muted text-muted-foreground",
  },
};

export const CREATE_EVENT_TYPE_OPTIONS: {
  value: EventType;
  label: string;
}[] = [
  { value: "STANDUP", label: "Standup" },
  { value: "TEAM_MEETING", label: "Meeting" },
  { value: "PLANNING", label: "Planning" },
  { value: "DEMO", label: "Demo" },
  { value: "BRAINSTORM", label: "Brainstorm" },
  { value: "CODE_REVIEW", label: "Code review" },
  { value: "DESIGN_REVIEW", label: "Design" },
  { value: "OTHER", label: "Other" },
];
