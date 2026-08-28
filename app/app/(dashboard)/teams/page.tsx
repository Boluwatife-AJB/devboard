"use client";

import {
  ClockIcon,
  PlusIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Can } from "@/components/providers/can";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { ManageMembersDialog } from "@/components/teams/manage-members-dialog";
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
import { useTeams } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { Action } from "@/lib/rbac/actions";
import { formatDate } from "@/lib/task-ui";

function TeamsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {["a", "b", "c"].map((key) => (
        <Card key={key} className="rounded-xs py-8!">
          <CardHeader className="mx-6 px-0!">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xs" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
          <CardContent className="mx-6 px-0">
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Teams() {
  const { data: teams, isPending, isError, error, refetch } = useTeams();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl text-white font-semibold font-heading">
            Teams
          </h2>
          <p className="text-sm text-white">
            {teams
              ? `${teams.length} team${
                  teams.length === 1 ? "" : "s"
                } in your organization.`
              : "Loading your organization's teams..."}
          </p>
        </div>
        <Can action={Action.CreateTeam}>
          <CreateTeamDialog
            trigger={
              <Button className="h-11 px-4 rounded-xs">
                <PlusIcon data-icon="inline-start" />
                Create Team
              </Button>
            }
          />
        </Can>
      </div>

      {isPending && <TeamsSkeleton />}

      {isError && (
        <Empty className="border border-dashed border-devboard-primary/30 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WarningCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Could not load teams</EmptyTitle>
            <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </Empty>
      )}

      {teams && teams.length === 0 && (
        <Empty className="border border-dashed border-devboard-primary/30 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersThreeIcon />
            </EmptyMedia>
            <EmptyTitle>No teams yet</EmptyTitle>
            <EmptyDescription>
              Teams own projects. Create your first team, add members, then
              create a project for it.
            </EmptyDescription>
          </EmptyHeader>
          <Can action={Action.CreateTeam}>
            <CreateTeamDialog
              trigger={
                <Button>
                  <PlusIcon data-icon="inline-start" />
                  Create Team
                </Button>
              }
            />
          </Can>
        </Empty>
      )}

      {teams && teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teams.map((team) => (
            <Card key={team.id} className="rounded-xs !py-8!">
              <CardHeader className="mx-6 px-0!">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-xs bg-[#4D8EFF4D]">
                    <UsersThreeIcon className="size-6 text-[#ADC6FF]" />
                  </div>
                  <h3 className="text-lg font-semibold">{team.name}</h3>
                </CardTitle>
              </CardHeader>

              <CardContent className="mx-6 px-0">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ClockIcon className="size-4" />
                  Created {formatDate(team.createdAt)}
                </p>
              </CardContent>

              <CardFooter className="mx-6 px-0">
                <ManageMembersDialog
                  team={team}
                  trigger={
                    <Button
                      variant="outline"
                      className="rounded-xs border-devboard-primary/40"
                    >
                      <UsersThreeIcon data-icon="inline-start" />
                      Manage members
                    </Button>
                  }
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
