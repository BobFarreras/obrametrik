import { messages } from "@obrametrik/i18n";
import Link from "next/link";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { logout } from "../auth/actions";

export default async function Dashboard({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
}) {
  const { locale } = await params;
  const t = messages[locale] ?? messages.ca;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main>
      <nav>
        <strong>{t.appName}</strong>
        <Link href={`/${locale}/dashboard/projects`}>{t.projects}</Link>
        <form action={logout}>
          <input name="locale" type="hidden" value={locale} />
          <button className="link-button" type="submit">{t.logout}</button>
        </form>
      </nav>
      <h1>{t.dashboard}</h1>
      <p>{t.welcome}, {data.user?.email}</p>
    </main>
  );
}
