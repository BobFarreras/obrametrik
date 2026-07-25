import { messages } from "@obrametrik/i18n";

export default async function Projects({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
}) {
  const { locale } = await params;
  const t = messages[locale] ?? messages.ca;
  return (
    <main>
      <h1>{t.projects}</h1>
      <div className="card">{t.emptyProjects}</div>
    </main>
  );
}
