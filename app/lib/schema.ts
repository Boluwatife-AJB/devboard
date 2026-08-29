import { z } from "zod";

export const signupStep1Schema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const signupStep2Schema = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  orgSlug: z
    .string()
    .min(2, "Organization slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export const signupSchema = signupStep1Schema.extend(signupStep2Schema.shape);

export const acceptInviteSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export const signinSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(10, "Key must be at most 6 characters")
    .regex(
      /^[A-Z][A-Z0-9#_-]*$/,
      "Key must be uppercase letters and numbers (e.g. CORE)",
    ),
  teamId: z.uuid("Please select a team"),
  description: z.string().optional(),
});

export const attachmentKindSchema = z.enum([
  "LINK",
  "GITHUB_ISSUE",
  "GITHUB_PR",
]);

export const taskAttachmentSchema = z.object({
  kind: attachmentKindSchema,
  label: z
    .string()
    .min(1, "Label is required")
    .max(255, "Label must be 255 characters or fewer"),
  url: z
    .string()
    .min(1, "URL is required")
    .max(2048, "URL must be 2048 characters or fewer")
    .refine(
      (value) => value.startsWith("http://") || value.startsWith("https://"),
      "URL must start with http:// or https://",
    ),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  attachments: z.array(taskAttachmentSchema).default([]),
});

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(50000, "Comment is too long"),
});

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be 100 characters or fewer"),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const addProjectMemberSchema = z.object({
  userId: z.uuid("Please select a member"),
  roleOverride: z.enum(["OWNER", "ADMIN", "CONTRIBUTOR", "VIEWER"]).optional(),
});

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(100, "Channel name must be 100 characters or fewer")
    .regex(/[a-zA-Z0-9]/, "Channel name must contain letters or numbers"),
  description: z.string().optional(),
  kind: z.enum(["OPEN", "PRIVATE"]),
});

export const inviteMemberSchema = z.object({
  email: z.email("Please enter a valid email address"),
  role: z.enum(["ORG_ADMIN", "ORG_MEMBER"]),
});

export const editProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(30, "Display name must be 30 characters or fewer")
    .regex(
      /^[a-z0-9_-]+$/,
      "Display name can only contain lowercase letters, numbers, underscores, and hyphens",
    ),
  pronouns: z.enum([
    "He / Him",
    "She / Her",
    "They / Them",
    "Prefer not to say",
    "",
  ]),
  title: z.string().optional(),
  bio: z.string().max(500, "Bio must be 500 characters or fewer").optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || value.startsWith("http://") || value.startsWith("https://"),
      "Website must start with http:// or https://",
    ),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
});

export const notificationSettingsSchema = z.object({
  taskAssigned: z.boolean(),
  taskDueSoon: z.boolean(),
  mentions: z.boolean(),
  taskComments: z.boolean(),
  channelMessages: z.boolean(),
  announcements: z.boolean(),
  emailDigest: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
