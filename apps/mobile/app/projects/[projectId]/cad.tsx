import type { CadComponentKind } from "@obrametrik/application";
import type { Point2Mm } from "@obrametrik/domain";
import { messages } from "@obrametrik/i18n";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/auth/auth-provider";
import {
  cadTemplates,
  closestWallPoint,
  componentDefaults,
  documentForSpaceId,
  edgeLengthMm,
  moveOrthogonalVertex,
  reprojectHostedMarkers,
  resizeWall,
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
type TechnicalView = "iso" | "top" | "front" | "right";
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
  const [selectedWall, setSelectedWall] = useState<number>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [orbit, setOrbit] = useState({ yaw: -42, pitch: 24 });
  const [technicalView, setTechnicalView] = useState<TechnicalView>("iso");
  const [showDimensions, setShowDimensions] = useState(false);
  const history = useRef<MobileCadDocument[]>([]);
  const future = useRef<MobileCadDocument[]>([]);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
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
      history.current = [];
      future.current = [];
      setHistoryState({ canUndo: false, canRedo: false });
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

  function checkpoint() {
    history.current = [...history.current.slice(-39), document];
    future.current = [];
    setHistoryState({ canUndo: true, canRedo: false });
  }

  function updateDocument(
    update: (current: MobileCadDocument) => MobileCadDocument,
    recordHistory = true,
  ) {
    setDocument((current) => {
      const next = update(current);
      if (next === current) return current;
      if (recordHistory) {
        history.current = [...history.current.slice(-39), current];
        future.current = [];
        setHistoryState({ canUndo: true, canRedo: false });
      }
      return next;
    });
    setErrorKind(undefined);
    setSaveState("dirty");
  }

  function undo() {
    const previous = history.current.at(-1);
    if (!previous) return;
    history.current = history.current.slice(0, -1);
    future.current = [document, ...future.current.slice(0, 39)];
    setDocument(previous);
    setHistoryState({ canUndo: history.current.length > 0, canRedo: true });
    setSaveState("dirty");
  }

  function redo() {
    const next = future.current[0];
    if (!next) return;
    future.current = future.current.slice(1);
    history.current = [...history.current.slice(-39), document];
    setDocument(next);
    setHistoryState({ canUndo: true, canRedo: future.current.length > 0 });
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
      setSelectedId(undefined);
      setSelectedVertex(undefined);
      setSelectedWall(undefined);
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
    setSelectedWall(undefined);
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

  const save = useCallback(async () => {
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
  }, [document, projectId, spaceId]);

  useEffect(() => {
    if (saveState !== "dirty" || !document.name.trim() || loading) return;
    const timeout = setTimeout(() => void save(), 1200);
    return () => clearTimeout(timeout);
  }, [document.name, loading, save, saveState]);

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
        <View style={styles.modeSwitch}>
          {(["2d", "3d"] as const).map((item) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === item }} key={item} onPress={() => setMode(item)} style={[styles.modeButton, mode === item && styles.modeActive]}>
              <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item === "2d" ? t.mode2d : t.mode3d}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityLabel={t.undo} accessibilityRole="button" disabled={!historyState.canUndo} onPress={undo} style={[styles.historyButton, !historyState.canUndo && styles.disabled]}>
          <Text style={styles.historyText}>↶</Text>
        </Pressable>
        <Pressable accessibilityLabel={t.redo} accessibilityRole="button" disabled={!historyState.canRedo} onPress={redo} style={[styles.historyButton, !historyState.canRedo && styles.disabled]}>
          <Text style={styles.historyText}>↷</Text>
        </Pressable>
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
                setSelectedWall(undefined);
              }}
              onSelectVertex={(index) => {
                setSelectedVertex(index);
                setSelectedId(undefined);
                setSelectedWall(undefined);
                setTool("select");
              }}
              onSelectWall={(index) => {
                setSelectedWall(index);
                setSelectedId(undefined);
                setSelectedVertex(undefined);
                setTool("select");
              }}
              onMoveMarker={(id, point) => {
                updateDocument((current) => ({
                  ...current,
                  markers: current.markers.map((marker) =>
                    marker.id === id
                      ? { ...marker, ...closestWallPoint(current.vertices, point, marker.widthMm) }
                      : marker,
                  ),
                }), false);
              }}
              onMoveStart={checkpoint}
              onMoveVertex={(index, point) => {
                updateDocument((current) => {
                  const vertices = moveOrthogonalVertex(current.vertices, index, point);
                  return {
                    ...current,
                    vertices,
                    markers: reprojectHostedMarkers(current.markers, current.vertices, vertices),
                  };
                }, false);
              }}
              selectedId={selectedId}
              selectedVertex={selectedVertex}
              selectedWall={selectedWall}
              showDimensions={showDimensions}
              vertices={document.vertices}
              viewport={viewport}
            />
          </Pressable>
        ) : (
          <SpatialPreview
            heightMm={document.clearHeightMm}
            markers={document.markers}
            onOrbitChange={(next) => {
              setOrbit(next);
              setTechnicalView("iso");
            }}
            onSelect={(id) => {
              setSelectedId(id);
              setSelectedWall(undefined);
            }}
            orbit={orbit}
            selectedId={selectedId}
            size={stageLayout}
            vertices={document.vertices}
            zoom={zoom}
            onZoomChange={setZoom}
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
          {mode === "2d" ? (
            <CanvasButton label={t.wallLengthMm} onPress={() => setShowDimensions((value) => !value)}>
              {showDimensions ? "↔" : "⇥"}
            </CanvasButton>
          ) : null}
          <CanvasButton label={t.mobileCadApplyShape} onPress={() => setSettingsOpen(true)}>⚙</CanvasButton>
        </View>
        {mode === "3d" ? (
          <View style={styles.viewBar}>
            {([
              ["top", t.viewTop, { yaw: 0, pitch: 90 }],
              ["front", t.viewFront, { yaw: 0, pitch: 0 }],
              ["right", t.viewRight, { yaw: 90, pitch: 0 }],
              ["iso", t.viewIso, { yaw: -42, pitch: 24 }],
            ] as const).map(([view, label, camera]) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: technicalView === view }}
                key={view}
                onPress={() => {
                  setTechnicalView(view);
                  setOrbit(camera);
                  setZoom(1);
                }}
                style={[styles.viewButton, technicalView === view && styles.viewButtonActive]}
              >
                <Text style={[styles.viewButtonText, technicalView === view && styles.viewButtonTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
      ) : selectedWall !== undefined ? (
        <View style={[styles.inspector, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inspectorHandle} />
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.inspectorTitle}>{t.wallSelected}</Text>
              <Text style={styles.wallIdentity}>W{selectedWall + 1}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setSelectedWall(undefined)} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <CompactNumber
            label={t.wallLengthMm}
            onChange={(lengthMm) => {
              const previousVertices = document.vertices;
              const vertices = resizeWall(previousVertices, selectedWall, lengthMm);
              updateDocument((current) => ({
                ...current,
                vertices,
                markers: reprojectHostedMarkers(current.markers, previousVertices, vertices),
              }));
            }}
            value={edgeLengthMm(
              document.vertices[selectedWall]!,
              document.vertices[(selectedWall + 1) % document.vertices.length]!,
            )}
          />
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
  markers, onMoveMarker, onMoveStart, onMoveVertex, onSelect, onSelectVertex, onSelectWall,
  selectedId, selectedVertex, selectedWall, showDimensions, vertices, viewport,
}: {
  markers: readonly MobileCadMarker[];
  onMoveMarker: (id: string, point: Point2Mm) => void;
  onMoveStart: () => void;
  onMoveVertex: (index: number, point: Point2Mm) => void;
  onSelect: (id: string) => void;
  onSelectVertex: (index: number) => void;
  onSelectWall: (index: number) => void;
  selectedId?: string;
  selectedVertex?: number;
  selectedWall?: number;
  showDimensions: boolean;
  vertices: readonly Point2Mm[];
  viewport: ReturnType<typeof createViewport>;
}) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {vertices.map((start, index) => {
        const a = viewport.toScreen(start);
        const b = viewport.toScreen(vertices[(index + 1) % vertices.length]!);
        const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        return (
          <View key={`wall-${index}`}>
            <PlanLine a={a} b={b} selected={selectedWall === index} />
            {showDimensions ? (
              <Pressable
                accessibilityRole="button"
                onPress={(event) => {
                  event.stopPropagation();
                  onSelectWall(index);
                }}
                style={[styles.dimensionBadge, { left: midpoint.x - 34, top: midpoint.y - 12 }]}
              >
                <Text style={styles.dimensionText}>{edgeLengthMm(start, vertices[(index + 1) % vertices.length]!)} mm</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
      {vertices.map((vertex, index) => {
        const point = viewport.toScreen(vertex);
        return (
          <DraggablePlanEntity
            modelPoint={vertex}
            key={`vertex-${index}`}
            onMove={(next) => onMoveVertex(index, next)}
            onMoveStart={() => {
              onSelectVertex(index);
              onMoveStart();
            }}
            scale={viewport.scale}
            style={[
              styles.vertex,
              { left: point.x - 12, top: point.y - 12 },
              selectedVertex === index && styles.vertexSelected,
            ]}
          >
            <View />
          </DraggablePlanEntity>
        );
      })}
      {markers.map((marker) => {
        const point = viewport.toScreen(marker.point);
        const selected = marker.id === selectedId;
        const start = vertices[marker.wallIndex]!;
        const end = vertices[(marker.wallIndex + 1) % vertices.length]!;
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
        const symbolWidth = Math.max(36, marker.widthMm * viewport.scale);
        return (
          <DraggablePlanEntity
            modelPoint={marker.point}
            key={marker.id}
            onMove={(next) => onMoveMarker(marker.id, next)}
            onMoveStart={() => {
              onSelect(marker.id);
              onMoveStart();
            }}
            scale={viewport.scale}
            style={[
              styles.cadSymbol,
              {
                left: point.x - symbolWidth / 2,
                top: point.y - 24,
                transform: [{ rotate: `${angle}deg` }],
                width: symbolWidth,
              },
              selected && styles.markerSelected,
            ]}
          >
            <CadSymbol2D kind={marker.kind} />
          </DraggablePlanEntity>
        );
      })}
    </View>
  );
}

function DraggablePlanEntity({
  children,
  modelPoint,
  onMove,
  onMoveStart,
  scale,
  style,
}: {
  children: ReactNode;
  modelPoint: Point2Mm;
  onMove: (point: Point2Mm) => void;
  onMoveStart: () => void;
  scale: number;
  style: object;
}) {
  const origin = useRef(modelPoint);
  const responder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        origin.current = modelPoint;
        onMoveStart();
      },
      onPanResponderMove: (_, gesture) => {
        onMove({
          x: Math.round((origin.current.x + gesture.dx / Math.max(scale, 0.0001)) / 50) * 50,
          y: Math.round((origin.current.y + gesture.dy / Math.max(scale, 0.0001)) / 50) * 50,
        });
      },
    }),
    [modelPoint, onMove, onMoveStart, scale],
  );
  return <View {...responder.panHandlers} style={style}>{children}</View>;
}

function CadSymbol2D({ kind }: { kind: CadComponentKind }) {
  if (kind === "door") {
    return (
      <View style={styles.openingSymbol}>
        <View style={styles.wallGap} />
        <View style={styles.doorLeaf} />
        <View style={styles.doorSwing} />
      </View>
    );
  }
  if (kind === "window") {
    return (
      <View style={styles.openingSymbol}>
        <View style={styles.wallGap} />
        <View style={[styles.windowLine, { top: 18 }]} />
        <View style={[styles.windowLine, { top: 27 }]} />
      </View>
    );
  }
  return (
    <View style={[styles.technicalSymbol, kind === "cold_water" && styles.coldSymbol, kind === "hot_water" && styles.hotSymbol]}>
      <Text style={[styles.markerGlyph, kind === "cold_water" && styles.cold, kind === "hot_water" && styles.hot]}>{toolGlyphs[kind]}</Text>
    </View>
  );
}

function PlanLine({ a, b, selected = false }: { a: Point2Mm; b: Point2Mm; selected?: boolean }) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  return <View style={[styles.wall, selected && styles.wallSelected, { left: (a.x + b.x - length) / 2, top: (a.y + b.y) / 2 - 3, width: length, transform: [{ rotate: `${angle}deg` }] }]} />;
}

function SpatialPreview({
  heightMm, markers, onOrbitChange, onSelect, onZoomChange, orbit, selectedId, size, vertices, zoom,
}: {
  heightMm: number;
  markers: readonly MobileCadMarker[];
  onOrbitChange: (orbit: { yaw: number; pitch: number }) => void;
  onSelect: (id: string) => void;
  onZoomChange: (zoom: number) => void;
  orbit: { yaw: number; pitch: number };
  selectedId?: string;
  size: { width: number; height: number };
  vertices: readonly Point2Mm[];
  zoom: number;
}) {
  const gesture = useRef<{ distance?: number; x: number; y: number } | undefined>(undefined);
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
  function touchState(event: GestureResponderEvent) {
    const touches = event.nativeEvent.touches;
    const first = touches[0];
    const second = touches[1];
    if (!first) return;
    if (second) {
      gesture.current = {
        distance: Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY),
        x: (first.pageX + second.pageX) / 2,
        y: (first.pageY + second.pageY) / 2,
      };
    } else {
      gesture.current = { x: first.pageX, y: first.pageY };
    }
  }

  function moveCamera(event: GestureResponderEvent) {
    const previous = gesture.current;
    const touches = event.nativeEvent.touches;
    const first = touches[0];
    const second = touches[1];
    if (!previous || !first) return touchState(event);
    if (second) {
      const distance = Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
      if (previous.distance) {
        onZoomChange(Math.max(0.55, Math.min(2.8, zoom * distance / previous.distance)));
      }
    } else {
      onOrbitChange({
        yaw: orbit.yaw + (first.pageX - previous.x) * 0.35,
        pitch: Math.max(-70, Math.min(85, orbit.pitch - (first.pageY - previous.y) * 0.25)),
      });
    }
    touchState(event);
  }

  return (
    <View
      accessibilityLabel={messages[getDeviceLocale()].mobileCadSpatialPreview}
      onTouchEnd={() => { gesture.current = undefined; }}
      onTouchMove={moveCamera}
      onTouchStart={touchState}
      style={styles.stage}
    >
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
        const wallStart = vertices[marker.wallIndex]!;
        const wallEnd = vertices[(marker.wallIndex + 1) % vertices.length]!;
        const wallLength = Math.max(1, edgeLengthMm(wallStart, wallEnd));
        const tangent = {
          x: (wallEnd.x - wallStart.x) / wallLength,
          y: (wallEnd.y - wallStart.y) / wallLength,
        };
        const left = {
          x: marker.point.x - tangent.x * marker.widthMm / 2,
          y: marker.point.y - tangent.y * marker.widthMm / 2,
        };
        const right = {
          x: marker.point.x + tangent.x * marker.widthMm / 2,
          y: marker.point.y + tangent.y * marker.widthMm / 2,
        };
        const bottomLeft = project(left, marker.elevationMm);
        const bottomRight = project(right, marker.elevationMm);
        const topLeft = project(left, marker.elevationMm + marker.heightMm);
        const topRight = project(right, marker.elevationMm + marker.heightMm);
        const center = project(marker.point, marker.elevationMm + marker.heightMm / 2);
        if (marker.kind === "door" || marker.kind === "window") {
          return (
            <View key={marker.id} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              <PlanLine a={bottomLeft} b={bottomRight} selected={selectedId === marker.id} />
              <PlanLine a={bottomLeft} b={topLeft} selected={selectedId === marker.id} />
              <PlanLine a={topLeft} b={topRight} selected={selectedId === marker.id} />
              <PlanLine a={bottomRight} b={topRight} selected={selectedId === marker.id} />
              {marker.kind === "window" ? <PlanLine a={bottomLeft} b={topRight} /> : null}
              <Pressable
                onPress={() => onSelect(marker.id)}
                style={[styles.spatialOpeningHit, { left: center.x - 22, top: center.y - 22 }]}
              />
            </View>
          );
        }
        return (
          <Pressable
            key={marker.id}
            onPress={() => onSelect(marker.id)}
            style={[styles.spatialMarker, selectedId === marker.id && styles.spatialMarkerSelected, { left: center.x - 18, top: center.y - 18 }]}
          >
            <Text style={styles.spatialGlyph}>{toolGlyphs[marker.kind]}</Text>
          </Pressable>
        );
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
  modeBar: { alignItems: "center", backgroundColor: theme.colors.brand, flexDirection: "row", gap: 6, paddingBottom: 10, paddingHorizontal: 16 },
  modeSwitch: { flex: 1, flexDirection: "row", gap: 5 },
  modeButton: { alignItems: "center", borderRadius: 16, flex: 1, minHeight: 42, justifyContent: "center" },
  modeActive: { backgroundColor: theme.colors.surface },
  modeText: { color: "#CFE0DD", fontSize: 13, fontWeight: "800" },
  modeTextActive: { color: theme.colors.brand },
  historyButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,.12)", borderRadius: 21, height: 42, justifyContent: "center", width: 42 },
  historyText: { color: theme.colors.surface, fontSize: 21, fontWeight: "800" },
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
  wallSelected: { backgroundColor: theme.colors.accent, height: 9 },
  dimensionBadge: { alignItems: "center", backgroundColor: "rgba(249,248,244,.9)", borderRadius: 6, height: 24, justifyContent: "center", position: "absolute", width: 68 },
  dimensionText: { color: theme.colors.ink, fontSize: 8, fontWeight: "800" },
  vertex: { backgroundColor: theme.colors.surface, borderColor: theme.colors.brand, borderRadius: 12, borderWidth: 3, height: 24, position: "absolute", width: 24 },
  vertexSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.ink, transform: [{ scale: 1.2 }] },
  cadSymbol: { alignItems: "center", borderColor: "transparent", borderRadius: 10, borderWidth: 2, height: 48, justifyContent: "center", minWidth: 36, position: "absolute" },
  markerSelected: { backgroundColor: "rgba(244,172,61,.22)", borderColor: theme.colors.accent, borderStyle: "dashed" },
  markerGlyph: { color: theme.colors.brand, fontSize: 18, fontWeight: "800" },
  openingSymbol: { height: 48, position: "relative", width: "100%" },
  wallGap: { backgroundColor: "#E7ECE9", height: 12, left: 0, position: "absolute", right: 0, top: 18 },
  doorLeaf: { backgroundColor: theme.colors.ink, height: 3, left: 0, position: "absolute", top: 22, transform: [{ rotate: "-45deg" }], transformOrigin: "left center", width: "70%" },
  doorSwing: { borderColor: theme.colors.brand, borderRadius: 30, borderRightWidth: 1, borderTopWidth: 1, height: 34, left: 0, position: "absolute", top: -7, width: "70%" },
  windowLine: { backgroundColor: theme.colors.brand, height: 3, left: 0, position: "absolute", right: 0 },
  technicalSymbol: { alignItems: "center", backgroundColor: theme.colors.surface, borderColor: theme.colors.brand, borderRadius: 18, borderWidth: 2, height: 36, justifyContent: "center", width: 36 },
  coldSymbol: { borderColor: "#3277B5" },
  hotSymbol: { borderColor: "#D86045" },
  spatialMarker: { alignItems: "center", backgroundColor: theme.colors.surface, borderColor: theme.colors.brand, borderRadius: 18, borderWidth: 2, height: 36, justifyContent: "center", position: "absolute", width: 36 },
  spatialMarkerSelected: { backgroundColor: theme.colors.accent, borderWidth: 3 },
  spatialOpeningHit: { backgroundColor: "rgba(244,172,61,.12)", borderColor: theme.colors.accent, borderRadius: 8, borderWidth: 1, height: 44, position: "absolute", width: 44 },
  spatialGlyph: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  canvasActions: { bottom: 14, flexDirection: "row", gap: 8, position: "absolute", right: 14 },
  canvasButton: { alignItems: "center", backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 24, borderWidth: 1, elevation: 3, height: 48, justifyContent: "center", shadowColor: theme.colors.brand, shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.12, shadowRadius: 7, width: 48 },
  canvasButtonText: { color: theme.colors.brand, fontSize: 22, fontWeight: "800" },
  viewBar: { backgroundColor: "rgba(255,255,255,.94)", borderRadius: 16, flexDirection: "row", gap: 4, left: 12, padding: 4, position: "absolute", right: 12, top: 12 },
  viewButton: { alignItems: "center", borderRadius: 12, flex: 1, minHeight: 40, justifyContent: "center", paddingHorizontal: 4 },
  viewButtonActive: { backgroundColor: theme.colors.brand },
  viewButtonText: { color: theme.colors.brand, fontSize: 10, fontWeight: "800" },
  viewButtonTextActive: { color: theme.colors.surface },
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
  wallIdentity: { color: theme.colors.muted, fontSize: 12, fontWeight: "800", marginTop: 3 },
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
