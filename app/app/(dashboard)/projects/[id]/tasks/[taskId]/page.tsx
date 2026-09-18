"use client";

import {
  CaretDoubleUpIcon,
  CircleIcon,
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { TaskAttachments } from "@/components/projects/task-attachments";
import { TaskComments } from "@/components/projects/task-comments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { memberDisplayName, useOrgMemberMap } from "@/hooks/use-org-member-map";
import { useProject } from "@/hooks/use-projects";
import { useDeleteTask, useTask, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatActivityTime,
  formatDate,
  getStatusColumn,
  initialsOf,
  priorityLabels,
  priorityStyles,
  taskStatusColumns,
} from "@/lib/task-ui";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

function TaskSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
        <CardContent className="flex flex-col gap-6 p-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-2/3" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
      <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
        <CardContent className="flex flex-col gap-5 p-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const taskId = params.taskId as string;

  const { data: project } = useProject(projectId);
  const {
    data: task,
    isPending,
    isError,
    error,
    refetch,
  } = useTask(projectId, taskId);
  const updateTaskStatus = useUpdateTaskStatus(projectId);
  const deleteTask = useDeleteTask(projectId);
  const memberNames = useOrgMemberMap();
  const assigneeName = task?.assignee
    ? memberDisplayName(memberNames, task.assignee.id)
    : null;

  const column = task ? getStatusColumn(task.status) : undefined;

  const handleStatusChange = (status: TaskStatus) => {
    if (!task || status === task.status) return;
    updateTaskStatus.mutate(
      { taskId: task.id, status },
      {
        onError: (mutationError) =>
          toast.error(getApiErrorMessage(mutationError)),
      },
    );
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success(`Task ${task.key} deleted`);
        router.push(`/projects/${projectId}`);
      },
      onError: (mutationError) =>
        toast.error(getApiErrorMessage(mutationError)),
    });
  };

  if (isError) {
    return (
      <Empty className="border border-dashed border-devboard-primary/30 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WarningCircleIcon />
          </EmptyMedia>
          <EmptyTitle>Could not load this task</EmptyTitle>
          <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
          <Button render={<Link href={`/projects/${projectId}`} />}>
            Back to project
          </Button>
        </div>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList className="text-[10px] font-semibold uppercase tracking-wider text-[#C2C6D6]">
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/projects"
              className="text-[#C2C6D6] hover:text-white"
            >
              Projects
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-[#4A4A4A]" />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/projects/${projectId}`}
              className="text-[#C2C6D6] hover:text-white"
            >
              {project?.name ?? "Project"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-[#4A4A4A]" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-white">
              {task ? `Task ${task.key}` : "Task"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {isPending && <TaskSkeleton />}

      {task && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-start justify-between gap-4">
                  <Badge className="h-6 rounded-xs border-0 bg-[#4D8EFF] px-2.5 text-xs font-semibold text-[#00285D] font-mono py-4">
                    {task.key}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#FF6B6B] hover:bg-[#FF6B6B1A]"
                          aria-label="Delete task"
                        />
                      }
                    >
                      <TrashIcon className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete task {task.key}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes "{task.title}" and cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteTask.isPending}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <h1 className="text-2xl font-semibold leading-tight text-white">
                  {task.title}
                </h1>

                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                    Description
                  </p>
                  {task.description ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#E5E5E5]">
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-[#8A8A8A]">
                      No description provided.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <TaskComments projectId={projectId} taskId={taskId} />
          </div>

          <div className="space-y-8">
            <TaskAttachments projectId={projectId} taskId={taskId} />

            <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
              <CardContent className="space-y-5 p-5">
                <h2 className="text-sm font-semibold text-white">Attributes</h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8A8A8A]">Status</p>
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        handleStatusChange(value as TaskStatus)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="h-6 gap-1.5 rounded-xs border-[#4D8EFF66] bg-[#4D8EFF1A] px-2 text-[10px] font-medium text-[#ADC6FF]"
                        aria-label="Change status"
                      >
                        <CircleIcon
                          className="size-2.5"
                          weight="fill"
                          color={column?.color}
                        />
                        <SelectValue>{column?.name ?? task.status}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {taskStatusColumns.map((statusColumn) => (
                            <SelectItem
                              key={statusColumn.id}
                              value={statusColumn.id}
                            >
                              {statusColumn.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8A8A8A]">Priority</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-6 gap-1 rounded-xs border-[#F9731666] bg-[#F973161A] px-2 text-[10px] font-semibold uppercase",
                        priorityStyles[task.priority],
                      )}
                    >
                      <CaretDoubleUpIcon className="size-3" weight="bold" />
                      {priorityLabels[task.priority]}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8A8A8A]">Assignee</p>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-[#4D8EFF] text-[10px] text-white">
                            {initialsOf(assigneeName ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-white">
                          {assigneeName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm italic text-[#8A8A8A]">
                        Unassigned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8A8A8A]">Created</p>
                    <p className="text-sm text-white">
                      {formatDate(task.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8A8A8A]">Due Date</p>
                    <p className="text-sm text-white">
                      {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
              <CardContent className="space-y-4 p-5">
                <h2 className="text-sm font-semibold text-white">
                  Activity History
                </h2>

                <div className="space-y-0">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex size-6 items-center justify-center rounded-full bg-[#4D8EFF]">
                        <PlusIcon
                          className="size-3.5 text-white"
                          weight="bold"
                        />
                      </div>
                      {task.updatedAt !== task.createdAt && (
                        <div className="my-1 w-px flex-1 bg-[#2A2A2A]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-5">
                      <p className="text-sm text-[#E5E5E5]">Task created</p>
                      <p className="mt-1 text-xs font-mono text-[#8A8A8A]">
                        {formatActivityTime(task.createdAt)}
                      </p>
                    </div>
                  </div>

                  {task.updatedAt !== task.createdAt && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex size-6 items-center justify-center rounded-full bg-[#F97316]">
                          <CircleIcon
                            className="size-3.5 text-white"
                            weight="fill"
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 pb-5">
                        <p className="text-sm text-[#E5E5E5]">Last updated</p>
                        <p className="mt-1 text-xs font-mono text-[#8A8A8A]">
                          {formatActivityTime(task.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
