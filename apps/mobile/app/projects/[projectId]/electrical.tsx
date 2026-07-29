import { defaultRouteConfiguration, measuredPolylineLengthMm } from "@obrametrik/application";
import type { Json } from "@obrametrik/database";
import type { BuildingElement, BuildingSpace, Point2Mm } from "@obrametrik/domain";
import { messages } from "@obrametrik/i18n";
import { Redirect, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/auth/auth-provider";
import { mobileBuildingModelRepository } from "../../../src/cad/repository";
import { verticesFromSpace } from "../../../src/cad/model";
import { getDeviceLocale } from "../../../src/lib/i18n";
import { supabase } from "../../../src/lib/supabase";
import { regenerateElectricalMaterials } from "../../../src/materials/electrical-materials";
import { theme } from "../../../src/theme";

type Circuit = { id: string; code: string; name: string };
type Assignment = { circuit_id: string; terminal_element_id: string };
type ElectricalCircuitCode = "C1" | "C2" | "C3" | "C4" | "C5" | "C10" | "C11";
type ElectricalRouteRole =
  "distribution" | "light_feed" | "switch_feed" | "switch_return" | "travellers" | "control";
const CODES: readonly ElectricalCircuitCode[] = ["C1", "C2", "C3", "C4", "C5", "C10", "C11"];
const ROLES: readonly ElectricalRouteRole[] = [
  "distribution",
  "light_feed",
  "switch_feed",
  "switch_return",
  "travellers",
  "control",
];

export default function ElectricalEditorScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { loading: authLoading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [spaces, setSpaces] = useState<readonly BuildingSpace[]>([]);
  const [elements, setElements] = useState<readonly BuildingElement[]>([]);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>();
  const [circuitName, setCircuitName] = useState("");
  const [circuitCode, setCircuitCode] = useState<ElectricalCircuitCode>("C1");
  const [routeRole, setRouteRole] = useState<ElectricalRouteRole>("distribution");
  const [routePoints, setRoutePoints] = useState<readonly Point2Mm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [nextSpaces, nextElements, circuitsResult, assignmentsResult] = await Promise.all([
        mobileBuildingModelRepository.findSpacesByProject(projectId),
        mobileBuildingModelRepository.findElementsByProject(projectId),
        supabase
          .from("electrical_circuits")
          .select("id,code,name")
          .eq("project_id", projectId)
          .order("created_at"),
        supabase
          .from("electrical_circuit_terminals")
          .select("circuit_id,terminal_element_id")
          .eq("project_id", projectId),
      ]);
      if (circuitsResult.error) throw circuitsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      setSpaces(nextSpaces);
      setElements(nextElements);
      setCircuits(circuitsResult.data);
      setAssignments(assignmentsResult.data);
      setSelectedCircuitId((current) => current ?? circuitsResult.data[0]?.id);
      setSelectedSpaceId((current) => current ?? nextSpaces[0]?.id);
      setError(undefined);
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }, [projectId, t.genericError]);

  useFocusEffect(useCallback(() => void load(), [load]));

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId);
  const vertices = useMemo(
    () => (selectedSpace ? verticesFromSpace(selectedSpace) : []),
    [selectedSpace],
  );
  const terminals = elements.filter(
    (element) =>
      element.kind === "terminal" &&
      element.confirmation === "confirmed" &&
      ["light", "switch", "socket"].includes(String(element.specification.terminalKind)),
  );
  const viewport = useMemo(() => createViewport(vertices, 330, 250), [vertices]);

  async function createCircuit() {
    if (!projectId || !user || !circuitName.trim()) return;
    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("electrical_circuits")
      .insert({
        project_id: projectId,
        created_by: user.id,
        name: circuitName.trim(),
        code: circuitCode,
        status: "confirmed",
      })
      .select("id,code,name")
      .single();
    setSaving(false);
    if (insertError) return setError(t.genericError);
    setCircuits((current) => [...current, data]);
    setSelectedCircuitId(data.id);
    setCircuitName("");
  }

  async function generateProposal() {
    if (!projectId || !user || circuits.length > 0) return;
    const groups = [
      { code: "C1" as const, name: "Il·luminació", kinds: ["light", "switch"] },
      { code: "C2" as const, name: "Endolls", kinds: ["socket"] },
    ];
    setSaving(true);
    try {
      for (const group of groups) {
        const members = terminals.filter((element) =>
          group.kinds.includes(String(element.specification.terminalKind)),
        );
        if (!members.length) continue;
        const { data: circuit, error: circuitError } = await supabase
          .from("electrical_circuits")
          .insert({
            project_id: projectId,
            created_by: user.id,
            name: group.name,
            code: group.code,
            status: "confirmed",
          })
          .select("id,code,name")
          .single();
        if (circuitError) throw circuitError;
        const { error: assignmentError } = await supabase
          .from("electrical_circuit_terminals")
          .insert(
            members.map((member) => ({
              project_id: projectId,
              circuit_id: circuit.id,
              terminal_element_id: member.id,
              created_by: user.id,
            })),
          );
        if (assignmentError) throw assignmentError;
        for (const member of members) {
          const target = { x: member.transform.position.x, y: member.transform.position.y };
          const points = [{ x: 0, y: 0 }, { x: target.x, y: 0 }, target];
          const role: ElectricalRouteRole =
            member.specification.terminalKind === "switch" ? "switch_feed" : "distribution";
          const configuration = defaultRouteConfiguration({ circuitCode: group.code, role });
          const { error: segmentError } = await supabase.from("electrical_route_segments").insert({
            project_id: projectId,
            circuit_id: circuit.id,
            space_id: member.spaceId,
            created_by: user.id,
            name: `${group.name} · ${member.name}`,
            route_role: role,
            path: points as unknown as Json,
            length_mm: measuredPolylineLengthMm(points),
            conductor_configuration: configuration.conductors,
            conduit_system: configuration.conduit.system,
            conduit_diameter_mm: configuration.conduit.diameterMm,
            status: "confirmed",
          });
          if (segmentError) throw segmentError;
        }
      }
      await regenerateElectricalMaterials(projectId);
      await load();
    } catch {
      setError(t.genericError);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAssignment(terminalId: string) {
    if (!projectId || !user || !selectedCircuitId) return;
    const existing = assignments.find((item) => item.terminal_element_id === terminalId);
    if (existing) {
      const { error: deleteError } = await supabase
        .from("electrical_circuit_terminals")
        .delete()
        .eq("project_id", projectId)
        .eq("terminal_element_id", terminalId);
      if (deleteError) return setError(t.genericError);
      setAssignments((current) =>
        current.filter((item) => item.terminal_element_id !== terminalId),
      );
    } else {
      const { error: insertError } = await supabase.from("electrical_circuit_terminals").insert({
        project_id: projectId,
        circuit_id: selectedCircuitId,
        terminal_element_id: terminalId,
        created_by: user.id,
      });
      if (insertError) return setError(t.genericError);
      setAssignments((current) => [
        ...current,
        { circuit_id: selectedCircuitId, terminal_element_id: terminalId },
      ]);
    }
  }

  async function saveRoute() {
    if (!projectId || !user || !selectedCircuitId || !selectedSpaceId || routePoints.length < 2) {
      setError(t.routeNeedsTwoPoints);
      return;
    }
    const circuit = circuits.find((item) => item.id === selectedCircuitId);
    if (!circuit || !CODES.includes(circuit.code as ElectricalCircuitCode)) return;
    const configuration = defaultRouteConfiguration({
      circuitCode: circuit.code as ElectricalCircuitCode,
      role: routeRole,
    });
    setSaving(true);
    const { error: insertError } = await supabase.from("electrical_route_segments").insert({
      project_id: projectId,
      circuit_id: selectedCircuitId,
      space_id: selectedSpaceId,
      created_by: user.id,
      name: `${circuit.name} · ${routeRole}`,
      route_role: routeRole,
      path: routePoints.map((point) => ({ ...point })) as unknown as Json,
      length_mm: measuredPolylineLengthMm(routePoints),
      conductor_configuration: configuration.conductors,
      conduit_system: configuration.conduit.system,
      conduit_diameter_mm: configuration.conduit.diameterMm,
      status: "confirmed",
    });
    if (!insertError) {
      await regenerateElectricalMaterials(projectId);
      setRoutePoints([]);
      setError(undefined);
    } else setError(t.genericError);
    setSaving(false);
  }

  if (authLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerBody}>
          <Text accessibilityRole="header" style={styles.title}>
            {t.electricalEditor}
          </Text>
          <Text style={styles.subtitle}>{t.electricalEditorHelp}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>{t.newCircuit}</Text>
        <Pressable
          disabled={saving || circuits.length > 0}
          onPress={() => void generateProposal()}
          style={styles.proposal}
        >
          <Text style={styles.proposalText}>{t.generateElectricalProposal}</Text>
        </Pressable>
        <TextInput
          accessibilityLabel={t.circuitName}
          onChangeText={setCircuitName}
          placeholder={t.circuitName}
          style={styles.input}
          value={circuitName}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CODES.map((code) => (
            <Choice
              key={code}
              label={code}
              selected={code === circuitCode}
              onPress={() => setCircuitCode(code)}
            />
          ))}
        </ScrollView>
        <Pressable disabled={saving} onPress={() => void createCircuit()} style={styles.primary}>
          <Text style={styles.primaryText}>{t.confirmCircuit}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>{t.electricalCircuits}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {circuits.map((circuit) => (
            <Choice
              key={circuit.id}
              label={`${circuit.code} · ${circuit.name}`}
              selected={selectedCircuitId === circuit.id}
              onPress={() => setSelectedCircuitId(circuit.id)}
            />
          ))}
        </ScrollView>
        {circuits.length === 0 ? <Text style={styles.help}>{t.noCircuits}</Text> : null}

        {selectedCircuitId ? (
          <>
            <Text style={styles.sectionTitle}>{t.unassignedPoints}</Text>
            <View style={styles.terminalList}>
              {terminals.map((terminal) => {
                const assignment = assignments.find(
                  (item) => item.terminal_element_id === terminal.id,
                );
                const selected = assignment?.circuit_id === selectedCircuitId;
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    key={terminal.id}
                    onPress={() => void toggleAssignment(terminal.id)}
                    style={[styles.terminal, selected && styles.terminalSelected]}
                  >
                    <Text style={styles.terminalGlyph}>
                      {terminal.specification.terminalKind === "light"
                        ? "☼"
                        : terminal.specification.terminalKind === "switch"
                          ? "◒"
                          : "◉"}
                    </Text>
                    <Text style={styles.terminalText}>{terminal.name}</Text>
                    <Text>{selected ? "✓" : "+"}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>{t.drawRoute}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {spaces.map((space) => (
                <Choice
                  key={space.id}
                  label={space.name}
                  selected={space.id === selectedSpaceId}
                  onPress={() => {
                    setSelectedSpaceId(space.id);
                    setRoutePoints([]);
                  }}
                />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {ROLES.map((role) => (
                <Choice
                  key={role}
                  label={routeRoleLabel(role, t)}
                  selected={routeRole === role}
                  onPress={() => setRouteRole(role)}
                />
              ))}
            </ScrollView>
            <Pressable
              accessibilityLabel={t.drawRoute}
              onPress={(event) => {
                const point = viewport.toModel({
                  x: event.nativeEvent.locationX,
                  y: event.nativeEvent.locationY,
                });
                setRoutePoints((current) => [
                  ...current,
                  { x: Math.round(point.x), y: Math.round(point.y) },
                ]);
              }}
              style={styles.plan}
            >
              {vertices.map((start, index) => {
                const end = vertices[(index + 1) % vertices.length]!;
                return (
                  <Line
                    key={`wall-${index}`}
                    a={viewport.toView(start)}
                    b={viewport.toView(end)}
                    style={styles.wall}
                  />
                );
              })}
              {routePoints.slice(1).map((point, index) => (
                <Line
                  key={`route-${index}`}
                  a={viewport.toView(routePoints[index]!)}
                  b={viewport.toView(point)}
                  style={styles.route}
                />
              ))}
              {routePoints.map((point, index) => {
                const view = viewport.toView(point);
                return (
                  <View
                    key={`point-${index}`}
                    style={[styles.routePoint, { left: view.x - 7, top: view.y - 7 }]}
                  />
                );
              })}
            </Pressable>
            <Text style={styles.measure}>
              {(measuredPolylineLengthMm(routePoints) / 1000).toLocaleString()} m
            </Text>
            <View style={styles.actionRow}>
              <Pressable onPress={() => setRoutePoints([])} style={styles.secondary}>
                <Text style={styles.secondaryText}>{t.cancelRoute}</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={() => void saveRoute()}
                style={styles.primaryInline}
              >
                <Text style={styles.primaryText}>{t.finishRoute}</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createViewport(vertices: readonly Point2Mm[], width: number, height: number) {
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);
  const modelWidth = Math.max(Math.max(...xs, 1) - minX, 1);
  const modelHeight = Math.max(Math.max(...ys, 1) - minY, 1);
  const scale = Math.min((width - 32) / modelWidth, (height - 32) / modelHeight);
  const offsetX = (width - modelWidth * scale) / 2;
  const offsetY = (height - modelHeight * scale) / 2;
  return {
    toView: (point: Point2Mm) => ({
      x: offsetX + (point.x - minX) * scale,
      y: offsetY + (point.y - minY) * scale,
    }),
    toModel: (point: Point2Mm) => ({
      x: minX + (point.x - offsetX) / scale,
      y: minY + (point.y - offsetY) / scale,
    }),
  };
}

function Line({ a, b, style }: { a: Point2Mm; b: Point2Mm; style: object }) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return (
    <View
      style={[
        style,
        {
          left: (a.x + b.x - length) / 2,
          top: (a.y + b.y) / 2 - 2,
          transform: [{ rotate: `${angle}deg` }],
          width: length,
        },
      ]}
    />
  );
}

function Choice({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function routeRoleLabel(role: ElectricalRouteRole, t: (typeof messages)[keyof typeof messages]) {
  return {
    distribution: t.distributionRoute,
    light_feed: t.lightFeedRoute,
    switch_feed: t.switchFeedRoute,
    switch_return: t.switchReturnRoute,
    travellers: t.travellersRoute,
    control: t.controlRoute,
  }[role];
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  header: {
    alignItems: "center",
    backgroundColor: theme.colors.brand,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  back: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.12)",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  backText: { color: theme.colors.surface, fontSize: 34 },
  headerBody: { flex: 1 },
  title: { color: theme.colors.surface, fontSize: 21, fontWeight: "900" },
  subtitle: { color: "#CFE0DD", fontSize: 11, marginTop: 2 },
  content: { gap: 10, padding: 18 },
  error: { backgroundColor: "#FFF0EC", borderRadius: 14, color: theme.colors.danger, padding: 12 },
  sectionTitle: { color: theme.colors.ink, fontSize: 19, fontWeight: "900", marginTop: 14 },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    color: theme.colors.ink,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  choice: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 7,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  choiceSelected: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  choiceText: { color: theme.colors.ink, fontSize: 12, fontWeight: "800" },
  choiceTextSelected: { color: theme.colors.surface },
  primary: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 24,
    minHeight: 48,
    justifyContent: "center",
  },
  primaryInline: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 22,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
  },
  primaryText: { color: theme.colors.ink, fontWeight: "900" },
  proposal: {
    alignItems: "center",
    backgroundColor: theme.colors.brand,
    borderRadius: 24,
    minHeight: 48,
    justifyContent: "center",
  },
  proposalText: { color: theme.colors.surface, fontWeight: "900" },
  help: { color: theme.colors.muted, fontSize: 13 },
  terminalList: { gap: 7 },
  terminal: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  terminalSelected: { backgroundColor: theme.colors.accentSoft },
  terminalGlyph: { color: theme.colors.brand, fontSize: 20, fontWeight: "900" },
  terminalText: { color: theme.colors.ink, flex: 1, fontWeight: "800" },
  plan: {
    backgroundColor: "#E7ECE9",
    borderRadius: 20,
    height: 250,
    overflow: "hidden",
    position: "relative",
    width: 330,
  },
  wall: { backgroundColor: theme.colors.brand, borderRadius: 2, height: 5, position: "absolute" },
  route: { backgroundColor: theme.colors.accent, borderRadius: 3, height: 7, position: "absolute" },
  routePoint: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
    borderRadius: 7,
    borderWidth: 3,
    height: 14,
    position: "absolute",
    width: 14,
  },
  measure: { color: theme.colors.brand, fontSize: 18, fontWeight: "900", textAlign: "right" },
  actionRow: { flexDirection: "row", gap: 8 },
  secondary: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryText: { color: theme.colors.ink, fontWeight: "800" },
});
