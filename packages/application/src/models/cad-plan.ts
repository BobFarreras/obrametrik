import type { Point2Mm, SpaceKind } from "@obrametrik/domain";

export type CadComponentKind =
  "door" | "window" | "light" | "switch" | "socket" | "cold_water" | "hot_water" | "drain";

export type CadComponentDraft = Readonly<{
  kind: CadComponentKind;
  point: Point2Mm;
  wallIndex: number;
  widthMm?: number | undefined;
  heightMm?: number | undefined;
  elevationMm?: number | undefined;
}>;

export type CadPlanDraft = Readonly<{
  projectId: string;
  name: string;
  kind: SpaceKind;
  vertices: readonly Point2Mm[];
  clearHeightMm: number;
  components: readonly CadComponentDraft[];
}>;
