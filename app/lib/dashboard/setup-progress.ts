import type {
  ApiDashboardEmptyState,
  ApiDashboardSetupProgress,
  ApiSetupStep,
  ApiSetupStepId,
} from "@/types";

export type SetupStepId =
  | "create-team"
  | "create-project"
  | "invite-members"
  | "create-channel"
  | "create-task"
  | "join-conversation"
  | "explore-projects"
  | "review-tasks";

export type SetupDialogId =
  | "create-team"
  | "create-project"
  | "invite-member"
  | "create-channel";

export type SetupStep = {
  id: SetupStepId;
  label: string;
  description: string;
  completed: boolean;
  href?: string;
  dialogId?: SetupDialogId;
};

export type SetupProgressInput = {
  teamCount: number;
  projectCount: number;
  memberCount: number;
  pendingInviteCount: number;
  channelCount: number;
  hasJoinedChannel: boolean;
  dmThreadCount: number;
  emptyState: ApiDashboardEmptyState;
};

export function buildAdminSetupSteps(input: SetupProgressInput): SetupStep[] {
  const hasTeam = input.teamCount > 0;
  const hasProject = input.projectCount > 0;
  const hasInvited = input.memberCount > 1 || input.pendingInviteCount > 0;
  const hasChannel = input.channelCount > 0;
  const hasTask = input.emptyState.hasTasks;

  return [
    {
      id: "create-team",
      label: "Create a team",
      description: "Teams group related projects and members.",
      completed: hasTeam,
      dialogId: "create-team",
    },
    {
      id: "create-project",
      label: "Create a project",
      description: "Projects are where tasks and work are tracked.",
      completed: hasProject,
      dialogId: "create-project",
    },
    {
      id: "invite-members",
      label: "Invite teammates",
      description: "Bring your team in so work can be assigned.",
      completed: hasInvited,
      dialogId: "invite-member",
    },
    {
      id: "create-channel",
      label: "Create a channel",
      description: "Use channels for async team conversations.",
      completed: hasChannel,
      dialogId: "create-channel",
    },
    {
      id: "create-task",
      label: "Create your first task",
      description: "Add a task to start tracking work.",
      completed: hasTask,
      href: hasProject ? "/projects" : undefined,
      dialogId: hasProject ? undefined : "create-project",
    },
  ];
}

export function buildMemberSetupSteps(input: SetupProgressInput): SetupStep[] {
  const hasJoinedConversation =
    input.hasJoinedChannel || input.dmThreadCount > 0;

  return [
    {
      id: "join-conversation",
      label: "Join a conversation",
      description: "Open Messages to join a channel or start a DM.",
      completed: hasJoinedConversation,
      href: "/messages",
    },
    {
      id: "explore-projects",
      label: "Explore projects",
      description: input.emptyState.hasProjects
        ? "Browse the projects your team is working on."
        : "Projects will appear here once your team creates them.",
      completed: input.emptyState.hasProjects,
      href: "/projects",
    },
    {
      id: "review-tasks",
      label: "Review your tasks",
      description: input.emptyState.hasAssignedTasks
        ? "You have tasks assigned — open them to get started."
        : "Tasks appear here once a teammate assigns work to you.",
      completed: input.emptyState.hasAssignedTasks,
      href: "/projects",
    },
  ];
}

export function summarizeSetupProgress(steps: SetupStep[]) {
  const completedCount = steps.filter((step) => step.completed).length;
  const totalCount = steps.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const nextStep = steps.find((step) => !step.completed) ?? null;

  return { completedCount, totalCount, progressPercent, nextStep };
}

export function getWhatsNextTip(
  persona: "admin" | "member",
  nextStep: SetupStep | null,
  organizationName?: string,
): string {
  if (!nextStep) {
    return persona === "admin"
      ? "Your workspace is set up. Explore the sidebar to manage projects, teams, and messages."
      : `You're ready to collaborate in ${organizationName ?? "your organization"}. Check Messages and Projects from the sidebar.`;
  }

  const tips: Record<SetupStepId, string> = {
    "create-team": "Start by creating a team — every project belongs to one.",
    "create-project":
      "Create your first project to unlock task tracking and workload views.",
    "invite-members":
      "Invite at least one teammate so you can assign tasks and collaborate.",
    "create-channel":
      "Create a channel like #general for team updates and discussions.",
    "create-task":
      "Add a task to your project to see progress on your dashboard.",
    "join-conversation":
      "Head to Messages to join a channel or send a direct message.",
    "explore-projects":
      "Open Projects to see what your team is working on — or check back soon.",
    "review-tasks":
      "Your task list will populate once a project lead assigns work to you.",
  };

  return tips[nextStep.id];
}

const API_STEP_ID_MAP: Record<ApiSetupStepId, SetupStepId> = {
  CREATE_TEAM: "create-team",
  CREATE_PROJECT: "create-project",
  INVITE_MEMBERS: "invite-members",
  CREATE_CHANNEL: "create-channel",
  CREATE_TASK: "create-task",
  JOIN_CONVERSATION: "join-conversation",
  EXPLORE_PROJECTS: "explore-projects",
  REVIEW_TASKS: "review-tasks",
};

const STEP_DIALOG_MAP: Partial<Record<SetupStepId, SetupDialogId>> = {
  "create-team": "create-team",
  "create-project": "create-project",
  "invite-members": "invite-member",
  "create-channel": "create-channel",
};

function mapApiSetupStep(step: ApiSetupStep): SetupStep {
  const id = API_STEP_ID_MAP[step.id];
  const href = step.href ?? undefined;
  let dialogId: SetupDialogId | undefined;

  if (!step.completed && !href) {
    dialogId = STEP_DIALOG_MAP[id];
    if (id === "create-task") {
      dialogId = "create-project";
    }
  }

  return {
    id,
    label: step.label,
    description: step.description,
    completed: step.completed,
    href,
    dialogId,
  };
}

export function mapApiSetupProgress(progress: ApiDashboardSetupProgress): {
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  nextStep: SetupStep | null;
  isComplete: boolean;
} {
  const steps = progress.steps.map(mapApiSetupStep);
  const summary = summarizeSetupProgress(steps);

  return {
    steps,
    ...summary,
    isComplete: summary.completedCount === summary.totalCount,
  };
}
