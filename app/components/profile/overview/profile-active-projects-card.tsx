"use client";

import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { avatarColorOf } from "@/lib/task-ui";
import { cn } from "@/lib/utils";
import type { ProfileActiveProject, ProfileProjectStatus } from "@/types";

const statusVariant: Record<
  ProfileProjectStatus,
  "default" | "secondary" | "outline"
> = {
  "In Progress": "default",
  Review: "secondary",
  Planned: "outline",
};

type ProfileActiveProjectsCardProps = {
  projects: ProfileActiveProject[];
};

export function ProfileActiveProjectsCard({
  projects,
}: ProfileActiveProjectsCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <LightningIcon className="size-4" />
          Active Projects
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col gap-3 rounded-xs bg-muted/20 p-4 ring-1 ring-foreground/5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-foreground">{project.name}</p>
              <Badge variant={statusVariant[project.status]}>
                {project.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-3">
              <AvatarGroup>
                {project.members.map((member) => (
                  <Avatar key={member.id} size="sm">
                    <AvatarFallback
                      className="text-[10px] text-white"
                      style={{ backgroundColor: avatarColorOf(member.name) }}
                    >
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
              <span className="text-sm font-medium tabular-nums text-foreground">
                {project.progress}%
              </span>
            </div>

            <Progress
              value={project.progress}
              className={cn(
                "w-full gap-0",
                project.status === "In Progress" &&
                  "**:data-[slot=progress-indicator]:bg-primary",
                project.status === "Review" &&
                  "**:data-[slot=progress-indicator]:bg-accent",
                project.status === "Planned" &&
                  "**:data-[slot=progress-indicator]:bg-muted-foreground",
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
