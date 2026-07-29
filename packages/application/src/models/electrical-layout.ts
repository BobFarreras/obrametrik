import type { Point2Mm } from "@obrametrik/domain";

export type ElectricalLayoutView = "plan" | "front" | "right";
export type ElectricalTerminalKind = "light" | "switch" | "socket";
export type ElectricalConductorColor = "brown" | "black" | "light_blue" | "green_yellow";

export type ElectricalLayoutTerminal = Readonly<{
  id: string;
  kind: ElectricalTerminalKind;
  point: Point2Mm;
  elevationMm: number;
}>;

export type ElectricalPoint3Mm = Readonly<{ x: number; y: number; z: number }>;
export type ElectricalJunctionBox = Readonly<{
  id: string;
  circuitCode: "C1" | "C2";
  point: Point2Mm;
  elevationMm: number;
  terminalIds: readonly string[];
}>;
export type ElectricalLayoutRun = Readonly<{
  id: string;
  circuitCode: "C1" | "C2";
  terminalId: string;
  junctionBoxId: string;
  path: readonly ElectricalPoint3Mm[];
  conductors: readonly Readonly<{
    role: "phase" | "neutral" | "protective" | "switched_phase";
    color: ElectricalConductorColor;
    sectionMm2: number;
  }>[];
}>;

export type ElectricalLayout = Readonly<{
  terminals: readonly ElectricalLayoutTerminal[];
  junctionBoxes: readonly ElectricalJunctionBox[];
  runs: readonly ElectricalLayoutRun[];
}>;

const conductorSets = {
  light: [
    { role: "switched_phase", color: "black", sectionMm2: 1.5 },
    { role: "neutral", color: "light_blue", sectionMm2: 1.5 },
    { role: "protective", color: "green_yellow", sectionMm2: 1.5 },
  ],
  switch: [
    { role: "phase", color: "brown", sectionMm2: 1.5 },
    { role: "switched_phase", color: "black", sectionMm2: 1.5 },
  ],
  socket: [
    { role: "phase", color: "brown", sectionMm2: 2.5 },
    { role: "neutral", color: "light_blue", sectionMm2: 2.5 },
    { role: "protective", color: "green_yellow", sectionMm2: 2.5 },
  ],
} as const;

function circuitFor(kind: ElectricalTerminalKind): "C1" | "C2" {
  return kind === "socket" ? "C2" : "C1";
}

function interiorAnchor(vertices: readonly Point2Mm[]): Point2Mm {
  return {
    x: Math.round(vertices.reduce((sum, point) => sum + point.x, 0) / vertices.length),
    y: Math.round(vertices.reduce((sum, point) => sum + point.y, 0) / vertices.length),
  };
}

export function buildElectricalLayout(input: {
  clearHeightMm: number;
  terminals: readonly ElectricalLayoutTerminal[];
  vertices: readonly Point2Mm[];
}): ElectricalLayout {
  if (input.vertices.length < 3 || input.terminals.length === 0) {
    return { terminals: input.terminals, junctionBoxes: [], runs: [] };
  }
  const anchor = interiorAnchor(input.vertices);
  const boxElevationMm = Math.max(0, input.clearHeightMm - 300);
  const circuitCodes = (["C1", "C2"] as const).filter((code) =>
    input.terminals.some((terminal) => circuitFor(terminal.kind) === code),
  );
  const junctionBoxes = circuitCodes.map((circuitCode) => ({
    id: `auto-box-${circuitCode}`,
    circuitCode,
    point: anchor,
    elevationMm: boxElevationMm,
    terminalIds: input.terminals
      .filter((terminal) => circuitFor(terminal.kind) === circuitCode)
      .map((terminal) => terminal.id),
  }));
  const runs = input.terminals.map((terminal): ElectricalLayoutRun => {
    const circuitCode = circuitFor(terminal.kind);
    const box = junctionBoxes.find((candidate) => candidate.circuitCode === circuitCode)!;
    return {
      id: `auto-run-${terminal.id}`,
      circuitCode,
      terminalId: terminal.id,
      junctionBoxId: box.id,
      path: [
        { x: box.point.x, y: box.point.y, z: box.elevationMm },
        { x: terminal.point.x, y: box.point.y, z: box.elevationMm },
        { x: terminal.point.x, y: terminal.point.y, z: box.elevationMm },
        { x: terminal.point.x, y: terminal.point.y, z: terminal.elevationMm },
      ],
      conductors: conductorSets[terminal.kind],
    };
  });
  return { terminals: input.terminals, junctionBoxes, runs };
}

export function projectElectricalPoint(
  point: ElectricalPoint3Mm,
  view: ElectricalLayoutView,
  clearHeightMm = 2600,
): Point2Mm {
  if (view === "plan") return { x: point.x, y: point.y };
  return {
    x: view === "front" ? point.x : point.y,
    y: clearHeightMm - point.z,
  };
}
