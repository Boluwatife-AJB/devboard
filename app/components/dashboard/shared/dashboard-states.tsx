"use client";

import {
  FolderIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserCirclePlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { DashboardGreetingSkeleton } from "@/components/dashboard/shared/dashboard-greeting";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api";
import type { ApiDashboardEmptyState, DashboardCta } from "@/types";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardGreetingSkeleton />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xs" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-xs xl:col-span-2" />
        <Skeleton className="h-64 rounded-xs" />
      </div>
      <Skeleton className="h-72 w-full rounded-xs" />
    </div>
  );
}

type DashboardErrorStateProps = {
  error: unknown;
  onRetry: () => void;
  title?: string;
};

export function DashboardErrorState({
  error,
  onRetry,
  title = "Could not load dashboard",
}: DashboardErrorStateProps) {
  return (
    <Empty className="border border-dashed border-devboard-primary/30 py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WarningCircleIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </Empty>
  );
}

const emptyCopy: Record<
  DashboardCta,
  {
    title: string;
    description: string;
    label: string;
    href: string;
    icon: typeof FolderOpenIcon;
  }
> = {
  CREATE_PROJECT: {
    title: "No projects yet",
    description:
      "Create your first project to start tracking tasks and team workload.",
    label: "Create Project",
    href: "/projects",
    icon: FolderOpenIcon,
  },
  INVITE_MEMBER: {
    title: "Invite your team",
    description:
      "Projects are ready. Invite members so work can be assigned and tracked.",
    label: "Invite Member",
    href: "/settings",
    icon: UserCirclePlusIcon,
  },
  CREATE_TASK: {
    title: "No tasks assigned yet",
    description:
      "Open a project to create tasks, or wait for an assignment from your team.",
    label: "Browse Projects",
    href: "/projects",
    icon: FolderIcon,
  },
  EXPLORE: {
    title: "Your dashboard is ready",
    description: "Explore projects and messages to get started.",
    label: "Explore Projects",
    href: "/projects",
    icon: MagnifyingGlassIcon,
  },
};

type DashboardEmptyStateProps = {
  emptyState: ApiDashboardEmptyState;
  /** When true, CREATE_PROJECT uses the create-project dialog trigger. */
  canCreateProject?: boolean;
};

export function DashboardEmptyState({
  emptyState,
  canCreateProject = false,
}: DashboardEmptyStateProps) {
  const copy = emptyCopy[emptyState.primaryCta];
  const Icon = copy.icon;

  const action =
    emptyState.primaryCta === "CREATE_PROJECT" && canCreateProject ? (
      <CreateProjectDialog
        trigger={
          <Button>
            <PlusIcon data-icon="inline-start" />
            {copy.label}
          </Button>
        }
      />
    ) : (
      <Button render={<Link href={copy.href} />}>{copy.label}</Button>
    );

  return (
    <Empty className="border border-dashed border-devboard-primary/30 py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{copy.title}</EmptyTitle>
        <EmptyDescription>{copy.description}</EmptyDescription>
      </EmptyHeader>
      {action}
    </Empty>
  );
}

/** True when the org has no projects yet — show the full empty CTA. */
export function shouldShowDashboardEmpty(
  emptyState: ApiDashboardEmptyState,
): boolean {
  return !emptyState.hasProjects;
}
