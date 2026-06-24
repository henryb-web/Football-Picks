import { z } from "zod";

export const signupSchema = z.object({
  email: z.email("Enter a valid email address."),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be 20 characters or fewer.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});
