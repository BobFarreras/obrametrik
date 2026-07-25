import { messages } from "@obrametrik/i18n";
export default async function Login({
  params,
}: {
  params: Promise<{ locale: keyof typeof messages }>;
}) {
  const { locale } = await params;
  const t = messages[locale] ?? messages.ca;
  return (
    <main>
      <div className="card" style={{ maxWidth: "30rem" }}>
        <h1>{t.login}</h1>
        <form>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={10}
              required
            />
          </label>
          <button className="button" type="submit">
            {t.login}
          </button>
        </form>
      </div>
    </main>
  );
}
