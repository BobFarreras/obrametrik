import {
  defaultCadComponentVariant,
  isCadComponentVariant,
  type CadComponentKind,
  type CadComponentVariant,
  type CadPlanDraft,
  type CadPlacementSurface,
  type DoorSwing,
} from "@obrametrik/application";
import type { BuildingElement, BuildingSpace, Point2Mm, SpaceKind } from "@obrametrik/domain";

export type MobileCadMarker = {
  id: string;
  kind: CadComponentKind;
  point: Point2Mm;
  wallIndex: number;
  placementSurface?: CadPlacementSurface;
  widthMm: number;
  heightMm: number;
  elevationMm: number;
  swing?: DoorSwing;
  variant: CadComponentVariant;
};

export type MobileCadDocument = {
  spaceId?: string;
  name: string;
  kind: SpaceKind;
  vertices: readonly Point2Mm[];
  clearHeightMm: number;
  markers: readonly MobileCadMarker[];
};

export const componentDefaults: Record<
  CadComponentKind,
  Pick<MobileCadMarker, "widthMm" | "heightMm" | "elevationMm">
> = {
  door: { widthMm: 900, heightMm: 2100, elevationMm: 0 },
  window: { widthMm: 1200, heightMm: 1000, elevationMm: 1000 },
  light: { widthMm: 100, heightMm: 100, elevationMm: 2300 },
  switch: { widthMm: 80, heightMm: 80, elevationMm: 1100 },
  socket: { widthMm: 80, heightMm: 80, elevationMm: 350 },
  cold_water: { widthMm: 80, heightMm: 80, elevationMm: 600 },
  hot_water: { widthMm: 80, heightMm: 80, elevationMm: 600 },
  drain: { widthMm: 110, heightMm: 110, elevationMm: 150 },
};

export const cadTemplates = {
  rectangle: (widthMm: number, depthMm: number): readonly Point2Mm[] => [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
    { x: widthMm, y: depthMm },
    { x: 0, y: depthMm },
  ],
  l_shape: (widthMm: number, depthMm: number): readonly Point2Mm[] => [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
    { x: widthMm, y: Math.round(depthMm * 0.45) },
    { x: Math.round(widthMm * 0.52), y: Math.round(depthMm * 0.45) },
    { x: Math.round(widthMm * 0.52), y: depthMm },
    { x: 0, y: depthMm },
  ],
  u_shape: (widthMm: number, depthMm: number): readonly Point2Mm[] => [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
    { x: widthMm, y: depthMm },
    { x: Math.round(widthMm * 0.72), y: depthMm },
    { x: Math.round(widthMm * 0.72), y: Math.round(depthMm * 0.45) },
    { x: Math.round(widthMm * 0.28), y: Math.round(depthMm * 0.45) },
    { x: Math.round(widthMm * 0.28), y: depthMm },
    { x: 0, y: depthMm },
  ],
} as const;

export function closestWallPoint(
  vertices: readonly Point2Mm[],
  point: Point2Mm,
  componentWidthMm: number,
): { point: Point2Mm; wallIndex: number } {
  let best = { point: vertices[0] ?? { x: 0, y: 0 }, wallIndex: 0, distance: Infinity };
  vertices.forEach((start, wallIndex) => {
    const end = vertices[(wallIndex + 1) % vertices.length]!;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const raw = lengthSquared
      ? ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
      : 0;
    const margin = Math.min(0.49, componentWidthMm / 2 / Math.max(Math.sqrt(lengthSquared), 1));
    const ratio = Math.max(margin, Math.min(1 - margin, raw));
    const projected = { x: Math.round(start.x + dx * ratio), y: Math.round(start.y + dy * ratio) };
    const distance = Math.hypot(point.x - projected.x, point.y - projected.y);
    if (distance < best.distance) best = { point: projected, wallIndex, distance };
  });
  return { point: best.point, wallIndex: best.wallIndex };
}

/**
 * Moves one corner and extends its two neighbours on their existing axes.
 * This preserves the orthogonal CAD invariant without exposing coordinates
 * for every connected vertex in the mobile UI.
 */
