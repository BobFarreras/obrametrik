"use client";

import {
  buildElectricalLayout,
  projectElectricalPoint,
} from "@obrametrik/application";
import type { BuildingElement, BuildingSpace, Point2Mm, SpaceKind } from "@obrametrik/domain";
import { useRouter } from "next/navigation";
import React from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  generateElectricalProposal,
  saveCadSpace,
} from "../app/[locale]/dashboard/projects/[projectId]/actions";
import {
  doorLeafCorners,
  findInteriorPoint,
  moveWalkCamera,
  wallOpeningCorners,
} from "./cad-camera";
import { isSimplePolygon, moveVertex, resizeWall } from "./cad-polygon-geometry";
import {
  distributeHostedMarkers,
  hostedMarkerIdsInBox,
  hostedMarkerOffsetMm,
  offsetHostedMarkers,
  positionHostedMarker,
  reprojectHostedMarkers,
} from "./cad-wall-geometry";

type ComponentKind =
  "door" | "window" | "light" | "switch" | "socket" | "cold_water" | "hot_water" | "drain";
type Tool = "select" | "draw" | ComponentKind;
type Template = "rectangle" | "l_shape" | "u_shape";
type PlanEditorView = "plan" | "wall";
type ViewBox = { x: number; y: number; width: number; height: number };
type SelectionBox = { start: Point2Mm; current: Point2Mm };
type Marker = {
  id: string;
  kind: ComponentKind;
  point: Point2Mm;
  wallIndex: number;
  placementSurface: "wall" | "ceiling" | "floor";
  widthMm: number;
  heightMm: number;
  elevationMm: number;
  variant: string;
};
export type ElectricalRouteOverlay = Readonly<{
  id: string;
  spaceId: string;
  path: readonly Point2Mm[];
  role: string;
  color?: string;
  dashPattern?: string;
  dashOffset?: number;
}>;

const electricalWireColors = {
  distribution: "#1e6fb9",
  switch_feed: "#704214",
  switch_return: "#191919",
} as const;

const conductorColors = {
  brown: "#704214",
  black: "#191919",
  light_blue: "#1e6fb9",
  green_yellow: "#278657",
} as const;

function projectPointToWall(
  point: { x: number; y: number; z: number },
  vertices: readonly Point2Mm[],
  wallIndex: number,
  clearHeightMm: number,
): Point2Mm {
  const start = vertices[wallIndex]!;
  const end = vertices[(wallIndex + 1) % vertices.length]!;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    x: Math.max(0, Math.min(length, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length)),
    y: clearHeightMm - point.z,
  };
}
type CadDocumentSnapshot = {
  vertices: readonly Point2Mm[];
  height: number;
  name: string;
  kind: SpaceKind;
  markers: readonly Marker[];
};

function cloneSnapshot(snapshot: CadDocumentSnapshot): CadDocumentSnapshot {
  return {
    ...snapshot,
    vertices: snapshot.vertices.map((point) => ({ ...point })),
    markers: snapshot.markers.map((marker) => ({ ...marker, point: { ...marker.point } })),
  };
}

type CadMessages = {
  cadEditor: string;
  cadEditorHelp: string;
  mode2d: string;
  mode3d: string;
  viewTop: string;
  viewFront: string;
  viewRight: string;
  viewElevation: string;
  viewIso: string;
  viewPerspective: string;
  viewWalk: string;
  fit3d: string;
  orbitHelp: string;
  walkHelp: string;
  previousWall: string;
  nextWall: string;
  moveForward: string;
  moveBackward: string;
  turnLeft: string;
  turnRight: string;
  selectTool: string;
  drawContour: string;
  finishContour: string;
  cancelDrawing: string;
  invalidContour: string;
  doorTool: string;
  windowTool: string;
  lightTool: string;
  switchTool: string;
  socketTool: string;
  waterTool: string;
  coldWaterTool: string;
  hotWaterTool: string;
  drainTool: string;
  fitPlan: string;
  zoomIn: string;
  zoomOut: string;
  componentWidthMm: string;
  componentHeightMm: string;
  componentElevationMm: string;
  componentPositionMm: string;
  deleteComponent: string;
  selectedComponent: string;
  selectedComponents: string;
  deleteSelectedComponents: string;
  rectangleShape: string;
  lShape: string;
  uShape: string;
  spaceName: string;
  spaceHeightMm: string;
  savePlan: string;
  planObjects: string;
  planCoordinates: string;
  noPlanObjects: string;
  savedSpaces: string;
  unsavedPlan: string;
  savePending: string;
  savingPlan: string;
  planSaved: string;
  saveFailed: string;
  electricalCircuits?: string;
  undo: string;
  redo: string;
  copyComponents: string;
  pasteComponents: string;
  duplicateComponents: string;
  distributeComponents: string;
  wallSelected: string;
  wallLengthMm: string;
  orthogonalConstraint: string;
  millimetresUnit: string;
  materialsAndShopping: string;
  componentVariant: string;
  variantSingle: string;
  variantDouble: string;
  variantUsb: string;
  variantDimmer: string;
  variantTwoWay: string;
  variantCeiling: string;
  variantWall: string;
  variantRecessed: string;
  variantPendant: string;
  bathroom: string;
  kitchen: string;
  bedroom: string;
  livingRoom: string;
  hallway: string;
  other: string;
};

const templates: Record<Template, readonly Point2Mm[]> = {
  rectangle: [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 4000, y: 3000 },
    { x: 0, y: 3000 },
  ],
  l_shape: [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 4000, y: 1800 },
    { x: 2400, y: 1800 },
    { x: 2400, y: 3400 },
    { x: 0, y: 3400 },
  ],
  u_shape: [
    { x: 0, y: 0 },
    { x: 5000, y: 0 },
    { x: 5000, y: 3500 },
    { x: 3600, y: 3500 },
    { x: 3600, y: 1600 },
    { x: 1400, y: 1600 },
    { x: 1400, y: 3500 },
    { x: 0, y: 3500 },
  ],
};

const defaults: Record<ComponentKind, Pick<Marker, "widthMm" | "heightMm" | "elevationMm">> = {
  door: { widthMm: 900, heightMm: 2100, elevationMm: 0 },
  window: { widthMm: 1200, heightMm: 1000, elevationMm: 1000 },
  light: { widthMm: 100, heightMm: 100, elevationMm: 2300 },
  switch: { widthMm: 80, heightMm: 80, elevationMm: 1100 },
  socket: { widthMm: 80, heightMm: 80, elevationMm: 350 },
  cold_water: { widthMm: 80, heightMm: 80, elevationMm: 600 },
  hot_water: { widthMm: 80, heightMm: 80, elevationMm: 600 },
  drain: { widthMm: 110, heightMm: 110, elevationMm: 150 },
};

const defaultVariants: Record<ComponentKind, string> = {
  door: "hinged",
  window: "casement",
  light: "ceiling",
  switch: "single",
  socket: "single",
  cold_water: "wall_outlet",
  hot_water: "wall_outlet",
  drain: "floor",
};

function ToolIcon({ kind }: { kind: Tool }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  if (kind === "select") return <path {...common} d="m5 3 10 9-5 .8 2.5 5.2-2 1-2.5-5.2-3 3Z" />;
  if (kind === "draw")
    return (
      <>
        <path {...common} d="M5 18 9 6l10 4-4 9Z" />
        <circle fill="currentColor" cx="5" cy="18" r="1.7" />
        <circle fill="currentColor" cx="9" cy="6" r="1.7" />
        <circle fill="currentColor" cx="19" cy="10" r="1.7" />
      </>
    );
  if (kind === "door")
    return (
      <>
        <path {...common} d="M4 20V4h11v16M4 20h16" />
        <path {...common} d="M15 20V9a11 11 0 0 1 5 11" />
      </>
    );
  if (kind === "window")
    return (
      <>
        <rect {...common} x="4" y="6" width="16" height="12" />
        <path {...common} d="M12 6v12M4 12h16" />
      </>
    );
  if (kind === "light")
    return (
      <>
        <circle {...common} cx="12" cy="12" r="7" />
        <path {...common} d="m7 7 10 10M17 7 7 17" />
      </>
    );
  if (kind === "switch")
    return (
      <>
        <circle {...common} cx="12" cy="12" r="7" />
        <path {...common} d="m8 15 8-7M8 8h3" />
      </>
    );
  if (kind === "socket")
    return (
      <>
        <circle {...common} cx="12" cy="12" r="7" />
        <circle fill="currentColor" cx="9.5" cy="12" r="1.1" />
        <circle fill="currentColor" cx="14.5" cy="12" r="1.1" />
      </>
    );
  if (kind === "drain")
    return (
      <>
        <rect {...common} x="5" y="5" width="14" height="14" rx="2" />
        <path {...common} d="M8 8l8 8m0-8-8 8" />
      </>
    );
  return (
    <>
      <path {...common} d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z" />
      <path {...common} d={kind === "hot_water" ? "M9 14h6M12 11v6" : "M9 14h6"} />
    </>
  );
}

function edgeLength(a: Point2Mm, b: Point2Mm): number {
  return Math.round(Math.hypot(b.x - a.x, b.y - a.y));
}

function wallAngle(vertices: readonly Point2Mm[], wallIndex: number): number {
  const start = vertices[wallIndex]!;
  const end = vertices[(wallIndex + 1) % vertices.length]!;
  return (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
}

function polygonArea(vertices: readonly Point2Mm[]): number {
  return (
    Math.abs(
      vertices.reduce((total, vertex, index) => {
        const next = vertices[(index + 1) % vertices.length]!;
        return total + vertex.x * next.y - next.x * vertex.y;
      }, 0),
    ) / 2_000_000
  );
}

function fitViewBox(vertices: readonly Point2Mm[]): ViewBox {
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = Math.max(600, Math.max(maxX - minX, maxY - minY) * 0.16);
  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(1800, maxX - minX + padding * 2),
    height: Math.max(1400, maxY - minY + padding * 2),
  };
}

