import { messages } from "@obrametrik/i18n";
export default async function Register({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
}) {
  const { locale } = await params;
  const t = messages[locale] ?? messages.ca;
  return (
    <main>
      <div className="card" style={{ maxWidth: "30rem" }}>
        <h1>{t.register}</h1>
        <p>{t.tagline}</p>
      </div>
    </main>
  );
}
