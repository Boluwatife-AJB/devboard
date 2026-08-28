"use client";

import {
  ClipboardTextIcon,
  FunnelSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MemberTask, MemberTaskStatus } from "@/types";

const statusMeta: Record<
  MemberTaskStatus,
  {
    label: string;
    variant: "destructive" | "secondary" | "outline";
    dot: string;
  }
> = {
  OVERDUE: {
    label: "Overdue",
    variant: "destructive",
    dot: "bg-destructive",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "secondary",
    dot: "bg-devboard-primary",
  },
  TODO: {
    label: "Todo",
    variant: "outline",
    dot: "bg-muted-foreground",
  },
};

type MyTasksCardProps = {
  tasks: MemberTask[];
};

export function MyTasksCard({ tasks }: MyTasksCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardTextIcon className="size-4 text-muted-foreground" />
          My Tasks
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="Filter tasks">
            <FunnelSimpleIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 px-0 pt-0">
        {tasks.map((task, index) => {
          const meta = statusMeta[task.status];
          return (
            <div key={task.id}>
              {index > 0 && <Separator />}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className={cn("size-2 shrink-0 rounded-full", meta.dot)}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.key}</p>
                </div>
                <Badge variant={meta.variant} className="shrink-0 uppercase">
                  {meta.label}
                </Badge>
                <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                  {task.dueLabel}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