export function moveOrthogonalVertex(
  vertices: readonly Point2Mm[],
  vertexIndex: number,
  point: Point2Mm,
): readonly Point2Mm[] {
  if (vertices.length < 4 || vertexIndex < 0 || vertexIndex >= vertices.length) return vertices;
  const previousIndex = (vertexIndex - 1 + vertices.length) % vertices.length;
  const nextIndex = (vertexIndex + 1) % vertices.length;
  const current = vertices[vertexIndex]!;
  const previous = vertices[previousIndex]!;
  const next = vertices[nextIndex]!;
  const moved = { x: Math.round(point.x), y: Math.round(point.y) };
  const result = vertices.map((vertex) => ({ ...vertex }));
  result[vertexIndex] = moved;
  result[previousIndex] =
    previous.x === current.x ? { ...previous, x: moved.x } : { ...previous, y: moved.y };
  result[nextIndex] = next.x === current.x ? { ...next, x: moved.x } : { ...next, y: moved.y };
  return result;
}

export function moveVertex(
  vertices: readonly Point2Mm[],
  vertexIndex: number,
  point: Point2Mm,
  orthogonal: boolean,
): readonly Point2Mm[] {
  if (orthogonal) return moveOrthogonalVertex(vertices, vertexIndex, point);
  if (!vertices[vertexIndex]) return vertices;
  return vertices.map((vertex, index) =>
    index === vertexIndex ? { x: Math.round(point.x), y: Math.round(point.y) } : vertex,
  );
}

export function edgeLengthMm(start: Point2Mm, end: Point2Mm): number {
  return Math.round(Math.hypot(end.x - start.x, end.y - start.y));
}

export function openingClearancesMm(
  marker: MobileCadMarker,
  vertices: readonly Point2Mm[],
): { beforeMm: number; afterMm: number } {
  const start = vertices[marker.wallIndex];
  const end = vertices[(marker.wallIndex + 1) % vertices.length];
  if (!start || !end) return { beforeMm: 0, afterMm: 0 };
  const wallLength = edgeLengthMm(start, end);
  if (!wallLength) return { beforeMm: 0, afterMm: 0 };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const centerOffset =
    ((marker.point.x - start.x) * dx + (marker.point.y - start.y) * dy) / wallLength;
  return {
    beforeMm: Math.max(0, Math.round(centerOffset - marker.widthMm / 2)),
    afterMm: Math.max(0, Math.round(wallLength - centerOffset - marker.widthMm / 2)),
  };
}

export function moveWall(
  vertices: readonly Point2Mm[],
  wallIndex: number,
  delta: Point2Mm,
): readonly Point2Mm[] {
  const endIndex = (wallIndex + 1) % vertices.length;
  if (!vertices[wallIndex] || !vertices[endIndex]) return vertices;
  return vertices.map((vertex, index) =>
    index === wallIndex || index === endIndex
      ? { x: Math.round(vertex.x + delta.x), y: Math.round(vertex.y + delta.y) }
      : vertex,
  );
}

export function resizeWall(
  vertices: readonly Point2Mm[],
  wallIndex: number,
  lengthMm: number,
): readonly Point2Mm[] {
  const start = vertices[wallIndex];
  const endIndex = (wallIndex + 1) % vertices.length;
  const end = vertices[endIndex];
  if (!start || !end || !Number.isFinite(lengthMm) || lengthMm < 100) return vertices;
  const currentLength = Math.hypot(end.x - start.x, end.y - start.y);
  if (!currentLength) return vertices;
  const nextEnd = {
    x: Math.round(start.x + ((end.x - start.x) / currentLength) * lengthMm),
    y: Math.round(start.y + ((end.y - start.y) / currentLength) * lengthMm),
  };
  return vertices.map((vertex, index) => (index === endIndex ? nextEnd : vertex));
}

function wallPositionRatio(point: Point2Mm, start: Point2Mm, end: Point2Mm): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const squaredLength = dx * dx + dy * dy;
  if (!squaredLength) return 0.5;
  return Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / squaredLength),
  );
}

