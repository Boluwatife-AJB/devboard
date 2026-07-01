import type { z } from "zod";
import type { signinSchema, signupSchema } from "@/lib/schema";

export type SignupFormData = z.infer<typeof signupSchema>;
export type SigninFormData = z.infer<typeof signinSchema>;
