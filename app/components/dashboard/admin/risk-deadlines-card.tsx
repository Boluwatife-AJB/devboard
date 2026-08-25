"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RiskTask, RiskTaskStatus } from "@/types";

const statusVariant: Record<
  RiskTaskStatus,
  "destructive" | "secondary" | "outline"
> = {
  Blocked: "destructive",
  "In Progress": "secondary",
  Todo: "outline",
};

type RiskDeadlinesCardProps = {
  tasks: RiskTask[];
};

export function RiskDeadlinesCard({ tasks }: RiskDeadlinesCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarBlankIcon className="size-4 text-muted-foreground" />
          Risk & Deadlines
        </CardTitle>
        <CardAction>
          <Button
            variant="link"
            size="sm"
            render={<Link href="/projects" />}
            className="text-muted-foreground"
          >
            View All
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="pl-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {task.title}
                    </span>
                    <span className="text-muted-foreground">{task.key}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[task.status]}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    "pr-4 text-right",
                    task.overdue && "text-destructive",
                  )}
                >
                  {task.dueLabel}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
