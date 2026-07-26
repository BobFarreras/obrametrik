import { messages } from "@obrametrik/i18n";
import { createProjectSchema } from "@obrametrik/validation";
import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/auth/auth-provider";
import { BottomNavigation } from "../src/components/bottom-navigation";
import { Button, Card, EmptyState, Field } from "../src/components/ui";
import { getDeviceLocale } from "../src/lib/i18n";
import { supabase } from "../src/lib/supabase";
import { theme } from "../src/theme";

export default function ProjectsScreen() {
  const { loading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [projects, setProjects] = useState<
    { id: string; name: string; description: string | null }[]
  >([]);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("projects")
      .select("id,name,description")
      .order("created_at", { ascending: false });
    if (loadError) setError(t.projectLoadError);
    else setProjects(data ?? []);
  }, [t.projectLoadError]);

  useEffect(() => {
    if (user) void loadProjects();
  }, [loadProjects, user]);

  async function submitProject() {
    if (!user) return;
    setError(undefined);
    setSaving(true);
    const { data: organization } = await supabase.from("organizations").select("id").limit(1).maybeSingle();
    const parsed = createProjectSchema.safeParse({
      organizationId: organization?.id,
      name,
      description: address || undefined,
    });
    if (!parsed.success) {
      setError(t.invalidForm);
      setSaving(false);
      return;
    }
    const { error: createError } = await supabase.from("projects").insert({
      organization_id: parsed.data.organizationId,
      created_by: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
    });
    if (createError) setError(t.projectCreateError);
    else {
      setName("");
      setAddress("");
      await loadProjects();
    }
    setSaving(false);
  }

  if (loading) return <View style={styles.center}><Text>{t.sessionLoading}</Text></View>;
  if (!user) return <Redirect href="/login" />;
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>{t.appName.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={styles.title}>{t.projects}</Text>
        <Text style={styles.copy}>{t.emptyProjectsHelp}</Text>
        {projects.length === 0 ? (
          <EmptyState
            description={t.emptyProjectsHelp}
            title={t.emptyProjects}
            visual={<Text style={styles.emptyIconText}>P</Text>}
          />
        ) : <View style={styles.list}>
          {projects.map((project) => (
            <View key={project.id} style={styles.projectRow}>
              <View style={styles.thumbnail}><Text style={styles.thumbnailText}>⌂</Text></View>
              <View style={styles.projectInfo}><Text style={styles.chip}>{t.draft.toUpperCase()}</Text><Text style={styles.projectName}>{project.name}</Text><Text style={styles.projectDescription}>{project.description}</Text></View>
              <Pressable accessibilityLabel={`${t.delete} ${project.name}`} onPress={async () => { await supabase.from("projects").delete().eq("id", project.id); await loadProjects(); }}><Text style={styles.delete}>{t.delete}</Text></Pressable>
            </View>
          ))}
        </View>}
        <Card style={styles.form}>
          <Text style={styles.chip}>{t.newProject.toUpperCase()}</Text>
          <Text style={styles.formTitle}>{t.createProject}</Text>
          <Field label={t.projectName} onChangeText={setName} placeholder={t.projectName} value={name} />
          <Field label={t.projectAddress} onChangeText={setAddress} placeholder={t.projectAddress} value={address} />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.formAction}>
            <Button loading={saving} onPress={submitProject}>{t.createProject}</Button>
          </View>
        </Card>
      </ScrollView>
      <BottomNavigation />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { padding: 22, paddingBottom: 120, paddingTop: 56 },
  eyebrow: { color: theme.colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  title: { color: theme.colors.ink, fontSize: 44, fontWeight: "700", letterSpacing: -2, marginTop: 8 },
  copy: { color: theme.colors.muted, fontSize: 16, lineHeight: 23, marginTop: 2 },
  emptyIconText: { color: theme.colors.brand, fontSize: 24, fontWeight: "800" },
  list: { gap: 12, marginTop: 34 },
  projectRow: { alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 22, flexDirection: "row", gap: 14, padding: 12 },
  thumbnail: { alignItems: "center", backgroundColor: "#dcd7ce", borderRadius: 16, height: 72, justifyContent: "center", width: 72 },
  thumbnailText: { color: "#77736d", fontSize: 28 },
  projectInfo: { flex: 1 },
  projectName: { color: theme.colors.ink, fontSize: 17, fontWeight: "700", marginTop: 4 },
  projectDescription: { color: theme.colors.muted, fontSize: 12, marginTop: 3 },
  delete: { color: theme.colors.danger, fontSize: 12, padding: 8 },
  form: { marginTop: 18 },
  chip: { color: theme.colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  formTitle: { color: theme.colors.ink, fontSize: 26, fontWeight: "700", letterSpacing: -1, marginBottom: 20, marginTop: 10 },
  formAction: { marginTop: 22 },
  error: { color: theme.colors.danger, marginTop: 12 },
});
