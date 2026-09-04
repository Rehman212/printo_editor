import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const designNameSchema = z.object({
  name: z.string().min(1).max(80),
});

export const qrSchema = z.object({
  content: z.string().min(1, "Enter a URL or text"),
  foreground: z.string(),
  background: z.string(),
  errorCorrection: z.enum(["L", "M", "Q", "H"]),
});
