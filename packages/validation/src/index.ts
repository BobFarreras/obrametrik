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
export const createRoomSchema = z.object({
  projectId: uuidSchema,
  name: z.string().trim().min(2).max(120),
  kind: z.enum(["bathroom", "kitchen", "bedroom", "living_room", "hallway", "other"]),
  lengthCm: z.coerce.number().min(10).max(10000),
  widthCm: z.coerce.number().min(10).max(10000),
  heightCm: z.coerce.number().min(10).max(2000),
});
export const createSurfaceSchema = z.object({
  roomId: uuidSchema,
  name: z.string().trim().min(2).max(120),
  kind: z.enum(["wall", "floor", "ceiling", "other"]),
  widthM: z.coerce.number().positive().max(100),
  heightM: z.coerce.number().positive().max(20),
});
export const createMeasurementSchema = z.object({
  surfaceId: uuidSchema,
  label: z.string().trim().min(2).max(120),
  operation: z.enum(["add", "subtract"]).default("subtract"),
  widthM: z.coerce.number().positive().max(100),
  heightM: z.coerce.number().positive().max(20),
});
export const surfaceWorkScopeSchema = z.object({
  surfaceId: uuidSchema,
  existingFinish: z.enum([
    "paint",
    "tile",
    "plaster",
    "drywall",
    "concrete",
    "wood",
    "unknown",
    "other",
  ]),
  condition: z.enum(["good", "minor_damage", "damaged", "damp", "unknown"]),
  waterExposure: z.enum(["dry", "occasional", "wet"]),
  removeExisting: z.boolean(),
  desiredWorks: z
    .array(
      z.enum([
        "paint",
        "tile",
        "plaster",
        "wallpaper",
        "repair",
        "waterproof",
        "replace",
        "leave_as_is",
        "other",
      ]),
    )
    .min(1)
    .max(9),
  notes: z.string().trim().max(1000).optional(),
});
const point2MmSchema = z.object({
  x: z.number().int().min(-1_000_000).max(1_000_000),
  y: z.number().int().min(-1_000_000).max(1_000_000),
});
export const cadSpacePlanSchema = z.object({
  projectId: uuidSchema,
  name: z.string().trim().min(1).max(120),
  kind: z.enum([
    "bathroom",
    "kitchen",
    "bedroom",
    "living_room",
    "hallway",
    "utility",
    "exterior",
    "other",
  ]),
  vertices: z.array(point2MmSchema).min(3).max(1000),
  clearHeightMm: z.number().int().min(100).max(20_000),
  components: z
    .array(
      z.object({
        kind: z.enum([
          "door",
          "window",
          "light",
          "switch",
          "socket",
          "cold_water",
          "hot_water",
          "drain",
        ]),
        point: point2MmSchema,
        wallIndex: z.number().int().min(0).max(999),
        widthMm: z.number().int().min(20).max(20_000).optional(),
        heightMm: z.number().int().min(20).max(20_000).optional(),
        elevationMm: z.number().int().min(0).max(20_000).optional(),
        variant: z
          .enum([
            "hinged",
            "sliding",
            "pocket",
            "folding",
            "double_hinged",
            "casement",
            "tilt_turn",
            "fixed",
            "awning",
            "ceiling",
            "wall",
            "recessed",
            "pendant",
            "single",
            "double",
            "dimmer",
            "two_way",
            "usb",
            "wall_outlet",
            "floor_outlet",
            "manifold",
            "floor",
            "linear",
          ])
          .optional(),
      }),
    )
    .max(1000),
});
export const publicWebEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_"),
});
export const publicMobileEnvironmentSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_"),
});