function closestWall(vertices: readonly Point2Mm[], point: Point2Mm, hostedWidthMm = 0) {
  return vertices.reduce(
    (best, start, index) => {
      const end = vertices[(index + 1) % vertices.length]!;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const squaredLength = dx * dx + dy * dy;
      const rawRatio =
        squaredLength === 0
          ? 0
          : ((point.x - start.x) * dx + (point.y - start.y) * dy) / squaredLength;
      const wallLength = Math.sqrt(squaredLength);
      const minimumRatio = wallLength ? Math.min(0.5, hostedWidthMm / 2 / wallLength) : 0;
      const ratio = Math.max(minimumRatio, Math.min(1 - minimumRatio, rawRatio));
      const projected = { x: start.x + ratio * dx, y: start.y + ratio * dy };
      const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
      return distance < best.distance ? { distance, wallIndex: index, point: projected } : best;
    },
    { distance: Number.POSITIVE_INFINITY, wallIndex: 0, point: vertices[0]! },
  );
}

function svgPoint(event: ReactPointerEvent<SVGSVGElement>): Point2Mm {
  const matrix = event.currentTarget.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return { x: Math.round(point.x / 50) * 50, y: Math.round(point.y / 50) * 50 };
}

function verticesFromSpace(space: BuildingSpace): readonly Point2Mm[] {
  if (space.footprint.kind === "polygon") return space.footprint.vertices;
  return [
    { x: 0, y: 0 },
    { x: space.footprint.widthMm, y: 0 },
    { x: space.footprint.widthMm, y: space.footprint.depthMm },
    { x: 0, y: space.footprint.depthMm },
  ];
}

function CadSymbol({
  marker,
  vertices,
  selected,
}: {
  marker: Marker;
  vertices: readonly Point2Mm[];
  selected: boolean;
}) {
  const angle = wallAngle(vertices, marker.wallIndex);
  const selection = selected ? (
    <rect
      x={-marker.widthMm / 2 - 100}
      y="-190"
      width={marker.widthMm + 200}
      height="380"
      rx="80"
      fill="none"
      stroke="#f4ac3d"
      strokeWidth="28"
      strokeDasharray="70 35"
    />
  ) : null;
  let symbol: React.ReactNode;
  if (marker.kind === "door") {
    symbol = (
      <>
        <path
          d={`M ${-marker.widthMm / 2} 0 H ${marker.widthMm / 2}`}
          stroke="#fff"
          strokeWidth="115"
        />
        <path
          d={`M ${-marker.widthMm / 2} 0 V ${-marker.widthMm}`}
          stroke="#1c3133"
          strokeWidth="36"
        />
        <path
          d={`M ${-marker.widthMm / 2} ${-marker.widthMm} A ${marker.widthMm} ${marker.widthMm} 0 0 1 ${marker.widthMm / 2} 0`}
          fill="none"
          stroke="#2a4b4f"
          strokeWidth="22"
          strokeDasharray="45 25"
        />
      </>
    );
  } else if (marker.kind === "window") {
    symbol = (
      <>
        <path
          d={`M ${-marker.widthMm / 2} 0 H ${marker.widthMm / 2}`}
          stroke="#fff"
          strokeWidth="120"
        />
        <path
          d={`M ${-marker.widthMm / 2} -34 H ${marker.widthMm / 2}`}
          stroke="#2a4b4f"
          strokeWidth="24"
        />
        <path
          d={`M ${-marker.widthMm / 2} 34 H ${marker.widthMm / 2}`}
          stroke="#2a4b4f"
          strokeWidth="24"
        />
      </>
    );
  } else {
    const color =
      marker.kind === "hot_water" ? "#e76f51" : marker.kind === "cold_water" ? "#3e86a0" : "#fff";
    symbol = (
      <g transform="scale(7)">
        <circle r="13" fill={color} stroke="#1c3133" strokeWidth="3" />
        <g transform="translate(-12 -12)" color="#1c3133">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <ToolIcon kind={marker.kind} />
          </svg>
        </g>
      </g>
    );
  }
  return (
    <g transform={`translate(${marker.point.x} ${marker.point.y}) rotate(${angle})`}>
      {selection}
      {symbol}
    </g>
  );
}

type TechnicalView = "top" | "front" | "right" | "elevation" | "iso" | "walk";

const technicalViewCamera: Record<TechnicalView, { yaw: number; pitch: number }> = {
  top: { yaw: 0, pitch: 0 },
  front: { yaw: 0, pitch: 90 },
  right: { yaw: 90, pitch: 90 },
  elevation: { yaw: 0, pitch: 90 },
  iso: { yaw: -42, pitch: 55 },
  walk: { yaw: 0, pitch: 0 },
};

function ViewIcon({ view }: { view: TechnicalView }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  if (view === "top")
    return (
      <>
        <rect {...common} x="4" y="5" width="16" height="14" />
        <path {...common} d="M8 9h8v6H8z" />
      </>
    );
  if (view === "front")
    return (
      <>
        <path {...common} d="M4 20V5h16v15" />
        <path {...common} d="M9 20v-8h6v8" />
      </>
    );
  if (view === "right")
    return (
      <>
        <path {...common} d="M5 20V6h14v14" />
        <path {...common} d="m12 3 4 3-4 3" />
      </>
    );
  if (view === "elevation")
    return (
      <>
        <path {...common} d="M4 20V5h16v15M8 20v-8h7v8" />
        <path {...common} d="M2 5h20" />
      </>
    );
  if (view === "walk")
    return (
      <>
        <circle {...common} cx="12" cy="6" r="2.5" />
        <path {...common} d="m12 9-3 5 3 2 3-5M9 14l-2 6M12 16l3 4" />
      </>
    );
  return (
    <>
      <path {...common} d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" />
      <path {...common} d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </>
  );
}

