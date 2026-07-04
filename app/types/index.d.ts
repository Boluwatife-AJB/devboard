/** biome-ignore-all lint/correctness/noUnusedVariables: by default all the types declared without "export" is available globally */

import type { Icon } from "@phosphor-icons/react";
import type { z } from "zod";
import type { signinSchema, signupSchema } from "@/lib/schema";

type SignupFormData = z.infer<typeof signupSchema>;
type SigninFormData = z.infer<typeof signinSchema>;

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
