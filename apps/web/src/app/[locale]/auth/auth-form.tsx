"use client";

import type { messages } from "@obrametrik/i18n";
import Link from "next/link";
import { useActionState } from "react";
import type { AuthActionState } from "./actions";

type Translation = (typeof messages)[keyof typeof messages];

export function AuthForm({
  action,
  locale,
  mode,
  t,
}: {
  action: (state: AuthActionState, data: FormData) => Promise<AuthActionState>;
  locale: keyof typeof messages;
  mode: "login" | "register";
  t: Translation;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isRegister = mode === "register";

  return (
    <form action={formAction}>
      <input name="locale" type="hidden" value={locale} />
      {isRegister ? (
        <label>
          {t.displayName}
          <input name="displayName" autoComplete="name" minLength={2} maxLength={80} required />
        </label>
      ) : null}
      <label>
        {t.email}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {t.password}
        <input
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={10}
          maxLength={128}
          required
        />
      </label>
      {state.error ? <p role="alert">{t[state.error]}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? t.loading : isRegister ? t.register : t.login}
      </button>
      <p>
        {isRegister ? t.hasAccount : t.noAccount}{" "}
        <Link href={`/${locale}/${isRegister ? "login" : "registre"}`}>
          {isRegister ? t.login : t.register}
        </Link>
      </p>
    </form>
  );
}
