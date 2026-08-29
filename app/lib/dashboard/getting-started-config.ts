import type { Icon } from "@phosphor-icons/react";
import {
  ChatTextIcon,
  ClipboardTextIcon,
  FolderIcon,
  GearIcon,
  HashIcon,
  UserCircleIcon,
  UserCirclePlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Action as ActionType } from "@/lib/rbac/actions";
import { Action } from "@/lib/rbac/actions";

export type QuickStartItem = {
  id: string;
  label: string;
  description: string;
  href?: string;
  icon: Icon;
  dialogId?:
    | "create-team"
    | "create-project"
    | "invite-member"
    | "create-channel";
  action?: ActionType;
};

export const adminQuickStartItems: QuickStartItem[] = [
  {
    id: "invite-member",
    label: "Invite members",
    description: "Bring your team into the workspace",
    icon: UserCirclePlusIcon,
    dialogId: "invite-member",
    action: Action.InviteOrgMember,
  },
  {
    id: "create-project",
    label: "New project",
    description: "Start tracking tasks and progress",
    icon: FolderIcon,
    dialogId: "create-project",
    action: Action.CreateProject,
  },
  {
    id: "create-channel",
    label: "New channel",
    description: "Set up #general or team channels",
    icon: HashIcon,
    dialogId: "create-channel",
    action: Action.CreateChannel,
  },
  {
    id: "create-team",
    label: "Create team",
    description: "Organize people and projects",
    icon: UsersThreeIcon,
    dialogId: "create-team",
    action: Action.CreateTeam,
  },
  {
    id: "open-settings",
    label: "Org settings",
    description: "Manage members and roles",
    href: "/settings",
    icon: GearIcon,
    action: Action.ViewOrgDashboard,
  },
];

export const memberQuickStartItems: QuickStartItem[] = [
  {
    id: "messages",
    label: "Messages",
    description: "Join channels and chat with teammates",
    href: "/messages",
    icon: ChatTextIcon,
  },
  {
    id: "projects",
    label: "Projects",
    description: "Browse team workspaces and boards",
    href: "/projects",
    icon: FolderIcon,
  },
  {
    id: "tasks",
    label: "My tasks",
    description: "See work assigned to you",
    href: "/projects",
    icon: ClipboardTextIcon,
  },
  {
    id: "profile",
    label: "Your profile",
    description: "View and update your account",
    href: "/profile",
    icon: UserCircleIcon,
  },
];

export const appMapSteps = [
  {
    title: "Structure",
    description: "Teams contain projects. Projects contain tasks.",
  },
  {
    title: "People",
    description: "Invite members and assign roles in Settings.",
  },
  {
    title: "Collaborate",
    description: "Use Messages for channels and direct messages.",
  },
] as const;
