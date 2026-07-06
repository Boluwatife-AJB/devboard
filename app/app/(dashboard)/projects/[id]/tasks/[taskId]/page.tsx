"use client";

import {
  CaretDoubleUpIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChatTextIcon,
  CircleIcon,
  GitBranchIcon,
  GitCommitIcon,
  PaperclipIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { projectCards } from "@/constant";
import {
  formatActivityTime,
  formatDueDate,
  formatRelativeTime,
  getColumnById,
  getTaskById,
  priorityStyles,
} from "@/lib/project-tasks";
import { cn } from "@/lib/utils";

function CommentAvatar({
  initials,
  color,
}: {
  initials: string;
  color: string;
}) {
  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-xs text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function ActivityIcon({ type }: { type: "created" | "status" | "assigned" }) {
  const iconClass = "size-3.5 text-white";

  if (type === "created") {
    return (
      <div className="flex size-6 items-center justify-center rounded-full bg-[#4D8EFF]">
        <PlusIcon className={iconClass} weight="bold" />
      </div>
    );
  }

  if (type === "status") {
    return (
      <div className="flex size-6 items-center justify-center rounded-full bg-[#F97316]">
        <CircleIcon className={iconClass} weight="fill" />
      </div>
    );
  }

  return (
    <div className="flex size-6 items-center justify-center rounded-full bg-[#22C55E]">
      <UserPlusIcon className={iconClass} weight="bold" />
    </div>
  );
}

export default function TaskDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const taskId = params.taskId as string;

  const project = projectCards.find(
    (item) => item.id === parseInt(projectId, 10),
  );
  const task = getTaskById(taskId);
  const column = task ? getColumnById(task.column) : undefined;

  if (!task) {
    return (
      <div className="space-y-4">
        <p className="text-white">Task not found.</p>
        <Button
          render={<Link href={`/projects/${projectId}`} />}
          variant="outline"
        >
          Back to project
        </Button>
      </div>
    );
  }

  const visibleAssignees = task.assignees.slice(0, 2);
  const remainingAssignees = task.assignees.length - visibleAssignees.length;

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
              {project?.title ?? "Project"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-[#4A4A4A]" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-white">
              Task {task.taskId}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-start justify-between gap-4">
                <Badge className="h-6 rounded-xs border-0 bg-[#4D8EFF] px-2.5 text-xs font-semibold text-[#00285D] font-mono py-4">
                  {task.taskId}
                </Badge>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-xs text-[#C2C6D6] transition-colors hover:bg-[#2A2A2A] hover:text-white"
                    aria-label="Edit task"
                  >
                    <PencilSimpleIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-xs text-[#FF6B6B] transition-colors hover:bg-[#FF6B6B1A]"
                    aria-label="Delete task"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold leading-tight text-white">
                {task.name}
              </h1>

              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Description
                </p>
                <p className="text-sm leading-relaxed text-[#E5E5E5]">
                  {task.description}
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#E5E5E5]">
                  {task.descriptionBullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChatTextIcon className="size-4 text-[#C2C6D6]" />
                  <h2 className="text-sm font-semibold text-white">Comments</h2>
                </div>
                <Badge
                  variant="outline"
                  className="h-5 rounded-xs font-mono border-0 bg-[#353534] px-2 text-xs py-3 text-[#C2C6D6]"
                >
                  {task.comments} Total
                </Badge>
              </div>

              <div className="space-y-4">
                {task.commentList.map((comment) => (
                  <div
                    key={comment.id}
                    className="space-y-3 rounded-xs border border-[#2A2A2A] bg-[#1C1B1B] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CommentAvatar
                        initials={comment.author.initials}
                        color={comment.author.color}
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-[#8A8A8A]">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-[#E5E5E5]">
                          {comment.content}
                        </p>
                        {comment.reactions && (
                          <div className="flex items-center gap-2">
                            {comment.reactions.map((reaction) => (
                              <span
                                key={reaction.emoji}
                                className="inline-flex items-center gap-1 rounded-xs border border-[#4A4A4A] bg-[#131313] px-2 py-0.5 text-xs text-[#C2C6D6]"
                              >
                                {reaction.emoji} {reaction.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-xs border border-[#2A2A2A] bg-[#1C1B1B] p-4">
                <textarea
                  placeholder="Write a comment... (Markdown supported)"
                  className="min-h-24 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-[#8A8A8A]"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-xs text-[#C2C6D6] transition-colors hover:bg-[#2A2A2A] hover:text-white"
                    aria-label="Attach file"
                  >
                    <PaperclipIcon className="size-4" />
                  </button>
                  <Button className="h-8 rounded-xs bg-[#4D8EFF] px-4 text-xs text-white hover:bg-[#4D8EFF]/80">
                    Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-5 p-5">
              <h2 className="text-sm font-semibold text-white">Attributes</h2>

              <div className="space-y-6">
                <div className="space-y-2 flex items-center justify-between">
                  <p className="text-xs text-[#8A8A8A]">Status</p>
                  <Badge
                    variant="outline"
                    className="h-6 gap-1.5 rounded-xs border-[#4D8EFF66] bg-[#4D8EFF1A] px-2 text-[10px] font-medium text-[#ADC6FF]"
                  >
                    <CircleIcon className="size-2.5" weight="fill" />
                    {column?.name ?? "In Progress"}
                  </Badge>
                </div>

                <div className="space-y-2 flex items-center justify-between">
                  <p className="text-xs text-[#8A8A8A]">Priority</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-6 gap-1 rounded-xs border-[#F9731666] bg-[#F973161A] px-2 text-[10px] font-semibold uppercase",
                      priorityStyles[task.priority],
                    )}
                  >
                    <CaretDoubleUpIcon className="size-3" weight="bold" />
                    {task.priority}
                  </Badge>
                </div>

                <div className="space-y-2 flex items-center justify-between">
                  <p className="text-xs text-[#8A8A8A]">Assignees</p>
                  <AvatarGroup>
                    {visibleAssignees.map((assignee) => (
                      <Avatar key={assignee.id} className="size-7">
                        <AvatarImage src={assignee.image} />
                        <AvatarFallback className="bg-[#4D8EFF] text-[10px] text-white">
                          {assignee.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {remainingAssignees > 0 && (
                      <AvatarGroupCount className="size-7 text-[10px]">
                        +{remainingAssignees}
                      </AvatarGroupCount>
                    )}
                  </AvatarGroup>
                </div>

                <div className="space-y-2 flex items-center justify-between">
                  <p className="text-xs text-[#8A8A8A]">Due Date</p>
                  <p className="text-sm text-white">
                    {formatDueDate(task.endAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  Activity History
                </h2>
                <Button
                  type="button"
                  variant="link"
                  className="text-xs text-[#4D8EFF] hover:underline"
                >
                  View All
                </Button>
              </div>

              <div className="space-y-0">
                {task.activityHistory.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <ActivityIcon type={activity.type} />
                      {index < task.activityHistory.length - 1 && (
                        <div className="my-1 w-px flex-1 bg-[#2A2A2A]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-5">
                      <p className="text-sm text-[#E5E5E5]">
                        {activity.description}
                      </p>
                      <p className="mt-1 text-xs font-mono text-[#8A8A8A]">
                        {formatActivityTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  Technical Context
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-xs text-[#8A8A8A] hover:bg-[#2A2A2A] hover:text-white"
                    aria-label="Previous context"
                  >
                    <CaretLeftIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-xs text-[#8A8A8A] hover:bg-[#2A2A2A] hover:text-white"
                    aria-label="Next context"
                  >
                    <CaretRightIcon className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 rounded-xs border border-[#2A2A2A] bg-[#1C1B1B] p-4">
                <div className="flex items-center gap-2 text-sm text-[#E5E5E5]">
                  <GitBranchIcon className="size-4 shrink-0 text-[#C2C6D6]" />
                  <span className="truncate font-mono text-xs">
                    {task.branchName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#E5E5E5]">
                  <GitCommitIcon className="size-4 shrink-0 text-[#C2C6D6]" />
                  <span className="font-mono text-xs">
                    {task.commitHash.slice(0, 7)}...
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
