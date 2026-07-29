import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../supabase/server";

export async function redirectAuthenticatedUser(locale: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (!error && data.user) redirect(`/${locale}/dashboard`);
}
