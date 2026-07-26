import { messages } from "@obrametrik/i18n";
import { Link, Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/auth-provider";
import { Button, Card, EmptyState } from "../../src/components/ui";
import { getDeviceLocale } from "../../src/lib/i18n";
import { supabase } from "../../src/lib/supabase";
import { theme } from "../../src/theme";

type Project = { description: string | null; id: string; name: string };
type Room = {
  height_m: number | null;
  id: string;
  kind: string | null;
  length_m: number | null;
  name: string;
  width_m: number | null;
};
type Surface = {
  gross_area_m2: number;
  height_m: number;
  id: string;
  kind: "ceiling" | "floor" | "other" | "wall";
  name: string;
  room_id: string;
  width_m: number;
};
type Measurement = {
  area_m2: number;
  id: string;
  label: string;
  operation: "add" | "subtract";
  surface_id: string;
};
type WorkScope = {
  desired_works: string[];
  id: string;
  surface_id: string;
};

export default function ProjectDetailScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { loading: authLoading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const [project, setProject] = useState<Project>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [workScopes, setWorkScopes] = useState<WorkScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    const [{ data: projectData, error: projectError }, { data: roomData, error: roomError }] =
      await Promise.all([
        supabase.from("projects").select("id,name,description").eq("id", projectId).maybeSingle(),
        supabase
          .from("rooms")
          .select("id,name,kind,length_m,width_m,height_m")
          .eq("project_id", projectId)
          .order("created_at"),
      ]);
    const roomIds = roomData?.map((room) => room.id) ?? [];
    const { data: surfaceData, error: surfaceError } = roomIds.length
      ? await supabase
          .from("surfaces")
          .select("id,room_id,name,kind,width_m,height_m,gross_area_m2")
          .in("room_id", roomIds)
          .order("created_at")
      : { data: [], error: null };
    const surfaceIds = surfaceData?.map((surface) => surface.id) ?? [];
    const { data: measurementData, error: measurementError } = surfaceIds.length
      ? await supabase
          .from("measurements")
          .select("id,surface_id,label,operation,area_m2")
          .in("surface_id", surfaceIds)
          .order("created_at")
      : { data: [], error: null };
    const { data: scopeData, error: scopeError } = surfaceIds.length
      ? await supabase
          .from("surface_work_scopes")
          .select("id,surface_id,desired_works")
          .in("surface_id", surfaceIds)
      : { data: [], error: null };
    if (projectError || roomError || surfaceError || measurementError || scopeError) setError(t.genericError);
    else {
      setProject(projectData ?? undefined);
      setRooms(roomData ?? []);
      setSurfaces((surfaceData ?? []) as Surface[]);
      setMeasurements((measurementData ?? []) as Measurement[]);
      setWorkScopes((scopeData ?? []) as WorkScope[]);
      setError(undefined);
    }
    setLoading(false);
  }, [projectId, t.genericError]);

  useEffect(() => {
    if (user) void loadProject();
  }, [loadProject, user]);

  if (authLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 22, paddingTop: Math.max(insets.top, 18) },
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
        <View style={styles.back}>
          <Button onPress={() => router.replace("/projects")} variant="danger">{t.backToProjects}</Button>
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={theme.colors.brand} /></View>
        ) : !project ? (
          <EmptyState description={t.projectNotFound} title={t.projectNotFound} />
        ) : (
          <>
            <Text style={styles.eyebrow}>{t.projectOverview.toUpperCase()}</Text>
            <Text accessibilityRole="header" style={styles.title}>{project.name}</Text>
            {project.description ? <Text style={styles.description}>{project.description}</Text> : null}

            <Card style={styles.summary}>
              <View>
                <Text style={styles.summaryValue}>{rooms.length}</Text>
                <Text style={styles.summaryLabel}>{t.spaceCount}</Text>
              </View>
              <Link
                href={{
                  pathname: "/projects/[projectId]/spaces/new",
                  params: { projectId: project.id },
                }}
                style={styles.addAction}
              >
                {t.newSpace}
              </Link>
            </Card>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>{t.spaces}</Text>
            </View>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {rooms.length === 0 ? (
              <EmptyState
                action={
                  <Link
                    href={{
                      pathname: "/projects/[projectId]/spaces/new",
                      params: { projectId: project.id },
                    }}
                    style={styles.emptyAction}
                  >
                    {t.addFirstSpace}
                  </Link>
                }
                description={t.dimensionsHelp}
                title={t.noRooms}
                visual={<PlanGlyph />}
              />
            ) : (
              <View style={styles.roomList}>
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    measurements={measurements}
                    projectId={project.id}
                    room={room}
                    surfaces={surfaces.filter((surface) => surface.room_id === room.id)}
                    workScopes={workScopes}
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

function RoomCard({
  measurements,
  projectId,
  room,
  surfaces,
  workScopes,
}: {
  measurements: Measurement[];
  projectId: string;
  room: Room;
  surfaces: Surface[];
  workScopes: WorkScope[];
}) {
  const t = messages[getDeviceLocale()];
  const kindLabels: Record<string, string> = {
    bathroom: t.bathroom,
    bedroom: t.bedroom,
    hallway: t.hallway,
    kitchen: t.kitchen,
    living_room: t.livingRoom,
    other: t.other,
  };
  return (
    <Card style={styles.roomCard}>
      <View style={styles.plan}>
        <View style={styles.planRoom}>
          <View style={styles.planDoor} />
          <Text style={styles.planText}>
            {room.length_m && room.width_m ? `${room.length_m} × ${room.width_m} m` : room.name}
          </Text>
        </View>
      </View>
      <Text style={styles.roomKind}>{kindLabels[room.kind ?? "other"]?.toUpperCase()}</Text>
      <Text style={styles.roomName}>{room.name}</Text>
      {room.height_m ? <Text style={styles.roomMeta}>{t.roomHeight}: {room.height_m * 100} cm</Text> : null}
      <View style={styles.surfaceHeading}>
        <Text style={styles.surfaceHeadingLabel}>{t.surfaceMeasurements}</Text>
        <Text style={styles.surfaceCount}>{surfaces.length} {t.surfaceCount}</Text>
      </View>
      <View style={styles.surfaceList}>
        {surfaces.map((surface) => (
          <SurfaceCard
            key={surface.id}
            measurements={measurements.filter((item) => item.surface_id === surface.id)}
            projectId={projectId}
            scope={workScopes.find((item) => item.surface_id === surface.id)}
            surface={surface}
          />
        ))}
      </View>
    </Card>
  );
}

function SurfaceCard({
  measurements,
  projectId,
  scope,
  surface,
}: {
  measurements: Measurement[];
  projectId: string;
  scope?: WorkScope;
  surface: Surface;
}) {
  const locale = getDeviceLocale();
  const t = messages[locale];
  const labels: Record<string, string> = {
    ceiling: t.ceiling,
    floor: t.floor,
    wall_east: t.wallEast,
    wall_north: t.wallNorth,
    wall_south: t.wallSouth,
    wall_west: t.wallWest,
  };
  const grossArea = Number(surface.gross_area_m2);
  const adjustment = measurements.reduce(
    (total, item) =>
      total + (item.operation === "add" ? Number(item.area_m2) : -Number(item.area_m2)),
    0,
  );
  const netArea = grossArea + adjustment;
  const formatArea = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceTop}>
        <View style={styles.surfaceIcon}>
          <View style={surface.kind === "wall" ? styles.wallGlyph : styles.floorGlyph} />
        </View>
        <View style={styles.surfaceIdentity}>
          <Text style={styles.surfaceKind}>{t[surface.kind].toUpperCase()}</Text>
          <Text style={styles.surfaceName}>{labels[surface.name] ?? surface.name}</Text>
          <Text style={styles.surfaceDimensions}>
            {Number(surface.width_m) * 100} × {Number(surface.height_m) * 100} cm
          </Text>
        </View>
      </View>
      <View style={styles.areaGrid}>
        <View style={styles.areaItem}>
          <Text style={styles.areaLabel}>{t.grossArea}</Text>
          <Text style={styles.areaValue}>{formatArea(grossArea)} m²</Text>
        </View>
        <View style={styles.areaItem}>
          <Text style={styles.areaLabel}>{t.deductions}</Text>
          <Text style={styles.areaValue}>{formatArea(Math.abs(Math.min(adjustment, 0)))} m²</Text>
        </View>
        <View style={[styles.areaItem, styles.netArea]}>
          <Text style={styles.areaLabel}>{t.netArea}</Text>
          <Text style={styles.areaValue}>{formatArea(netArea)} m²</Text>
        </View>
      </View>
      {measurements.length ? (
        <View style={styles.deductionList}>
          {measurements.map((measurement) => (
            <View key={measurement.id} style={styles.deductionRow}>
              <Text style={styles.deductionName}>{measurement.label}</Text>
              <Text style={styles.deductionValue}>− {formatArea(Number(measurement.area_m2))} m²</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noDeductions}>{t.noDeductions}</Text>
      )}
      {surface.kind === "wall" ? (
        <Link
          href={{
            pathname: "/projects/[projectId]/surfaces/[surfaceId]/openings/new",
            params: { projectId, surfaceId: surface.id },
          }}
          style={styles.openingAction}
        >
          {t.newOpening}
        </Link>
      ) : null}
      <Link
        href={{
          pathname: "/projects/[projectId]/surfaces/[surfaceId]/scope",
          params: { projectId, surfaceId: surface.id },
        }}
        style={[styles.scopeAction, scope && styles.scopeActionDefined]}
      >
        {scope ? t.editWork : t.defineWork}
      </Link>
      {scope ? (
        <View style={styles.scopeStatus}>
          <View style={styles.scopeDot} />
          <Text style={styles.scopeStatusText}>{t.workDefined} · {scope.desired_works.length}</Text>
        </View>
      ) : null}
    </View>
  );
}

function PlanGlyph() {
  return <View style={styles.planGlyph}><View style={styles.planGlyphDoor} /></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  content: { paddingHorizontal: 22 },
  center: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 240 },
  back: { alignItems: "flex-start", marginBottom: 24 },
  eyebrow: { color: theme.colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: theme.colors.ink, fontSize: 38, fontWeight: "800", letterSpacing: -1.5, lineHeight: 42, marginTop: 8 },
  description: { color: theme.colors.muted, fontSize: 16, lineHeight: 22, marginTop: 8 },
  summary: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
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
  sectionHeading: { marginBottom: 16, marginTop: 32 },
  sectionTitle: { color: theme.colors.ink, fontSize: 22, fontWeight: "800" },
  error: { backgroundColor: "#FFF0EC", borderRadius: 16, color: theme.colors.danger, marginBottom: 16, padding: 14 },
  emptyAction: { backgroundColor: theme.colors.accent, borderRadius: 99, color: theme.colors.ink, fontWeight: "800", marginTop: 20, overflow: "hidden", paddingHorizontal: 20, paddingVertical: 14 },
  roomList: { gap: 16 },
  roomCard: { padding: 14 },
  plan: { backgroundColor: theme.colors.brand, borderRadius: 18, height: 170, padding: 24 },
  planRoom: { alignItems: "center", borderColor: theme.colors.accent, borderRadius: 3, borderWidth: 4, flex: 1, justifyContent: "center", position: "relative" },
  planDoor: { backgroundColor: theme.colors.brand, borderRightColor: theme.colors.accent, borderRightWidth: 3, bottom: -4, height: 32, position: "absolute", right: 22, width: 34 },
  planText: { color: theme.colors.surface, fontSize: 15, fontWeight: "700" },
  roomKind: { color: theme.colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 16 },
  roomName: { color: theme.colors.ink, fontSize: 21, fontWeight: "800", marginTop: 5 },
  roomMeta: { color: theme.colors.muted, fontSize: 13, marginTop: 5 },
  surfaceHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  surfaceHeadingLabel: { color: theme.colors.ink, fontSize: 17, fontWeight: "800" },
  surfaceCount: { color: theme.colors.muted, fontSize: 12 },
  surfaceList: { gap: 12, marginTop: 12 },
  surfaceCard: { backgroundColor: theme.colors.canvas, borderRadius: 18, padding: 14 },
  surfaceTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  surfaceIcon: { alignItems: "center", backgroundColor: theme.colors.accentSoft, borderRadius: 14, height: 48, justifyContent: "center", width: 48 },
  wallGlyph: { borderColor: theme.colors.brand, borderWidth: 2, height: 25, width: 29 },
  floorGlyph: { borderBottomColor: theme.colors.brand, borderBottomWidth: 2, borderLeftColor: theme.colors.brand, borderLeftWidth: 2, height: 20, transform: [{ skewX: "-20deg" }], width: 29 },
  surfaceIdentity: { flex: 1 },
  surfaceKind: { color: theme.colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  surfaceName: { color: theme.colors.ink, fontSize: 16, fontWeight: "800", marginTop: 3 },
  surfaceDimensions: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  areaGrid: { flexDirection: "row", gap: 6, marginTop: 14 },
  areaItem: { backgroundColor: theme.colors.surface, borderRadius: 12, flex: 1, padding: 10 },
  netArea: { backgroundColor: theme.colors.accentSoft },
  areaLabel: { color: theme.colors.muted, fontSize: 10 },
  areaValue: { color: theme.colors.ink, fontSize: 13, fontWeight: "800", marginTop: 4 },
  deductionList: { borderTopColor: theme.colors.border, borderTopWidth: 1, gap: 7, marginTop: 12, paddingTop: 10 },
  deductionRow: { flexDirection: "row", justifyContent: "space-between" },
  deductionName: { color: theme.colors.ink, fontSize: 12 },
  deductionValue: { color: theme.colors.danger, fontSize: 12, fontWeight: "700" },
  noDeductions: { color: theme.colors.muted, fontSize: 12, marginTop: 12 },
  openingAction: { backgroundColor: theme.colors.brand, borderRadius: 99, color: theme.colors.surface, fontSize: 13, fontWeight: "800", marginTop: 14, overflow: "hidden", paddingHorizontal: 16, paddingVertical: 12, textAlign: "center" },
  scopeAction: { backgroundColor: theme.colors.accent, borderRadius: 99, color: theme.colors.ink, fontSize: 13, fontWeight: "800", marginTop: 10, overflow: "hidden", paddingHorizontal: 16, paddingVertical: 12, textAlign: "center" },
  scopeActionDefined: { backgroundColor: theme.colors.accentSoft },
  scopeStatus: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 9 },
  scopeDot: { backgroundColor: theme.colors.accent, borderRadius: 4, height: 8, width: 8 },
  scopeStatusText: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  planGlyph: { borderColor: theme.colors.brand, borderRadius: 3, borderWidth: 3, height: 38, position: "relative", width: 44 },
  planGlyphDoor: { backgroundColor: theme.colors.accentSoft, borderRightColor: theme.colors.brand, borderRightWidth: 2, bottom: -3, height: 16, position: "absolute", right: 6, width: 17 },
});
