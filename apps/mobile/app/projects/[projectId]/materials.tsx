import type { Database } from "@obrametrik/database";
import { messages } from "@obrametrik/i18n";
import { Redirect, router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import { useAuth } from "../../../src/auth/auth-provider";
import { getDeviceLocale } from "../../../src/lib/i18n";
import { supabase } from "../../../src/lib/supabase";
import { theme } from "../../../src/theme";

type TakeoffLine = Database["public"]["Tables"]["takeoff_lines"]["Row"];

function categoryLabel(categoryId: string, t: (typeof messages)[keyof typeof messages]) {
  const labels: Record<string, string> = {
    "electrical.device.light": t.materialLightPoint,
    "electrical.device.switch": t.materialSwitch,
    "electrical.device.socket": t.materialSocket,
    "electrical.box.flush": t.materialFlushBox,
    "electrical.frame": t.materialFrame,
    "electrical.connector": t.materialConnector,
    "electrical.conductor": t.materialConductor,
    "electrical.conduit": t.materialConduit,
    "tool.insulated_screwdriver": t.toolInsulatedScrewdriver,
    "tool.wire_stripper": t.toolWireStripper,
    "tool.voltage_tester": t.toolVoltageTester,
  };
  return labels[categoryId] ?? categoryId;
}

function glyph(categoryId: string) {
  if (categoryId.includes("socket")) return "◉";
  if (categoryId.includes("switch")) return "◒";
  if (categoryId.includes("light")) return "☼";
  if (categoryId.includes("box")) return "○";
  if (categoryId.includes("frame")) return "▣";
  if (categoryId.includes("connector")) return "↔";
  if (categoryId.includes("conductor")) return "〰";
  if (categoryId.includes("conduit")) return "⌇";
  return "⌁";
}

export default function MobileMaterialsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { loading: authLoading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const [lines, setLines] = useState<TakeoffLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data: run, error: runError } = await supabase
        .from("takeoff_runs")
        .select("id")
        .eq("project_id", projectId)
        .eq("trade", "electrical")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (runError) throw runError;
      if (!run) {
        setLines([]);
        return;
      }
      const { data, error: linesError } = await supabase
        .from("takeoff_lines")
        .select("*")
        .eq("project_id", projectId)
        .eq("run_id", run.id)
        .order("category_id");
      if (linesError) throw linesError;
      setLines(data ?? []);
      setError(undefined);
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }, [projectId, t.genericError]);

  useFocusEffect(useCallback(() => void load(), [load]));

  if (authLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (!user) return <Redirect href="/login" />;

  const materials = lines.filter((line) => !line.category_id.startsWith("tool."));
  const tools = lines.filter((line) => line.category_id.startsWith("tool."));
  const hasMeasuredRoutes = lines.some(
    (line) =>
      line.category_id === "electrical.conductor" || line.category_id === "electrical.conduit",
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" style={styles.title}>
            {t.materialsAndShopping}
          </Text>
          <Text style={styles.subtitle}>{t.automaticOnSave}</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 18) + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/projects/[projectId]/electrical",
              params: { projectId },
            })
          }
          style={styles.electricalAction}
        >
          <View>
            <Text style={styles.electricalActionTitle}>{t.electricalCircuits}</Text>
            <Text style={styles.electricalActionHelp}>{t.electricalCircuitsHelp}</Text>
          </View>
          <Text style={styles.electricalActionArrow}>→</Text>
        </Pressable>
        {loading ? (
          <ActivityIndicator color={theme.colors.brand} />
        ) : error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : lines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyGlyph}>◉</Text>
            <Text style={styles.emptyTitle}>{t.takeoffInsufficientPlan}</Text>
            <Text style={styles.emptyText}>{t.savePlanToCalculate}</Text>
          </View>
        ) : (
          <>
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>
                {hasMeasuredRoutes ? t.cableAndConduitCalculated : t.cablesPendingTitle}
              </Text>
              <Text style={styles.noticeText}>
                {hasMeasuredRoutes ? t.confirmedRoute : t.routesPending}
              </Text>
            </View>
            <MaterialGroup lines={materials} title={t.materials} eyebrow={t.buyForInstallation} />
            <MaterialGroup lines={tools} title={t.tools} eyebrow={t.reusableNotConsumable} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MaterialGroup({
  eyebrow,
  lines,
  title,
}: {
  eyebrow: string;
  lines: readonly TakeoffLine[];
  title: string;
}) {
  const t = messages[getDeviceLocale()];
  return (
    <View style={styles.group}>
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.groupTitle}>{title}</Text>
      {lines.map((line) => (
        <View key={line.id} style={styles.card}>
          <View style={styles.visual}>
            <Text style={styles.glyph}>{glyph(line.category_id)}</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>{categoryLabel(line.category_id, t)}</Text>
              <Text style={styles.quantity}>
                {line.purchase_quantity} {line.unit === "m" ? "m" : t.unitsShort}
              </Text>
            </View>
            <Text style={styles.cardText}>
              {t.calculatedFromPlanObjects.replace(
                "{count}",
                String(line.source_entity_ids.length),
              )}
            </Text>
            <Text style={styles.pending}>{t.pricePending}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  header: {
    alignItems: "center",
    backgroundColor: theme.colors.brand,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  back: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.12)",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  backText: { color: "#fff", fontSize: 34, lineHeight: 38 },
  headerText: { flex: 1 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#C9DCDA", fontSize: 12, marginTop: 2 },
  content: { gap: 16, padding: 16 },
  notice: {
    backgroundColor: theme.colors.accentSoft,
    borderLeftColor: theme.colors.accent,
    borderLeftWidth: 5,
    borderRadius: 18,
    padding: 16,
  },
  noticeTitle: { color: theme.colors.ink, fontWeight: "800" },
  noticeText: { color: theme.colors.muted, lineHeight: 19, marginTop: 4 },
  group: { backgroundColor: theme.colors.surface, borderRadius: 24, gap: 12, padding: 16 },
  eyebrow: { color: theme.colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  groupTitle: { color: theme.colors.ink, fontSize: 23, fontWeight: "800", marginBottom: 4 },
  card: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 18,
    flexDirection: "row",
    gap: 13,
    padding: 12,
  },
  visual: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  glyph: { color: theme.colors.brand, fontSize: 34 },
  cardBody: { flex: 1, gap: 5 },
  cardHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  cardTitle: { color: theme.colors.ink, flex: 1, fontSize: 15, fontWeight: "800" },
  quantity: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cardText: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  pending: { color: theme.colors.brand, fontSize: 11, fontWeight: "700" },
  empty: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 40,
  },
  emptyGlyph: { color: theme.colors.brand, fontSize: 58 },
  emptyTitle: { color: theme.colors.ink, fontSize: 20, fontWeight: "800", marginTop: 14 },
  emptyText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8, textAlign: "center" },
  error: { color: theme.colors.danger, textAlign: "center" },
  electricalAction: {
    alignItems: "center",
    backgroundColor: theme.colors.brand,
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    padding: 18,
  },
  electricalActionTitle: { color: theme.colors.surface, fontSize: 17, fontWeight: "900" },
  electricalActionHelp: {
    color: "#CFE0DD",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    maxWidth: 260,
  },
  electricalActionArrow: { color: theme.colors.accent, fontSize: 26, fontWeight: "900" },
});
