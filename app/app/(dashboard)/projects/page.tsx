"use client";

import {
  ClockIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/task-ui";

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {["a", "b", "c", "d", "e", "f"].map((key) => (
        <Card key={key} className="rounded-xs py-8!">
          <CardHeader className="mx-6 px-0!">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xs" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="mx-6 px-0 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Projects() {
  const router = useRouter();
  const { data: projects, isPending, isError, error, refetch } = useProjects();

  const createProjectButton = (
    <Button className="h-11 px-4 rounded-xs">
      <PlusIcon data-icon="inline-start" />
      Create Project
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl text-white font-semibold font-heading">
            Project Portfolio
          </h2>
          <p className="text-sm text-white">
            {projects
              ? `${projects.length} project${projects.length === 1 ? "" : "s"} in your organization.`
              : "Loading your organization's projects..."}
          </p>
        </div>
        <CreateProjectDialog trigger={createProjectButton} />
      </div>

      {isPending && <ProjectsSkeleton />}

      {isError && (
        <Empty className="border border-dashed border-devboard-primary/30 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WarningCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Could not load projects</EmptyTitle>
            <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </Empty>
      )}

      {projects && projects.length === 0 && (
        <Empty className="border border-dashed border-devboard-primary/30 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenIcon />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Create your first project to start tracking tasks on a kanban
              board.
            </EmptyDescription>
          </EmptyHeader>
          <CreateProjectDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                Create Project
              </Button>
            }
          />
        </Empty>
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="rounded-xs py-8! cursor-pointer transition-colors hover:border-devboard-primary/40"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardHeader className="mx-6 px-0! h-20">
                <CardTitle className="flex items-start justify-between">
                  <div className="items-center flex gap-3">
                    <div className="flex items-center justify-center size-10 rounded-xs bg-[#4D8EFF4D]">
                      <FolderIcon className="size-7.5 text-[#ADC6FF]" />
                    </div>
                    <div className="space-y-1">
                      <span className="uppercase text-xs font-mono text-[#4D8EFF]">
                        {project.key}
                      </span>
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="mx-6 px-0">
                <p className="text-base line-clamp-2">
                  {project.description ?? "No description provided."}
                </p>
              </CardContent>

              <CardFooter className="mx-6 flex items-center justify-between px-0">
                <Badge
                  variant="outline"
                  className="h-5 rounded-xs border-0 bg-[#353534] px-2 font-mono text-[10px] text-[#C2C6D6]"
                >
                  {project.key}
                </Badge>
                <p className="flex items-center gap-2">
                  <ClockIcon className="size-5" />
                  <span className="text-sm">
                    Created {formatDate(project.createdAt)}
                  </span>
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
