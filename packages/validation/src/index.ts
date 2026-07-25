/**
 * @file packages/validation/src/index.ts
 * @description Validates external input shared by web, mobile and API adapters.
 */
import { z } from "zod";

export const uuidSchema = z.uuid();
export const paginationSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const localeSchema = z.enum(["ca", "es", "en"]);
export const loginSchema = z.object({ email: z.email(), password: z.string().min(10).max(128) });
export const registerSchema = loginSchema.extend({ displayName: z.string().trim().min(2).max(80) });
export const createProjectSchema = z.object({
  organizationId: uuidSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
});
export const updateProjectSchema = createProjectSchema.omit({ organizationId: true }).partial();
export const publicWebEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_"),
});
export const publicMobileEnvironmentSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_"),
});
