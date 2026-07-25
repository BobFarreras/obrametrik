import Link from "next/link";
import { messages } from "@obrametrik/i18n";
export default async function Home({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
}) {
  const { locale } = await params;
  const t = messages[locale] ?? messages.ca;
  return (
    <main>
      <nav>
        <strong>{t.appName}</strong>
        <Link href={`/${locale}/login`}>{t.login}</Link>
      </nav>
      <section style={{ paddingBlock: "6rem" }}>
        <p>Obrametrik</p>
        <h1 style={{ fontSize: "clamp(2.5rem,8vw,6rem)", maxWidth: "12ch" }}>{t.tagline}</h1>
        <Link className="button" href={`/${locale}/registre`}>
          {t.register}
        </Link>
      </section>
    </main>
  );
}
