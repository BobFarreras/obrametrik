import { messages } from "@obrametrik/i18n";
import { AuthForm } from "../auth/auth-form";
import { register } from "../auth/actions";
import { redirectAuthenticatedUser } from "../../../lib/auth/redirect-authenticated-user";

export const dynamic = "force-dynamic";

export default async function Register({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
}) {
  const { locale } = await params;
  await redirectAuthenticatedUser(locale);
  const t = messages[locale] ?? messages.ca;
  return (
    <main className="auth-page">
      <section className="auth-story" aria-hidden="true">
        <div className="auth-brand">Obrametrik<span>·</span></div>
        <div className="floating-plan"><span>＋</span><strong>{t.startFirstProject}</strong><small>{t.emptyProjectsHelp}</small></div>
        <p>{t.secureData}</p>
      </section>
      <div className="auth-card">
        <span className="mobile-brand">Obrametrik<span>·</span></span>
        <h1>{t.register}</h1>
        <p>{t.registerIntro}</p>
        <AuthForm action={register} locale={locale} mode="register" t={t} />
      </div>
    </main>
  );
}