export function reprojectHostedMarkers(
  markers: readonly MobileCadMarker[],
  previousVertices: readonly Point2Mm[],
  nextVertices: readonly Point2Mm[],
): readonly MobileCadMarker[] {
  return markers.map((marker) => {
    const previousStart = previousVertices[marker.wallIndex];
    const previousEnd = previousVertices[(marker.wallIndex + 1) % previousVertices.length];
    const nextStart = nextVertices[marker.wallIndex];
    const nextEnd = nextVertices[(marker.wallIndex + 1) % nextVertices.length];
    if (!previousStart || !previousEnd || !nextStart || !nextEnd) return marker;
    const nextLength = edgeLengthMm(nextStart, nextEnd);
    const edgeRatio = marker.widthMm / 2 / Math.max(nextLength, 1);
    const ratio = Math.max(
      marker.kind === "door" || marker.kind === "window" ? Math.min(0.5, edgeRatio) : 0,
      Math.min(
        marker.kind === "door" || marker.kind === "window" ? 1 - Math.min(0.5, edgeRatio) : 1,
        wallPositionRatio(marker.point, previousStart, previousEnd),
      ),
    );
    return {
      ...marker,
      point: {
        x: Math.round(nextStart.x + (nextEnd.x - nextStart.x) * ratio),
        y: Math.round(nextStart.y + (nextEnd.y - nextStart.y) * ratio),
      },
    };
  });
}

export function verticesFromSpace(space: BuildingSpace): readonly Point2Mm[] {
  if (space.footprint.kind === "polygon") return space.footprint.vertices;
  return cadTemplates.rectangle(space.footprint.widthMm, space.footprint.depthMm);
}

export function documentFromBuildingModel(
  space: BuildingSpace,
  elements: readonly BuildingElement[],
): MobileCadDocument {
  const markers = elements
    .filter((element) => element.spaceId === space.id && element.kind !== "wall")
    .flatMap((element): MobileCadMarker[] => {
      const terminalKind = element.specification.terminalKind;
      const kind =
        element.kind === "door" || element.kind === "window"
          ? element.kind
          : typeof terminalKind === "string" && terminalKind in componentDefaults
            ? (terminalKind as CadComponentKind)
            : null;
      if (!kind) return [];
      const host = elements.find((candidate) => candidate.id === element.hostElementId);
      return [
        {
          id: element.id,
          kind,
          point: { x: element.transform.position.x, y: element.transform.position.y },
          wallIndex:
            typeof host?.specification.wallIndex === "number" ? host.specification.wallIndex : 0,
          widthMm: element.dimensionsMm.width,
          heightMm: element.dimensionsMm.height,
          elevationMm: kind === "light" ? space.clearHeightMm : element.transform.position.z,
          variant: isCadComponentVariant(kind, element.specification.componentVariant)
            ? element.specification.componentVariant
            : defaultCadComponentVariant(kind),
          placementSurface:
            kind === "light"
              ? "ceiling"
              : element.specification.placementSurface === "ceiling" ||
            element.specification.placementSurface === "floor"
              ? element.specification.placementSurface
              : "wall",
          swing:
            kind === "door" &&
            (element.specification.doorSwing === "left_in" ||
              element.specification.doorSwing === "right_in" ||
              element.specification.doorSwing === "left_out" ||
              element.specification.doorSwing === "right_out")
              ? element.specification.doorSwing
              : kind === "door"
                ? "left_in"
                : undefined,
        },
      ];
    });
  return {
    spaceId: space.id,
    name: space.name,
    kind: space.kind,
    vertices: verticesFromSpace(space),
    clearHeightMm: space.clearHeightMm,
    markers,
  };
}

export function documentForSpaceId(
  spaces: readonly BuildingSpace[],
  elements: readonly BuildingElement[],
  spaceId: string,
): MobileCadDocument {
  const space = spaces.find((candidate) => candidate.id === spaceId);
  if (!space) throw new Error("Requested CAD space is not available");
  return documentFromBuildingModel(space, elements);
}

export function toCadPlan(projectId: string, document: MobileCadDocument): CadPlanDraft {
  return {
    projectId,
    name: document.name,
    kind: document.kind,
    vertices: document.vertices,
    clearHeightMm: document.clearHeightMm,
    components: document.markers.map(
      ({
        kind,
        point,
        wallIndex,
        placementSurface,
        widthMm,
        heightMm,
        elevationMm,
        swing,
        variant,
      }) => ({
        kind,
        point,
        wallIndex,
        placementSurface: placementSurface ?? (kind === "light" ? "ceiling" : "wall"),
        widthMm,
        heightMm,
        elevationMm,
        swing,
        variant,
      }),
    ),
  };
}
