/** biome-ignore-all lint/correctness/noUnusedVariables: by default all the types declared without "export" is available globally */

import type { Icon } from "@phosphor-icons/react";
import type { z } from "zod";
import type {
  addProjectMemberSchema,
  acceptInviteSignupSchema,
  createChannelSchema,
  createCommentSchema,
  createProjectSchema,
  createTaskSchema,
  createTeamSchema,
  inviteMemberSchema,
  signinSchema,
  signupSchema,
  updateProjectSchema,
} from "@/lib/schema";

type SignupFormData = z.infer<typeof signupSchema>;
type SigninFormData = z.infer<typeof signinSchema>;
type CreateProjectFormData = z.infer<typeof createProjectSchema>;
type CreateTaskFormData = z.infer<typeof createTaskSchema>;
type CreateTeamFormData = z.infer<typeof createTeamSchema>;
type CreateCommentFormData = z.infer<typeof createCommentSchema>;
type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;
type AddProjectMemberFormData = z.infer<typeof addProjectMemberSchema>;
type CreateChannelFormData = z.infer<typeof createChannelSchema>;
type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;
type AcceptInviteSignupFormData = z.infer<typeof acceptInviteSignupSchema>;
interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  organizations: Organization[];
}

interface SidebarLink {
  name: string;
  path: string;
  icon: Icon;
  requiredAction?: import("@/lib/rbac/actions").Action;
}

type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELLED";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type AttachmentKind = "LINK" | "GITHUB_ISSUE" | "GITHUB_PR";

type TaskEventKind = "CREATED" | "UPDATED" | "DELETED";

type TeamRole = "OWNER" | "ADMIN" | "MEMBER";

type OrgRole = "ORG_OWNER" | "ORG_ADMIN" | "ORG_MEMBER";

type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

type NotificationKind =
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "TASK_STATUS_CHANGED"
  | "TASK_CREATED"
  | "MENTION"
  | "TASK_COMMENT"
  | "CHANNEL_MESSAGE"
  | "DM_THREAD_MESSAGE"
  | "ANNOUNCEMENT"
  | "INVITE_RECEIVED";

type DashboardCta =
  | "CREATE_PROJECT"
  | "INVITE_MEMBER"
  | "CREATE_TASK"
  | "EXPLORE";

interface ApiDashboardEmptyState {
  hasProjects: boolean;
  hasTasks: boolean;
  hasAssignedTasks: boolean;
  primaryCta: DashboardCta;
}

interface ApiDashboardTaskItem {
  id: string;
  projectId: string;
  key: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  isOverdue: boolean;
}

interface ApiCompletionPoint {
  day: string;
  completed: number;
}

interface ApiMyDashboard {
  greetingName: string;
  organizationName: string;
  emptyState: ApiDashboardEmptyState;
  stats: {
    tasksAssignedToMe: number;
    tasksDueThisWeek: number;
    overdueTasks: number;
    tasksInProgress: number;
  };
  myTasks: ApiDashboardTaskItem[];
  myProjects: {
    id: string;
    name: string;
    key: string;
    openTasks: number;
    myOpenTasks: number;
  }[];
  upcomingEvents: { id: string; title: string; startsAt: string }[];
  completionTrend: ApiCompletionPoint[];
}

interface ApiOrgDashboard {
  greetingName: string;
  organizationName: string;
  emptyState: ApiDashboardEmptyState;
  stats: {
    overdueTasks: number;
    unassignedTasks: number;
    unassignedUrgentTasks: number;
    pendingInvites: number;
    openTasks: number;
    movedThisWeek: number;
  };
  riskTasks: ApiDashboardTaskItem[];
  attention: {
    id: string;
    kind: string;
    title: string;
    description: string;
    actionLabel: string;
    href: string | null;
    count: number;
  }[];
  workloadByTeam: WorkloadPoint[];
  completionTrend: ApiCompletionPoint[];
}

interface ApiNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ApiInvitation {
  id: string;
  email: string;
  role: OrgRole;
  status: InvitationStatus;
  invitedBy: string;
  inviteUrl: string;
  expiresAt: string;
  createdAt: string;
}

interface CreateInviteResponse {
  message: string;
  inviteUrl: string;
  emailSent: boolean;
}

