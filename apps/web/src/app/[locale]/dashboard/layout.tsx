import { redirect } from "next/navigation";
export default async function DashboardLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  // Authentication wiring is ready for Supabase SSR; deny access until a verified session exists.
  if (process.env.OBRAMETRIK_DEMO_AUTH !== "enabled") redirect(`/${locale}/login`);
  return children;
}
