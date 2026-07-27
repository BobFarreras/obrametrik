import { createSupabaseBuildingModelRepository } from "@obrametrik/database";
import { messages } from "@obrametrik/i18n";
import { notFound } from "next/navigation";
import { CadWorkspace } from "../../../../../components/cad-workspace";
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
    </main>
  );
}
