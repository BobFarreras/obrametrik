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

export type SpatialEntityRef =
  | Readonly<{ entityType: "level"; entityId: string }>
  | Readonly<{ entityType: "space"; entityId: string }>
  | Readonly<{ entityType: "element"; entityId: string }>;
