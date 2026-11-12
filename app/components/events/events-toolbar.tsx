"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ApiProject, ApiTeam, EventType } from "@/types";
import { CREATE_EVENT_TYPE_OPTIONS } from "./lib/event-labels";

export type EventsViewTab = "upcoming" | "calendar" | "past";

type EventsToolbarProps = {
  tab: EventsViewTab;
  onTabChange: (tab: EventsViewTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  eventType: EventType | "ALL";
  onEventTypeChange: (value: EventType | "ALL") => void;
  teamId: string | "ALL";
  onTeamIdChange: (value: string | "ALL") => void;
  projectId: string | "ALL";
  onProjectIdChange: (value: string | "ALL") => void;
  teams: ApiTeam[];
  projects: ApiProject[];
};

const TABS: { id: EventsViewTab; label: string; disabled?: boolean }[] = [
  { id: "upcoming", label: "Upcoming & Timeline" },
  { id: "calendar", label: "Calendar Grid", disabled: true },
  { id: "past", label: "Past Archive", disabled: true },
];

export function EventsToolbar({
  tab,
  onTabChange,
  search,
  onSearchChange,
  eventType,
  onEventTypeChange,
  teamId,
  onTeamIdChange,
  projectId,
  onProjectIdChange,
  teams,
  projects,
}: EventsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-1 rounded-xs border border-border bg-muted/40 p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "rounded-xs px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors",
              tab === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              item.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter events, tags, people"
            className="rounded-xs pl-9"
          />
        </div>

        <Select
          value={eventType}
          onValueChange={(value) =>
            onEventTypeChange((value ?? "ALL") as EventType | "ALL")
          }
        >
          <SelectTrigger className="w-full rounded-xs sm:w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {CREATE_EVENT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={teamId}
          onValueChange={(value) => onTeamIdChange(value ?? "ALL")}
        >
          <SelectTrigger className="w-full rounded-xs sm:w-[140px]">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={projectId}
          onValueChange={(value) => onProjectIdChange(value ?? "ALL")}
        >
          <SelectTrigger className="w-full rounded-xs sm:w-[140px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
