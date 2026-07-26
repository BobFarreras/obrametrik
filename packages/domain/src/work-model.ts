import type { SpatialEntityRef } from "./building-model";

export type Trade =
  | "demolition"
  | "masonry"
  | "waterproofing"
  | "electrical"
  | "lighting"
  | "plumbing"
  | "drainage"
  | "ventilation"
  | "climate"
  | "joinery"
  | "finishes"
  | "painting"
  | "coordination";

export type TechnicalSystemKind =
  | "electrical"
  | "lighting_control"
  | "cold_water"
  | "hot_water"
  | "drainage"
  | "ventilation"
  | "heating"
  | "cooling"
  | "data"
  | "other";

export type TechnicalSystem = Readonly<{
  id: string;
  projectId: string;
  kind: TechnicalSystemKind;
  name: string;
  sourceElementIds: readonly string[];
  terminalElementIds: readonly string[];
  status: "draft" | "confirmed" | "installed" | "tested" | "commissioned";
}>;

export type SystemConnection = Readonly<{
  id: string;
  projectId: string;
  systemId: string;
  fromElementId: string;
  toElementId: string;
  route: readonly SpatialEntityRef[];
  specification: Readonly<Record<string, unknown>>;
}>;

export type WorkStatus =
  | "draft"
  | "confirmed"
  | "ready"
  | "in_progress"
  | "installed"
  | "tested"
  | "accepted"
  | "blocked"
  | "cancelled";

export type WorkItem = Readonly<{
  id: string;
  projectId: string;
  trade: Trade;
  title: string;
  targetRefs: readonly SpatialEntityRef[];
  dependencyIds: readonly string[];
  status: WorkStatus;
  ruleVersionIds: readonly string[];
}>;

const workTransitions: Readonly<Record<WorkStatus, readonly WorkStatus[]>> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["ready", "blocked", "cancelled"],
  ready: ["in_progress", "blocked", "cancelled"],
  in_progress: ["installed", "blocked", "cancelled"],
  installed: ["tested", "blocked"],
  tested: ["accepted", "blocked"],
  accepted: [],
  blocked: ["confirmed", "ready", "in_progress", "installed", "cancelled"],
  cancelled: [],
};

export function canTransitionWork(from: WorkStatus, to: WorkStatus): boolean {
  return workTransitions[from].includes(to);
}

export function assertWorkTransition(from: WorkStatus, to: WorkStatus): void {
  if (!canTransitionWork(from, to)) {
    throw new RangeError(`Invalid work transition: ${from} -> ${to}`);
  }
}
