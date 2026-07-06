"use client";

import {
  ChatTextIcon,
  FunnelIcon,
  PaperclipIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectCards } from "@/constant";
import {
  kanbanColumns,
  priorityStyles,
  projectTasks,
  scopeBadgeStyles,
} from "@/lib/project-tasks";
import { cn } from "@/lib/utils";

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();

  const [tasks, setTasks] = useState(projectTasks);

  const projectId = params.id as string;

  const project = projectCards.find(
    (project) => project.id === parseInt(projectId, 10),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl text-white font-semibold font-heading">
            {project?.title}
          </h2>
          <p className="text-sm text-white">{project?.description}</p>
        </div>
        <div className="space-x-4">
          <Button
            variant="outline"
            className="h-11 px-4 rounded-xs border-devboard-primary! text-white"
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </Button>
          <Button className="h-11 px-4 rounded-xs">
            <PlusIcon className="w-5 h-5" />
            Add Task
          </Button>
        </div>
      </div>

      <KanbanProvider
        columns={kanbanColumns}
        data={tasks}
        onDataChange={setTasks}
      >
        {(column) => (
          <KanbanBoard
            id={column.id}
            key={column.id}
            className="border-dashed border bg-[#1C1B1B4D] w-72 max-h-[calc(100vh-15rem)] "
          >
            <KanbanHeader className="border-0 py-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] order-2 font-mono bg-[#353534] text-[#C2C6D6]",
                  )}
                >
                  {tasks.filter((task) => task.column === column.id).length}
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
              {(task: (typeof tasks)[number]) => (
                <KanbanCard
                  column={column.id}
                  id={task.id}
                  key={task.id}
                  name={task.name}
                  className="gap-3 rounded-xs border border-[#2A2A2A] bg-[#131313] p-4 shadow-none"
                  onClick={() =>
                    router.push(`/projects/${projectId}/tasks/${task.id}`)
                  }
                >
                  <Badge
                    className={cn(
                      "h-5 rounded-xs px-2 text-[10px] font-semibold uppercase",
                      scopeBadgeStyles[task.scope] ?? scopeBadgeStyles.other,
                    )}
                  >
                    {task.scope}
                  </Badge>

                  <p className="m-0 text-sm font-medium leading-snug text-white">
                    {task.name}
                  </p>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-5 rounded-xs border-0 bg-[#353534] px-2 font-mono text-[10px] text-[#C2C6D6]"
                    >
                      #{task.taskId}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 rounded-xs border-[#4A4A4A] bg-transparent px-2 text-[10px] font-semibold uppercase",
                        priorityStyles[task.priority],
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[#C2C6D6]">
                      <span className="flex items-center gap-1 text-xs">
                        <ChatTextIcon className="size-3.5" />
                        {task.comments}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <PaperclipIcon className="size-3.5" />
                        {task.attachments}
                      </span>
                    </div>
                    {task.owner && (
                      <Avatar className="size-6 shrink-0 ring-2 ring-[#131313]">
                        <AvatarImage src={task.owner.image} />
                        <AvatarFallback className="text-[10px]">
                          {task.owner.initials}
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
  );
}
