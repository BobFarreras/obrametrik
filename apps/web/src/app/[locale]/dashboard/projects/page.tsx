import { messages } from "@obrametrik/i18n";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { createProject, deleteProject } from "./actions";
import Link from "next/link";

export default async function Projects({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
}) {
  const { locale } = await params;
  const t = messages[locale] ?? messages.ca;
  const supabase = await createSupabaseServerClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,description,status,created_at")
    .order("created_at", { ascending: false });
  return (
    <main className="dashboard-main">
      <header className="page-header"><div><span className="eyebrow">{t.appName}</span><h1>{t.projects}</h1><p>{t.emptyProjectsHelp}</p></div></header>
      <section className="projects-layout">
        <div className={projects?.length ? "project-list" : "empty-state"}>
          {projects?.length ? projects.map((project) => (
            <article className="project-row" key={project.id}>
              <div className="project-thumb" aria-hidden="true">⌂</div>
              <div><span className="status-chip">{t.draft}</span><h2><Link href={`/${locale}/dashboard/projects/${project.id}`}>{project.name}</Link></h2><p>{project.description}</p></div>
              <form action={deleteProject}>
                <input name="locale" type="hidden" value={locale} />
                <input name="projectId" type="hidden" value={project.id} />
                <button className="text-danger" type="submit">{t.delete}</button>
              </form>
            </article>
          )) : <>
            <div className="empty-icon" aria-hidden="true">▱</div>
            <h2>{t.emptyProjects}</h2>
            <p>{t.emptyProjectsHelp}</p>
          </>}
        </div>
        <form action={createProject} className="new-project-card" id="new">
          <input name="locale" type="hidden" value={locale} />
          <span className="status-chip">{t.newProject}</span>
          <h2>{t.createProject}</h2>
          <label>{t.projectName}<input name="name" placeholder="Reforma del bany" /></label>
          <label>{t.projectAddress}<input name="address" placeholder="Barcelona" /></label>
          <button className="button" type="submit">{t.createProject} →</button>
        </form>
      </section>
    </main>
  );
}
