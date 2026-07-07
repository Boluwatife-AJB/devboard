/** biome-ignore-all lint/correctness/noUnusedVariables: by default all the types declared without "export" is available globally */

import type { Icon } from "@phosphor-icons/react";
import type { z } from "zod";
import type { createProjectSchema, signinSchema, signupSchema } from "@/lib/schema";

type SignupFormData = z.infer<typeof signupSchema>;
type SigninFormData = z.infer<typeof signinSchema>;
type CreateProjectFormData = z.infer<typeof createProjectSchema>;
type CreateTaskFormData = z.infer<typeof createTaskSchema>;

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

type TaskEventKind = "CREATED" | "UPDATED" | "DELETED";

interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
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
  assignee: ApiUser | null;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskUpdatedEvent {
  kind: TaskEventKind;
  task: ApiTask | null;
  taskId: string;
  projectId: string;
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
