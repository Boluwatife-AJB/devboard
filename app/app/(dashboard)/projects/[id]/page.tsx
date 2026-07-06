"use client";

import { faker } from "@faker-js/faker";
import {
  ChatTextIcon,
  FunnelIcon,
  PaperclipIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useParams } from "next/navigation";
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
import { capitalize, cn } from "@/lib/utils";

const columns = [
  {
    id: faker.string.uuid(),
    name: "Backlog",
    color: "#C2C6D6",
  },
  {
    id: faker.string.uuid(),
    name: "To Do",
    color: "#ADC6FF",
  },
  {
    id: faker.string.uuid(),
    name: "In Progress",
    color: "#ADC6FF",
  },
  {
    id: faker.string.uuid(),
    name: "In Review",
    color: "#C2C6D6",
  },
  {
    id: faker.string.uuid(),
    name: "Done",
    color: "#016630",
  },
];

const users = Array.from({ length: 4 })
  .fill(null)
  .map(() => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    image: faker.image.avatar(),
  }));

const scopeBadgeStyles: Record<string, string> = {
  refactor: "bg-[#F97316] text-black",
  bug: "bg-[#EF4444] text-white",
  feature: "bg-[#4D8EFF] text-black",
  task: "bg-[#22C55E] text-black",
  schema: "bg-[#A855F7] text-white",
  docs: "bg-[#64748B] text-white",
  ui: "bg-[#EC4899] text-white",
  frontend: "bg-[#06B6D4] text-black",
  backend: "bg-[#8B5CF6] text-white",
  database: "bg-[#14B8A6] text-black",
  infrastructure: "bg-[#EAB308] text-black",
  other: "bg-[#6B7280] text-white",
};

const priorityStyles: Record<string, string> = {
  low: "text-[#C2C6D6]",
  medium: "text-[#ADC6FF]",
  high: "text-[#FFB690]",
  critical: "text-[#FF6B6B]",
};

const exampleTasks = Array.from({ length: 20 })
  .fill(null)
  .map(() => {
    const startAt = faker.date.past({ years: 1 });
    const endAt = faker.date.future({ years: 1, refDate: startAt });
    const prefix = faker.helpers.arrayElement([
      "CORE",
      "API",
      "UI",
      "DB",
      "OPS",
    ]);

    return {
      id: faker.string.uuid(),
      taskId: `${prefix}-${faker.number.int({ min: 100, max: 999 })}`,
      scope: faker.helpers.arrayElement([
        "feature",
        "bug",
        "task",
        "refactor",
        "schema",
        "docs",
        "ui",
        "frontend",
        "backend",
        "database",
        "infrastructure",
        "other",
      ]),
      priority: faker.helpers.arrayElement([
        "low",
        "medium",
        "high",
        "critical",
      ]),
      name: capitalize(faker.company.buzzPhrase()),
      comments: faker.number.int({ min: 0, max: 12 }),
      attachments: faker.number.int({ min: 0, max: 5 }),
      startAt,
      endAt,
      column: faker.helpers.arrayElement(columns).id,
      owner: faker.helpers.arrayElement(users),
    };
  });

export default function ProjectDetails() {
  const params = useParams();

  const [tasks, setTasks] = useState(exampleTasks);

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

      {/* Kanban Board  */}
      <KanbanProvider columns={columns} data={tasks} onDataChange={setTasks}>
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
                          {task.owner.name?.slice(0, 2)}
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
      {/* Having 5 columns: Backlog, To Do, In Progress, In Review, Done */}
      {/* <ScrollArea>
        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-1">
            <h3 className="text-lg font-semibold">Backlog</h3>
          </div>
          <div className="col-span-1">
            <h3 className="text-lg font-semibold">To Do</h3>
          </div>
          <div className="col-span-1">
            <h3 className="text-lg font-semibold">In Progress</h3>
          </div>
          <div className="col-span-1">
            <h3 className="text-lg font-semibold">In Review</h3>
          </div>
          <div className="col-span-1">
            <h3 className="text-lg font-semibold">Done</h3>
          </div>
        </div>
      </ScrollArea> */}
    </div>
  );
}
