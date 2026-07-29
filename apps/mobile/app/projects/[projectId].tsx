import type { BuildingElement, BuildingSpace, Point2Mm } from "@obrametrik/domain";
import { messages } from "@obrametrik/i18n";
import { Link, Redirect, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/auth-provider";
import { mobileBuildingModelRepository } from "../../src/cad/repository";
import { verticesFromSpace } from "../../src/cad/model";
import { Card, EmptyState } from "../../src/components/ui";
import { getDeviceLocale } from "../../src/lib/i18n";
import { supabase } from "../../src/lib/supabase";
import { theme } from "../../src/theme";

type Project = { description: string | null; id: string; name: string };

export default function ProjectDetailScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { loading: authLoading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const [project, setProject] = useState<Project>();
  const [spaces, setSpaces] = useState<readonly BuildingSpace[]>([]);
  const [elements, setElements] = useState<readonly BuildingElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const [{ data, error: projectError }, nextSpaces, nextElements] = await Promise.all([
        supabase.from("projects").select("id,name,description").eq("id", projectId).maybeSingle(),
        mobileBuildingModelRepository.findSpacesByProject(projectId),
        mobileBuildingModelRepository.findElementsByProject(projectId),
      ]);
      if (projectError) throw projectError;
      setProject(data ?? undefined);
      setSpaces(nextSpaces);
      setElements(nextElements);
      setError(undefined);
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }, [projectId, t.genericError]);

  useFocusEffect(
    useCallback(() => {
      if (user) void loadProject();
    }, [loadProject, user]),
  );

  if (authLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 30, paddingTop: Math.max(insets.top, 18) },
        ]}
        refreshControl={
          <RefreshControl
            onRefresh={async () => {
              setRefreshing(true);
              await loadProject();
              setRefreshing(false);
            }}
            refreshing={refreshing}
            tintColor={theme.colors.brand}
          />
        }
      >
        <Pressable
          accessibilityLabel={t.backToProjects}
          accessibilityRole="button"
          onPress={() => router.replace("/projects")}
          style={styles.back}
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.brand} />
          </View>
        ) : !project ? (
          <EmptyState description={t.projectNotFound} title={t.projectNotFound} />
        ) : (
          <>
            <Text style={styles.eyebrow}>{t.projectOverview.toUpperCase()}</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {project.name}
            </Text>
            {project.description ? (
              <Text style={styles.description}>{project.description}</Text>
            ) : null}

            <Card style={styles.summary}>
              <View>
                <Text style={styles.summaryValue}>{spaces.length}</Text>
                <Text style={styles.summaryLabel}>{t.spaceCount}</Text>
              </View>
              <Link
                href={{ pathname: "/projects/[projectId]/cad", params: { projectId: project.id } }}
                style={styles.addAction}
              >
                {t.createCadSpace}
              </Link>
            </Card>

            <Link
              asChild
              href={{
                pathname: "/projects/[projectId]/materials",
                params: { projectId: project.id },
              }}
            >
              <Pressable
                accessibilityLabel={t.materialsAndShopping}
                accessibilityRole="button"
                style={({ pressed }) => [styles.materialsAction, pressed && styles.pressed]}
              >
                <View style={styles.materialsGlyph}>
                  <Text style={styles.materialsGlyphText}>▤</Text>
                </View>
                <View style={styles.materialsActionBody}>
                  <Text style={styles.materialsActionTitle}>{t.materialsAndShopping}</Text>
                  <Text style={styles.materialsActionHelp}>{t.automaticMaterialsHelp}</Text>
                </View>
                <Text style={styles.materialsArrow}>→</Text>
              </Pressable>
            </Link>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>{t.savedSpaces}</Text>
                <Text style={styles.sectionHelp}>{t.cadSpacesHelp}</Text>
              </View>
            </View>

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            {spaces.length === 0 ? (
              <EmptyState
                action={
                  <Link
                    href={{
                      pathname: "/projects/[projectId]/cad",
                      params: { projectId: project.id },
                    }}
                    style={styles.emptyAction}
                  >
                    {t.createCadSpace}
                  </Link>
                }
                description={t.mobileCadNoSpace}
                title={t.noRooms}
                visual={<PlanGlyph />}
              />
            ) : (
              <View style={styles.spaceList}>
                {spaces.map((space) => (
                  <CadSpaceCard
                    componentCount={
                      elements.filter(
                        (element) => element.spaceId === space.id && element.kind !== "wall",
                      ).length
                    }
                    key={space.id}
                    projectId={project.id}
                    space={space}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function CadSpaceCard({
  componentCount,
  projectId,
  space,
}: {
  componentCount: number;
  projectId: string;
  space: BuildingSpace;
}) {
  const t = messages[getDeviceLocale()];
  const kindLabels = {
    bathroom: t.bathroom,
    kitchen: t.kitchen,
    bedroom: t.bedroom,
    living_room: t.livingRoom,
    hallway: t.hallway,
    utility: t.other,
    exterior: t.other,
    other: t.other,
  };
  return (
    <Link
      asChild
      href={{
        pathname: "/projects/[projectId]/cad",
        params: { projectId, spaceId: space.id },
      }}
    >
      <Pressable style={({ pressed }) => [styles.spaceCard, pressed && styles.pressed]}>
        <View style={styles.preview}>
          <MiniPlan vertices={verticesFromSpace(space)} />
        </View>
        <View style={styles.spaceBody}>
          <Text style={styles.spaceKind}>{kindLabels[space.kind].toUpperCase()}</Text>
          <Text style={styles.spaceName}>{space.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.spaceMeta}>{space.clearHeightMm} mm</Text>
            <Text style={styles.spaceMeta}>
              {componentCount} {t.planObjects.toLocaleLowerCase()}
            </Text>
          </View>
          <View style={styles.openRow}>
            <Text style={styles.openLabel}>{t.editCadSpace}</Text>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function MiniPlan({ vertices }: { vertices: readonly Point2Mm[] }) {
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(Math.max(...xs) - minX, 1);
  const height = Math.max(Math.max(...ys) - minY, 1);
  const scale = Math.min(210 / width, 105 / height);
  const offsetX = (238 - width * scale) / 2;
  const offsetY = (133 - height * scale) / 2;
  const project = (point: Point2Mm) => ({
    x: offsetX + (point.x - minX) * scale,
    y: offsetY + (point.y - minY) * scale,
  });
  return (
    <View style={StyleSheet.absoluteFill}>
      {vertices.map((start, index) => {
        const a = project(start);
        const b = project(vertices[(index + 1) % vertices.length]!);
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        return (
          <View
            key={index}
            style={[
              styles.planWall,
              {
                left: (a.x + b.x - length) / 2,
                top: (a.y + b.y) / 2 - 2,
                transform: [{ rotate: `${angle}deg` }],
                width: length,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function PlanGlyph() {
  return (
    <View style={styles.planGlyph}>
      <View style={styles.planGlyphDoor} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  content: { paddingHorizontal: 22 },
  center: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 240 },
  back: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginBottom: 24,
    width: 44,
  },
  backGlyph: { color: theme.colors.brand, fontSize: 34, lineHeight: 38 },
  eyebrow: { color: theme.colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: {
    color: theme.colors.ink,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 42,
    marginTop: 8,
  },
  description: { color: theme.colors.muted, fontSize: 16, lineHeight: 22, marginTop: 8 },
  summary: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  summaryValue: { color: theme.colors.ink, fontSize: 30, fontWeight: "800" },
  summaryLabel: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  addAction: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    color: theme.colors.ink,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  materialsAction: {
    alignItems: "center",
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.card,
    flexDirection: "row",
    gap: 14,
    marginTop: 14,
    minHeight: 92,
    padding: 16,
  },
  materialsGlyph: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  materialsGlyphText: { color: theme.colors.ink, fontSize: 26, fontWeight: "900" },
  materialsActionBody: { flex: 1 },
  materialsActionTitle: { color: theme.colors.surface, fontSize: 17, fontWeight: "800" },
  materialsActionHelp: { color: "#CFE0DD", fontSize: 12, lineHeight: 17, marginTop: 3 },
  materialsArrow: { color: theme.colors.accent, fontSize: 24, fontWeight: "800" },
  sectionHeading: { marginBottom: 16, marginTop: 32 },
  sectionTitle: { color: theme.colors.ink, fontSize: 22, fontWeight: "800" },
  sectionHelp: { color: theme.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  error: {
    backgroundColor: "#FFF0EC",
    borderRadius: 16,
    color: theme.colors.danger,
    marginBottom: 16,
    padding: 14,
  },
  emptyAction: {
    backgroundColor: theme.colors.accent,
    borderRadius: 99,
    color: theme.colors.ink,
    fontWeight: "800",
    marginTop: 20,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  spaceList: { gap: 16 },
  spaceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    elevation: 3,
    overflow: "hidden",
    shadowColor: theme.colors.brand,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  preview: { backgroundColor: theme.colors.brand, height: 145, position: "relative" },
  planWall: {
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
    height: 4,
    position: "absolute",
  },
  spaceBody: { padding: 18 },
  spaceKind: { color: theme.colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  spaceName: { color: theme.colors.ink, fontSize: 21, fontWeight: "800", marginTop: 5 },
  metaRow: { flexDirection: "row", gap: 14, marginTop: 7 },
  spaceMeta: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  openRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  openLabel: { color: theme.colors.brand, fontSize: 13, fontWeight: "800" },
  arrow: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  arrowText: { color: theme.colors.ink, fontSize: 18 },
  planGlyph: {
    borderColor: theme.colors.brand,
    borderRadius: 3,
    borderWidth: 3,
    height: 38,
    position: "relative",
    width: 44,
  },
  planGlyphDoor: {
    backgroundColor: theme.colors.accentSoft,
    borderRightColor: theme.colors.brand,
    borderRightWidth: 2,
    bottom: -3,
    height: 16,
    position: "absolute",
    right: 6,
    width: 17,
  },
});
