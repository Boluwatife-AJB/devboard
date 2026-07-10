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

export const signinSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(6, "Key must be at most 6 characters")
    .regex(
      /^[A-Z][A-Z0-9#_-]*$/,
      "Key must be uppercase letters and numbers (e.g. CORE)",
    ),
  teamId: z.uuid("Please select a team"),
  description: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
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
