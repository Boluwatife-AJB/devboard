"use client";

import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { CreateChannelDialog } from "@/components/messages/create-channel-dialog";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Can } from "@/components/providers/can";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { SetupDialogId, SetupStep } from "@/lib/dashboard/setup-progress";
import { Action } from "@/lib/rbac/actions";
import { cn } from "@/lib/utils";

type SetupChecklistProps = {
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  isPending?: boolean;
  persona: "admin" | "member";
};

const dialogActionMap: Record<
  SetupDialogId,
  { action: (typeof Action)[keyof typeof Action]; label: string }
> = {
  "create-team": { action: Action.CreateTeam, label: "Create team" },
  "create-project": { action: Action.CreateProject, label: "Create project" },
  "invite-member": { action: Action.InviteOrgMember, label: "Invite" },
  "create-channel": { action: Action.CreateChannel, label: "Create channel" },
};

function StepAction({ step }: { step: SetupStep }) {
  if (step.completed) {
    return null;
  }

  const trigger = (
    <Button variant="outline" size="sm" className="rounded-xs">
      {step.dialogId
        ? (dialogActionMap[step.dialogId]?.label ?? "Start")
        : "Open"}
    </Button>
  );

  if (step.dialogId === "create-team") {
    return (
      <Can action={Action.CreateTeam}>
        <CreateTeamDialog trigger={trigger} />
      </Can>
    );
  }

  if (step.dialogId === "create-project") {
    return (
      <Can action={Action.CreateProject}>
        <CreateProjectDialog trigger={trigger} />
      </Can>
    );
  }

  if (step.dialogId === "invite-member") {
    return (
      <Can action={Action.InviteOrgMember}>
        <InviteMemberDialog trigger={trigger} />
      </Can>
    );
  }

  if (step.dialogId === "create-channel") {
    return (
      <Can action={Action.CreateChannel}>
        <CreateChannelDialog trigger={trigger} />
      </Can>
    );
  }

  if (step.href) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-xs"
        render={<Link href={step.href} />}
      >
        Open
      </Button>
    );
  }

  return null;
}

export function SetupChecklist({
  steps,
  completedCount,
  totalCount,
  progressPercent,
  isPending = false,
  persona,
}: SetupChecklistProps) {
  const title = persona === "admin" ? "Workspace setup" : "Getting started";

  if (isPending) {
    return (
      <Card className="rounded-xs">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-2 w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          {["a", "b", "c"].map((key) => (
            <Skeleton key={key} className="h-14 w-full rounded-xs" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xs">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base text-white">{title}</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {completedCount} of {totalCount} complete
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1 gap-0">
            <ProgressTrack className="h-1.5">
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
          <span className="text-xs text-muted-foreground tabular-nums">
            {progressPercent}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start justify-between gap-4 rounded-xs border px-4 py-3",
              step.completed
                ? "border-devboard-primary/20 bg-devboard-primary/5"
                : "border-foreground/10 bg-card",
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              {step.completed ? (
                <CheckCircleIcon
                  className="mt-0.5 size-5 shrink-0 text-devboard-primary"
                  weight="fill"
                />
              ) : (
                <CircleIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 space-y-0.5">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.completed && "text-muted-foreground line-through",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
            <StepAction step={step} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
