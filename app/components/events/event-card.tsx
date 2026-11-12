"use client";

import {
  DotsThreeVerticalIcon,
  LinkSimpleIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCancelEvent } from "@/hooks/use-events";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ApiEventOccurrence, ApiProject, ApiTeam } from "@/types";
import { EVENT_TYPE_META } from "./lib/event-labels";
import { formatEventTimeRange } from "./lib/group-events";

type EventCardProps = {
  event: ApiEventOccurrence;
  teams: ApiTeam[];
  projects: ApiProject[];
  canManage: boolean;
};

export function EventCard({
  event,
  teams,
  projects,
  canManage,
}: EventCardProps) {
  const meta = EVENT_TYPE_META[event.eventType];
  const Icon = meta.icon;
  const cancelEvent = useCancelEvent();

  const teamName = event.teamId
    ? (teams.find((t) => t.id === event.teamId)?.name ?? "Team")
    : null;
  const projectName = event.projectId
    ? (projects.find((p) => p.id === event.projectId)?.name ?? "Project")
    : null;

  const audienceLabel =
    event.audienceType === "ORGANIZATION"
      ? "Organization"
      : event.audienceType === "TEAM"
        ? (teamName ?? "Team")
        : event.audienceType === "PROJECT"
          ? (projectName ?? "Project")
          : "Custom invitees";

  const timeLabel = formatEventTimeRange(
    event.startsAt,
    event.endsAt,
    event.timezone,
  );

  const linkHref = event.meetingUrl ?? undefined;

  const onCancel = async () => {
    try {
      await cancelEvent.mutateAsync({
        seriesId: event.seriesId,
        occurrenceId: event.id,
      });
      toast.success("Event occurrence cancelled");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Card className="rounded-xs">
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xs",
              meta.iconWellClass,
            )}
          >
            <Icon className="size-5" weight="duotone" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("rounded-xs text-[10px]", meta.badgeClass)}
              >
                {meta.shortLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {audienceLabel}
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {event.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {timeLabel}
                  <span className="mx-1.5 text-border">·</span>
                  {event.timezone}
                </p>
                {(event.meetingUrl || event.location) && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {event.meetingUrl ? (
                      <LinkSimpleIcon className="size-3.5 shrink-0" />
                    ) : (
                      <MapPinIcon className="size-3.5 shrink-0" />
                    )}
                    {event.meetingUrl ? (
                      <a
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-devboard-primary hover:underline"
                      >
                        {event.meetingUrl}
                      </a>
                    ) : (
                      <span className="truncate">{event.location}</span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {linkHref && (
                  <a
                    href={linkHref}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ size: "sm" }), "rounded-xs")}
                  >
                    Join call
                  </a>
                )}
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-xs"
                          aria-label="Event actions"
                        />
                      }
                    >
                      <DotsThreeVerticalIcon className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={cancelEvent.isPending}
                        onClick={() => {
                          void onCancel();
                        }}
                      >
                        Cancel occurrence
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {event.description && (
              <div className="rounded-xs border border-border bg-muted/30 px-3 py-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Details
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground/90">
                  {event.description}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                Recurrence:{" "}
                {event.recurrenceKind === "NONE"
                  ? "One-time"
                  : event.recurrenceKind === "INTERVAL_DAYS"
                    ? `Every ${event.intervalDays ?? "?"} days`
                    : event.recurrenceKind.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
