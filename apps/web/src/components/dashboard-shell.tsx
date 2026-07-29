"use client";

import type { messages } from "@obrametrik/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "../app/[locale]/auth/actions";

type Translation = (typeof messages)[keyof typeof messages];

export function DashboardShell({
  children,
  email,
  locale,
  t,
}: {
  children: React.ReactNode;
  email: string;
  locale: keyof typeof messages;
  t: Translation;
}) {
  const pathname = usePathname();
  const items = [
    { href: `/${locale}/dashboard`, icon: "⌂", label: t.home },
    { href: `/${locale}/dashboard/projects`, icon: "▱", label: t.projects },
    { href: `/${locale}/dashboard`, icon: "◷", label: t.activity },
  ];

  return (
    <div className="app-shell">
      <aside className="side-rail" aria-label={t.navigation}>
        <Link className="brand-mark" href={`/${locale}/dashboard`} aria-label={t.appName}>
          O<span>·</span>
        </Link>
        <div className="rail-links">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                className={`rail-link${active ? " is-active" : ""}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                <small>{item.label}</small>
              </Link>
            );
          })}
        </div>
        <form action={logout}>
          <input name="locale" type="hidden" value={locale} />
          <button className="avatar-button" type="submit" title={t.logout}>
            {email.slice(0, 1).toUpperCase()}
          </button>
        </form>
      </aside>
      <div className="app-content">{children}</div>
      <nav className="bottom-nav" aria-label={t.navigation}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              className={active ? "is-active" : undefined}
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <small>{item.label}</small>
            </Link>
          );
        })}
        <form action={logout}>
          <input name="locale" type="hidden" value={locale} />
          <button type="submit"><span aria-hidden="true">○</span><small>{t.profile}</small></button>
        </form>
      </nav>
    </div>
  );
}
