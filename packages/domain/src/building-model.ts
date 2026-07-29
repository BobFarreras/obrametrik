/**
 * Canonical building geometry shared by web, mobile and persistence adapters.
 * Integer millimetres avoid UI-dependent rounding in professional drawings.
 */
export type Millimetres = number;
export type Degrees = number;

export type Point2Mm = Readonly<{
  x: Millimetres;
  y: Millimetres;
}>;

export type Point3Mm = Readonly<{
  x: Millimetres;
  y: Millimetres;
  z: Millimetres;
}>;

export type Transform3 = Readonly<{
  position: Point3Mm;
  rotationDegrees: Readonly<{
    x: Degrees;
    y: Degrees;
    z: Degrees;
  }>;
}>;

export type RectangleGeometry = Readonly<{
  kind: "rectangle";
  widthMm: Millimetres;
  depthMm: Millimetres;
}>;

export type PolygonGeometry = Readonly<{
  kind: "polygon";
  vertices: readonly Point2Mm[];
}>;

export type SpaceFootprint = RectangleGeometry | PolygonGeometry;

export type BuildingLevel = Readonly<{
  id: string;
  projectId: string;
  name: string;
  elevationMm: Millimetres;
  order: number;
}>;

export type SpaceKind =
  "bathroom" | "kitchen" | "bedroom" | "living_room" | "hallway" | "utility" | "exterior" | "other";

export type BuildingSpace = Readonly<{
  id: string;
  projectId: string;
  levelId: string;
  name: string;
  kind: SpaceKind;
  footprint: SpaceFootprint;
  clearHeightMm: Millimetres;
  transform: Transform3;
  geometrySource: "manual" | "plan" | "scan" | "import";
  confirmation: "estimated" | "confirmed";
}>;

export type BuildingSpaceDraft = Omit<BuildingSpace, "id">;

function assertIntegerMillimetres(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Geometry coordinates must use integer millimetres");
  }
}

function orientation(a: Point2Mm, b: Point2Mm, c: Point2Mm): number {
  return Math.sign((b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y));
}

function isOnSegment(a: Point2Mm, b: Point2Mm, point: Point2Mm): boolean {
  return (
    point.x >= Math.min(a.x, b.x) &&
    point.x <= Math.max(a.x, b.x) &&
    point.y >= Math.min(a.y, b.y) &&
    point.y <= Math.max(a.y, b.y)
  );
}

function segmentsIntersect(a: Point2Mm, b: Point2Mm, c: Point2Mm, d: Point2Mm): boolean {
  const abc = orientation(a, b, c);
  const abd = orientation(a, b, d);
  const cda = orientation(c, d, a);
  const cdb = orientation(c, d, b);

  if (abc !== abd && cda !== cdb) return true;
  if (abc === 0 && isOnSegment(a, b, c)) return true;
  if (abd === 0 && isOnSegment(a, b, d)) return true;
  if (cda === 0 && isOnSegment(c, d, a)) return true;
  return cdb === 0 && isOnSegment(c, d, b);
}

function assertSimplePolygon(vertices: readonly Point2Mm[]): void {
  if (vertices.length < 3 || vertices.length > 1000) {
    throw new RangeError("Polygon requires between 3 and 1000 vertices");
  }

  vertices.forEach((vertex) => {
    assertIntegerMillimetres(vertex.x);
    assertIntegerMillimetres(vertex.y);
  });

  for (let index = 0; index < vertices.length; index += 1) {
    const next = (index + 1) % vertices.length;
    const vertex = vertices[index]!;
    const nextVertex = vertices[next]!;
    if (vertex.x === nextVertex.x && vertex.y === nextVertex.y) {
      throw new RangeError("Polygon has repeated consecutive vertices");
    }
  }

  for (let first = 0; first < vertices.length; first += 1) {
    const firstNext = (first + 1) % vertices.length;
    for (let second = first + 1; second < vertices.length; second += 1) {
      const secondNext = (second + 1) % vertices.length;
      const adjacent =
        first === second ||
        firstNext === second ||
        secondNext === first ||
        (first === 0 && secondNext === 0);
      if (
        !adjacent &&
        segmentsIntersect(
          vertices[first]!,
          vertices[firstNext]!,
          vertices[second]!,
          vertices[secondNext]!,
        )
      ) {
        throw new RangeError("Polygon must not self-intersect");
      }
    }
  }

  const doubledArea = vertices.reduce((area, vertex, index) => {
    const next = vertices[(index + 1) % vertices.length]!;
    return area + vertex.x * next.y - next.x * vertex.y;
  }, 0);
  if (doubledArea === 0) throw new RangeError("Polygon area must be non-zero");
}

export function assertValidSpaceDraft(space: BuildingSpaceDraft): void {
  if (!space.name.trim() || space.name.length > 120) {
    throw new RangeError("Space name must contain between 1 and 120 characters");
  }
  assertIntegerMillimetres(space.clearHeightMm);
  if (space.clearHeightMm < 100 || space.clearHeightMm > 20_000) {
    throw new RangeError("Space clear height is outside supported dimensions");
  }

  Object.values(space.transform.position).forEach(assertIntegerMillimetres);
  Object.values(space.transform.rotationDegrees).forEach((rotation) => {
    if (
      !Number.isFinite(rotation) ||
      Math.abs(rotation) > 360 ||
      !Number.isSafeInteger(rotation * 1000)
    ) {
      throw new RangeError("Rotation must use millidegree precision within ±360 degrees");
    }
  });

  if (space.footprint.kind === "rectangle") {
    assertIntegerMillimetres(space.footprint.widthMm);
    assertIntegerMillimetres(space.footprint.depthMm);
    if (
      space.footprint.widthMm < 100 ||
      space.footprint.widthMm > 100_000 ||
      space.footprint.depthMm < 100 ||
      space.footprint.depthMm > 100_000
    ) {
      throw new RangeError("Rectangle dimensions are outside supported limits");
    }
    return;
  }

  assertSimplePolygon(space.footprint.vertices);
}

export type HostFace = "interior" | "exterior" | "top" | "bottom" | "axis";

export type BuildingElementKind =
  | "wall"
  | "floor"
  | "ceiling"
  | "roof"
  | "door"
  | "window"
  | "opening"
  | "column"
  | "beam"
  | "lining"
  | "fixture"
  | "equipment"
  | "terminal"
  | "other";

export type BuildingElement = Readonly<{
  id: string;
  projectId: string;
  spaceId: string;
  hostElementId: string | null;
  hostFace: HostFace | null;
  kind: BuildingElementKind;
  name: string;
  transform: Transform3;
  dimensionsMm: Readonly<{
    width: Millimetres;
    height: Millimetres;
    depth: Millimetres;
  }>;
  specification: Readonly<Record<string, unknown>>;
  lifecycle: "existing" | "to_remove" | "new" | "modified";
  confirmation: "estimated" | "confirmed";
}>;

export type BuildingElementDraft = Omit<BuildingElement, "id">;

export type SpatialEntityRef =
  | Readonly<{ entityType: "level"; entityId: string }>
  | Readonly<{ entityType: "space"; entityId: string }>
  | Readonly<{ entityType: "element"; entityId: string }>;
