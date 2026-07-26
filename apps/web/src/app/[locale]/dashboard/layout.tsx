import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { messages } from "@obrametrik/i18n";
import { DashboardShell } from "../../../components/dashboard-shell";

export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect(`/${locale}/login`);
  const safeLocale = locale as keyof typeof messages;
  const t = messages[safeLocale] ?? messages.ca;
  return (
    <DashboardShell email={data.user.email ?? ""} locale={safeLocale} t={t}>
      {children}
    </DashboardShell>
  );
}