interface AcceptInviteResponse {
  message: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

interface InvitePreview {
  email: string;
  orgName: string;
  role: OrgRole;
  expiresAt: string;
}

type ProjectRole = "OWNER" | "ADMIN" | "CONTRIBUTOR" | "VIEWER";

type UiPresence = "online" | "away" | "offline";

interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface ApiTeam {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiTeamMember {
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user: ApiUser | null;
}

interface ApiOrgMember {
  userId: string;
  role: OrgRole;
  joinedAt: string;
  user: ApiUser | null;
}

interface ApiProject {
  id: string;
  organizationId: string;
  teamId: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiTask {
  id: string;
  projectId: string;
  key: string;
  taskNumber: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: ApiUser | null;
  reporterId: string;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiAttachment {
  id: string;
  taskId: string;
  addedBy: string;
  kind: AttachmentKind;
  label: string;
  url: string;
  createdAt: string;
}

interface ApiComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  isEdited: boolean;
  createdAt: string;
  editedAt: string | null;
  author: ApiUser | null;
}

interface TaskUpdatedEvent {
  kind: TaskEventKind;
  task: ApiTask | null;
  taskId: string;
  projectId: string;
}

interface AddTeamMemberInput {
  teamId: string;
  userId: string;
  role?: TeamRole | null;
}

interface CreateProjectInput {
  teamId: string;
  organizationId: string;
  name: string;
  key: string;
  description?: string | null;
}

interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority | null;
  assigneeId?: string | null;
  dueDate?: string | null;
}

interface AddAttachmentInput {
  taskId: string;
  projectId: string;
  kind: AttachmentKind;
  label: string;
  url: string;
}

interface CreateCommentInput {
  taskId: string;
  projectId: string;
  body: string;
}

interface UpdateTaskStatusInput {
  taskId: string;
  projectId: string;
  status: TaskStatus;
}

interface AssignTaskInput {
  taskId: string;
  projectId: string;
  assigneeId?: string | null;
}

interface UpdateProjectInput {
  projectId: string;
  name?: string | null;
  description?: string | null;
}

interface AddProjectMemberInput {
  projectId: string;
  userId: string;
  roleOverride?: ProjectRole | null;
}

type MessageChannel = {
  id: string;
  slug: string;
  name: string;
  description: string;
  memberCount: number;
  subtitle: string;
};

type DirectMessage = {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: "online" | "away" | "offline";
};

type ChatMessage =
  | {
      id: string;
      type: "text";
      author: string;
      initials: string;
      avatarColor: string;
      isSelf: boolean;
      timestamp: string;
      body: string;
      read?: boolean;
      reactions?: { emoji: string; count: number }[];
    }
  | {
      id: string;
      type: "commit";
      author: string;
      initials: string;
      avatarColor: string;
      isSelf: boolean;
      timestamp: string;
      body: string;
      commitHash: string;
      commitMessage: string;
    };

type ChannelMember = {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: "online" | "offline";
};

type SharedFile = {
  id: string;
  name: string;
  size: string;
  date: string;
  kind: "pdf" | "image" | "code";
};

type ChannelKind = "OPEN" | "PRIVATE";

type PresenceStatus = "ONLINE" | "AWAY" | "OFFLINE";

type MessageEventKind = "NEW" | "EDITED" | "DELETED";

type ActiveConversation =
  | { type: "channel"; id: string }
  | { type: "dm"; id: string };

interface ApiChannel {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: ChannelKind;
  createdAt: string;
  isMember: boolean;
  unreadCount: number;
}

interface ApiChannelMember {
  channelId: string;
  userId: string;
  joinedAt: string;
  user: ApiUser | null;
}

interface CreateChannelInput {
  slug: string;
  name: string;
  description?: string | null;
  kind?: ChannelKind | null;
}

interface ApiMessageEmbed {
  kind: string;
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  repo?: string | null;
  sha?: string | null;
  number?: number | null;
  state?: string | null;
}

interface ApiMessage {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  isEdited: boolean;
  embeds: ApiMessageEmbed[];
  reactions?: ApiReactionSummary[];
}

interface SendMessageInput {
  channelId: string;
  body: string;
}

interface EditMessageInput {
  messageId: string;
  body: string;
}

interface DeleteMessageInput {
  messageId: string;
  orgId: string;
}

interface EditDmInput {
  messageId: string;
  body: string;
}

interface DeleteDmInput {
  messageId: string;
}

interface ReactionInput {
  messageId: string;
  emoji: string;
}

interface ApiReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

interface MarkChannelAsReadInput {
  channelId: string;
  lastMessageId: string;
}

interface ApiDmThread {
  id: string;
  participantA: string;
  participantB: string;
  createdAt: string;
  unreadCount: number;
}

interface ApiDmMessage {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  isEdited: boolean;
  isRead: boolean;
  readByRecipientAt?: string | null;
}

interface SendDmInput {
  threadId: string;
  body: string;
}

interface ApiMessageEvent {
  kind: MessageEventKind | string;
  channelId: string;
  messageId: string;
  message: ApiMessage | null;
}

interface ApiDmMessageEvent {
  kind: MessageEventKind | string;
  threadId: string;
  messageId: string;
  message: ApiDmMessage | null;
}

interface ApiReactionEvent {
  channelId: string;
  messageId: string;
}

interface ApiUserPresence {
  userId: string;
  status: PresenceStatus;
}

interface DisplayMessage {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  isEdited: boolean;
  isRead?: boolean;
  embeds?: ApiMessageEmbed[];
  reactions?: ApiReactionSummary[];
  channelId?: string;
}

type StatTone = "default" | "warning" | "accent";

type DashboardStat = {
  id: string;
  label: string;
  value: number;
  hint: string;
  icon: Icon;
  tone?: StatTone;
};

type RiskTaskStatus = "Blocked" | "In Progress" | "Todo";

type RiskTask = {
  id: string;
  key: string;
  title: string;
  status: RiskTaskStatus;
  dueLabel: string;
  overdue?: boolean;
};

type AttentionItem = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
};

type QuickAction = {
  id: string;
  label: string;
  href: string;
  icon: Icon;
};

type WorkloadPoint = {
  team: string;
  todo: number;
  inProgress: number;
  done: number;
};

type MemberTaskStatus = "OVERDUE" | "IN_PROGRESS" | "TODO";

type MemberTask = {
  id: string;
  key: string;
  title: string;
  status: MemberTaskStatus;
  dueLabel: string;
};

type MemberProject = {
  id: string;
  name: string;
  tag: string;
  openTasks: number;
  members: { id: string; name: string; initials: string }[];
};

type UpcomingEvent = {
  id: string;
  dateLabel: string;
  title: string;
  time: string;
};

type CompletionPoint = {
  day: string;
  completed: number;
};
