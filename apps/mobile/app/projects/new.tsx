import { messages } from "@obrametrik/i18n";
import { createProjectSchema } from "@obrametrik/validation";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/auth-provider";
import { Button, Card, Field } from "../../src/components/ui";
import { getDeviceLocale } from "../../src/lib/i18n";
import { supabase } from "../../src/lib/supabase";
import { theme } from "../../src/theme";

export default function NewProjectScreen() {
  const { loading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submitProject() {
    if (!user) return;
    setError(undefined);
    setSaving(true);
    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .maybeSingle();
    const parsed = createProjectSchema.safeParse({
      organizationId: organization?.id,
      name,
      description: address || undefined,
    });
    if (organizationError || !parsed.success) {
      setError(t.invalidForm);
      setSaving(false);
      return;
    }
    const { data: project, error: createError } = await supabase
      .from("projects")
      .insert({
        organization_id: parsed.data.organizationId,
        created_by: user.id,
        name: parsed.data.name,
        description: parsed.data.description,
      })
      .select("id")
      .single();
    if (createError || !project) {
      setError(t.projectCreateError);
      setSaving(false);
      return;
    }
    router.replace({
      pathname: "/projects/[projectId]",
      params: { projectId: project.id },
    });
  }

  if (loading) return <View style={styles.center}><Text>{t.sessionLoading}</Text></View>;
  if (!user) return <Redirect href="/login" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 20, paddingTop: Math.max(insets.top, 20) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Button onPress={() => router.back()} variant="danger">{t.cancel}</Button>
        <View style={styles.heading}>
          <Text style={styles.step}>01</Text>
          <Text accessibilityRole="header" style={styles.title}>{t.createProject}</Text>
          <Text style={styles.copy}>{t.emptyProjectsHelp}</Text>
        </View>
        <Card>
          <Field
            autoFocus
            label={t.projectName}
            maxLength={120}
            onChangeText={setName}
            placeholder={t.spaceNameExample}
            returnKeyType="next"
            value={name}
          />
          <Field
            label={t.projectAddress}
            maxLength={2000}
            onChangeText={setAddress}
            placeholder={t.searchProjectsPlaceholder}
            returnKeyType="done"
            value={address}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.action}>
            <Button disabled={name.trim().length < 2} loading={saving} onPress={submitProject}>
              {t.createProject}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { paddingHorizontal: 22 },
  heading: { marginBottom: 28, marginTop: 30 },
  step: { color: theme.colors.accent, fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  title: { color: theme.colors.ink, fontSize: 36, fontWeight: "800", letterSpacing: -1.4, lineHeight: 40, marginTop: 8 },
  copy: { color: theme.colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10 },
  error: { color: theme.colors.danger, marginTop: 16 },
  action: { marginTop: 24 },
});
