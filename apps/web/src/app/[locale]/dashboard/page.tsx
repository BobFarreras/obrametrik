import { messages } from "@obrametrik/i18n";
import Link from "next/link";

export default async function Dashboard({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
}) {
  const { locale } = await params;
  const t = messages[locale] ?? messages.ca;
  return (
    <main className="dashboard-main">
      <header className="page-header">
        <div><span className="eyebrow">{t.today}</span><h1>{t.goodMorning}</h1><p>{t.dashboardIntro}</p></div>
        <Link className="button" href={`/${locale}/dashboard/projects#new`}>＋ {t.newProject}</Link>
      </header>
      <section>
        <div className="section-heading"><h2>{t.recentProjects}</h2><Link href={`/${locale}/dashboard/projects`}>{t.viewAll} →</Link></div>
        <div className="empty-project-card">
          <div className="project-visual" aria-hidden="true"><span>⌂</span></div>
          <div><span className="status-chip">{t.draft}</span><h2>{t.startFirstProject}</h2><p>{t.emptyProjectsHelp}</p></div>
          <Link className="circle-action" href={`/${locale}/dashboard/projects#new`} aria-label={t.newProject}>→</Link>
        </div>
      </section>
      <section>
        <div className="section-heading"><h2>{t.quickActions}</h2></div>
        <div className="quick-grid">
          <Link href={`/${locale}/dashboard/projects`}><span>＋</span><strong>{t.addMeasurement}</strong><small>{t.projects}</small></Link>
          <Link href={`/${locale}/dashboard/projects`}><span>⌗</span><strong>{t.scanSpace}</strong><small>{t.projects}</small></Link>
          <Link href={`/${locale}/dashboard/projects`}><span>€</span><strong>{t.openBudget}</strong><small>{t.projects}</small></Link>
        </div>
      </section>
    </main>
  );
}
