import { messages } from "@obrametrik/i18n";
import { AuthForm } from "../auth/auth-form";
import { login } from "../auth/actions";
import { redirectAuthenticatedUser } from "../../../lib/auth/redirect-authenticated-user";

export const dynamic = "force-dynamic";

export default async function Login({
  params,
  searchParams,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
  searchParams: Promise<{ confirmation?: string }>;
}) {
  const { locale } = await params;
  await redirectAuthenticatedUser(locale);
  const query = await searchParams;
  const t = messages[locale] ?? messages.ca;
  return (
    <main>
      <div className="card" style={{ maxWidth: "30rem" }}>
        <h1>{t.login}</h1>
        <p>{t.loginIntro}</p>
        {query.confirmation === "required" ? (
          <p role="status">{t.emailConfirmationRequired}</p>
        ) : null}
        <AuthForm action={login} locale={locale} mode="login" t={t} />
      </div>
    </main>
  );
}
