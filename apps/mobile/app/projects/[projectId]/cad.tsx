import {
  cadComponentVariants,
  defaultCadComponentVariant,
  type CadComponentKind,
  type CadComponentVariant,
} from "@obrametrik/application";
import type { Point2Mm } from "@obrametrik/domain";
import { messages } from "@obrametrik/i18n";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Keyboard,
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/auth/auth-provider";
import {
  cadTemplates,
  closestWallPoint,
  componentDefaults,
  documentForSpaceId,
  edgeLengthMm,
  moveVertex,
  moveWall,
  openingClearancesMm,
  reprojectHostedMarkers,
  resizeWall,
  toCadPlan,
  type MobileCadDocument,
  type MobileCadMarker,
} from "../../../src/cad/model";
import { mobileBuildingModelRepository } from "../../../src/cad/repository";
import { NativeCad3D } from "../../../src/cad/native-cad-3d";
import { Button, Field } from "../../../src/components/ui";
import { getDeviceLocale } from "../../../src/lib/i18n";
import { regenerateElectricalMaterials } from "../../../src/materials/electrical-materials";
import { theme } from "../../../src/theme";

type Shape = keyof typeof cadTemplates;
type Mode = "2d" | "3d";
type TechnicalView = "iso" | "top" | "front" | "right";
type ActiveTool = "select" | CadComponentKind;
type NumericEdit = { label: string; value: number; onCommit: (value: number) => void };
const tools: readonly ActiveTool[] = [
  "select",
  "door",
  "window",
  "light",
  "switch",
  "socket",
  "cold_water",
  "hot_water",
  "drain",
];
const toolGlyphs: Record<ActiveTool, string> = {
  select: "⌖",
  door: "◩",
  window: "╫",
  light: "⊗",
  switch: "◒",
  socket: "⏚",
  cold_water: "●",
  hot_water: "●",
  drain: "◎",
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
  const [orthogonal, setOrthogonal] = useState(true);
  const [planPan, setPlanPan] = useState({ x: 0, y: 0 });
  const [numericEdit, setNumericEdit] = useState<NumericEdit>();
  const planGesture = useRef<
    { distance?: number; localX: number; localY: number; pageX: number; pageY: number } | undefined
  >(undefined);
  const entityInteraction = useRef(false);
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
  const variantLabels: Record<CadComponentVariant, string> = {
    hinged: t.variantHinged,
    sliding: t.variantSliding,
    pocket: t.variantPocket,
    folding: t.variantFolding,
    double_hinged: t.variantDoubleHinged,
    casement: t.variantCasement,
    tilt_turn: t.variantTiltTurn,
    fixed: t.variantFixed,
    awning: t.variantAwning,
    ceiling: t.variantCeiling,
    wall: t.variantWall,
    recessed: t.variantRecessed,
    pendant: t.variantPendant,
    single: t.variantSingle,
    double: t.variantDouble,
    dimmer: t.variantDimmer,
    two_way: t.variantTwoWay,
    usb: t.variantUsb,
    wall_outlet: t.variantWallOutlet,
    floor_outlet: t.variantFloorOutlet,
    manifold: t.variantManifold,
    floor: t.variantFloor,
    linear: t.variantLinear,
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
    () => createViewport(bounds, stageLayout.width, stageLayout.height, zoom, planPan),
    [bounds, planPan, stageLayout, zoom],
  );

  function capturePlanTouches(event: {
    nativeEvent: {
      touches: readonly { locationX: number; locationY: number; pageX: number; pageY: number }[];
    };
  }) {
    const [first, second] = event.nativeEvent.touches;
    if (!first) return;
    planGesture.current = second
      ? {
          distance: Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY),
          localX: (first.locationX + second.locationX) / 2,
          localY: (first.locationY + second.locationY) / 2,
          pageX: (first.pageX + second.pageX) / 2,
          pageY: (first.pageY + second.pageY) / 2,
        }
      : {
          localX: first.locationX,
          localY: first.locationY,
          pageX: first.pageX,
          pageY: first.pageY,
        };
  }

  function movePlan(event: {
    nativeEvent: {
      touches: readonly { locationX: number; locationY: number; pageX: number; pageY: number }[];
    };
  }) {
    const previous = planGesture.current;
    const [first, second] = event.nativeEvent.touches;
    if (!previous || !first) return capturePlanTouches(event);
    if (second) {
      const distance = Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
      if (previous.distance) {
        const ratio = distance / previous.distance;
        const nextZoom = Math.max(0.55, Math.min(3.5, zoom * ratio));
        const appliedRatio = nextZoom / zoom;
        const localX = previous.localX - stageLayout.width / 2;
        const localY = previous.localY - stageLayout.height / 2;
        setPlanPan((current) => ({
          x: current.x + (localX - current.x) * (1 - appliedRatio),
          y: current.y + (localY - current.y) * (1 - appliedRatio),
        }));
        setZoom(nextZoom);
      }
    } else if (!entityInteraction.current) {
      setPlanPan((current) => ({
        x: current.x + first.pageX - previous.pageX,
        y: current.y + first.pageY - previous.pageY,
      }));
    }
    capturePlanTouches(event);
  }

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
    placeMarkerAt(modelPoint);
  }

  function placeMarkerAt(modelPoint: Point2Mm) {
    if (tool === "select") return;
    const hosted = closestWallPoint(document.vertices, modelPoint, componentDefaults[tool].widthMm);
    const marker: MobileCadMarker = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      kind: tool,
      ...hosted,
      ...componentDefaults[tool],
      variant: defaultCadComponentVariant(tool),
      ...(tool === "door" ? { swing: "left_in" as const } : {}),
    };
    updateDocument((current) => ({ ...current, markers: [...current.markers, marker] }));
    setSelectedId(marker.id);
    setSelectedVertex(undefined);
    setSelectedWall(undefined);
    setTool("select");
  }

  function updateSelected(patch: Partial<MobileCadMarker>, recordHistory = true) {
    if (!selectedId) return;
    updateDocument(
      (current) => ({
        ...current,
        markers: current.markers.map((marker) =>
          marker.id === selectedId ? { ...marker, ...patch } : marker,
        ),
      }),
      recordHistory,
    );
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
      await regenerateElectricalMaterials(projectId);
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

  if (authLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (!user) return <Redirect href="/login" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>‹</Text>
        </Pressable>
        <View style={styles.headerIdentity}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {document.name || t.unsavedPlan}
          </Text>
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
          accessibilityLabel={t.materialsAndShopping}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/projects/[projectId]/materials",
              params: { projectId },
            })
          }
          style={styles.materialsButton}
        >
          <Text style={styles.materialsButtonGlyph}>▤</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={t.savePlan}
          accessibilityRole="button"
          disabled={saveState === "saving" || !document.name.trim()}
          onPress={() => void save()}
          style={[
            styles.saveButton,
            (!document.name.trim() || saveState === "saving") && styles.disabled,
          ]}
        >
          <Text style={styles.saveButtonText}>✓</Text>
        </Pressable>
      </View>

      <View style={styles.modeBar}>
        <View style={styles.modeSwitch}>
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
        <Pressable
          accessibilityLabel={t.undo}
          accessibilityRole="button"
          disabled={!historyState.canUndo}
          onPress={undo}
          style={[styles.historyButton, !historyState.canUndo && styles.disabled]}
        >
          <Text style={styles.historyText}>↶</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={t.redo}
          accessibilityRole="button"
          disabled={!historyState.canRedo}
          onPress={redo}
          style={[styles.historyButton, !historyState.canRedo && styles.disabled]}
        >
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
            <Text
              style={[
                styles.toolGlyph,
                item === "cold_water" && styles.cold,
                item === "hot_water" && styles.hot,
              ]}
            >
              {toolGlyphs[item]}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.toolLabel, tool === item && styles.toolLabelActive]}
            >
              {toolLabels[item]}
            </Text>
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
          <View style={styles.stage}>
            <ActivityIndicator color={theme.colors.brand} />
          </View>
        ) : errorKind === "load" ? (
          <View style={styles.stage}>
            <Text accessibilityRole="alert" style={styles.stageError}>
              {t.mobileCadLoadError}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadModel()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>{t.retry}</Text>
            </Pressable>
          </View>
        ) : mode === "2d" ? (
          <Pressable
            accessibilityHint={t.mobileCadTapHint}
            accessibilityLabel={t.mode2d}
            onPress={(event) =>
              placeMarker(event.nativeEvent.locationX, event.nativeEvent.locationY)
            }
            onTouchEnd={() => {
              planGesture.current = undefined;
              entityInteraction.current = false;
            }}
            onTouchMove={movePlan}
            onTouchStart={capturePlanTouches}
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
                const start = document.vertices[index]!;
                const end = document.vertices[(index + 1) % document.vertices.length]!;
                const wallMidpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
                if (tool !== "select") {
                  placeMarkerAt(wallMidpoint);
                  return;
                }
                if (selectedId) {
                  const selectedMarker = document.markers.find(
                    (marker) => marker.id === selectedId,
                  );
                  if (selectedMarker) {
                    updateSelected(
                      closestWallPoint(document.vertices, wallMidpoint, selectedMarker.widthMm),
                    );
                  }
                  return;
                }
                setSelectedWall(index);
                setSelectedId(undefined);
                setSelectedVertex(undefined);
                setTool("select");
              }}
              onMoveMarker={(id, point) => {
                updateDocument(
                  (current) => ({
                    ...current,
                    markers: current.markers.map((marker) =>
                      marker.id === id
                        ? {
                            ...marker,
                            ...closestWallPoint(current.vertices, point, marker.widthMm),
                          }
                        : marker,
                    ),
                  }),
                  false,
                );
              }}
              onMoveStart={checkpoint}
              onMoveInteractionChange={(active) => {
                entityInteraction.current = active;
              }}
              onMoveVertex={(index, point) => {
                updateDocument((current) => {
                  const vertices = moveVertex(current.vertices, index, point, orthogonal);
                  return {
                    ...current,
                    vertices,
                    markers: reprojectHostedMarkers(current.markers, current.vertices, vertices),
                  };
                }, false);
              }}
              onMoveWall={(index, point) => {
                // The active insertion tool owns this gesture; a small finger
                // movement after placement must never deform the host wall.
                if (tool !== "select") return;
                if (selectedId) {
                  const selectedMarker = document.markers.find(
                    (marker) => marker.id === selectedId,
                  );
                  if (selectedMarker) {
                    updateSelected(
                      closestWallPoint(document.vertices, point, selectedMarker.widthMm),
                      false,
                    );
                  }
                  return;
                }
                updateDocument((current) => {
                  const start = current.vertices[index]!;
                  const end = current.vertices[(index + 1) % current.vertices.length]!;
                  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
                  const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
                  const vertices = moveWall(current.vertices, index, {
                    x: orthogonal && horizontal ? 0 : point.x - midpoint.x,
                    y: orthogonal && !horizontal ? 0 : point.y - midpoint.y,
                  });
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
          <NativeCad3D
            clearHeightMm={document.clearHeightMm}
            fallbackLabel={t.mobileCad3dUnavailable}
            markers={document.markers}
            onClearSelection={() => {
              setSelectedId(undefined);
              setSelectedWall(undefined);
            }}
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
            vertices={document.vertices}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        )}

        <View style={[styles.canvasActions, { bottom: Math.max(insets.bottom, 12) }]}>
          {mode === "3d" ? (
            <>
              <CanvasButton
                label={t.mode3d}
                onPress={() => setOrbit((value) => ({ ...value, yaw: value.yaw - 15 }))}
              >
                ↶
              </CanvasButton>
              <CanvasButton
                label={t.mode3d}
                onPress={() => setOrbit((value) => ({ ...value, yaw: value.yaw + 15 }))}
              >
                ↷
              </CanvasButton>
            </>
          ) : null}
          <CanvasButton
            label={t.mobileCadSpatialPreview}
            onPress={() => setZoom((value) => Math.max(0.65, value - 0.2))}
          >
            −
          </CanvasButton>
          <CanvasButton
            label={t.mobileCadSpatialPreview}
            onPress={() => setZoom((value) => Math.min(2.4, value + 0.2))}
          >
            +
          </CanvasButton>
          <CanvasButton
            label={t.mobileCadApplyShape}
            onPress={() => {
              setZoom(1);
              setPlanPan({ x: 0, y: 0 });
            }}
          >
            ⌂
          </CanvasButton>
          {mode === "2d" ? (
            <CanvasButton
              label={t.wallLengthMm}
              onPress={() => setShowDimensions((value) => !value)}
            >
              {showDimensions ? "↔" : "⇥"}
            </CanvasButton>
          ) : null}
          {mode === "2d" ? (
            <CanvasButton
              label={t.orthogonalConstraint}
              onPress={() => setOrthogonal((value) => !value)}
              selected={orthogonal}
            >
              {orthogonal ? "⊥" : "∠"}
            </CanvasButton>
          ) : null}
          <CanvasButton label={t.mobileCadApplyShape} onPress={() => setSettingsOpen(true)}>
            ⚙
          </CanvasButton>
        </View>
        {mode === "3d" ? (
          <View style={styles.viewBar}>
            {(
              [
                ["top", t.viewTop, { yaw: 0, pitch: 90 }],
                ["front", t.viewFront, { yaw: 0, pitch: 0 }],
                ["right", t.viewRight, { yaw: 90, pitch: 0 }],
                ["iso", t.viewIso, { yaw: -42, pitch: 24 }],
              ] as const
            ).map(([view, label, camera]) => (
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
                <Text
                  style={[
                    styles.viewButtonText,
                    technicalView === view && styles.viewButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
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
              <Pressable
                accessibilityRole="button"
                onPress={() => setSettingsOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.form}>
              <Field
                label={t.spaceName}
                onChangeText={(name) => updateDocument((current) => ({ ...current, name }))}
                value={document.name}
              />
              <Field
                keyboardType="number-pad"
                label={t.spaceHeightMm}
                onChangeText={(value) =>
                  updateDocument((current) => ({ ...current, clearHeightMm: Number(value) || 0 }))
                }
                unit="mm"
                value={String(document.clearHeightMm)}
              />
              <View accessibilityRole="radiogroup" style={styles.shapeRow}>
                {(["rectangle", "l_shape", "u_shape"] as const).map((item) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: shape === item }}
                    key={item}
                    onPress={() => setShape(item)}
                    style={[styles.shape, shape === item && styles.shapeActive]}
                  >
                    <Text style={styles.shapeText}>
                      {item === "rectangle"
                        ? t.rectangleShape
                        : item === "l_shape"
                          ? t.lShape
                          : t.uShape}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.dimensionRow}>
                <View style={styles.dimension}>
                  <Field
                    keyboardType="number-pad"
                    label={t.mobileCadWidth}
                    onChangeText={setWidthMm}
                    unit="mm"
                    value={widthMm}
                  />
                </View>
                <View style={styles.dimension}>
                  <Field
                    keyboardType="number-pad"
                    label={t.mobileCadDepth}
                    onChangeText={setDepthMm}
                    unit="mm"
                    value={depthMm}
                  />
                </View>
              </View>
              <Button
                onPress={() => {
                  applyShape();
                  setSettingsOpen(false);
                }}
                variant="secondary"
              >
                {t.mobileCadApplyShape}
              </Button>
            </View>
          </ScrollView>
        </View>
      ) : null}

      {selected ? (
        <View style={[styles.inspector, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inspectorHandle} />
          <View style={styles.panelHeader}>
            <Text style={styles.inspectorTitle}>{toolLabels[selected.kind]}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedId(undefined)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.inspectorFields}>
            <CompactNumber
              label={t.componentWidthMm}
              onEdit={() =>
                setNumericEdit({
                  label: t.componentWidthMm,
                  value: selected.widthMm,
                  onCommit: (widthMm) => updateSelected({ widthMm }),
                })
              }
              value={selected.widthMm}
            />
            <CompactNumber
              label={t.componentHeightMm}
              onEdit={() =>
                setNumericEdit({
                  label: t.componentHeightMm,
                  value: selected.heightMm,
                  onCommit: (heightMm) => updateSelected({ heightMm }),
                })
              }
              value={selected.heightMm}
            />
            <CompactNumber
              label={t.componentElevationMm}
              onEdit={() =>
                setNumericEdit({
                  label: t.componentElevationMm,
                  value: selected.elevationMm,
                  onCommit: (elevationMm) => updateSelected({ elevationMm }),
                })
              }
              value={selected.elevationMm}
            />
          </View>
          <Text style={styles.variantLabel}>{t.componentType}</Text>
          <ScrollView
            accessibilityRole="radiogroup"
            contentContainerStyle={styles.variantContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {cadComponentVariants[selected.kind].map((variant) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected.variant === variant }}
                key={variant}
                onPress={() => updateSelected({ variant })}
                style={[
                  styles.variantButton,
                  selected.variant === variant && styles.variantButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.variantButtonText,
                    selected.variant === variant && styles.variantButtonTextActive,
                  ]}
                >
                  {variantLabels[variant]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {selected.kind === "door" &&
          (selected.variant === "hinged" || selected.variant === "double_hinged") ? (
            <View>
              <Text style={styles.swingLabel}>{t.doorSwing}</Text>
              <View accessibilityRole="radiogroup" style={styles.swingGrid}>
                {(
                  [
                    ["left_in", t.doorLeftIn],
                    ["right_in", t.doorRightIn],
                    ["left_out", t.doorLeftOut],
                    ["right_out", t.doorRightOut],
                  ] as const
                ).map(([swing, label]) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: (selected.swing ?? "left_in") === swing }}
                    key={swing}
                    onPress={() => updateSelected({ swing })}
                    style={[
                      styles.swingButton,
                      (selected.swing ?? "left_in") === swing && styles.swingButtonActive,
                    ]}
                  >
                    <Text style={styles.swingButtonText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              updateDocument((current) => ({
                ...current,
                markers: current.markers.filter((marker) => marker.id !== selected.id),
              }));
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
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedWall(undefined)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <CompactNumber
            label={t.wallLengthMm}
            onEdit={() =>
              setNumericEdit({
                label: t.wallLengthMm,
                value: edgeLengthMm(
                  document.vertices[selectedWall]!,
                  document.vertices[(selectedWall + 1) % document.vertices.length]!,
                ),
                onCommit: (lengthMm) => {
                  const previousVertices = document.vertices;
                  const vertices = resizeWall(previousVertices, selectedWall, lengthMm);
                  updateDocument((current) => ({
                    ...current,
                    vertices,
                    markers: reprojectHostedMarkers(current.markers, previousVertices, vertices),
                  }));
                },
              })
            }
            value={edgeLengthMm(
              document.vertices[selectedWall]!,
              document.vertices[(selectedWall + 1) % document.vertices.length]!,
            )}
          />
        </View>
      ) : null}
      {numericEdit ? (
        <NumericKeyboardEditor
          cancelLabel={t.cancel}
          confirmLabel={t.confirmMeasurement}
          edit={numericEdit}
          onClose={() => {
            Keyboard.dismiss();
            setNumericEdit(undefined);
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

function modelBounds(vertices: readonly Point2Mm[]) {
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function createViewport(
  bounds: ReturnType<typeof modelBounds>,
  width: number,
  height: number,
  zoom = 1,
  pan = { x: 0, y: 0 },
) {
  const padding = 44;
  const scale =
    Math.min(
      (width - padding * 2) / Math.max(bounds.maxX - bounds.minX, 1),
      (height - padding * 2) / Math.max(bounds.maxY - bounds.minY, 1),
    ) * zoom;
  const offsetX = (width - (bounds.maxX - bounds.minX) * scale) / 2 + pan.x;
  const offsetY = (height - (bounds.maxY - bounds.minY) * scale) / 2 + pan.y;
  return {
    scale,
    toScreen: (point: Point2Mm) => ({
      x: offsetX + (point.x - bounds.minX) * scale,
      y: offsetY + (point.y - bounds.minY) * scale,
    }),
    toModel: (point: Point2Mm) => ({
      x: Math.round((point.x - offsetX) / scale + bounds.minX),
      y: Math.round((point.y - offsetY) / scale + bounds.minY),
    }),
  };
}

function PlanCanvas({
  markers,
  onMoveMarker,
  onMoveStart,
  onMoveVertex,
  onMoveWall,
  onSelect,
  onSelectVertex,
  onSelectWall,
  onMoveInteractionChange,
  selectedId,
  selectedVertex,
  selectedWall,
  showDimensions,
  vertices,
  viewport,
}: {
  markers: readonly MobileCadMarker[];
  onMoveMarker: (id: string, point: Point2Mm) => void;
  onMoveStart: () => void;
  onMoveInteractionChange: (active: boolean) => void;
  onMoveVertex: (index: number, point: Point2Mm) => void;
  onMoveWall: (index: number, point: Point2Mm) => void;
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
  const selectedMarker = markers.find((marker) => marker.id === selectedId);
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {vertices.map((start, index) => {
        const a = viewport.toScreen(start);
        const b = viewport.toScreen(vertices[(index + 1) % vertices.length]!);
        const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const modelMidpoint = {
          x: (start.x + vertices[(index + 1) % vertices.length]!.x) / 2,
          y: (start.y + vertices[(index + 1) % vertices.length]!.y) / 2,
        };
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        return (
          <View key={`wall-${index}`}>
            <PlanLine a={a} b={b} selected={selectedWall === index} />
            <DraggablePlanEntity
              modelPoint={modelMidpoint}
              onInteractionChange={onMoveInteractionChange}
              onMove={(next) => onMoveWall(index, next)}
              onMoveStart={() => {
                onSelectWall(index);
                onMoveStart();
              }}
              scale={viewport.scale}
              style={[
                styles.wallHit,
                {
                  left: midpoint.x - length / 2,
                  top: midpoint.y - 22,
                  transform: [{ rotate: `${angle}deg` }],
                  width: length,
                },
              ]}
            >
              <View />
            </DraggablePlanEntity>
            {showDimensions ? (
              <Pressable
                accessibilityRole="button"
                onPress={(event) => {
                  event.stopPropagation();
                  onSelectWall(index);
                }}
                style={[styles.dimensionBadge, { left: midpoint.x - 34, top: midpoint.y - 12 }]}
              >
                <Text style={styles.dimensionText}>
                  {edgeLengthMm(start, vertices[(index + 1) % vertices.length]!)} mm
                </Text>
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
            onInteractionChange={onMoveInteractionChange}
            scale={viewport.scale}
            style={[styles.vertexHit, { left: point.x - 24, top: point.y - 24 }]}
          >
            <View style={[styles.vertex, selectedVertex === index && styles.vertexSelected]} />
          </DraggablePlanEntity>
        );
      })}
      {markers.map((marker) => {
        const point = viewport.toScreen(marker.point);
        const selected = marker.id === selectedId;
        const start = vertices[marker.wallIndex]!;
        const end = vertices[(marker.wallIndex + 1) % vertices.length]!;
        const angle = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
        const symbolWidth = Math.max(52, marker.widthMm * viewport.scale);
        return (
          <DraggablePlanEntity
            modelPoint={marker.point}
            key={marker.id}
            onMove={(next) => onMoveMarker(marker.id, next)}
            onMoveStart={() => {
              onSelect(marker.id);
              onMoveStart();
            }}
            onInteractionChange={onMoveInteractionChange}
            scale={viewport.scale}
            style={[
              styles.cadSymbol,
              {
                left: point.x - symbolWidth / 2,
                top: point.y - 30,
                transform: [{ rotate: `${angle}deg` }],
                width: symbolWidth,
              },
              selected && styles.markerSelected,
            ]}
          >
            <CadSymbol2D marker={marker} />
          </DraggablePlanEntity>
        );
      })}
      {selectedMarker && (selectedMarker.kind === "door" || selectedMarker.kind === "window") ? (
        <OpeningDimensions marker={selectedMarker} vertices={vertices} viewport={viewport} />
      ) : null}
    </View>
  );
}

function OpeningDimensions({
  marker,
  vertices,
  viewport,
}: {
  marker: MobileCadMarker;
  vertices: readonly Point2Mm[];
  viewport: ReturnType<typeof createViewport>;
}) {
  const start = vertices[marker.wallIndex]!;
  const end = vertices[(marker.wallIndex + 1) % vertices.length]!;
  const wallLength = Math.max(1, edgeLengthMm(start, end));
  const tangent = { x: (end.x - start.x) / wallLength, y: (end.y - start.y) / wallLength };
  const clearances = openingClearancesMm(marker, vertices);
  const openingStart = {
    x: marker.point.x - (tangent.x * marker.widthMm) / 2,
    y: marker.point.y - (tangent.y * marker.widthMm) / 2,
  };
  const openingEnd = {
    x: marker.point.x + (tangent.x * marker.widthMm) / 2,
    y: marker.point.y + (tangent.y * marker.widthMm) / 2,
  };
  const points = [start, openingStart, openingEnd, end].map(viewport.toScreen);
  const screenDx = points[3]!.x - points[0]!.x;
  const screenDy = points[3]!.y - points[0]!.y;
  const screenLength = Math.max(1, Math.hypot(screenDx, screenDy));
  const normal = { x: (-screenDy / screenLength) * 30, y: (screenDx / screenLength) * 30 };
  const labels = [
    { from: points[0]!, to: points[1]!, value: clearances.beforeMm },
    { from: points[1]!, to: points[2]!, value: marker.widthMm, active: true },
    { from: points[2]!, to: points[3]!, value: clearances.afterMm },
  ];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {labels.map((label, index) => {
        const x = (label.from.x + label.to.x) / 2 + normal.x;
        const y = (label.from.y + label.to.y) / 2 + normal.y;
        return (
          <View
            key={index}
            style={[
              styles.openingDimension,
              label.active && styles.openingDimensionActive,
              { left: x - 30, top: y - 11 },
            ]}
          >
            <Text style={styles.openingDimensionText}>{label.value} mm</Text>
          </View>
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
  onInteractionChange,
  scale,
  style,
}: {
  children: ReactNode;
  modelPoint: Point2Mm;
  onMove: (point: Point2Mm) => void;
  onMoveStart: () => void;
  onInteractionChange: (active: boolean) => void;
  scale: number;
  style: object;
}) {
  const origin = useRef(modelPoint);
  const interaction = useRef({ modelPoint, onInteractionChange, onMove, onMoveStart, scale });
  interaction.current = { modelPoint, onInteractionChange, onMove, onMoveStart, scale };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        origin.current = interaction.current.modelPoint;
        interaction.current.onInteractionChange(true);
        interaction.current.onMoveStart();
      },
      onPanResponderMove: (_, gesture) => {
        const current = interaction.current;
        current.onMove({
          x:
            Math.round((origin.current.x + gesture.dx / Math.max(current.scale, 0.0001)) / 50) * 50,
          y:
            Math.round((origin.current.y + gesture.dy / Math.max(current.scale, 0.0001)) / 50) * 50,
        });
      },
      onPanResponderRelease: () => interaction.current.onInteractionChange(false),
      onPanResponderTerminate: () => interaction.current.onInteractionChange(false),
    }),
  ).current;
  return (
    <View {...responder.panHandlers} style={style}>
      {children}
    </View>
  );
}

function CadSymbol2D({ marker }: { marker: MobileCadMarker }) {
  const { kind } = marker;
  if (kind === "door") {
    if (marker.variant === "sliding" || marker.variant === "pocket") {
      return (
        <View style={styles.openingSymbol}>
          <View style={styles.wallGap} />
          <View style={[styles.doorJamb, { left: 0 }]} />
          <View style={[styles.doorJamb, { right: 0 }]} />
          <View style={[styles.slidingLeaf, { left: marker.variant === "pocket" ? "8%" : "4%" }]} />
          <View
            style={[
              styles.slidingLeaf,
              { right: marker.variant === "pocket" ? "-28%" : "4%", top: 34 },
            ]}
          />
        </View>
      );
    }
    if (marker.variant === "folding") {
      return (
        <View style={styles.openingSymbol}>
          <View style={styles.wallGap} />
          <View style={[styles.doorJamb, { left: 0 }]} />
          <View style={[styles.doorJamb, { right: 0 }]} />
          <View style={[styles.foldLeaf, { left: "12%", transform: [{ rotate: "28deg" }] }]} />
          <View style={[styles.foldLeaf, { right: "12%", transform: [{ rotate: "-28deg" }] }]} />
        </View>
      );
    }
    const swing = marker.swing ?? "left_in";
    const hingeLeft = swing.startsWith("left");
    const opensIn = swing.endsWith("_in");
    const rotation = (hingeLeft ? -1 : 1) * (opensIn ? 64 : -64);
    if (marker.variant === "double_hinged") {
      return (
        <View style={styles.openingSymbol}>
          <View style={styles.wallGap} />
          <View style={[styles.doorJamb, { left: 0 }]} />
          <View style={[styles.doorJamb, { right: 0 }]} />
          <View
            style={[
              styles.doubleDoorLeaf,
              {
                left: 0,
                transform: [{ rotate: `${opensIn ? -58 : 58}deg` }],
                transformOrigin: "left center",
              },
            ]}
          />
          <View
            style={[
              styles.doubleDoorLeaf,
              {
                right: 0,
                transform: [{ rotate: `${opensIn ? 58 : -58}deg` }],
                transformOrigin: "right center",
              },
            ]}
          />
        </View>
      );
    }
    return (
      <View style={styles.openingSymbol}>
        <View style={styles.wallGap} />
        <View style={[styles.doorJamb, { left: 0 }]} />
        <View style={[styles.doorJamb, { right: 0 }]} />
        <View
          style={[
            styles.doorLeaf,
            hingeLeft ? { left: 0 } : { right: 0 },
            {
              transform: [{ rotate: `${rotation}deg` }],
              transformOrigin: hingeLeft ? "left center" : "right center",
            },
          ]}
        />
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
    <View
      style={[
        styles.technicalSymbol,
        kind === "cold_water" && styles.coldSymbol,
        kind === "hot_water" && styles.hotSymbol,
      ]}
    >
      <Text
        style={[
          styles.markerGlyph,
          kind === "cold_water" && styles.cold,
          kind === "hot_water" && styles.hot,
        ]}
      >
        {toolGlyphs[kind]}
      </Text>
    </View>
  );
}

function PlanLine({ a, b, selected = false }: { a: Point2Mm; b: Point2Mm; selected?: boolean }) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return (
    <View
      style={[
        styles.wall,
        selected && styles.wallSelected,
        {
          left: (a.x + b.x - length) / 2,
          top: (a.y + b.y) / 2 - 3,
          width: length,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

function CanvasButton({
  children,
  label,
  onPress,
  selected = false,
}: {
  children: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.canvasButton, selected && styles.canvasButtonSelected]}
    >
      <Text style={[styles.canvasButtonText, selected && styles.canvasButtonTextSelected]}>
        {children}
      </Text>
    </Pressable>
  );
}

function CompactNumber({
  label,
  onEdit,
  value,
}: {
  label: string;
  onEdit: () => void;
  value: number;
}) {
  return (
    <View style={styles.compact}>
      <Text numberOfLines={1} style={styles.compactLabel}>
        {label}
      </Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={onEdit}
        style={styles.compactInput}
      >
        <Text style={styles.compactText}>{value}</Text>
        <Text style={styles.compactUnit}>mm</Text>
      </Pressable>
    </View>
  );
}

function NumericKeyboardEditor({
  cancelLabel,
  confirmLabel,
  edit,
  onClose,
}: {
  cancelLabel: string;
  confirmLabel: string;
  edit: NumericEdit;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(String(edit.value));
  const commit = () => {
    const value = Number(draft);
    if (Number.isFinite(value) && value >= 0) edit.onCommit(Math.round(value));
    onClose();
  };
  return (
    <View style={styles.numericEditor}>
      <Text numberOfLines={1} style={styles.numericEditorLabel}>
        {edit.label}
      </Text>
      <View style={styles.numericEditorInput}>
        <TextInput
          accessibilityLabel={edit.label}
          autoFocus
          keyboardType="number-pad"
          onChangeText={setDraft}
          onSubmitEditing={commit}
          selectTextOnFocus
          style={styles.numericEditorText}
          value={draft}
        />
        <Text style={styles.numericEditorUnit}>mm</Text>
      </View>
      <Pressable
        accessibilityLabel={cancelLabel}
        accessibilityRole="button"
        onPress={onClose}
        style={styles.numericEditorCancel}
      >
        <Text style={styles.numericEditorCancelText}>×</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={commit} style={styles.numericEditorConfirm}>
        <Text style={styles.numericEditorConfirmText}>{confirmLabel}</Text>
      </Pressable>
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
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.12)",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerButtonText: { color: theme.colors.surface, fontSize: 34, lineHeight: 38 },
  headerIdentity: { flex: 1 },
  headerTitle: { color: theme.colors.surface, fontSize: 17, fontWeight: "800" },
  materialsButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.12)",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  materialsButtonGlyph: { color: theme.colors.surface, fontSize: 22, fontWeight: "800" },
  saveStatus: { color: "#CFE0DD", fontSize: 11, marginTop: 2 },
  saveButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  saveButtonText: { color: theme.colors.ink, fontSize: 22, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  modeBar: {
    alignItems: "center",
    backgroundColor: theme.colors.brand,
    flexDirection: "row",
    gap: 6,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  modeSwitch: { flex: 1, flexDirection: "row", gap: 5 },
  modeButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
  },
  modeActive: { backgroundColor: theme.colors.surface },
  modeText: { color: "#CFE0DD", fontSize: 13, fontWeight: "800" },
  modeTextActive: { color: theme.colors.brand },
  historyButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.12)",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  historyText: { color: theme.colors.surface, fontSize: 21, fontWeight: "800" },
  tools: { backgroundColor: theme.colors.surface, flexGrow: 0, maxHeight: 82 },
  toolContent: { gap: 7, padding: 8 },
  tool: {
    alignItems: "center",
    borderRadius: 14,
    height: 66,
    justifyContent: "center",
    paddingHorizontal: 10,
    width: 78,
  },
  toolActive: { backgroundColor: theme.colors.accent },
  toolGlyph: { color: theme.colors.brand, fontSize: 23, fontWeight: "800" },
  toolLabel: { color: theme.colors.muted, fontSize: 9, fontWeight: "700", marginTop: 2 },
  toolLabelActive: { color: theme.colors.ink },
  cold: { color: "#3277B5" },
  hot: { color: "#D86045" },
  stageCard: {
    backgroundColor: "#E7ECE9",
    flex: 1,
    minHeight: 260,
    overflow: "hidden",
    position: "relative",
  },
  stage: {
    alignItems: "center",
    backgroundColor: "#E7ECE9",
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  stageError: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: "700",
    maxWidth: 260,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 20,
    marginTop: 14,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  retryText: { color: theme.colors.ink, fontWeight: "800" },
  wall: { backgroundColor: theme.colors.brand, borderRadius: 3, height: 6, position: "absolute" },
  wallHit: { backgroundColor: "transparent", height: 44, position: "absolute" },
  wallSelected: { backgroundColor: theme.colors.accent, height: 9 },
  dimensionBadge: {
    alignItems: "center",
    backgroundColor: "rgba(249,248,244,.9)",
    borderRadius: 6,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    width: 68,
  },
  dimensionText: { color: theme.colors.ink, fontSize: 8, fontWeight: "800" },
  openingDimension: {
    alignItems: "center",
    backgroundColor: "rgba(249,248,244,.96)",
    borderColor: theme.colors.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    width: 60,
  },
  openingDimensionActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  openingDimensionText: { color: theme.colors.ink, fontSize: 8, fontWeight: "800" },
  vertexHit: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    position: "absolute",
    width: 48,
  },
  vertex: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.brand,
    borderRadius: 12,
    borderWidth: 3,
    height: 24,
    width: 24,
  },
  vertexSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.ink,
    transform: [{ scale: 1.2 }],
  },
  cadSymbol: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 10,
    borderWidth: 2,
    height: 60,
    justifyContent: "center",
    minWidth: 52,
    position: "absolute",
  },
  markerSelected: {
    backgroundColor: "rgba(244,172,61,.22)",
    borderColor: theme.colors.accent,
    borderStyle: "dashed",
  },
  markerGlyph: { color: theme.colors.brand, fontSize: 18, fontWeight: "800" },
  openingSymbol: { height: 48, position: "relative", width: "100%" },
  wallGap: {
    backgroundColor: "#E7ECE9",
    height: 12,
    left: 0,
    position: "absolute",
    right: 0,
    top: 24,
  },
  doorJamb: {
    backgroundColor: theme.colors.ink,
    height: 18,
    position: "absolute",
    top: 21,
    width: 3,
  },
  doorLeaf: {
    backgroundColor: theme.colors.ink,
    height: 3,
    position: "absolute",
    top: 29,
    width: "100%",
  },
  doubleDoorLeaf: {
    backgroundColor: theme.colors.ink,
    height: 3,
    position: "absolute",
    top: 29,
    width: "50%",
  },
  slidingLeaf: {
    backgroundColor: theme.colors.ink,
    height: 3,
    position: "absolute",
    right: "50%",
    top: 25,
    width: "58%",
  },
  foldLeaf: {
    backgroundColor: theme.colors.ink,
    height: 3,
    position: "absolute",
    top: 29,
    width: "43%",
  },
  windowLine: {
    backgroundColor: theme.colors.brand,
    height: 3,
    left: 0,
    position: "absolute",
    right: 0,
  },
  technicalSymbol: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.brand,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  coldSymbol: { borderColor: "#3277B5" },
  hotSymbol: { borderColor: "#D86045" },
  canvasActions: { bottom: 14, flexDirection: "row", gap: 8, position: "absolute", right: 14 },
  canvasButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 3,
    height: 48,
    justifyContent: "center",
    shadowColor: theme.colors.brand,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    width: 48,
  },
  canvasButtonText: { color: theme.colors.brand, fontSize: 22, fontWeight: "800" },
  canvasButtonSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  canvasButtonTextSelected: { color: theme.colors.ink },
  viewBar: {
    backgroundColor: "rgba(255,255,255,.94)",
    borderRadius: 16,
    flexDirection: "row",
    gap: 4,
    left: 12,
    padding: 4,
    position: "absolute",
    right: 12,
    top: 12,
  },
  viewButton: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  viewButtonActive: { backgroundColor: theme.colors.brand },
  viewButtonText: { color: theme.colors.brand, fontSize: 10, fontWeight: "800" },
  viewButtonTextActive: { color: theme.colors.surface },
  form: { gap: 14, paddingBottom: 8, paddingHorizontal: 18 },
  shapeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  shape: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    padding: 8,
  },
  shapeActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  shapeText: { color: theme.colors.ink, fontSize: 11, fontWeight: "800", textAlign: "center" },
  dimensionRow: { flexDirection: "row", gap: 10 },
  dimension: { flex: 1 },
  settingsPanel: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    elevation: 16,
    left: 0,
    maxHeight: "78%",
    paddingTop: 8,
    position: "absolute",
    right: 0,
    shadowColor: theme.colors.brand,
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    zIndex: 20,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  closeButton: { alignItems: "center", height: 48, justifyContent: "center", width: 48 },
  closeText: { color: theme.colors.ink, fontSize: 30, lineHeight: 34 },
  wallIdentity: { color: theme.colors.muted, fontSize: 12, fontWeight: "800", marginTop: 3 },
  inspector: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    elevation: 12,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    position: "absolute",
    right: 0,
    shadowColor: theme.colors.brand,
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  inspectorHandle: {
    alignSelf: "center",
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    height: 5,
    width: 48,
  },
  inspectorTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: "800", marginTop: 10 },
  inspectorFields: { flexDirection: "row", gap: 8, marginTop: 10 },
  compact: { flex: 1 },
  compactLabel: { color: theme.colors.muted, fontSize: 9, fontWeight: "700" },
  compactInput: {
    alignItems: "center",
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    flexDirection: "row",
    marginTop: 4,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  compactText: { color: theme.colors.ink, flex: 1, fontSize: 14, fontWeight: "800" },
  compactUnit: { color: theme.colors.muted, fontSize: 10 },
  swingLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: "800", marginTop: 8 },
  variantLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: "800", marginTop: 8 },
  variantContent: { gap: 6, paddingRight: 8 },
  variantButton: {
    alignItems: "center",
    backgroundColor: theme.colors.canvas,
    borderColor: theme.colors.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    marginTop: 5,
    paddingHorizontal: 14,
  },
  variantButtonActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  variantButtonText: { color: theme.colors.ink, fontSize: 11, fontWeight: "800" },
  variantButtonTextActive: { color: theme.colors.surface },
  swingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 5 },
  swingButton: {
    alignItems: "center",
    backgroundColor: theme.colors.canvas,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  swingButtonActive: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  swingButtonText: {
    color: theme.colors.ink,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  numericEditor: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 30,
    flexDirection: "row",
    gap: 8,
    left: 0,
    minHeight: 76,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
    zIndex: 50,
  },
  numericEditorLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: "800", maxWidth: 84 },
  numericEditorInput: {
    alignItems: "center",
    backgroundColor: theme.colors.canvas,
    borderColor: theme.colors.accent,
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: 12,
  },
  numericEditorText: {
    color: theme.colors.ink,
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    paddingVertical: 0,
  },
  numericEditorUnit: { color: theme.colors.muted, fontSize: 12, fontWeight: "800" },
  numericEditorCancel: { alignItems: "center", height: 48, justifyContent: "center", width: 42 },
  numericEditorCancelText: { color: theme.colors.ink, fontSize: 28 },
  numericEditorConfirm: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center",
    maxWidth: 92,
    paddingHorizontal: 10,
  },
  numericEditorConfirmText: {
    color: theme.colors.ink,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  deleteButton: { alignItems: "center", minHeight: 44, justifyContent: "center", marginTop: 6 },
  deleteText: { color: theme.colors.danger, fontSize: 13, fontWeight: "800" },
});
