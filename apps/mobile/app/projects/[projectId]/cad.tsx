import type { CadComponentKind } from "@obrametrik/application";
import type { Point2Mm } from "@obrametrik/domain";
import { messages } from "@obrametrik/i18n";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/auth/auth-provider";
import {
  cadTemplates,
  closestWallPoint,
  componentDefaults,
  documentForSpaceId,
  moveOrthogonalVertex,
  toCadPlan,
  type MobileCadDocument,
  type MobileCadMarker,
} from "../../../src/cad/model";
import { mobileBuildingModelRepository } from "../../../src/cad/repository";
import { Button, Field } from "../../../src/components/ui";
import { getDeviceLocale } from "../../../src/lib/i18n";
import { theme } from "../../../src/theme";

type Shape = keyof typeof cadTemplates;
type Mode = "2d" | "3d";
type ActiveTool = "select" | CadComponentKind;
const tools: readonly ActiveTool[] = [
  "select",
  "door", "window", "light", "switch", "socket", "cold_water", "hot_water", "drain",
];
const toolGlyphs: Record<ActiveTool, string> = {
  select: "⌖",
  door: "◩", window: "╫", light: "⊗", switch: "◒", socket: "⏚",
  cold_water: "●", hot_water: "●", drain: "◎",
};

function initialDocument(): MobileCadDocument {
  return {
    name: "",
    kind: "bathroom",
    vertices: cadTemplates.rectangle(4000, 3000),
    clearHeightMm: 2500,
    markers: [],
  };
}

