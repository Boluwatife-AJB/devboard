"use client";

import {
  ChatTextIcon,
  GearIcon,
  PaperclipIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type DragEndEvent,
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import { CreateTaskDialog } from "@/components/projects/create-task-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/hooks/use-projects";
import { useTaskEvents } from "@/hooks/use-task-events";
import { useTasks, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { getApiErrorMessage } from "@/lib/api";
import {
  initialsOf,
  priorityLabels,
  priorityStyles,
  taskStatusColumns,
} from "@/lib/task-ui";
import { cn } from "@/lib/utils";
import type { ApiTask, TaskStatus } from "@/types";

type BoardItem = {
  id: string;
  name: string;
  column: TaskStatus;
  task: ApiTask;
};

function toBoardItem(task: ApiTask): BoardItem {
  return {
    id: task.id,
    name: task.title,
    column: task.status,
    task,
  };
}

function BoardSkeleton() {
  return (
    <div className="flex gap-8 overflow-hidden h-[calc(100vh-20rem)]">
      {taskStatusColumns.map((column) => (
        <div
          key={column.id}
          className="flex w-72 shrink-0 flex-col gap-3 rounded-xs border border-dashed bg-[#1C1B1B4D] p-4"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-xs" />
          <Skeleton className="h-24 w-full rounded-xs" />
        </div>
      ))}
    </div>
  );
}

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project } = useProject(projectId);
  const {
    data: tasks,
    isPending,
    isError,
    error,
    refetch,
  } = useTasks(projectId);
  const updateTaskStatus = useUpdateTaskStatus(projectId);
  useTaskEvents(projectId);

  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);

  useEffect(() => {
    if (tasks) {
      setBoardItems(tasks.map(toBoardItem));
    }
  }, [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks?.find((task) => task.id === active.id);
    if (!activeTask) return;

    // The drop target is either a column or a card inside the target column
    const targetStatus =
      taskStatusColumns.find((column) => column.id === over.id)?.id ??
      boardItems.find((item) => item.id === over.id)?.column;

    if (!targetStatus || targetStatus === activeTask.status) return;

    updateTaskStatus.mutate(
      { taskId: activeTask.id, status: targetStatus },
      {
        onError: (mutationError) => {
          toast.error(getApiErrorMessage(mutationError));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          {project ? (
            <>
              <h2 className="text-3xl text-white font-semibold font-heading">
                {project.name}
              </h2>
              <p className="text-sm text-white w-7/10">
                {project.description ?? `Tasks for ${project.key}`}
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/settings`}>
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xs border-border"
            >
              <GearIcon data-icon="inline-start" />
              Project Settings
            </Button>
          </Link>
          <CreateTaskDialog
            projectId={projectId}
            teamId={project?.teamId ?? ""}
            trigger={
              <Button className="h-11 px-4 rounded-xs">
                <PlusIcon data-icon="inline-start" />
                Add Task
              </Button>
            }
          />
        </div>
      </div>

      {isPending && <BoardSkeleton />}

      {isError && (
        <Empty className="border border-dashed border-devboard-primary/30 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WarningCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Could not load tasks</EmptyTitle>
            <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </Empty>
      )}

      {tasks && (
        <div className="min-w-0 w-full overflow-x-auto">
          <KanbanProvider
            columns={taskStatusColumns}
            data={boardItems}
            onDataChange={setBoardItems}
            onDragEnd={handleDragEnd}
          >
            {(column) => (
              <KanbanBoard
                id={column.id}
                key={column.id}
                className="w-72 shrink-0 border-dashed border bg-[#1C1B1B4D] h-full max-h-[calc(100vh-20rem)]"
              >
                <KanbanHeader className="border-0 py-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] order-2 font-mono bg-[#353534] text-[#C2C6D6]",
                      )}
                    >
                      {
                        boardItems.filter((item) => item.column === column.id)
                          .length
                      }
                    </Badge>
                    <span
                      className="order-1 text-xs uppercase"
                      style={{ color: column.color }}
                    >
                      {column.name}
                    </span>
                  </div>
                </KanbanHeader>
                <KanbanCards id={column.id} className="gap-3">
                  {(item: BoardItem) => (
                    <KanbanCard
                      column={column.id}
                      id={item.id}
                      key={item.id}
                      name={item.name}
                      className="gap-3 rounded-xs border border-[#2A2A2A] bg-[#131313] p-4 shadow-none h-32 flex flex-col justify-between"
                      onClick={() =>
                        router.push(`/projects/${projectId}/tasks/${item.id}`)
                      }
                    >
                      <p className="m-0 text-sm font-medium leading-snug text-white">
                        {item.task.title}
                      </p>
                      {/* <div className="flex items-center justify-between">
                      <p className="m-0 flex-1 text-sm font-medium leading-snug text-white">
                        {item.task.title}
                      </p>

                      <Button variant="ghost" size="icon">
                        <DotsThreeIcon className="size-4" />
                      </Button>
                      </div> */}

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="h-5 rounded-xs border-0 bg-[#353534] px-2 font-mono text-[10px] text-[#C2C6D6]"
                        >
                          #{item.task.key}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 rounded-xs border-[#4A4A4A] bg-transparent px-2 text-[10px] font-semibold uppercase",
                            priorityStyles[item.task.priority],
                          )}
                        >
                          {priorityLabels[item.task.priority]}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[#C2C6D6]">
                          {item.task.commentCount > 0 && (
                            <span className="flex items-center gap-1 text-xs">
                              <ChatTextIcon className="size-3.5" />
                              {item.task.commentCount}
                            </span>
                          )}
                          {item.task.attachmentCount > 0 && (
                            <span className="flex items-center gap-1 text-xs">
                              <PaperclipIcon className="size-3.5" />
                              {item.task.attachmentCount}
                            </span>
                          )}
                        </div>

                        {item.task.assignee && (
                          <Avatar className="size-6 shrink-0 ring-2 ring-[#131313]">
                            <AvatarFallback className="text-[10px]">
                              {initialsOf(item.task.assignee.displayName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </KanbanCard>
                  )}
                </KanbanCards>
              </KanbanBoard>
            )}
          </KanbanProvider>
        </div>
      )}

      {tasks && tasks.length === 0 && (
        <p className="text-sm text-[#8A8A8A]">
          No tasks yet, use "Add Task" to create the first one.
        </p>
      )}
    </div>
  );
}
