import type { CadComponentKind, CadPlanDraft } from "@obrametrik/application";
import type { BuildingElement, BuildingSpace, Point2Mm, SpaceKind } from "@obrametrik/domain";

export type MobileCadMarker = {
  id: string;
  kind: CadComponentKind;
  point: Point2Mm;
  wallIndex: number;
  widthMm: number;
  heightMm: number;
  elevationMm: number;
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
    const raw = lengthSquared ? ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared : 0;
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
  result[nextIndex] =
    next.x === current.x ? { ...next, x: moved.x } : { ...next, y: moved.y };
  return result;
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
      return [{
        id: element.id,
        kind,
        point: { x: element.transform.position.x, y: element.transform.position.y },
        wallIndex: typeof host?.specification.wallIndex === "number" ? host.specification.wallIndex : 0,
        widthMm: element.dimensionsMm.width,
        heightMm: element.dimensionsMm.height,
        elevationMm: element.transform.position.z,
      }];
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
    components: document.markers.map(({ kind, point, wallIndex, widthMm, heightMm, elevationMm }) => ({
      kind, point, wallIndex, widthMm, heightMm, elevationMm,
    })),
  };
}
