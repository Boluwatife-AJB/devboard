"use client";

import { useMemo } from "react";
import { usePendingInvitations } from "@/hooks/use-invitations";
import { useChannels, useDmThreads } from "@/hooks/use-messaging";
import { useOrgAuthz } from "@/hooks/use-org-authz";
import { useProjects } from "@/hooks/use-projects";
import { useOrgMembers, useTeams } from "@/hooks/use-teams";
import {
  buildAdminSetupSteps,
  buildMemberSetupSteps,
  mapApiSetupProgress,
  summarizeSetupProgress,
} from "@/lib/dashboard/setup-progress";
import { Action } from "@/lib/rbac/actions";
import type {
  ApiDashboardEmptyState,
  ApiDashboardSetupProgress,
} from "@/types";

type UseSetupProgressOptions = {
  persona: "admin" | "member";
  emptyState: ApiDashboardEmptyState;
  pendingInviteCount?: number;
  setupProgressFromApi?: ApiDashboardSetupProgress;
};

export function useSetupProgress({
  persona,
  emptyState,
  pendingInviteCount = 0,
  setupProgressFromApi,
}: UseSetupProgressOptions) {
  const { can } = useOrgAuthz();
  const { data: teams, isPending: teamsPending } = useTeams();
  const { data: projects, isPending: projectsPending } = useProjects();
  const { data: channels, isPending: channelsPending } = useChannels();
  const { data: members, isPending: membersPending } = useOrgMembers();
  const { data: dmThreads, isPending: dmsPending } = useDmThreads();
  const canViewPendingInvites =
    !setupProgressFromApi && persona === "admin" && can(Action.InviteOrgMember);
  const { data: pendingInvitations, isPending: invitesPending } =
    usePendingInvitations(canViewPendingInvites);

  const isPending = setupProgressFromApi
    ? false
    : teamsPending ||
      projectsPending ||
      channelsPending ||
      membersPending ||
      dmsPending ||
      (canViewPendingInvites && invitesPending);

  const result = useMemo(() => {
    if (setupProgressFromApi) {
      return mapApiSetupProgress(setupProgressFromApi);
    }

    const input = {
      teamCount: teams?.length ?? 0,
      projectCount: projects?.length ?? 0,
      memberCount: members?.length ?? 0,
      pendingInviteCount:
        pendingInviteCount || (pendingInvitations?.length ?? 0),
      channelCount: channels?.length ?? 0,
      hasJoinedChannel: channels?.some((channel) => channel.isMember) ?? false,
      dmThreadCount: dmThreads?.length ?? 0,
      emptyState,
    };

    const steps =
      persona === "admin"
        ? buildAdminSetupSteps(input)
        : buildMemberSetupSteps(input);
    const summary = summarizeSetupProgress(steps);

    return {
      steps,
      ...summary,
      isComplete: summary.completedCount === summary.totalCount,
    };
  }, [
    setupProgressFromApi,
    teams,
    projects,
    members,
    pendingInviteCount,
    pendingInvitations,
    channels,
    dmThreads,
    emptyState,
    persona,
  ]);

  return {
    ...result,
    isPending,
  };
}
