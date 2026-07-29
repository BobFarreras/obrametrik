import type { Point2Mm, SpaceKind } from "@obrametrik/domain";

export type CadComponentKind =
  "door" | "window" | "light" | "switch" | "socket" | "cold_water" | "hot_water" | "drain";

export type DoorSwing = "left_in" | "right_in" | "left_out" | "right_out";
export type CadPlacementSurface = "wall" | "ceiling" | "floor";

export const cadComponentVariants = {
  door: ["hinged", "sliding", "pocket", "folding", "double_hinged"],
  window: ["casement", "sliding", "tilt_turn", "fixed", "awning"],
  light: ["ceiling", "wall", "recessed", "pendant"],
  switch: ["single", "double", "dimmer", "two_way"],
  socket: ["single", "double", "usb"],
  cold_water: ["wall_outlet", "floor_outlet", "manifold"],
  hot_water: ["wall_outlet", "floor_outlet", "manifold"],
  drain: ["floor", "wall", "linear"],
} as const satisfies Record<CadComponentKind, readonly string[]>;

export type CadComponentVariant =
  (typeof cadComponentVariants)[CadComponentKind][number];

export function defaultCadComponentVariant(kind: CadComponentKind): CadComponentVariant {
  return cadComponentVariants[kind][0];
}

export function isCadComponentVariant(
  kind: CadComponentKind,
  value: unknown,
): value is CadComponentVariant {
  return typeof value === "string" && (cadComponentVariants[kind] as readonly string[]).includes(value);
}

export type CadComponentDraft = Readonly<{
  kind: CadComponentKind;
  point: Point2Mm;
  wallIndex?: number | undefined;
  placementSurface?: CadPlacementSurface | undefined;
  widthMm?: number | undefined;
  heightMm?: number | undefined;
  elevationMm?: number | undefined;
  swing?: DoorSwing | undefined;
  variant?: CadComponentVariant | undefined;
}>;

export type CadPlanDraft = Readonly<{
  projectId: string;
  name: string;
  kind: SpaceKind;
  vertices: readonly Point2Mm[];
  clearHeightMm: number;
  components: readonly CadComponentDraft[];
}>;
