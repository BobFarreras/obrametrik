"use server";

import { createProjectSchema, localeSchema, uuidSchema } from "@obrametrik/validation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function createProject(formData: FormData) {
  const locale = localeSchema.catch("ca").parse(formData.get("locale"));
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!organization) return;

  const parsed = createProjectSchema.safeParse({
    organizationId: organization.id,
    name: formData.get("name"),
    description: formData.get("address") || undefined,
  });
  if (!parsed.success) return;

  await supabase.from("projects").insert({
    organization_id: parsed.data.organizationId,
    created_by: auth.user.id,
    name: parsed.data.name,
    description: parsed.data.description,
  });
  revalidatePath(`/${locale}/dashboard/projects`);
  revalidatePath(`/${locale}/dashboard`);
}

export async function deleteProject(formData: FormData) {
  const locale = localeSchema.catch("ca").parse(formData.get("locale"));
  const projectId = uuidSchema.safeParse(formData.get("projectId"));
  if (!projectId.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("projects").delete().eq("id", projectId.data);
  revalidatePath(`/${locale}/dashboard/projects`);
}
