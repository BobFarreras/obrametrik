import type {
  ConductorFunction,
  ElectricalCircuitCode,
} from "./electrical-takeoff";

export type ConductorColor =
  | "brown"
  | "black"
  | "grey"
  | "light_blue"
  | "green_yellow";

export type ElectricalRouteRole =
  | "distribution"
  | "light_feed"
  | "switch_feed"
  | "switch_return"
  | "travellers"
  | "control";

export type IdentifiedConductor = Readonly<{
  function: ConductorFunction;
  color: ConductorColor;
  sectionMm2: number;
  count: number;
}>;

const SECTION_BY_CIRCUIT: Record<ElectricalCircuitCode, number> = {
  C1: 1.5,
  C2: 2.5,
  C3: 6,
  C4: 4,
  C5: 2.5,
  C10: 2.5,
  C11: 1.5,
};

export function wiringForRouteRole(input: {
  circuitCode: ElectricalCircuitCode;
  role: ElectricalRouteRole;
}): IdentifiedConductor[] {
  const sectionMm2 = SECTION_BY_CIRCUIT[input.circuitCode];
  if (input.role === "distribution" || input.role === "light_feed") {
    return [
      { function: "phase", color: "brown", sectionMm2, count: 1 },
      { function: "neutral", color: "light_blue", sectionMm2, count: 1 },
      { function: "protective", color: "green_yellow", sectionMm2, count: 1 },
    ];
  }
  if (input.role === "switch_feed") {
    return [{ function: "phase", color: "brown", sectionMm2, count: 1 }];
  }
  if (input.role === "switch_return") {
    return [{ function: "return", color: "black", sectionMm2, count: 1 }];
  }
  if (input.role === "travellers") {
    return [
      { function: "traveller", color: "black", sectionMm2, count: 1 },
      { function: "traveller", color: "grey", sectionMm2, count: 1 },
    ];
  }
  return [{ function: "control", color: "grey", sectionMm2, count: 1 }];
}
