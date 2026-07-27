"use client";

import type { BuildingElement, BuildingSpace, Point2Mm, SpaceKind } from "@obrametrik/domain";
import React from "react";
import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createCadSpace } from "../app/[locale]/dashboard/projects/[projectId]/actions";

type ComponentKind =
  "door" | "window" | "light" | "switch" | "socket" | "cold_water" | "hot_water" | "drain";
type Tool = "select" | ComponentKind;
type Template = "rectangle" | "l_shape" | "u_shape";
type ViewBox = { x: number; y: number; width: number; height: number };
type Marker = {
  id: string;
  kind: ComponentKind;
  point: Point2Mm;
  wallIndex: number;
  widthMm: number;
  heightMm: number;
  elevationMm: number;
};

type CadMessages = {
  cadEditor: string;
  cadEditorHelp: string;
  mode2d: string;
  mode3d: string;
  selectTool: string;
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
  deleteComponent: string;
  selectedComponent: string;
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
  millimetresUnit: string;
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

function ToolIcon({ kind }: { kind: Tool }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  if (kind === "select") return <path {...common} d="m5 3 10 9-5 .8 2.5 5.2-2 1-2.5-5.2-3 3Z" />;
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

function Plan3D({
  vertices,
  height,
  markers,
  label,
}: {
  vertices: readonly Point2Mm[];
  height: number;
  markers: readonly Marker[];
  label: string;
}) {
  const bounds = fitViewBox(vertices);
  const extent = Math.max(bounds.width, bounds.height, height);
  const scale = 300 / Math.max(extent, 1);
  const project = (point: Point2Mm, z = 0) => ({
    x: 400 + (point.x - bounds.x - (point.y - bounds.y)) * scale * 0.72,
    y: 390 + (point.x - bounds.x + (point.y - bounds.y)) * scale * 0.36 - z * scale,
  });
  const points = (items: readonly { x: number; y: number }[]) =>
    items.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <svg className="cad-3d" viewBox="0 0 800 560" role="img" aria-label={label}>
      <polygon
        points={points(vertices.map((point) => project(point)))}
        fill="#dfe7e2"
        stroke="#2a4b4f"
        strokeWidth="5"
      />
      {vertices.map((start, index) => {
        const end = vertices[(index + 1) % vertices.length]!;
        return (
          <polygon
            key={`${start.x}-${start.y}`}
            points={points([
              project(start),
              project(end),
              project(end, height),
              project(start, height),
            ])}
            fill={index % 2 ? "rgba(42,75,79,.14)" : "rgba(244,172,61,.13)"}
            stroke="#2a4b4f"
            strokeWidth="3"
          />
        );
      })}
      {markers.map((marker) => {
        const point = project(marker.point, marker.elevationMm);
        return (
          <g key={marker.id} transform={`translate(${point.x} ${point.y})`}>
            <circle r="14" fill="#fff" stroke="#1c3133" strokeWidth="2" />
            <g transform="translate(-10 -10)" color="#1c3133">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <ToolIcon kind={marker.kind} />
              </svg>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export function CadWorkspace({
  locale,
  projectId,
  projectName,
  projectDescription,
  spaces,
  elements,
  messages,
}: {
  locale: string;
  projectId: string;
  projectName?: string;
  projectDescription?: string | null;
  spaces: readonly BuildingSpace[];
  elements: readonly BuildingElement[];
  messages: CadMessages;
}) {
  const [vertices, setVertices] = useState<readonly Point2Mm[]>(templates.rectangle);
  const [viewBox, setViewBox] = useState<ViewBox>(() => fitViewBox(templates.rectangle));
  const [height, setHeight] = useState(2500);
  const [name, setName] = useState(messages.unsavedPlan);
  const [kind, setKind] = useState<SpaceKind>("bathroom");
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [tool, setTool] = useState<Tool>("select");
  const [activeVertex, setActiveVertex] = useState<number | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [markers, setMarkers] = useState<readonly Marker[]>([]);
  const panStart = useRef<{ x: number; y: number; viewBox: ViewBox } | null>(null);
  const area = useMemo(() => polygonArea(vertices), [vertices]);
  const selected = markers.find((marker) => marker.id === selectedMarker);
  const toolLabels: Record<Tool, string> = {
    select: messages.selectTool,
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
      widthMm: marker.widthMm,
      heightMm: marker.heightMm,
      elevationMm: marker.elevationMm,
    })),
  });

  function applyTemplate(template: Template) {
    const next = templates[template].map((point) => ({ ...point }));
    setVertices(next);
    setViewBox(fitViewBox(next));
    setMarkers([]);
    setSelectedMarker(null);
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
    setSelectedMarker(null);
    setMarkers(
      elements
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
                typeof host?.specification.wallIndex === "number"
                  ? host.specification.wallIndex
                  : 0,
              widthMm: element.dimensionsMm.width,
              heightMm: element.dimensionsMm.height,
              elevationMm: element.transform.position.z,
            },
          ];
        }),
    );
  }

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
    if (tool !== "select") {
      const nearest = closestWall(vertices, svgPoint(event), defaults[tool].widthMm);
      const marker: Marker = {
        id: crypto.randomUUID(),
        kind: tool,
        point: { x: Math.round(nearest.point.x), y: Math.round(nearest.point.y) },
        wallIndex: nearest.wallIndex,
        ...defaults[tool],
      };
      setMarkers((current) => [...current, marker]);
      setSelectedMarker(marker.id);
      setTool("select");
      return;
    }
    setSelectedMarker(null);
    panStart.current = { x: event.clientX, y: event.clientY, viewBox };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (activeVertex !== null) {
      const point = svgPoint(event);
      setVertices((current) =>
        current.map((vertex, index) => (index === activeVertex ? point : vertex)),
      );
      return;
    }
    if (activeMarker) {
      const active = markers.find((marker) => marker.id === activeMarker);
      const nearest = closestWall(vertices, svgPoint(event), active?.widthMm ?? 0);
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

  function finishPointerInteraction() {
    setActiveVertex(null);
    setActiveMarker(null);
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
        <form action={createCadSpace}>
          <input name="locale" type="hidden" value={locale} />
          <input name="projectId" type="hidden" value={projectId} />
          <input name="plan" type="hidden" value={serialized} />
          <button className="button cad-save" type="submit">
            {messages.savePlan}
          </button>
        </form>
      </header>

      <div className="cad-workspace">
        <aside className="cad-tools" aria-label={messages.cadEditor}>
          {(
            [
              "select",
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
              onClick={() => setTool(value)}
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
          </div>
          {mode === "2d" ? (
            <>
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
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handlePointerMove}
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
                  fill="rgba(244,172,61,.10)"
                  stroke="#2a4b4f"
                  strokeWidth="70"
                  strokeLinejoin="miter"
                />
                {vertices.map((start, index) => {
                  const end = vertices[(index + 1) % vertices.length]!;
                  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
                  return (
                    <g key={`dimension-${index}`} pointerEvents="none">
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
                })}
                {markers.map((marker) => (
                  <g
                    key={marker.id}
                    onPointerDown={(event) => {
                      if (tool !== "select") return;
                      event.stopPropagation();
                      setSelectedMarker(marker.id);
                      setActiveMarker(marker.id);
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                  >
                    <CadSymbol
                      marker={marker}
                      vertices={vertices}
                      selected={marker.id === selectedMarker}
                    />
                  </g>
                ))}
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
                        setSelectedMarker(null);
                        setActiveVertex(index);
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                    />
                  ))}
              </svg>
            </>
          ) : (
            <Plan3D vertices={vertices} height={height} markers={markers} label={messages.mode3d} />
          )}
        </div>

        <aside className="cad-inspector">
          {selected ? (
            <div className="cad-inspector-section">
              <span className="status-chip">{messages.selectedComponent}</span>
              <div className="cad-selected-heading">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <ToolIcon kind={selected.kind} />
                </svg>
                <strong>{toolLabels[selected.kind]}</strong>
              </div>
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
                  onChange={(event) => updateSelected({ elevationMm: Number(event.target.value) })}
                />
              </label>
              <button
                className="cad-delete-component"
                type="button"
                onClick={() => {
                  setMarkers((current) => current.filter((marker) => marker.id !== selected.id));
                  setSelectedMarker(null);
                }}
              >
                {messages.deleteComponent}
              </button>
            </div>
          ) : (
            <div className="cad-inspector-section">
              <span className="status-chip">{messages.planCoordinates}</span>
              <label>
                {messages.spaceName}
                <input value={name} onChange={(event) => setName(event.target.value)} />
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
                  onChange={(event) => setHeight(Number(event.target.value))}
                />
              </label>
              <label>
                {messages.spaceName}
                <select value={kind} onChange={(event) => setKind(event.target.value as SpaceKind)}>
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
                  <li key={marker.id} className={marker.id === selectedMarker ? "is-active" : ""}>
                    <button
                      type="button"
                      onClick={() => setSelectedMarker(marker.id)}
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