export default function MobileCadScreen() {
  const { projectId, spaceId } = useLocalSearchParams<{ projectId: string; spaceId?: string }>();
  const { loading: authLoading, user } = useAuth();
  const t = messages[getDeviceLocale()];
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const [document, setDocument] = useState<MobileCadDocument>(initialDocument);
  const [shape, setShape] = useState<Shape>("rectangle");
  const [widthMm, setWidthMm] = useState("4000");
  const [depthMm, setDepthMm] = useState("3000");
  const [mode, setMode] = useState<Mode>("2d");
  const [tool, setTool] = useState<ActiveTool>("select");
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedVertex, setSelectedVertex] = useState<number>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [orbit, setOrbit] = useState({ yaw: -42, pitch: 24 });
  const [stageLayout, setStageLayout] = useState({
    width: Math.max(280, window.width),
    height: Math.max(300, window.height - 230),
  });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"clean" | "dirty" | "saving" | "error">("clean");
  const [errorKind, setErrorKind] = useState<"load" | "save">();

  const toolLabels: Record<ActiveTool, string> = {
    select: t.selectTool,
    door: t.doorTool,
    window: t.windowTool,
    light: t.lightTool,
    switch: t.switchTool,
    socket: t.socketTool,
    cold_water: t.coldWaterTool,
    hot_water: t.hotWaterTool,
    drain: t.drainTool,
  };

  const loadModel = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErrorKind(undefined);
    try {
      const [spaces, elements] = await Promise.all([
        mobileBuildingModelRepository.findSpacesByProject(projectId),
        mobileBuildingModelRepository.findElementsByProject(projectId),
      ]);
      if (spaceId) {
        const loaded = documentForSpaceId(spaces, elements, spaceId);
        const xs = loaded.vertices.map((point) => point.x);
        const ys = loaded.vertices.map((point) => point.y);
        setDocument(loaded);
        setWidthMm(String(Math.max(...xs) - Math.min(...xs)));
        setDepthMm(String(Math.max(...ys) - Math.min(...ys)));
      } else {
        setDocument(initialDocument());
        setWidthMm("4000");
        setDepthMm("3000");
      }
      setSaveState("clean");
    } catch {
      setErrorKind("load");
      setSaveState("error");
    } finally {
      setLoading(false);
    }
  }, [projectId, spaceId]);

  useEffect(() => {
    if (user) void loadModel();
  }, [loadModel, user]);

  const selected = document.markers.find((marker) => marker.id === selectedId);
  const bounds = useMemo(() => modelBounds(document.vertices), [document.vertices]);
  const viewport = useMemo(
    () => createViewport(bounds, stageLayout.width, stageLayout.height, zoom),
    [bounds, stageLayout, zoom],
  );

  function updateDocument(update: (current: MobileCadDocument) => MobileCadDocument) {
    setDocument(update);
    setErrorKind(undefined);
    setSaveState("dirty");
  }

  function applyShape() {
    const width = Number(widthMm);
    const depth = Number(depthMm);
    if (!Number.isInteger(width) || !Number.isInteger(depth) || width < 500 || depth < 500) return;
    const vertices = cadTemplates[shape](width, depth);
    updateDocument((current) => ({
      ...current,
      vertices,
      markers: current.markers.map((marker) => ({
        ...marker,
        ...closestWallPoint(vertices, marker.point, marker.widthMm),
      })),
    }));
  }

  function placeMarker(locationX: number, locationY: number) {
    const modelPoint = viewport.toModel({ x: locationX, y: locationY });
    if (tool === "select") {
      if (selectedVertex !== undefined) {
        const vertices = moveOrthogonalVertex(document.vertices, selectedVertex, modelPoint);
        updateDocument((current) => ({
          ...current,
          vertices,
          markers: current.markers.map((marker) => ({
            ...marker,
            ...closestWallPoint(vertices, marker.point, marker.widthMm),
          })),
        }));
        setSelectedVertex(undefined);
      } else if (selected) {
        const hosted = closestWallPoint(document.vertices, modelPoint, selected.widthMm);
        updateSelected(hosted);
      }
      return;
    }
    const hosted = closestWallPoint(document.vertices, modelPoint, componentDefaults[tool].widthMm);
    const marker: MobileCadMarker = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      kind: tool,
      ...hosted,
      ...componentDefaults[tool],
    };
    updateDocument((current) => ({ ...current, markers: [...current.markers, marker] }));
    setSelectedId(marker.id);
    setSelectedVertex(undefined);
  }

  function updateSelected(patch: Partial<MobileCadMarker>) {
    if (!selectedId) return;
    updateDocument((current) => ({
      ...current,
      markers: current.markers.map((marker) =>
        marker.id === selectedId ? { ...marker, ...patch } : marker,
      ),
    }));
  }

  async function save() {
    if (!projectId || !document.name.trim()) return;
    setSaveState("saving");
    setErrorKind(undefined);
    try {
      const saved = await mobileBuildingModelRepository.saveCadPlan(
        toCadPlan(projectId, document),
        document.spaceId,
      );
      setDocument((current) => ({ ...current, spaceId: saved.spaceId }));
      setSaveState("clean");
      if (!spaceId) {
        router.replace({
          pathname: "/projects/[projectId]/cad",
          params: { projectId, spaceId: saved.spaceId },
        });
      }
    } catch {
      setErrorKind("save");
      setSaveState("error");
    }
  }

  if (authLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!user) return <Redirect href="/login" />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>‹</Text>
        </Pressable>
        <View style={styles.headerIdentity}>
          <Text numberOfLines={1} style={styles.headerTitle}>{document.name || t.unsavedPlan}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.saveStatus}>
            {saveState === "saving"
              ? t.savingPlan
              : saveState === "dirty"
                ? t.savePending
                : errorKind === "load"
                  ? t.mobileCadLoadError
                  : errorKind === "save"
                    ? t.mobileCadSaveError
                    : t.planSaved}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t.savePlan}
          accessibilityRole="button"
          disabled={saveState === "saving" || !document.name.trim()}
          onPress={() => void save()}
          style={[styles.saveButton, (!document.name.trim() || saveState === "saving") && styles.disabled]}
        >
          <Text style={styles.saveButtonText}>✓</Text>
        </Pressable>
      </View>

      <View style={styles.modeBar}>
        {(["2d", "3d"] as const).map((item) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === item }}
            key={item}
            onPress={() => setMode(item)}
            style={[styles.modeButton, mode === item && styles.modeActive]}
          >
            <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>
              {item === "2d" ? t.mode2d : t.mode3d}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.toolContent}
        showsHorizontalScrollIndicator={false}
        style={styles.tools}
      >
        {tools.map((item) => (
          <Pressable
            accessibilityLabel={toolLabels[item]}
            accessibilityRole="button"
            accessibilityState={{ selected: tool === item }}
            key={item}
            onPress={() => {
              setTool(item);
              setSelectedVertex(undefined);
            }}
            style={[styles.tool, tool === item && styles.toolActive]}
          >
            <Text style={[styles.toolGlyph, item === "cold_water" && styles.cold, item === "hot_water" && styles.hot]}>
              {toolGlyphs[item]}
            </Text>
            <Text numberOfLines={1} style={[styles.toolLabel, tool === item && styles.toolLabelActive]}>{toolLabels[item]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          if (width > 0 && height > 0) setStageLayout({ width, height });
        }}
        style={styles.stageCard}
      >
        {loading ? (
          <View style={styles.stage}><ActivityIndicator color={theme.colors.brand} /></View>
        ) : errorKind === "load" ? (
          <View style={styles.stage}>
            <Text accessibilityRole="alert" style={styles.stageError}>{t.mobileCadLoadError}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadModel()} style={styles.retryButton}>
              <Text style={styles.retryText}>{t.retry}</Text>
            </Pressable>
          </View>
        ) : mode === "2d" ? (
          <Pressable
            accessibilityHint={t.mobileCadTapHint}
            accessibilityLabel={t.mode2d}
            onPress={(event) => placeMarker(event.nativeEvent.locationX, event.nativeEvent.locationY)}
            style={styles.stage}
          >
            <PlanCanvas
              markers={document.markers}
              onSelect={(id) => {
                setSelectedId(id);
                setSelectedVertex(undefined);
              }}
              onSelectVertex={(index) => {
                setSelectedVertex(index);
                setSelectedId(undefined);
                setTool("select");
              }}
              selectedId={selectedId}
              selectedVertex={selectedVertex}
              vertices={document.vertices}
              viewport={viewport}
            />
          </Pressable>
        ) : (
          <SpatialPreview
            heightMm={document.clearHeightMm}
            markers={document.markers}
            orbit={orbit}
            size={stageLayout}
            vertices={document.vertices}
            zoom={zoom}
          />
        )}

        <View style={styles.canvasActions}>
          {mode === "3d" ? (
            <>
              <CanvasButton label={t.mode3d} onPress={() => setOrbit((value) => ({ ...value, yaw: value.yaw - 15 }))}>↶</CanvasButton>
              <CanvasButton label={t.mode3d} onPress={() => setOrbit((value) => ({ ...value, yaw: value.yaw + 15 }))}>↷</CanvasButton>
            </>
          ) : null}
          <CanvasButton label={t.mobileCadSpatialPreview} onPress={() => setZoom((value) => Math.max(0.65, value - 0.2))}>−</CanvasButton>
          <CanvasButton label={t.mobileCadSpatialPreview} onPress={() => setZoom((value) => Math.min(2.4, value + 0.2))}>+</CanvasButton>
          <CanvasButton label={t.mobileCadApplyShape} onPress={() => setZoom(1)}>⌂</CanvasButton>
          <CanvasButton label={t.mobileCadApplyShape} onPress={() => setSettingsOpen(true)}>⚙</CanvasButton>
        </View>
      </View>

      {settingsOpen ? (
        <View style={[styles.settingsPanel, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.panelHeader}>
              <Text style={styles.inspectorTitle}>{t.mobileCadApplyShape}</Text>
              <Pressable accessibilityRole="button" onPress={() => setSettingsOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.form}>
              <Field label={t.spaceName} onChangeText={(name) => updateDocument((current) => ({ ...current, name }))} value={document.name} />
              <Field keyboardType="number-pad" label={t.spaceHeightMm} onChangeText={(value) => updateDocument((current) => ({ ...current, clearHeightMm: Number(value) || 0 }))} unit="mm" value={String(document.clearHeightMm)} />
              <View accessibilityRole="radiogroup" style={styles.shapeRow}>
                {(["rectangle", "l_shape", "u_shape"] as const).map((item) => (
                  <Pressable accessibilityRole="radio" accessibilityState={{ checked: shape === item }} key={item} onPress={() => setShape(item)} style={[styles.shape, shape === item && styles.shapeActive]}>
                    <Text style={styles.shapeText}>{item === "rectangle" ? t.rectangleShape : item === "l_shape" ? t.lShape : t.uShape}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.dimensionRow}>
                <View style={styles.dimension}><Field keyboardType="number-pad" label={t.mobileCadWidth} onChangeText={setWidthMm} unit="mm" value={widthMm} /></View>
                <View style={styles.dimension}><Field keyboardType="number-pad" label={t.mobileCadDepth} onChangeText={setDepthMm} unit="mm" value={depthMm} /></View>
              </View>
              <Button onPress={() => { applyShape(); setSettingsOpen(false); }} variant="secondary">{t.mobileCadApplyShape}</Button>
            </View>
          </ScrollView>
        </View>
      ) : null}

      {selected ? (
        <View style={[styles.inspector, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inspectorHandle} />
          <Text style={styles.inspectorTitle}>{toolLabels[selected.kind]}</Text>
          <View style={styles.inspectorFields}>
            <CompactNumber label={t.componentWidthMm} onChange={(widthMm) => updateSelected({ widthMm })} value={selected.widthMm} />
            <CompactNumber label={t.componentHeightMm} onChange={(heightMm) => updateSelected({ heightMm })} value={selected.heightMm} />
            <CompactNumber label={t.componentElevationMm} onChange={(elevationMm) => updateSelected({ elevationMm })} value={selected.elevationMm} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              updateDocument((current) => ({ ...current, markers: current.markers.filter((marker) => marker.id !== selected.id) }));
              setSelectedId(undefined);
            }}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>{t.deleteComponent}</Text>
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function modelBounds(vertices: readonly Point2Mm[]) {
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function createViewport(
  bounds: ReturnType<typeof modelBounds>,
  width: number,
  height: number,
  zoom = 1,
) {
  const padding = 44;
  const scale = Math.min(
    (width - padding * 2) / Math.max(bounds.maxX - bounds.minX, 1),
    (height - padding * 2) / Math.max(bounds.maxY - bounds.minY, 1),
  ) * zoom;
  const offsetX = (width - (bounds.maxX - bounds.minX) * scale) / 2;
  const offsetY = (height - (bounds.maxY - bounds.minY) * scale) / 2;
  return {
    scale,
    toScreen: (point: Point2Mm) => ({ x: offsetX + (point.x - bounds.minX) * scale, y: offsetY + (point.y - bounds.minY) * scale }),
    toModel: (point: Point2Mm) => ({ x: Math.round((point.x - offsetX) / scale + bounds.minX), y: Math.round((point.y - offsetY) / scale + bounds.minY) }),
  };
}

function PlanCanvas({
  markers, onSelect, onSelectVertex, selectedId, selectedVertex, vertices, viewport,
}: {
  markers: readonly MobileCadMarker[];
  onSelect: (id: string) => void;
  onSelectVertex: (index: number) => void;
  selectedId?: string;
  selectedVertex?: number;
  vertices: readonly Point2Mm[];
  viewport: ReturnType<typeof createViewport>;
}) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {vertices.map((start, index) => {
        const a = viewport.toScreen(start);
        const b = viewport.toScreen(vertices[(index + 1) % vertices.length]!);
        return <PlanLine a={a} b={b} key={`wall-${index}`} />;
      })}
      {vertices.map((vertex, index) => {
        const point = viewport.toScreen(vertex);
        return (
          <Pressable
            accessibilityRole="button"
            key={`vertex-${index}`}
            onPress={(event) => {
              event.stopPropagation();
              onSelectVertex(index);
            }}
            style={[
              styles.vertex,
              { left: point.x - 12, top: point.y - 12 },
              selectedVertex === index && styles.vertexSelected,
            ]}
          />
        );
      })}
      {markers.map((marker) => {
        const point = viewport.toScreen(marker.point);
        const selected = marker.id === selectedId;
        return (
          <Pressable
            accessibilityRole="button"
            key={marker.id}
            onPress={(event) => { event.stopPropagation(); onSelect(marker.id); }}
            style={[styles.marker, { left: point.x - 18, top: point.y - 18 }, selected && styles.markerSelected]}
          >
            <Text style={[styles.markerGlyph, marker.kind === "cold_water" && styles.cold, marker.kind === "hot_water" && styles.hot]}>{toolGlyphs[marker.kind]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PlanLine({ a, b }: { a: Point2Mm; b: Point2Mm }) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  return <View style={[styles.wall, { left: (a.x + b.x - length) / 2, top: (a.y + b.y) / 2 - 3, width: length, transform: [{ rotate: `${angle}deg` }] }]} />;
}

function SpatialPreview({
  heightMm, markers, orbit, size, vertices, zoom,
}: {
  heightMm: number;
  markers: readonly MobileCadMarker[];
  orbit: { yaw: number; pitch: number };
  size: { width: number; height: number };
  vertices: readonly Point2Mm[];
  zoom: number;
}) {
  const bounds = modelBounds(vertices);
  const extent = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, heightMm, 1);
  const scale = (Math.min(size.width, size.height) * 0.68 * zoom) / extent;
  const yaw = orbit.yaw * Math.PI / 180;
  const pitch = orbit.pitch * Math.PI / 180;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const project = (point: Point2Mm, z = 0) => ({
    x: size.width / 2 + ((point.x - centerX) * Math.cos(yaw) - (point.y - centerY) * Math.sin(yaw)) * scale,
    y: size.height / 2
      + (((point.x - centerX) * Math.sin(yaw) + (point.y - centerY) * Math.cos(yaw)) * Math.sin(pitch)
      - (z - heightMm / 2) * Math.cos(pitch)) * scale,
  });
  return (
    <View accessibilityLabel={messages[getDeviceLocale()].mobileCadSpatialPreview} style={styles.stage}>
      {vertices.map((start, index) => (
        <PlanLine a={project(start)} b={project(vertices[(index + 1) % vertices.length]!)} key={`floor-${index}`} />
      ))}
      {vertices.map((start, index) => {
        const end = vertices[(index + 1) % vertices.length]!;
        return (
          <View key={`spatial-${index}`} pointerEvents="none">
            <PlanLine a={project(start)} b={project(end)} />
            <PlanLine a={project(start)} b={project(start, heightMm)} />
            <PlanLine a={project(start, heightMm)} b={project(end, heightMm)} />
          </View>
        );
      })}
      {markers.map((marker) => {
        const point = project(marker.point, marker.elevationMm);
        return <View key={marker.id} style={[styles.spatialMarker, { left: point.x - 10, top: point.y - 10 }]}><Text style={styles.spatialGlyph}>{toolGlyphs[marker.kind]}</Text></View>;
      })}
    </View>
  );
}

function CanvasButton({
  children,
  label,
  onPress,
}: {
  children: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.canvasButton}>
      <Text style={styles.canvasButtonText}>{children}</Text>
    </Pressable>
  );
}

function CompactNumber({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <View style={styles.compact}>
      <Text numberOfLines={1} style={styles.compactLabel}>{label}</Text>
      <View style={styles.compactInput}>
        <TextInput keyboardType="number-pad" onChangeText={(text) => onChange(Number(text) || 0)} style={styles.compactText} value={String(value)} />
        <Text style={styles.compactUnit}>mm</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  header: { alignItems: "center", backgroundColor: theme.colors.brand, flexDirection: "row", gap: 12, paddingBottom: 12, paddingHorizontal: 16 },
  headerButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,.12)", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  headerButtonText: { color: theme.colors.surface, fontSize: 34, lineHeight: 38 },
  headerIdentity: { flex: 1 },
  headerTitle: { color: theme.colors.surface, fontSize: 17, fontWeight: "800" },
  saveStatus: { color: "#CFE0DD", fontSize: 11, marginTop: 2 },
  saveButton: { alignItems: "center", backgroundColor: theme.colors.accent, borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  saveButtonText: { color: theme.colors.ink, fontSize: 22, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  modeBar: { backgroundColor: theme.colors.brand, flexDirection: "row", gap: 6, paddingBottom: 10, paddingHorizontal: 16 },
  modeButton: { alignItems: "center", borderRadius: 16, flex: 1, minHeight: 42, justifyContent: "center" },
  modeActive: { backgroundColor: theme.colors.surface },
  modeText: { color: "#CFE0DD", fontSize: 13, fontWeight: "800" },
  modeTextActive: { color: theme.colors.brand },
  tools: { backgroundColor: theme.colors.surface, flexGrow: 0, maxHeight: 82 },
  toolContent: { gap: 7, padding: 8 },
  tool: { alignItems: "center", borderRadius: 14, height: 66, justifyContent: "center", paddingHorizontal: 10, width: 78 },
  toolActive: { backgroundColor: theme.colors.accent },
  toolGlyph: { color: theme.colors.brand, fontSize: 23, fontWeight: "800" },
  toolLabel: { color: theme.colors.muted, fontSize: 9, fontWeight: "700", marginTop: 2 },
  toolLabelActive: { color: theme.colors.ink },
  cold: { color: "#3277B5" },
  hot: { color: "#D86045" },
  stageCard: { backgroundColor: "#E7ECE9", flex: 1, minHeight: 260, overflow: "hidden", position: "relative" },
  stage: { alignItems: "center", backgroundColor: "#E7ECE9", flex: 1, justifyContent: "center", overflow: "hidden", position: "relative", width: "100%" },
  stageError: { color: theme.colors.danger, fontSize: 14, fontWeight: "700", maxWidth: 260, textAlign: "center" },
  retryButton: { backgroundColor: theme.colors.accent, borderRadius: 20, marginTop: 14, minHeight: 44, justifyContent: "center", paddingHorizontal: 20 },
  retryText: { color: theme.colors.ink, fontWeight: "800" },
  wall: { backgroundColor: theme.colors.brand, borderRadius: 3, height: 6, position: "absolute" },
  vertex: { backgroundColor: theme.colors.surface, borderColor: theme.colors.brand, borderRadius: 12, borderWidth: 3, height: 24, position: "absolute", width: 24 },
  vertexSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.ink, transform: [{ scale: 1.2 }] },
  marker: { alignItems: "center", backgroundColor: theme.colors.surface, borderColor: theme.colors.brand, borderRadius: 18, borderWidth: 2, height: 36, justifyContent: "center", position: "absolute", width: 36 },
  markerSelected: { backgroundColor: theme.colors.accent, borderWidth: 3 },
  markerGlyph: { color: theme.colors.brand, fontSize: 18, fontWeight: "800" },
  spatialMarker: { alignItems: "center", backgroundColor: theme.colors.accent, borderRadius: 10, height: 20, justifyContent: "center", position: "absolute", width: 20 },
  spatialGlyph: { color: theme.colors.ink, fontSize: 11, fontWeight: "800" },
  canvasActions: { bottom: 14, flexDirection: "row", gap: 8, position: "absolute", right: 14 },
  canvasButton: { alignItems: "center", backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 24, borderWidth: 1, elevation: 3, height: 48, justifyContent: "center", shadowColor: theme.colors.brand, shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.12, shadowRadius: 7, width: 48 },
  canvasButtonText: { color: theme.colors.brand, fontSize: 22, fontWeight: "800" },
  form: { gap: 14, paddingBottom: 8, paddingHorizontal: 18 },
  shapeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  shape: { alignItems: "center", backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flex: 1, minHeight: 48, justifyContent: "center", padding: 8 },
  shapeActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  shapeText: { color: theme.colors.ink, fontSize: 11, fontWeight: "800", textAlign: "center" },
  dimensionRow: { flexDirection: "row", gap: 10 },
  dimension: { flex: 1 },
  settingsPanel: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, bottom: 0, elevation: 16, left: 0, maxHeight: "78%", paddingTop: 8, position: "absolute", right: 0, shadowColor: theme.colors.brand, shadowOffset: { height: -8, width: 0 }, shadowOpacity: 0.18, shadowRadius: 24, zIndex: 20 },
  panelHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 8 },
  closeButton: { alignItems: "center", height: 48, justifyContent: "center", width: 48 },
  closeText: { color: theme.colors.ink, fontSize: 30, lineHeight: 34 },
  inspector: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, bottom: 0, elevation: 12, left: 0, paddingHorizontal: 16, paddingTop: 8, position: "absolute", right: 0, shadowColor: theme.colors.brand, shadowOffset: { height: -8, width: 0 }, shadowOpacity: 0.16, shadowRadius: 24 },
  inspectorHandle: { alignSelf: "center", backgroundColor: theme.colors.border, borderRadius: 3, height: 5, width: 48 },
  inspectorTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: "800", marginTop: 10 },
  inspectorFields: { flexDirection: "row", gap: 8, marginTop: 10 },
  compact: { flex: 1 },
  compactLabel: { color: theme.colors.muted, fontSize: 9, fontWeight: "700" },
  compactInput: { alignItems: "center", backgroundColor: theme.colors.canvas, borderRadius: 12, flexDirection: "row", marginTop: 4, minHeight: 44, paddingHorizontal: 8 },
  compactText: { color: theme.colors.ink, flex: 1, fontSize: 14, fontWeight: "800" },
  compactUnit: { color: theme.colors.muted, fontSize: 10 },
  deleteButton: { alignItems: "center", minHeight: 44, justifyContent: "center", marginTop: 6 },
  deleteText: { color: theme.colors.danger, fontSize: 13, fontWeight: "800" },
});
