"use server";

import {
  createMeasurementSchema,
  createRoomSchema,
  createSurfaceSchema,
  localeSchema,
  uuidSchema,
} from "@obrametrik/validation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

function path(formData: FormData) {
  const locale = localeSchema.catch("ca").parse(formData.get("locale"));
  const projectId = uuidSchema.parse(formData.get("projectId"));
  return { locale, projectId, value: `/${locale}/dashboard/projects/${projectId}` };
}

export async function createRoom(formData: FormData) {
  const route = path(formData);
  const parsed = createRoomSchema.safeParse({
    projectId: route.projectId, name: formData.get("name"), kind: formData.get("kind"),
    lengthCm: formData.get("lengthCm"), widthCm: formData.get("widthCm"), heightCm: formData.get("heightCm"),
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("rooms").insert({
    project_id: parsed.data.projectId, created_by: data.user.id, name: parsed.data.name,
    kind: parsed.data.kind, length_m: parsed.data.lengthCm / 100,
    width_m: parsed.data.widthCm / 100, height_m: parsed.data.heightCm / 100,
  });
  revalidatePath(route.value);
}

export async function createSurface(formData: FormData) {
  const route = path(formData);
  const parsed = createSurfaceSchema.safeParse({
    roomId: formData.get("roomId"), name: formData.get("name"), kind: formData.get("kind"),
    widthM: formData.get("widthM"), heightM: formData.get("heightM"),
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("surfaces").insert({
    room_id: parsed.data.roomId, created_by: data.user.id, name: parsed.data.name,
    kind: parsed.data.kind, width_m: parsed.data.widthM, height_m: parsed.data.heightM,
  });
  revalidatePath(route.value);
}

export async function createMeasurement(formData: FormData) {
  const route = path(formData);
  const parsed = createMeasurementSchema.safeParse({
    surfaceId: formData.get("surfaceId"), label: formData.get("label"), operation: "subtract",
    widthM: Number(formData.get("widthCm")) / 100,
    heightM: Number(formData.get("heightCm")) / 100,
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("measurements").insert({
    surface_id: parsed.data.surfaceId, created_by: data.user.id, label: parsed.data.label,
    operation: parsed.data.operation, width_m: parsed.data.widthM, height_m: parsed.data.heightM,
  });
  revalidatePath(route.value);
}
