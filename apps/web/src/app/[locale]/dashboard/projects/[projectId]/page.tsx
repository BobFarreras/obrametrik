import { createSupabaseBuildingModelRepository } from "@obrametrik/database";
import { messages } from "@obrametrik/i18n";
import { notFound } from "next/navigation";
import { CadWorkspace } from "../../../../../components/cad-workspace";
import { ElectricalTakeoffPanel } from "../../../../../components/electrical-takeoff-panel";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const t = messages[locale] ?? messages.ca;
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id,name,description")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const repository = createSupabaseBuildingModelRepository(supabase);
  const [spaces, elements] = await Promise.all([
    repository.findSpacesByProject(projectId),
    repository.findElementsByProject(projectId),
  ]);
  const { data: latestRun } = await supabase
    .from("takeoff_runs")
    .select("*")
    .eq("project_id", projectId)
    .eq("trade", "electrical")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const [{ data: lines }, { data: shoppingItems }] = await Promise.all([
    latestRun
      ? supabase
          .from("takeoff_lines")
          .select("*")
          .eq("project_id", projectId)
          .eq("run_id", latestRun.id)
          .order("category_id")
      : Promise.resolve({ data: [] }),
    supabase
      .from("shopping_list_items")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at"),
  ]);

  return (
    <main className="dashboard-main cad-project-page">
      <CadWorkspace
        locale={locale}
        projectId={projectId}
        projectName={project.name}
        projectDescription={project.description}
        spaces={spaces}
        elements={elements}
        messages={t}
      />
      <ElectricalTakeoffPanel
        locale={locale}
        projectId={projectId}
        messages={t}
        latestRun={latestRun}
        lines={lines ?? []}
        shoppingItems={shoppingItems ?? []}
      />
    </main>
  );
}