function Plan3D({
  vertices,
  height,
  markers,
  markerLabels,
  label,
  viewLabels,
  selectedMarkerIds,
  onSelectMarker,
  onStartMarkerMove,
  onMoveMarker,
}: {
  vertices: readonly Point2Mm[];
  height: number;
  markers: readonly Marker[];
  markerLabels: Record<ComponentKind, string>;
  label: string;
  viewLabels: Record<TechnicalView, string> & {
    fit: string;
    orbitHelp: string;
    walkHelp: string;
    previousWall: string;
    nextWall: string;
    moveForward: string;
    moveBackward: string;
    turnLeft: string;
    turnRight: string;
  };
  selectedMarkerIds: readonly string[];
  onSelectMarker: (markerId: string) => void;
  onStartMarkerMove: () => void;
  onMoveMarker: (markerId: string, offsetMm: number, elevationMm: number) => void;
}) {
  const [view, setView] = useState<TechnicalView>("iso");
  const [yaw, setYaw] = useState(technicalViewCamera.iso.yaw);
  const [pitch, setPitch] = useState(technicalViewCamera.iso.pitch);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [elevationWallIndex, setElevationWallIndex] = useState(0);
  const cameraDrag = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    pan: { x: number; y: number };
    mode: "orbit" | "pan";
  } | null>(null);
  const elevationMarkerDrag = useRef<string | null>(null);
  const bounds = fitViewBox(vertices);
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    z: height / 2,
  };
  const [walkPosition, setWalkPosition] = useState(() => findInteriorPoint(vertices));
  const walkKeys = useRef(new Set<string>());
  const walkYaw = useRef(yaw);
  const walkViewport = useRef<SVGSVGElement | null>(null);
  const extent = Math.max(bounds.width, bounds.height, height, 1);
  const scale = (520 / extent) * zoom;
  const yawRadians = (yaw * Math.PI) / 180;
  const pitchRadians = (pitch * Math.PI) / 180;

  function project(point: Point2Mm, z = 0) {
    if (view === "walk") {
      const cameraZ = Math.min(1600, Math.max(900, height - 250));
      const walkYaw = (yaw * Math.PI) / 180;
      const walkPitch = (pitch * Math.PI) / 180;
      const dx = point.x - walkPosition.x;
      const dy = point.y - walkPosition.y;
      const dz = z - cameraZ;
      const forward = dx * Math.cos(walkYaw) + dy * Math.sin(walkYaw);
      const right = -dx * Math.sin(walkYaw) + dy * Math.cos(walkYaw);
      const forwardWithPitch = forward * Math.cos(walkPitch) + dz * Math.sin(walkPitch);
      const up = dz * Math.cos(walkPitch) - forward * Math.sin(walkPitch);
      const visible = forwardWithPitch > 80;
      const divisor = Math.max(forwardWithPitch, 80);
      return {
        x: 500 + (right / divisor) * 650,
        y: 350 - (up / divisor) * 650,
        depth: forwardWithPitch,
        visible,
      };
    }
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const dz = z - center.z;
    const rotatedX = dx * Math.cos(yawRadians) - dy * Math.sin(yawRadians);
    const rotatedY = dx * Math.sin(yawRadians) + dy * Math.cos(yawRadians);
    const vertical = rotatedY * Math.cos(pitchRadians) - dz * Math.sin(pitchRadians);
    const depth = rotatedY * Math.sin(pitchRadians) + dz * Math.cos(pitchRadians);
    return {
      x: 500 + pan.x + rotatedX * scale,
      y: 350 + pan.y + vertical * scale,
      depth,
      visible: true,
    };
  }

  function selectView(next: TechnicalView) {
    setView(next);
    setYaw(technicalViewCamera[next].yaw);
    setPitch(technicalViewCamera[next].pitch);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (next === "walk") {
      setWalkPosition(findInteriorPoint(vertices));
      setYaw(0);
      setPitch(0);
    }
  }

  useEffect(() => {
    walkYaw.current = yaw;
  }, [yaw]);

  useEffect(() => {
    if (view !== "walk") return;
    const activeKeys = walkKeys.current;
    let frame = 0;
    let previousTime = performance.now();
    function handleWalkKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
        activeKeys.add(key);
      }
    }
    function handleWalkKeyUp(event: KeyboardEvent) {
      activeKeys.delete(event.key.toLowerCase());
    }
    function handleMouseLook(event: MouseEvent) {
      if (document.pointerLockElement !== walkViewport.current) return;
      setYaw((current) => current + event.movementX * 0.12);
      setPitch((current) => Math.max(-55, Math.min(55, current - event.movementY * 0.1)));
    }
    function tick(time: number) {
      const seconds = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const keys = activeKeys;
      const turn = (keys.has("arrowright") ? 1 : 0) - (keys.has("arrowleft") ? 1 : 0);
      if (turn) setYaw((current) => current + turn * 95 * seconds);
      const forward =
        (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
      const strafe = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
      if (forward || strafe) {
        const distance = 1800 * seconds;
        setWalkPosition((current) =>
          moveWalkCamera(current, walkYaw.current, forward * distance, strafe * distance, vertices),
        );
      }
      frame = requestAnimationFrame(tick);
    }
    window.addEventListener("keydown", handleWalkKeyDown);
    window.addEventListener("keyup", handleWalkKeyUp);
    document.addEventListener("mousemove", handleMouseLook);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      activeKeys.clear();
      window.removeEventListener("keydown", handleWalkKeyDown);
      window.removeEventListener("keyup", handleWalkKeyUp);
      document.removeEventListener("mousemove", handleMouseLook);
    };
  }, [view, vertices]);

  function startCameraDrag(event: ReactPointerEvent<SVGSVGElement>) {
    cameraDrag.current = {
      x: event.clientX,
      y: event.clientY,
      yaw,
      pitch,
      pan,
      mode:
        event.shiftKey ||
        view === "top" ||
        view === "front" ||
        view === "right" ||
        view === "elevation"
          ? "pan"
          : "orbit",
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveCamera(event: ReactPointerEvent<SVGSVGElement>) {
    if (view === "elevation" && elevationMarkerDrag.current) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const localX = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 1000;
      const localY = ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 700;
      onMoveMarker(
        elevationMarkerDrag.current,
        Math.max(0, Math.min(elevationWallLength, (localX - 140) / elevationScaleX)),
        Math.max(0, Math.min(height, (560 - localY) / elevationScaleZ)),
      );
      return;
    }
    const drag = cameraDrag.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (drag.mode === "pan") {
      setPan({ x: drag.pan.x + dx, y: drag.pan.y + dy });
    } else {
      setYaw(drag.yaw + dx * 0.35);
      setPitch(
        view === "walk"
          ? Math.max(-45, Math.min(45, drag.pitch - dy * 0.2))
          : Math.max(10, Math.min(85, drag.pitch - dy * 0.3)),
      );
    }
  }

  const points = (items: readonly { x: number; y: number }[]) =>
    items.map((point) => `${point.x},${point.y}`).join(" ");
  const wallFaces = vertices
    .map((start, index) => {
      const end = vertices[(index + 1) % vertices.length]!;
      const projected = [
        project(start),
        project(end),
        project(end, height),
        project(start, height),
      ];
      return {
        index,
        projected,
        depth: projected.reduce((sum, point) => sum + point.depth, 0) / 4,
      };
    })
    .sort((a, b) => a.depth - b.depth);
  const openingFaces = markers
    .filter((marker) => marker.kind === "door" || marker.kind === "window")
    .flatMap((marker) => {
      const wallStart = vertices[marker.wallIndex];
      const wallEnd = vertices[(marker.wallIndex + 1) % vertices.length];
      if (!wallStart || !wallEnd) return [];
      const corners = wallOpeningCorners(
        marker.point,
        wallStart,
        wallEnd,
        marker.widthMm,
        marker.elevationMm,
        marker.heightMm,
      );
      const projected = corners.map((corner) => project(corner, corner.z));
      const doorLeaf =
        marker.kind === "door"
          ? doorLeafCorners(
              marker.point,
              wallStart,
              wallEnd,
              marker.widthMm,
              marker.heightMm,
              vertices,
            ).map((corner) => project(corner, corner.z))
          : [];
      return [
        {
          marker,
          projected,
          doorLeaf,
          depth: projected.reduce((sum, point) => sum + point.depth, 0) / 4,
        },
      ];
    })
    .sort((a, b) => a.depth - b.depth);
  const elevationStart = vertices[elevationWallIndex] ?? vertices[0]!;
  const elevationEnd = vertices[(elevationWallIndex + 1) % vertices.length] ?? vertices[1]!;
  const elevationWallLength = Math.max(1, edgeLength(elevationStart, elevationEnd));
  const elevationScaleX = 720 / elevationWallLength;
  const elevationScaleZ = 460 / Math.max(height, 1);
  const elevationMarkers = markers.filter((marker) => marker.wallIndex === elevationWallIndex);

  function movePerson(forwardMm: number) {
    setWalkPosition((current) => moveWalkCamera(current, yaw, forwardMm, 0, vertices));
  }

  return (
    <div className="cad-technical-viewport">
      <div className="cad-view-presets" aria-label={label}>
        {(Object.keys(technicalViewCamera) as TechnicalView[]).map((preset) => (
          <button
            key={preset}
            type="button"
            className={view === preset ? "is-active" : ""}
            aria-pressed={view === preset}
            onClick={() => selectView(preset)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <ViewIcon view={preset} />
            </svg>
            <span>{viewLabels[preset]}</span>
          </button>
        ))}
        {view === "elevation" ? (
          <>
            <button
              type="button"
              aria-label={viewLabels.previousWall}
              onClick={() =>
                setElevationWallIndex(
                  (current) => (current - 1 + vertices.length) % vertices.length,
                )
              }
            >
              ← W
            </button>
            <button
              type="button"
              aria-label={viewLabels.nextWall}
              onClick={() => setElevationWallIndex((current) => (current + 1) % vertices.length)}
            >
              W →
            </button>
          </>
        ) : null}
        <button type="button" onClick={() => selectView(view)}>
          {viewLabels.fit}
        </button>
      </div>
      <span className="cad-camera-help">
        {view === "walk" ? viewLabels.walkHelp : viewLabels.orbitHelp}
      </span>
      {view === "walk" ? (
        <div className="cad-walk-controls">
          <button type="button" aria-label={viewLabels.moveForward} onClick={() => movePerson(200)}>
            ↑
          </button>
          <button
            type="button"
            aria-label={viewLabels.turnLeft}
            onClick={() => setYaw((current) => current - 8)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label={viewLabels.moveBackward}
            onClick={() => movePerson(-200)}
          >
            ↓
          </button>
          <button
            type="button"
            aria-label={viewLabels.turnRight}
            onClick={() => setYaw((current) => current + 8)}
          >
            →
          </button>
        </div>
      ) : null}
      <svg
        ref={walkViewport}
        className="cad-3d"
        viewBox="0 0 1000 700"
        role="img"
        aria-label={label}
        onDoubleClick={(event) => {
          if (view === "walk" && document.pointerLockElement !== event.currentTarget) {
            void event.currentTarget.requestPointerLock?.();
          }
        }}
        onPointerDown={startCameraDrag}
        onPointerMove={moveCamera}
        onPointerUp={() => {
          cameraDrag.current = null;
          elevationMarkerDrag.current = null;
        }}
        onPointerLeave={() => {
          cameraDrag.current = null;
          elevationMarkerDrag.current = null;
        }}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((current) =>
            Math.max(0.25, Math.min(5, current * (event.deltaY > 0 ? 0.9 : 1.1))),
          );
        }}
      >
        {view === "elevation" ? (
          <>
            <rect
              x="140"
              y="100"
              width="720"
              height="460"
              fill="#f8faf8"
              stroke="#2a4b4f"
              strokeWidth="5"
            />
            <line x1="110" y1="560" x2="890" y2="560" stroke="#1c3133" strokeWidth="6" />
            <text x="500" y="625" textAnchor="middle" fontSize="24" fontWeight="800">
              W{elevationWallIndex + 1} · {elevationWallLength} mm
            </text>
            <text
              x="92"
              y="340"
              textAnchor="middle"
              fontSize="22"
              fontWeight="800"
              transform="rotate(-90 92 340)"
            >
              {height} mm
            </text>
            {elevationMarkers.map((marker) => {
              const offset = hostedMarkerOffsetMm(marker, vertices);
              const x = 140 + offset * elevationScaleX;
              const y = 560 - marker.elevationMm * elevationScaleZ;
              const selected = selectedMarkerIds.includes(marker.id);
              if (marker.kind === "door" || marker.kind === "window") {
                return (
                  <g
                    key={marker.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${markerLabels[marker.kind]} · ${marker.elevationMm} mm`}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      onSelectMarker(marker.id);
                      onStartMarkerMove();
                      elevationMarkerDrag.current = marker.id;
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") onSelectMarker(marker.id);
                    }}
                  >
                    <rect
                      x={x - (marker.widthMm * elevationScaleX) / 2}
                      y={y - marker.heightMm * elevationScaleZ}
                      width={marker.widthMm * elevationScaleX}
                      height={marker.heightMm * elevationScaleZ}
                      fill={marker.kind === "window" ? "#dceef2" : "#f4e7d6"}
                      stroke={selected ? "#f4ac3d" : "#2a4b4f"}
                      strokeWidth={selected ? 8 : 4}
                    />
                    {marker.kind === "window" ? (
                      <line
                        x1={x}
                        y1={y - marker.heightMm * elevationScaleZ}
                        x2={x}
                        y2={y}
                        stroke="#2a4b4f"
                        strokeWidth="3"
                      />
                    ) : null}
                  </g>
                );
              }
              return (
                <g
                  key={marker.id}
                  transform={`translate(${x} ${y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${markerLabels[marker.kind]} · ${marker.elevationMm} mm`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onSelectMarker(marker.id);
                    onStartMarkerMove();
                    elevationMarkerDrag.current = marker.id;
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                >
                  <circle
                    r={selected ? 24 : 19}
                    fill={selected ? "#f4ac3d" : "#fff"}
                    stroke="#1c3133"
                    strokeWidth="4"
                  />
                  <g transform="translate(-12 -12)" color="#1c3133">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <ToolIcon kind={marker.kind} />
                    </svg>
                  </g>
                  <text x="28" y="-22" fontSize="20" fontWeight="800">
                    {marker.elevationMm} mm
                  </text>
                </g>
              );
            })}
          </>
        ) : (
          <>
            {vertices.map((point) => project(point)).every((point) => point.visible) ? (
              <polygon
                points={points(vertices.map((point) => project(point)))}
                fill="#dfe7e2"
                stroke="#2a4b4f"
                strokeWidth="5"
              />
            ) : null}
            {wallFaces
              .filter(({ projected }) => projected.every((point) => point.visible))
              .map(({ index, projected }) => (
                <polygon
                  key={`wall-face-${index}`}
                  points={points(projected)}
                  fill={index % 2 ? "rgba(42,75,79,.18)" : "rgba(244,172,61,.16)"}
                  stroke="#2a4b4f"
                  strokeWidth="3"
                />
              ))}
            {openingFaces
              .filter(({ projected }) => projected.every((point) => point.visible))
              .map(({ marker, projected, doorLeaf }) => (
                <g
                  key={`opening-${marker.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${markerLabels[marker.kind]} · ${marker.elevationMm} mm`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onSelectMarker(marker.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onSelectMarker(marker.id);
                  }}
                >
                  <polygon
                    points={points(projected)}
                    fill={marker.kind === "window" ? "rgba(198,229,238,.92)" : "#f8f5ef"}
                    stroke="#1c3133"
                    strokeWidth="5"
                  />
                  {marker.kind === "door" && doorLeaf.every((point) => point.visible) ? (
                    <polygon
                      points={points(doorLeaf)}
                      fill="rgba(184,132,76,.7)"
                      stroke="#573a20"
                      strokeWidth="5"
                    />
                  ) : null}
                  {marker.kind === "window" ? (
                    <line
                      x1={(projected[0]!.x + projected[3]!.x) / 2}
                      y1={(projected[0]!.y + projected[3]!.y) / 2}
                      x2={(projected[1]!.x + projected[2]!.x) / 2}
                      y2={(projected[1]!.y + projected[2]!.y) / 2}
                      stroke="#2a4b4f"
                      strokeWidth="3"
                    />
                  ) : null}
                </g>
              ))}
          </>
        )}
        {view !== "elevation" &&
          markers
            .filter((marker) => marker.kind !== "door" && marker.kind !== "window")
            .map((marker) => {
              const point = project(marker.point, marker.elevationMm);
              if (!point.visible) return null;
              const selected = selectedMarkerIds.includes(marker.id);
              return (
                <g
                  key={marker.id}
                  transform={`translate(${point.x} ${point.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${markerLabels[marker.kind]} · ${marker.elevationMm} mm`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onSelectMarker(marker.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onSelectMarker(marker.id);
                  }}
                >
                  <circle
                    r={selected ? 20 : 16}
                    fill={selected ? "#f4ac3d" : "#fff"}
                    stroke="#1c3133"
                    strokeWidth="3"
                  />
                  <g transform="translate(-11 -11)" color="#1c3133">
                    <svg width="22" height="22" viewBox="0 0 24 24">
                      <ToolIcon kind={marker.kind} />
                    </svg>
                  </g>
                  {(view === "front" || view === "right") && (
                    <text x="24" y="-18" fontSize="18" fontWeight="800" fill="#1c3133">
                      {marker.elevationMm} mm
                    </text>
                  )}
                </g>
              );
            })}
      </svg>
    </div>
  );
}

export function CadWorkspace({
  locale,
  projectId,
  projectName,
  projectDescription,
  spaces,
  elements,
  electricalRoutes = [],
  messages,
}: {
  locale: string;
  projectId: string;
  projectName?: string;
  projectDescription?: string | null;
  spaces: readonly BuildingSpace[];
  elements: readonly BuildingElement[];
  electricalRoutes?: readonly ElectricalRouteOverlay[];
  messages: CadMessages;
}) {
  const router = useRouter();
  const [vertices, setVertices] = useState<readonly Point2Mm[]>(templates.rectangle);
  const [viewBox, setViewBox] = useState<ViewBox>(() => fitViewBox(templates.rectangle));
  const [height, setHeight] = useState(2500);
  const [name, setName] = useState(messages.unsavedPlan);
  const [kind, setKind] = useState<SpaceKind>("bathroom");
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [planView, setPlanView] = useState<PlanEditorView>("plan");
  const [elevationWallIndex, setElevationWallIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("select");
  const [activeVertex, setActiveVertex] = useState<number | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [selectedMarkerIds, setSelectedMarkerIds] = useState<readonly string[]>([]);
  const [markers, setMarkers] = useState<readonly Marker[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"clean" | "dirty" | "saving" | "error">("clean");
  const [generatingElectrical, setGeneratingElectrical] = useState(false);
  const [historyAvailability, setHistoryAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });
  const lastSavedRef = useRef("");
  const initialSpaceLoadedRef = useRef(false);
  const historyRef = useRef<{
    past: CadDocumentSnapshot[];
    future: CadDocumentSnapshot[];
  }>({ past: [], future: [] });
  const componentClipboardRef = useRef<readonly Marker[]>([]);
  const [hasComponentClipboard, setHasComponentClipboard] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectedWallIndex, setSelectedWallIndex] = useState<number | null>(null);
  const [orthogonalConstraint, setOrthogonalConstraint] = useState(true);
  const [drawingVertices, setDrawingVertices] = useState<readonly Point2Mm[] | null>(null);
  const [drawingError, setDrawingError] = useState<string | null>(null);
  const [showElectricalLayer, setShowElectricalLayer] = useState(false);
  const panStart = useRef<{ x: number; y: number; viewBox: ViewBox } | null>(null);
  const dragCheckpointRef = useRef(false);
  const area = useMemo(() => polygonArea(vertices), [vertices]);
  const electricalLayout = useMemo(
    () =>
      buildElectricalLayout({
        clearHeightMm: height,
        terminals: markers.flatMap((marker) =>
          marker.kind === "light" || marker.kind === "switch" || marker.kind === "socket"
            ? [{
                id: marker.id,
                kind: marker.kind,
                point: marker.point,
                elevationMm: marker.placementSurface === "ceiling" ? height : marker.elevationMm,
              }]
            : [],
        ),
        vertices,
      }),
    [height, markers, vertices],
  );
  const projectedElectricalRoutes = useMemo(
    () =>
      electricalLayout.runs.flatMap((run) =>
        planView === "wall" &&
        markers.some(
          (marker) =>
            marker.id === run.terminalId &&
            marker.kind !== "light" &&
            marker.wallIndex !== elevationWallIndex,
        )
          ? []
          : run.conductors.map((conductor, conductorIndex): ElectricalRouteOverlay => ({
          id: `${run.id}-${conductor.role}`,
          spaceId: activeSpaceId ?? "preview",
          path: run.path.map((point) =>
            planView === "plan"
              ? projectElectricalPoint(point, "plan", height)
              : projectPointToWall(point, vertices, elevationWallIndex, height),
          ),
          role: conductor.role,
          color: conductorColors[conductor.color],
          dashPattern: "34 68",
          dashOffset: conductorIndex * -34,
            })),
      ),
    [activeSpaceId, electricalLayout.runs, elevationWallIndex, height, markers, planView, vertices],
  );
  const visibleElectricalRoutes = useMemo(() => {
    const persisted = activeSpaceId && planView === "plan"
      ? electricalRoutes.filter((route) => route.spaceId === activeSpaceId)
      : [];
    return persisted.length > 0 ? persisted : projectedElectricalRoutes;
  }, [activeSpaceId, electricalRoutes, planView, projectedElectricalRoutes]);

  function selectPlanView(view: PlanEditorView) {
    setPlanView(view);
    if (view === "plan") {
      setViewBox(fitViewBox(vertices));
      return;
    }
    const start = vertices[elevationWallIndex]!;
    const end = vertices[(elevationWallIndex + 1) % vertices.length]!;
    const wallLength = Math.hypot(end.x - start.x, end.y - start.y);
    setViewBox({
      x: -400,
      y: -400,
      width: Math.max(1000, wallLength + 800),
      height: height + 800,
    });
  }

  function selectElevationWall(index: number) {
    setElevationWallIndex(index);
    setSelectedWallIndex(index);
    setSelectedMarkerIds([]);
    const start = vertices[index]!;
    const end = vertices[(index + 1) % vertices.length]!;
    setViewBox({
      x: -400,
      y: -400,
      width: Math.max(1000, Math.hypot(end.x - start.x, end.y - start.y) + 800),
      height: height + 800,
    });
  }

  function openMaterialsDrawer() {
    const drawer = document.getElementById("materials-shopping-drawer");
    if (drawer instanceof HTMLDetailsElement) {
      drawer.open = true;
      drawer.querySelector<HTMLElement>(".takeoff-drawer-content")?.focus();
    }
  }
  const selectedMarker = selectedMarkerIds.at(-1) ?? null;
  const selected = markers.find((marker) => marker.id === selectedMarker);
  const toolLabels: Record<Tool, string> = {
    select: messages.selectTool,
    draw: messages.drawContour,
    door: messages.doorTool,
    window: messages.windowTool,
    light: messages.lightTool,
    switch: messages.switchTool,
    socket: messages.socketTool,
    cold_water: messages.coldWaterTool,
    hot_water: messages.hotWaterTool,
    drain: messages.drainTool,
  };
  const serialized = JSON.stringify({
    projectId,
    name,
    kind,
    vertices,
    clearHeightMm: height,
    components: markers.map((marker) => ({
      kind: marker.kind,
      point: marker.point,
      wallIndex: marker.wallIndex,
      placementSurface: marker.placementSurface,
      widthMm: marker.widthMm,
      heightMm: marker.heightMm,
      elevationMm: marker.elevationMm,
      variant: marker.variant,
    })),
  });

  function currentSnapshot(): CadDocumentSnapshot {
    return cloneSnapshot({ vertices, height, name, kind, markers });
  }

  function checkpoint() {
    const history = historyRef.current;
    history.past.push(currentSnapshot());
    if (history.past.length > 100) history.past.shift();
    history.future = [];
    setHistoryAvailability({ canUndo: true, canRedo: false });
  }

  function restoreSnapshot(snapshot: CadDocumentSnapshot) {
    const restored = cloneSnapshot(snapshot);
    setVertices(restored.vertices);
    setHeight(restored.height);
    setName(restored.name);
    setKind(restored.kind);
    setMarkers(restored.markers);
    setSelectedMarkerIds([]);
    setSelectedWallIndex(null);
    setViewBox(fitViewBox(restored.vertices));
  }

  function undo() {
    const previous = historyRef.current.past.pop();
    if (!previous) return;
    historyRef.current.future.push(currentSnapshot());
    restoreSnapshot(previous);
    setHistoryAvailability({
      canUndo: historyRef.current.past.length > 0,
      canRedo: true,
    });
  }

  function redo() {
    const next = historyRef.current.future.pop();
    if (!next) return;
    historyRef.current.past.push(currentSnapshot());
    restoreSnapshot(next);
    setHistoryAvailability({
      canUndo: true,
      canRedo: historyRef.current.future.length > 0,
    });
  }

  function copySelectedComponents() {
    const copied = markers
      .filter((marker) => selectedMarkerIds.includes(marker.id))
      .map((marker) => ({ ...marker, point: { ...marker.point } }));
    if (!copied.length) return;
    componentClipboardRef.current = copied;
    setHasComponentClipboard(true);
  }

  function insertComponentCopies(source: readonly Marker[]) {
    if (!source.length) return;
    checkpoint();
    const copies = offsetHostedMarkers(
      source.map((marker) => ({ ...marker, id: crypto.randomUUID(), point: { ...marker.point } })),
      vertices,
      200,
    );
    setMarkers((current) => [...current, ...copies]);
    setSelectedMarkerIds(copies.map((marker) => marker.id));
  }

  function duplicateSelectedComponents() {
    insertComponentCopies(markers.filter((marker) => selectedMarkerIds.includes(marker.id)));
  }

  function pasteComponents() {
    insertComponentCopies(componentClipboardRef.current);
  }

  function distributeSelectedComponents() {
    const selectedMarkers = markers.filter((marker) => selectedMarkerIds.includes(marker.id));
    if (selectedMarkers.length < 3) return;
    checkpoint();
    const distributed = distributeHostedMarkers(selectedMarkers, vertices);
    const byId = new Map(distributed.map((marker) => [marker.id, marker]));
    setMarkers((current) => current.map((marker) => byId.get(marker.id) ?? marker));
  }

  function finishContour() {
    if (!drawingVertices || !isSimplePolygon(drawingVertices)) {
      setDrawingError(messages.invalidContour);
      return;
    }
    checkpoint();
    setVertices(drawingVertices.map((point) => ({ ...point })));
    setViewBox(fitViewBox(drawingVertices));
    setMarkers([]);
    setSelectedMarkerIds([]);
    setSelectedWallIndex(null);
    setDrawingVertices(null);
    setDrawingError(null);
    setTool("select");
  }

  function cancelDrawing() {
    setDrawingVertices(null);
    setDrawingError(null);
    setTool("select");
  }

  async function persistPlan(spaceId: string | null) {
    setSaveState("saving");
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("projectId", projectId);
    formData.set("plan", serialized);
    if (spaceId) formData.set("spaceId", spaceId);
    const result = await saveCadSpace(formData);
    if (result.status === "saved") {
      setActiveSpaceId(result.spaceId);
      lastSavedRef.current = serialized;
      setSaveState("clean");
      router.refresh();
    } else {
      setSaveState("error");
    }
  }

  async function toggleElectricalLayer() {
    const shouldShow = !showElectricalLayer;
    setShowElectricalLayer(shouldShow);
    if (!shouldShow || electricalRoutes.some((route) => route.spaceId === activeSpaceId)) return;

    // The proposal is deterministic and remains editable in the electrical editor.
    // It is generated on demand so an untouched plan does not acquire invisible data.
    setGeneratingElectrical(true);
    try {
      const formData = new FormData();
      formData.set("locale", locale);
      formData.set("projectId", projectId);
      await generateElectricalProposal(formData);
      router.refresh();
    } finally {
      setGeneratingElectrical(false);
    }
  }

  useEffect(() => {
    if (!activeSpaceId || serialized === lastSavedRef.current) return;
    setSaveState("dirty");
    const timeout = window.setTimeout(() => void persistPlan(activeSpaceId), 1200);
    return () => window.clearTimeout(timeout);
    // The serialized document is the autosave boundary; individual editor fields
    // intentionally do not trigger separate persistence effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSpaceId, serialized]);

  function applyTemplate(template: Template) {
    checkpoint();
    const next = templates[template].map((point) => ({ ...point }));
    setVertices(next);
    setViewBox(fitViewBox(next));
    setMarkers([]);
    setSelectedMarkerIds([]);
    setSelectedWallIndex(null);
  }

  function updateSelected(values: Partial<Marker>) {
    if (!selectedMarker) return;
    setMarkers((current) =>
      current.map((marker) => (marker.id === selectedMarker ? { ...marker, ...values } : marker)),
    );
  }

  function loadSpace(space: BuildingSpace) {
    const nextVertices = verticesFromSpace(space).map((point) => ({ ...point }));
    setVertices(nextVertices);
    setViewBox(fitViewBox(nextVertices));
    setHeight(space.clearHeightMm);
    setName(space.name);
    setKind(space.kind);
    setSelectedMarkerIds([]);
    const loadedMarkers = elements
      .filter((element) => element.spaceId === space.id && element.kind !== "wall")
      .flatMap((element): Marker[] => {
        const terminalKind = element.specification.terminalKind;
        const markerKind =
          element.kind === "door" || element.kind === "window"
            ? element.kind
            : terminalKind === "light" ||
                terminalKind === "switch" ||
                terminalKind === "socket" ||
                terminalKind === "cold_water" ||
                terminalKind === "hot_water" ||
                terminalKind === "drain"
              ? terminalKind
              : null;
        if (!markerKind) return [];
        const host = elements.find((candidate) => candidate.id === element.hostElementId);
        return [
          {
            id: element.id,
            kind: markerKind,
            point: { x: element.transform.position.x, y: element.transform.position.y },
            wallIndex:
              typeof host?.specification.wallIndex === "number" ? host.specification.wallIndex : 0,
            placementSurface:
              markerKind === "light"
                ? "ceiling"
                : element.specification.placementSurface === "ceiling" ||
              element.specification.placementSurface === "floor"
                ? element.specification.placementSurface
                : "wall",
            widthMm: element.dimensionsMm.width,
            heightMm: element.dimensionsMm.height,
            elevationMm: markerKind === "light" ? space.clearHeightMm : element.transform.position.z,
            variant:
              typeof element.specification.variant === "string"
                ? element.specification.variant
                : defaultVariants[markerKind],
          },
        ];
      });
    setMarkers(loadedMarkers);
    setActiveSpaceId(space.id);
    lastSavedRef.current = JSON.stringify({
      projectId,
      name: space.name,
      kind: space.kind,
      vertices: nextVertices,
      clearHeightMm: space.clearHeightMm,
      components: loadedMarkers.map((marker) => ({
        kind: marker.kind,
        point: marker.point,
        wallIndex: marker.wallIndex,
        placementSurface: marker.placementSurface,
        widthMm: marker.widthMm,
        heightMm: marker.heightMm,
        elevationMm: marker.elevationMm,
        variant: marker.variant,
      })),
    });
    setSaveState("clean");
    historyRef.current = { past: [], future: [] };
    setHistoryAvailability({ canUndo: false, canRedo: false });
  }

  useEffect(() => {
    if (initialSpaceLoadedRef.current || !spaces[0]) return;
    initialSpaceLoadedRef.current = true;
    loadSpace(spaces[0]);
    // Loading server state once is initialization, not an editor mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaces]);

  useEffect(() => {
    function handleEditorShortcut(event: KeyboardEvent) {
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (command && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (command && key === "c" && selectedMarkerIds.length) {
        event.preventDefault();
        copySelectedComponents();
      } else if (command && key === "v" && componentClipboardRef.current.length) {
        event.preventDefault();
        pasteComponents();
      } else if (command && key === "d" && selectedMarkerIds.length) {
        event.preventDefault();
        duplicateSelectedComponents();
      } else if (event.key === "Escape" && drawingVertices) {
        event.preventDefault();
        cancelDrawing();
      }
    }
    window.addEventListener("keydown", handleEditorShortcut);
    return () => window.removeEventListener("keydown", handleEditorShortcut);
    // History always captures the current rendered document before restoring.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertices, height, name, kind, markers, selectedMarkerIds, drawingVertices]);

  function zoom(factor: number) {
    setViewBox((current) => {
      const width = Math.max(1000, Math.min(30_000, current.width * factor));
      const heightValue = Math.max(800, Math.min(24_000, current.height * factor));
      return {
        x: current.x + (current.width - width) / 2,
        y: current.y + (current.height - heightValue) / 2,
        width,
        height: heightValue,
      };
    });
  }

  function handleWheel(event: ReactWheelEvent<SVGSVGElement>) {
    event.preventDefault();
    zoom(event.deltaY > 0 ? 1.12 : 0.88);
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (tool === "draw") {
      const point = svgPoint(event);
      const first = drawingVertices?.[0];
      if (
        first &&
        (drawingVertices?.length ?? 0) >= 3 &&
        Math.hypot(point.x - first.x, point.y - first.y) <= 250
      ) {
        finishContour();
        return;
      }
      setDrawingVertices((current) => [...(current ?? []), point]);
      setDrawingError(null);
      return;
    }
    if (tool !== "select") {
      checkpoint();
      const canvasPoint = svgPoint(event);
      const nearest = closestWall(vertices, canvasPoint, defaults[tool].widthMm);
      const placementSurface = tool === "light" ? "ceiling" : "wall";
      const marker: Marker = {
        id: crypto.randomUUID(),
        kind: tool,
        point:
          placementSurface === "ceiling"
            ? { x: Math.round(canvasPoint.x), y: Math.round(canvasPoint.y) }
            : { x: Math.round(nearest.point.x), y: Math.round(nearest.point.y) },
        wallIndex: nearest.wallIndex,
        placementSurface,
        variant: defaultVariants[tool],
        ...defaults[tool],
      };
      setMarkers((current) => [...current, marker]);
      setSelectedMarkerIds([marker.id]);
      setSelectedWallIndex(null);
      setTool("select");
      return;
    }
    if (event.shiftKey) {
      const point = svgPoint(event);
      setSelectionBox({ start: point, current: point });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    setSelectedMarkerIds([]);
    setSelectedWallIndex(null);
    panStart.current = { x: event.clientX, y: event.clientY, viewBox };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (selectionBox) {
      setSelectionBox((current) => (current ? { ...current, current: svgPoint(event) } : null));
      return;
    }
    if (activeVertex !== null) {
      if (!dragCheckpointRef.current) {
        checkpoint();
        dragCheckpointRef.current = true;
      }
      const point = svgPoint(event);
      const nextVertices = moveVertex(vertices, activeVertex, point, orthogonalConstraint);
      setVertices(nextVertices);
      setMarkers((current) => reprojectHostedMarkers(current, vertices, nextVertices));
      return;
    }
    if (activeMarker) {
      if (!dragCheckpointRef.current) {
        checkpoint();
        dragCheckpointRef.current = true;
      }
      const active = markers.find((marker) => marker.id === activeMarker);
      if (active?.placementSurface !== "wall") {
        const point = svgPoint(event);
        setMarkers((current) =>
          current.map((marker) =>
            marker.id === activeMarker
              ? { ...marker, point: { x: Math.round(point.x), y: Math.round(point.y) } }
              : marker,
          ),
        );
        return;
      }
      const nearest = closestWall(vertices, svgPoint(event), active?.widthMm ?? 0);
      if (active && selectedMarkerIds.length > 1) {
        const wallStart = vertices[active.wallIndex];
        const wallEnd = vertices[(active.wallIndex + 1) % vertices.length];
        if (wallStart && wallEnd) {
          const length = Math.hypot(wallEnd.x - wallStart.x, wallEnd.y - wallStart.y);
          const offsetMm =
            length === 0
              ? 0
              : ((nearest.point.x - active.point.x) * (wallEnd.x - wallStart.x) +
                  (nearest.point.y - active.point.y) * (wallEnd.y - wallStart.y)) /
                length;
          setMarkers((current) => {
            const moved = offsetHostedMarkers(
              current.filter((marker) => selectedMarkerIds.includes(marker.id)),
              vertices,
              offsetMm,
            );
            const byId = new Map(moved.map((marker) => [marker.id, marker]));
            return current.map((marker) => byId.get(marker.id) ?? marker);
          });
          return;
        }
      }
      setMarkers((current) =>
        current.map((marker) =>
          marker.id === activeMarker
            ? {
                ...marker,
                point: { x: Math.round(nearest.point.x), y: Math.round(nearest.point.y) },
                wallIndex: nearest.wallIndex,
              }
            : marker,
        ),
      );
      return;
    }
    if (panStart.current) {
      const stage = event.currentTarget.getBoundingClientRect();
      const dx = ((event.clientX - panStart.current.x) / Math.max(stage.width, 1)) * viewBox.width;
      const dy =
        ((event.clientY - panStart.current.y) / Math.max(stage.height, 1)) * viewBox.height;
      setViewBox({
        ...panStart.current.viewBox,
        x: panStart.current.viewBox.x - dx,
        y: panStart.current.viewBox.y - dy,
      });
    }
  }

  function handleElevationPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!activeMarker) return;
    const marker = markers.find((candidate) => candidate.id === activeMarker);
    if (!marker || marker.kind === "light" || marker.wallIndex !== elevationWallIndex) return;
    if (!dragCheckpointRef.current) {
      checkpoint();
      dragCheckpointRef.current = true;
    }
    const point = svgPoint(event);
    const positioned = positionHostedMarker(marker, vertices, Math.max(0, point.x));
    setMarkers((current) =>
      current.map((candidate) =>
        candidate.id === marker.id
          ? {
              ...positioned,
              elevationMm: Math.round(Math.max(0, Math.min(height, height - point.y))),
            }
          : candidate,
      ),
    );
  }

  function finishPointerInteraction() {
    if (selectionBox) {
      const boxedIds = hostedMarkerIdsInBox(markers, selectionBox.start, selectionBox.current);
      setSelectedMarkerIds((current) => [...new Set([...current, ...boxedIds])]);
      setSelectionBox(null);
    }
    setActiveVertex(null);
    setActiveMarker(null);
    dragCheckpointRef.current = false;
    panStart.current = null;
  }

  return (
    <section className="cad-shell" aria-label={messages.cadEditor}>
      <header className="cad-commandbar">
        <div className="cad-title">
          <span className="status-chip">{messages.cadEditor}</span>
          <strong>{projectName ?? name}</strong>
          {projectDescription ? <small>{projectDescription}</small> : null}
        </div>
        <div className="cad-mode-switch" aria-label={messages.cadEditor}>
          <button
            type="button"
            className={mode === "2d" ? "is-active" : ""}
            onClick={() => setMode("2d")}
            aria-pressed={mode === "2d"}
          >
            {messages.mode2d}
          </button>
          <button
            type="button"
            className={mode === "3d" ? "is-active" : ""}
            onClick={() => setMode("3d")}
            aria-pressed={mode === "3d"}
          >
            {messages.mode3d}
          </button>
        </div>
        <div className="cad-history-controls">
          <button
            type="button"
            aria-label={messages.undo}
            title={`${messages.undo} · Ctrl+Z`}
            onClick={undo}
            disabled={!historyAvailability.canUndo}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label={messages.redo}
            title={`${messages.redo} · Ctrl+Shift+Z`}
            onClick={redo}
            disabled={!historyAvailability.canRedo}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
        <button
          className="cad-materials-button"
          type="button"
          onClick={openMaterialsDrawer}
          aria-label={messages.materialsAndShopping}
          title={messages.materialsAndShopping}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 6h2l2 9h9l2-6H8M10 20h.01M17 20h.01"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <span>{messages.materialsAndShopping}</span>
        </button>
        <button
          aria-label={messages.electricalCircuits ?? messages.materialsAndShopping}
          aria-busy={generatingElectrical}
          aria-pressed={showElectricalLayer}
          className={showElectricalLayer ? "cad-header-action is-active" : "cad-header-action"}
          disabled={generatingElectrical}
          onClick={() => void toggleElectricalLayer()}
          type="button"
        >
          <span aria-hidden="true">⚡</span>
          <span>{messages.electricalCircuits ?? messages.materialsAndShopping}</span>
        </button>
        <button
          aria-busy={saveState === "saving"}
          aria-label={messages.savePlan}
          className="button cad-save"
          type="button"
          onClick={() => void persistPlan(activeSpaceId)}
          disabled={saveState === "saving"}
        >
          {saveState === "saving" ? <span aria-hidden="true" className="button-spinner" /> : messages.savePlan}
          <span className="sr-only" role="status">
            {saveState === "saving"
              ? messages.savingPlan
              : saveState === "error"
                ? messages.saveFailed
                : activeSpaceId
                  ? messages.planSaved
                  : ""}
          </span>
        </button>
      </header>
      <button
        className="cad-materials-mobile-nav"
        type="button"
        onClick={openMaterialsDrawer}
        aria-label={messages.materialsAndShopping}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6h2l2 9h9l2-6H8M10 20h.01M17 20h.01"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <span>{messages.materialsAndShopping}</span>
      </button>

      <div className="cad-workspace">
        <aside className="cad-tools" aria-label={messages.cadEditor}>
          {(
            [
              "select",
              "draw",
              "door",
              "window",
              "light",
              "switch",
              "socket",
              "cold_water",
              "hot_water",
              "drain",
            ] as const
          ).map((value) => (
            <button
              key={value}
              type="button"
              className={tool === value ? "is-active" : ""}
              onClick={() => {
                setTool(value);
                if (value === "draw") {
                  setDrawingVertices([]);
                  setDrawingError(null);
                }
              }}
              aria-label={toolLabels[value]}
              aria-pressed={tool === value}
              title={toolLabels[value]}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <ToolIcon kind={value} />
              </svg>
              <small>{toolLabels[value]}</small>
            </button>
          ))}
        </aside>

        <div className="cad-stage">
          <div className="cad-stage-meta">
            <span>{area.toFixed(2)} m²</span>
            <span>SNAP 50</span>
            <button
              type="button"
              aria-label={messages.orthogonalConstraint}
              aria-pressed={orthogonalConstraint}
              onClick={() => setOrthogonalConstraint((current) => !current)}
            >
              ORTHO
            </button>
            {drawingVertices ? (
              <>
                <button type="button" onClick={finishContour}>
                  {messages.finishContour}
                </button>
                <button type="button" onClick={cancelDrawing}>
                  {messages.cancelDrawing}
                </button>
              </>
            ) : null}
          </div>
          {mode === "2d" ? (
            <>
              <div className="cad-plan-views" aria-label={messages.viewElevation}>
                {([
                  ["plan", messages.viewTop],
                  ["wall", messages.viewElevation],
                ] as const).map(([view, label]) => (
                  <button
                    aria-pressed={planView === view}
                    className={planView === view ? "is-active" : ""}
                    key={view}
                    onClick={() => selectPlanView(view)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              {planView === "wall" ? (
                <div className="cad-wall-selector" aria-label={messages.viewElevation}>
                  <button
                    aria-label={messages.previousWall}
                    onClick={() =>
                      selectElevationWall(
                        (elevationWallIndex - 1 + vertices.length) % vertices.length,
                      )
                    }
                    type="button"
                  >
                    ‹
                  </button>
                  <div className="cad-wall-tabs">
                    {vertices.map((start, index) => (
                      <button
                        aria-pressed={elevationWallIndex === index}
                        className={elevationWallIndex === index ? "is-active" : ""}
                        key={`wall-tab-${index}`}
                        onClick={() => selectElevationWall(index)}
                        type="button"
                      >
                        <strong>W{index + 1}</strong>
                        <small>{edgeLength(start, vertices[(index + 1) % vertices.length]!)} mm</small>
                      </button>
                    ))}
                  </div>
                  <button
                    aria-label={messages.nextWall}
                    onClick={() => selectElevationWall((elevationWallIndex + 1) % vertices.length)}
                    type="button"
                  >
                    ›
                  </button>
                </div>
              ) : null}
              <div className="cad-view-controls">
                <button type="button" aria-label={messages.zoomIn} onClick={() => zoom(0.82)}>
                  +
                </button>
                <button type="button" aria-label={messages.zoomOut} onClick={() => zoom(1.22)}>
                  −
                </button>
                <button
                  type="button"
                  aria-label={messages.fitPlan}
                  onClick={() => setViewBox(fitViewBox(vertices))}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
              <svg
                className="cad-canvas"
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                onPointerDown={planView === "plan" ? handleCanvasPointerDown : undefined}
                onPointerMove={
                  planView === "plan" ? handlePointerMove : handleElevationPointerMove
                }
                onPointerUp={finishPointerInteraction}
                onPointerLeave={finishPointerInteraction}
                onWheel={handleWheel}
              >
                <defs>
                  <pattern id="minor-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M100 0H0V100" fill="none" stroke="#d8e1dc" strokeWidth="5" />
                  </pattern>
                  <pattern id="major-grid" width="500" height="500" patternUnits="userSpaceOnUse">
                    <rect width="500" height="500" fill="url(#minor-grid)" />
                    <path d="M500 0H0V500" fill="none" stroke="#b8c8c3" strokeWidth="8" />
                  </pattern>
                </defs>
                <rect
                  x={viewBox.x - viewBox.width}
                  y={viewBox.y - viewBox.height}
                  width={viewBox.width * 3}
                  height={viewBox.height * 3}
                  fill="url(#major-grid)"
                />
                <polygon
                  points={vertices.map((point) => `${point.x},${point.y}`).join(" ")}
                  fill={planView === "plan" ? "rgba(244,172,61,.10)" : "transparent"}
                  stroke={planView === "plan" ? "#2a4b4f" : "transparent"}
                  strokeWidth="70"
                  strokeLinejoin="miter"
                />
                {planView === "plan" ? vertices.map((start, index) => {
                  const end = vertices[(index + 1) % vertices.length]!;
                  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
                  return (
                    <g
                      key={`dimension-${index}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${messages.wallSelected} ${index + 1}`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedMarkerIds([]);
                        setSelectedWallIndex(index);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        setSelectedMarkerIds([]);
                        setSelectedWallIndex(index);
                      }}
                    >
                      <rect
                        x={midpoint.x - 210}
                        y={midpoint.y - 85}
                        width="420"
                        height="170"
                        rx="50"
                        fill="#fff"
                        stroke="#f4ac3d"
                        strokeWidth="14"
                      />
                      <text
                        x={midpoint.x}
                        y={midpoint.y + 28}
                        textAnchor="middle"
                        fontSize="95"
                        fontWeight="800"
                      >
                        {edgeLength(start, end)} mm
                      </text>
                    </g>
                  );
                }) : (
                  <g pointerEvents="none">
                    <rect
                      x={viewBox.x}
                      y={viewBox.y}
                      width={viewBox.width}
                      height={viewBox.height}
                      fill="#f9f8f4"
                    />
                    <line
                      x1={viewBox.x}
                      x2={viewBox.x + viewBox.width}
                      y1={height}
                      y2={height}
                      stroke="#2a4b4f"
                      strokeWidth="45"
                    />
                    <line
                      x1={viewBox.x}
                      x2={viewBox.x + viewBox.width}
                      y1={0}
                      y2={0}
                      stroke="#8a9a9c"
                      strokeDasharray="100 55"
                      strokeWidth="22"
                    />
                  </g>
                )}
                {planView === "plan" ? markers.map((marker) => (
                  <g
                    key={marker.id}
                    onPointerDown={(event) => {
                      if (tool !== "select") return;
                      event.stopPropagation();
                      setSelectedMarkerIds((current) =>
                        event.shiftKey
                          ? current.includes(marker.id)
                            ? current.filter((id) => id !== marker.id)
                            : [...current, marker.id]
                          : [marker.id],
                      );
                      setSelectedWallIndex(null);
                      setActiveMarker(marker.id);
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                  >
                    <CadSymbol
                      marker={marker}
                      vertices={vertices}
                      selected={selectedMarkerIds.includes(marker.id)}
                    />
                  </g>
                )) : electricalLayout.terminals.map((terminal) => {
                  const marker = markers.find((candidate) => candidate.id === terminal.id);
                  if (!marker) return null;
                  if (marker.kind !== "light" && marker.wallIndex !== elevationWallIndex) return null;
                  const point = projectPointToWall(
                    { x: terminal.point.x, y: terminal.point.y, z: terminal.elevationMm },
                    vertices,
                    elevationWallIndex,
                    height,
                  );
                  return (
                    <g
                      key={terminal.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${toolLabels[marker.kind]} · ${terminal.elevationMm} mm`}
                      transform={`translate(${point.x} ${point.y})`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedMarkerIds([terminal.id]);
                        setSelectedWallIndex(null);
                        if (marker.kind !== "light") {
                          setActiveMarker(terminal.id);
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }
                      }}
                    >
                      <circle
                        r={selectedMarkerIds.includes(terminal.id) ? 88 : 68}
                        fill="#fff"
                        stroke={selectedMarkerIds.includes(terminal.id) ? "#f4ac3d" : "#2a4b4f"}
                        strokeWidth="24"
                      />
                      <text x="95" y="-25" fontSize="82" fontWeight="800" fill="#1c3133">
                        {toolLabels[marker.kind]}
                      </text>
                      <text x="95" y="70" fontSize="72" fill="#687d7f">
                        {terminal.elevationMm} mm
                      </text>
                    </g>
                  );
                })}
                {showElectricalLayer
                  ? visibleElectricalRoutes.map((route) => (
                        <g key={route.id} pointerEvents="none">
                          <polyline
                            points={route.path.map((point) => `${point.x},${point.y}`).join(" ")}
                            fill="none"
                            stroke={route.color ?? electricalWireColors[route.role as keyof typeof electricalWireColors] ?? "#f4ac3d"}
                            strokeDasharray={route.dashPattern ?? (route.role === "switch_return" ? "110 50" : undefined)}
                            strokeDashoffset={route.dashOffset}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="42"
                          />
                          {route.path.map((point, index) => (
                            <circle
                              key={index}
                              cx={point.x}
                              cy={point.y}
                              fill="#fff"
                              r="45"
                              stroke={route.color ?? electricalWireColors[route.role as keyof typeof electricalWireColors] ?? "#f4ac3d"}
                              strokeWidth="16"
                            />
                          ))}
                        </g>
                      ))
                  : null}
                {showElectricalLayer
                  ? electricalLayout.junctionBoxes.map((box) => {
                      const point = projectElectricalPoint(
                        { x: box.point.x, y: box.point.y, z: box.elevationMm },
                        "plan",
                        height,
                      );
                      const displayedPoint =
                        planView === "plan"
                          ? point
                          : projectPointToWall(
                              { x: box.point.x, y: box.point.y, z: box.elevationMm },
                              vertices,
                              elevationWallIndex,
                              height,
                            );
                      return (
                        <g key={box.id} pointerEvents="none" transform={`translate(${displayedPoint.x} ${displayedPoint.y})`}>
                          <rect
                            x="-82"
                            y="-82"
                            width="164"
                            height="164"
                            rx="24"
                            fill="#fff"
                            stroke="#f4ac3d"
                            strokeWidth="28"
                          />
                          <text x="0" y="24" textAnchor="middle" fontSize="74" fontWeight="900" fill="#1c3133">
                            {box.circuitCode}
                          </text>
                        </g>
                      );
                    })
                  : null}
                {drawingVertices?.length ? (
                  <polyline
                    points={drawingVertices.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="rgba(244,172,61,.08)"
                    stroke="#f4ac3d"
                    strokeWidth="55"
                    strokeDasharray="120 65"
                    pointerEvents="none"
                  />
                ) : null}
                {selectionBox ? (
                  <rect
                    x={Math.min(selectionBox.start.x, selectionBox.current.x)}
                    y={Math.min(selectionBox.start.y, selectionBox.current.y)}
                    width={Math.abs(selectionBox.current.x - selectionBox.start.x)}
                    height={Math.abs(selectionBox.current.y - selectionBox.start.y)}
                    fill="rgba(244,172,61,.16)"
                    stroke="#f4ac3d"
                    strokeWidth="24"
                    strokeDasharray="90 50"
                    pointerEvents="none"
                  />
                ) : null}
                {tool === "select" &&
                  vertices.map((point, index) => (
                    <circle
                      key={`vertex-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="100"
                      fill={activeVertex === index ? "#f4ac3d" : "#fff"}
                      stroke="#2a4b4f"
                      strokeWidth="35"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedMarkerIds([]);
                        setSelectedWallIndex(null);
                        setActiveVertex(index);
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                    />
                  ))}
              </svg>
            </>
          ) : (
            <Plan3D
              vertices={vertices}
              height={height}
              markers={markers}
              markerLabels={toolLabels}
              label={messages.mode3d}
              selectedMarkerIds={selectedMarkerIds}
              onSelectMarker={(markerId) => {
                setSelectedMarkerIds([markerId]);
                setSelectedWallIndex(null);
              }}
              onStartMarkerMove={checkpoint}
              onMoveMarker={(markerId, offsetMm, elevationMm) => {
                setMarkers((current) =>
                  current.map((marker) =>
                    marker.id === markerId
                      ? {
                          ...positionHostedMarker(marker, vertices, offsetMm),
                          elevationMm: Math.round(elevationMm),
                        }
                      : marker,
                  ),
                );
              }}
              viewLabels={{
                top: messages.viewTop,
                front: messages.viewFront,
                right: messages.viewRight,
                elevation: messages.viewElevation,
                iso: messages.viewIso,
                walk: messages.viewWalk,
                fit: messages.fit3d,
                orbitHelp: messages.orbitHelp,
                walkHelp: messages.walkHelp,
                previousWall: messages.previousWall,
                nextWall: messages.nextWall,
                moveForward: messages.moveForward,
                moveBackward: messages.moveBackward,
                turnLeft: messages.turnLeft,
                turnRight: messages.turnRight,
              }}
            />
          )}
        </div>

        <aside className="cad-inspector">
          {drawingError ? (
            <p className="cad-drawing-error" role="alert">
              {drawingError}
            </p>
          ) : null}
          {selectedMarkerIds.length > 1 ? (
            <div className="cad-inspector-section">
              <span className="status-chip">{messages.selectedComponents}</span>
              <div className="cad-selected-heading">
                <strong>{selectedMarkerIds.length}</strong>
                <span>{messages.selectedComponents}</span>
              </div>
              <div className="cad-selection-actions">
                <button type="button" onClick={copySelectedComponents}>
                  {messages.copyComponents}
                </button>
                <button type="button" onClick={duplicateSelectedComponents}>
                  {messages.duplicateComponents}
                </button>
                <button type="button" onClick={pasteComponents} disabled={!hasComponentClipboard}>
                  {messages.pasteComponents}
                </button>
                <button type="button" onClick={distributeSelectedComponents}>
                  {messages.distributeComponents}
                </button>
              </div>
              <button
                className="cad-delete-component"
                type="button"
                onClick={() => {
                  checkpoint();
                  setMarkers((current) =>
                    current.filter((marker) => !selectedMarkerIds.includes(marker.id)),
                  );
                  setSelectedMarkerIds([]);
                }}
              >
                {messages.deleteSelectedComponents}
              </button>
            </div>
          ) : selected ? (
            <div className="cad-inspector-section">
              <span className="status-chip">{messages.selectedComponent}</span>
              <div className="cad-selected-heading">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <ToolIcon kind={selected.kind} />
                </svg>
                <strong>{toolLabels[selected.kind]}</strong>
              </div>
              <div className="cad-selection-actions">
                <button type="button" onClick={copySelectedComponents}>
                  {messages.copyComponents}
                </button>
                <button type="button" onClick={duplicateSelectedComponents}>
                  {messages.duplicateComponents}
                </button>
                <button type="button" onClick={pasteComponents} disabled={!hasComponentClipboard}>
                  {messages.pasteComponents}
                </button>
              </div>
              {selected.kind === "light" ||
              selected.kind === "switch" ||
              selected.kind === "socket" ? (
                <label>
                  {messages.componentVariant}
                  <select
                    aria-label={messages.componentVariant}
                    value={selected.variant}
                    onFocus={checkpoint}
                    onChange={(event) => updateSelected({ variant: event.target.value })}
                  >
                    {(selected.kind === "light"
                      ? [
                          ["ceiling", messages.variantCeiling],
                          ["wall", messages.variantWall],
                          ["recessed", messages.variantRecessed],
                          ["pendant", messages.variantPendant],
                        ]
                      : selected.kind === "switch"
                        ? [
                            ["single", messages.variantSingle],
                            ["double", messages.variantDouble],
                            ["dimmer", messages.variantDimmer],
                            ["two_way", messages.variantTwoWay],
                          ]
                        : [
                            ["single", messages.variantSingle],
                            ["double", messages.variantDouble],
                            ["usb", messages.variantUsb],
                          ]
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                {messages.componentWidthMm}
                <input
                  aria-label={messages.componentWidthMm}
                  type="number"
                  inputMode="numeric"
                  min="20"
                  max="20000"
                  step="10"
                  value={selected.widthMm}
                  onFocus={checkpoint}
                  onChange={(event) => updateSelected({ widthMm: Number(event.target.value) })}
                />
              </label>
              <label>
                {messages.componentHeightMm}
                <input
                  aria-label={messages.componentHeightMm}
                  type="number"
                  inputMode="numeric"
                  min="20"
                  max="20000"
                  step="10"
                  value={selected.heightMm}
                  onFocus={checkpoint}
                  onChange={(event) => updateSelected({ heightMm: Number(event.target.value) })}
                />
              </label>
              <label>
                {messages.componentElevationMm}
                <input
                  aria-label={messages.componentElevationMm}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={height}
                  step="10"
                  value={selected.elevationMm}
                  onFocus={checkpoint}
                  onChange={(event) => updateSelected({ elevationMm: Number(event.target.value) })}
                />
              </label>
              <label>
                {messages.componentPositionMm}
                <input
                  aria-label={messages.componentPositionMm}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="10"
                  value={hostedMarkerOffsetMm(selected, vertices)}
                  onFocus={checkpoint}
                  onChange={(event) => {
                    const positioned = positionHostedMarker(
                      selected,
                      vertices,
                      Number(event.target.value),
                    );
                    setMarkers((current) =>
                      current.map((marker) => (marker.id === selected.id ? positioned : marker)),
                    );
                  }}
                />
              </label>
              <button
                className="cad-delete-component"
                type="button"
                onClick={() => {
                  checkpoint();
                  setMarkers((current) => current.filter((marker) => marker.id !== selected.id));
                  setSelectedMarkerIds([]);
                }}
              >
                {messages.deleteComponent}
              </button>
            </div>
          ) : selectedWallIndex !== null ? (
            <div className="cad-inspector-section">
              <span className="status-chip">{messages.wallSelected}</span>
              <div className="cad-selected-heading">
                <strong>W{selectedWallIndex + 1}</strong>
              </div>
              <label>
                {messages.wallLengthMm}
                <input
                  aria-label={messages.wallLengthMm}
                  type="number"
                  inputMode="numeric"
                  min="100"
                  max="100000"
                  step="10"
                  value={edgeLength(
                    vertices[selectedWallIndex]!,
                    vertices[(selectedWallIndex + 1) % vertices.length]!,
                  )}
                  onFocus={checkpoint}
                  onChange={(event) => {
                    const nextVertices = resizeWall(
                      vertices,
                      selectedWallIndex,
                      Number(event.target.value),
                    );
                    setVertices(nextVertices);
                    setMarkers((current) =>
                      reprojectHostedMarkers(current, vertices, nextVertices),
                    );
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="cad-inspector-section">
              <span className="status-chip">{messages.planCoordinates}</span>
              <label>
                {messages.spaceName}
                <input
                  value={name}
                  onFocus={checkpoint}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                {messages.spaceHeightMm}
                <input
                  aria-label={messages.spaceHeightMm}
                  type="number"
                  inputMode="numeric"
                  min="100"
                  max="20000"
                  step="50"
                  value={height}
                  onFocus={checkpoint}
                  onChange={(event) => setHeight(Number(event.target.value))}
                />
              </label>
              <label>
                {messages.spaceName}
                <select
                  value={kind}
                  onFocus={checkpoint}
                  onChange={(event) => setKind(event.target.value as SpaceKind)}
                >
                  <option value="bathroom">{messages.bathroom}</option>
                  <option value="kitchen">{messages.kitchen}</option>
                  <option value="bedroom">{messages.bedroom}</option>
                  <option value="living_room">{messages.livingRoom}</option>
                  <option value="hallway">{messages.hallway}</option>
                  <option value="other">{messages.other}</option>
                </select>
              </label>
              <div className="cad-template-grid">
                <button type="button" onClick={() => applyTemplate("rectangle")}>
                  {messages.rectangleShape}
                </button>
                <button type="button" onClick={() => applyTemplate("l_shape")}>
                  {messages.lShape}
                </button>
                <button type="button" onClick={() => applyTemplate("u_shape")}>
                  {messages.uShape}
                </button>
              </div>
            </div>
          )}
          <div className="cad-inspector-section">
            <span className="status-chip">{messages.planObjects}</span>
            {markers.length ? (
              <ul className="cad-object-list">
                {markers.map((marker) => (
                  <li
                    key={marker.id}
                    className={selectedMarkerIds.includes(marker.id) ? "is-active" : ""}
                  >
                    <button
                      type="button"
                      onClick={(event) =>
                        setSelectedMarkerIds((current) =>
                          event.shiftKey
                            ? current.includes(marker.id)
                              ? current.filter((id) => id !== marker.id)
                              : [...current, marker.id]
                            : [marker.id],
                        )
                      }
                      aria-label={toolLabels[marker.kind]}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <ToolIcon kind={marker.kind} />
                      </svg>
                      <span>
                        <strong>{toolLabels[marker.kind]}</strong>
                        <small>
                          W{marker.wallIndex + 1} · {marker.elevationMm} mm
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{messages.noPlanObjects}</p>
            )}
          </div>
          {spaces.length ? (
            <div className="cad-inspector-section">
              <span className="status-chip">{messages.savedSpaces}</span>
              <div className="cad-saved-spaces">
                {spaces.map((space) => (
                  <button type="button" key={space.id} onClick={() => loadSpace(space)}>
                    <strong>{space.name}</strong>
                    <small>{space.clearHeightMm} mm</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
