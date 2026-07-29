import { createSupabaseBuildingModelRepository } from "@obrametrik/database";
import { messages } from "@obrametrik/i18n";
import { notFound } from "next/navigation";
import { ElectricalEditor } from "../../../../../../components/electrical-editor";
import { createSupabaseServerClient } from "../../../../../../lib/supabase/server";

export default async function ElectricalPage({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const t = messages[locale] ?? messages.ca;
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();
  const repository = createSupabaseBuildingModelRepository(supabase);
  const [spaces, elements, circuits, assignments] = await Promise.all([
    repository.findSpacesByProject(projectId),
    repository.findElementsByProject(projectId),
    supabase
      .from("electrical_circuits")
      .select("id,code,name")
      .eq("project_id", projectId)
      .order("created_at"),
    supabase
      .from("electrical_circuit_terminals")
      .select("circuit_id,terminal_element_id")
      .eq("project_id", projectId),
  ]);

  return (
    <ElectricalEditor
      assignments={assignments.data ?? []}
      circuits={circuits.data ?? []}
      elements={elements}
      locale={locale}
      messages={t}
      projectId={projectId}
      spaces={spaces}
    />
  );
}
