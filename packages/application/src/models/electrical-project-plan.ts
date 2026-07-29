import type {
  ConductorFunction,
  ConduitSystem,
  ElectricalCircuitCode,
  ElectricalProjectCircuit,
} from "@obrametrik/calculations";

export type ElectricalCircuitRecord = Readonly<{
  id: string;
  code: string;
  status: string;
}>;

export type ElectricalTerminalAssignmentRecord = Readonly<{
  circuit_id: string;
  terminal_element_id: string;
}>;

export type ElectricalRouteSegmentRecord = Readonly<{
  id: string;
  circuit_id: string;
  length_mm: number;
  conductor_configuration: unknown;
  conduit_system: string;
  conduit_diameter_mm: number;
  status: string;
}>;

const CIRCUIT_CODES = new Set(["C1", "C2", "C3", "C4", "C5", "C10", "C11"]);
const CONDUCTOR_FUNCTIONS = new Set([
  "phase",
  "neutral",
  "protective",
  "return",
  "traveller",
  "control",
]);
const CONDUIT_SYSTEMS = new Set(["embedded-tube", "surface-tube", "trunking"]);

function parseConductors(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (
      typeof record.function !== "string" ||
      !CONDUCTOR_FUNCTIONS.has(record.function) ||
      typeof record.sectionMm2 !== "number" ||
      record.sectionMm2 <= 0 ||
      typeof record.count !== "number" ||
      !Number.isInteger(record.count) ||
      record.count <= 0
    )
      return [];
    return [
      {
        function: record.function as ConductorFunction,
        ...(typeof record.color === "string" ? { color: record.color } : {}),
        sectionMm2: record.sectionMm2,
        count: record.count,
      },
    ];
  });
}

export function buildElectricalProjectCircuits(input: {
  circuits: readonly ElectricalCircuitRecord[];
  assignments: readonly ElectricalTerminalAssignmentRecord[];
  segments: readonly ElectricalRouteSegmentRecord[];
}): ElectricalProjectCircuit[] {
  return input.circuits.flatMap((circuit) => {
    if (circuit.status !== "confirmed" || !CIRCUIT_CODES.has(circuit.code)) return [];
    return [
      {
        id: circuit.id,
        code: circuit.code as ElectricalCircuitCode,
        terminalIds: input.assignments
          .filter((assignment) => assignment.circuit_id === circuit.id)
          .map((assignment) => assignment.terminal_element_id),
        segments: input.segments
          .filter((segment) => segment.circuit_id === circuit.id && segment.status === "confirmed")
          .flatMap((segment) => {
            const conductors = parseConductors(segment.conductor_configuration);
            if (
              conductors.length === 0 ||
              !CONDUIT_SYSTEMS.has(segment.conduit_system) ||
              segment.length_mm <= 0 ||
              segment.conduit_diameter_mm <= 0
            )
              return [];
            return [
              {
                id: segment.id,
                lengthMm: segment.length_mm,
                sourceEntityIds: [circuit.id, segment.id],
                conductors,
                conduit: {
                  system: segment.conduit_system as ConduitSystem,
                  diameterMm: segment.conduit_diameter_mm,
                },
              },
            ];
          }),
      },
    ];
  });
}
