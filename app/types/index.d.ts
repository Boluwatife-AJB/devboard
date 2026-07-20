/** biome-ignore-all lint/correctness/noUnusedVariables: by default all the types declared without "export" is available globally */

import type { Icon } from "@phosphor-icons/react";
import type { z } from "zod";
import type {
  addProjectMemberSchema,
  createCommentSchema,
  createProjectSchema,
  createTaskSchema,
  createTeamSchema,
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

type ProjectRole = "OWNER" | "ADMIN" | "CONTRIBUTOR" | "VIEWER";

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
