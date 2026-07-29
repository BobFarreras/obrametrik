import { createSupabaseBuildingModelRepository } from "@obrametrik/database";
import { messages } from "@obrametrik/i18n";
import { notFound } from "next/navigation";
import { CadWorkspace, type ElectricalRouteOverlay } from "../../../../../components/cad-workspace";
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
  const [spaces, elements, routesResult] = await Promise.all([
    repository.findSpacesByProject(projectId),
    repository.findElementsByProject(projectId),
    supabase
      .from("electrical_route_segments")
      .select("id,space_id,path,route_role")
      .eq("project_id", projectId)
      .eq("status", "confirmed"),
  ]);
  const electricalRoutes: ElectricalRouteOverlay[] = (routesResult.data ?? []).flatMap((route) => {
    if (!Array.isArray(route.path)) return [];
    const path = route.path.flatMap((point) =>
      point &&
      typeof point === "object" &&
      !Array.isArray(point) &&
      typeof point.x === "number" &&
      typeof point.y === "number"
        ? [{ x: point.x, y: point.y }]
        : [],
    );
    return path.length >= 2
      ? [{ id: route.id, spaceId: route.space_id, path, role: route.route_role }]
      : [];
  });
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
        electricalRoutes={electricalRoutes}
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
