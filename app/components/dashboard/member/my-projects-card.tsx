"use client";

import { FolderIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { avatarColorOf } from "@/lib/task-ui";
import type { MemberProject } from "@/types";

type MyProjectsCardProps = {
  projects: MemberProject[];
};

export function MyProjectsCard({ projects }: MyProjectsCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderIcon className="size-4 text-muted-foreground" />
          My Projects
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href="/projects"
              className="flex flex-col gap-4 rounded-xs bg-muted/20 p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/35"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-foreground">{project.name}</p>
                <Badge variant="outline">{project.tag}</Badge>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Open Tasks
                  </span>
                  <span className="font-heading text-2xl font-semibold tabular-nums">
                    {project.openTasks}
                  </span>
                </div>
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
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
