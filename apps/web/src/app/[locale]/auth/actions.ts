"use server";

import { localeSchema, loginSchema, registerSchema } from "@obrametrik/validation";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export type AuthActionState = {
  error?: "invalidForm" | "invalidCredentials" | "authUnavailable";
};

function readCredentials(formData: FormData) {
  return {
    email: formData.get("email"),
    password: formData.get("password"),
  };
}

export async function login(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const locale = localeSchema.safeParse(formData.get("locale"));
  const credentials = loginSchema.safeParse(readCredentials(formData));
  if (!locale.success || !credentials.success) return { error: "invalidForm" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) return { error: "invalidCredentials" };
  redirect(`/${locale.data}/dashboard`);
}

export async function register(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const locale = localeSchema.safeParse(formData.get("locale"));
  const credentials = registerSchema.safeParse({
    ...readCredentials(formData),
    displayName: formData.get("displayName"),
  });
  if (!locale.success || !credentials.success) return { error: "invalidForm" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.data.email,
    password: credentials.data.password,
    options: {
      data: {
        display_name: credentials.data.displayName,
        preferred_locale: locale.data,
      },
    },
  });
  if (error) return { error: "authUnavailable" };
  if (!data.session) redirect(`/${locale.data}/login?confirmation=required`);
  redirect(`/${locale.data}/dashboard`);
}

export async function logout(formData: FormData) {
  const locale = localeSchema.catch("ca").parse(formData.get("locale"));
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
