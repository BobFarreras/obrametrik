import { messages } from "@obrametrik/i18n";
import { loginSchema, registerSchema } from "@obrametrik/validation";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { getDeviceLocale } from "../lib/i18n";
import { supabase } from "../lib/supabase";

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const locale = getDeviceLocale();
  const t = messages[locale];
  const schema = mode === "register" ? registerSchema : loginSchema;
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues | RegisterValues>({
    defaultValues:
      mode === "register"
        ? { displayName: "", email: "", password: "" }
        : { email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    const validated = schema.safeParse(values);
    if (!validated.success) {
      setError("root", { message: t.invalidForm });
      return;
    }
    if (mode === "register") {
      const registerValues = validated.data as RegisterValues;
      const { data, error } = await supabase.auth.signUp({
        email: registerValues.email,
        password: registerValues.password,
        options: {
          data: {
            display_name: registerValues.displayName,
            preferred_locale: locale,
          },
        },
      });
      if (error) {
        setError("root", { message: t.authUnavailable });
        return;
      }
      if (!data.session) {
        setError("root", { message: t.emailConfirmationRequired });
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword(validated.data as LoginValues);
      if (error) {
        setError("root", { message: t.invalidCredentials });
        return;
      }
    }
    router.replace("/projects");
  });

  return (
    <View style={styles.form}>
      {mode === "register" ? (
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              accessibilityLabel={t.displayName}
              autoComplete="name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t.displayName}
              style={styles.input}
              value={value ?? ""}
            />
          )}
        />
      ) : null}
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            accessibilityLabel={t.email}
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={t.email}
            style={styles.input}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            accessibilityLabel={t.password}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={t.password}
            secureTextEntry
            style={styles.input}
            value={value}
          />
        )}
      />
      {errors.root ? <Text accessibilityRole="alert">{errors.root.message}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={submit}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? t.loading : mode === "register" ? t.register : t.login}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#9da79f",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  button: { backgroundColor: "#d85c2f", borderRadius: 10, padding: 14 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
});
