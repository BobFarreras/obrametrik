import { messages } from "@obrametrik/i18n";
import { Link, Redirect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../src/auth/auth-provider";
import { BottomNavigation } from "../src/components/bottom-navigation";
import { EmptyState } from "../src/components/ui";
import { getDeviceLocale } from "../src/lib/i18n";
import { supabase } from "../src/lib/supabase";
import { theme } from "../src/theme";

type Project = {
  created_at: string;
  description: string | null;
  id: string;
  name: string;
};

export default function ProjectsScreen() {
  const { loading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("projects")
      .select("id,name,description,created_at")
      .order("created_at", { ascending: false });
    if (loadError) setError(t.projectLoadError);
    else {
      setError(undefined);
      setProjects(data ?? []);
    }
  }, [t.projectLoadError]);

  useEffect(() => {
    if (user) void loadProjects();
  }, [loadProjects, user]);

  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) =>
      `${project.name} ${project.description ?? ""}`.toLocaleLowerCase().includes(normalized),
    );
  }, [projects, query]);

  async function deleteProject(project: Project) {
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", project.id);
    if (deleteError) setError(t.genericError);
    else await loadProjects();
  }

  function confirmDelete(project: Project) {
    Alert.alert(t.deleteProjectTitle, t.deleteProjectHelp, [
      { style: "cancel", text: t.cancel },
      { style: "destructive", text: t.delete, onPress: () => void deleteProject(project) },
    ]);
  }

  if (loading) return <View style={styles.center}><Text>{t.sessionLoading}</Text></View>;
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={async () => {
              setRefreshing(true);
              await loadProjects();
              setRefreshing(false);
            }}
            refreshing={refreshing}
            tintColor={theme.colors.brand}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{t.appName.toUpperCase()}</Text>
            <Text accessibilityRole="header" style={styles.title}>{t.projects}</Text>
          </View>
          <Link accessibilityLabel={t.newProject} href="/projects/new" style={styles.headerAction}>＋</Link>
        </View>

        <View style={styles.search}>
          <View accessibilityElementsHidden style={styles.searchGlyph}>
            <View style={styles.searchCircle} />
            <View style={styles.searchHandle} />
          </View>
          <TextInput
            accessibilityLabel={t.searchProjects}
            onChangeText={setQuery}
            placeholder={t.searchProjectsPlaceholder}
            placeholderTextColor={theme.colors.concrete}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        {projects.length === 0 ? (
          <View style={styles.emptySection}>
            <EmptyState
              action={<Link href="/projects/new" style={styles.emptyAction}>{t.createProject}</Link>}
              description={t.emptyProjectsHelp}
              title={t.emptyProjects}
              visual={<ProjectGlyph />}
            />
          </View>
        ) : visibleProjects.length === 0 ? (
          <View style={styles.emptySection}>
            <EmptyState
              description={t.noSearchResultsHelp}
              title={t.noSearchResults}
              visual={<ProjectGlyph />}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {visibleProjects.map((project, index) => (
              <Link
                href={{ pathname: "/projects/[projectId]", params: { projectId: project.id } }}
                key={project.id}
                asChild
              >
                <Pressable
                  accessibilityHint={t.openProject}
                  style={({ pressed }) => [styles.projectCard, pressed && styles.pressed]}
                >
                  <View style={[styles.projectVisual, index % 2 === 1 && styles.projectVisualAlternate]}>
                    <RoomIllustration />
                  </View>
                  <View style={styles.projectBody}>
                    <View style={styles.projectHeading}>
                      <Text style={styles.chip}>{t.draft.toUpperCase()}</Text>
                      <Pressable
                        accessibilityLabel={`${t.delete} ${project.name}`}
                        hitSlop={12}
                        onPress={(event) => {
                          event.stopPropagation();
                          confirmDelete(project);
                        }}
                        style={styles.moreButton}
                      >
                        <Text style={styles.moreLabel}>•••</Text>
                      </Pressable>
                    </View>
                    <Text numberOfLines={2} style={styles.projectName}>{project.name}</Text>
                    {project.description ? (
                      <Text numberOfLines={1} style={styles.projectDescription}>{project.description}</Text>
                    ) : null}
                    <View style={styles.openRow}>
                      <Text style={styles.openLabel}>{t.openProject}</Text>
                      <View style={styles.arrow}><Text style={styles.arrowLabel}>→</Text></View>
                    </View>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
      <BottomNavigation />
    </View>
  );
}

function ProjectGlyph() {
  return <View style={styles.glyphStack}><View style={styles.glyphBack} /><View style={styles.glyphFront} /></View>;
}

function RoomIllustration() {
  return (
    <View style={styles.room}>
      <View style={styles.roomWindow}><View style={styles.windowLine} /></View>
      <View style={styles.roomDesk} />
      <View style={styles.roomPlant}><View style={styles.plantLeaf} /></View>
      <View style={styles.roomFloor} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { padding: 22, paddingBottom: 120, paddingTop: 52 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: theme.colors.brand, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  title: { color: theme.colors.ink, fontSize: 38, fontWeight: "800", letterSpacing: -1.5, marginTop: 6 },
  headerAction: {
    backgroundColor: theme.colors.accent,
    borderRadius: 25,
    color: theme.colors.ink,
    fontSize: 25,
    fontWeight: "500",
    height: 50,
    lineHeight: 48,
    overflow: "hidden",
    textAlign: "center",
    width: 50,
  },
  search: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    marginTop: 28,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  searchGlyph: { height: 22, marginRight: 10, width: 22 },
  searchCircle: { borderColor: theme.colors.concrete, borderRadius: 7, borderWidth: 2, height: 14, width: 14 },
  searchHandle: { backgroundColor: theme.colors.concrete, height: 2, left: 12, position: "absolute", top: 14, transform: [{ rotate: "45deg" }], width: 8 },
  searchInput: { color: theme.colors.ink, flex: 1, fontSize: 16, minHeight: 52 },
  error: { backgroundColor: "#FFF0EC", borderRadius: 16, color: theme.colors.danger, marginTop: 16, padding: 14 },
  emptySection: { marginTop: 24 },
  emptyAction: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    color: theme.colors.ink,
    fontWeight: "800",
    marginTop: 20,
    minHeight: 48,
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  list: { gap: 18, marginTop: 24 },
  projectCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    elevation: 3,
    overflow: "hidden",
    shadowColor: theme.colors.brand,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  projectVisual: { backgroundColor: "#D9E7E3", height: 150, overflow: "hidden" },
  projectVisualAlternate: { backgroundColor: "#F5DFC1" },
  projectBody: { padding: 20 },
  projectHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  chip: { color: theme.colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  moreButton: { alignItems: "center", height: 32, justifyContent: "center", width: 42 },
  moreLabel: { color: theme.colors.muted, fontSize: 15, letterSpacing: 2 },
  projectName: { color: theme.colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 8 },
  projectDescription: { color: theme.colors.muted, fontSize: 14, marginTop: 5 },
  openRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  openLabel: { color: theme.colors.brand, fontSize: 14, fontWeight: "700" },
  arrow: { alignItems: "center", backgroundColor: theme.colors.accent, borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  arrowLabel: { color: theme.colors.ink, fontSize: 19 },
  glyphStack: { height: 34, width: 40 },
  glyphBack: { borderColor: theme.colors.brand, borderRadius: 5, borderWidth: 2, height: 25, left: 0, position: "absolute", top: 0, width: 30 },
  glyphFront: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.brand, borderRadius: 5, borderWidth: 2, bottom: 0, height: 25, position: "absolute", right: 0, width: 30 },
  room: { flex: 1, position: "relative" },
  roomWindow: { backgroundColor: "#F7FBFA", borderColor: theme.colors.brand, borderWidth: 3, height: 62, left: 45, position: "absolute", top: 23, width: 90 },
  windowLine: { backgroundColor: theme.colors.brand, height: 3, left: 42, position: "absolute", top: 0, width: 3 },
  roomDesk: { backgroundColor: theme.colors.brand, borderRadius: 4, bottom: 25, height: 17, left: 88, position: "absolute", width: 130 },
  roomPlant: { backgroundColor: "#A86E3B", borderRadius: 4, bottom: 24, height: 30, position: "absolute", right: 38, width: 28 },
  plantLeaf: { backgroundColor: "#5E846F", borderRadius: 18, bottom: 21, height: 42, left: -7, position: "absolute", transform: [{ rotate: "-18deg" }], width: 26 },
  roomFloor: { backgroundColor: "rgba(42,75,79,.13)", bottom: -30, height: 58, left: -20, position: "absolute", transform: [{ rotate: "-4deg" }], width: "120%" },
});
