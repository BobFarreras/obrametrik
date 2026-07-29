import {
  calculateElectricalPlanBill,
  type ElectricalPlanBillLine,
  type ElectricalPlanComponent,
} from "./electrical-plan-bill";
import {
  calculateElectricalTakeoff,
  type ElectricalCircuitCode,
  type ElectricalTakeoffInput,
  type ElectricalTakeoffLine,
} from "./electrical-takeoff";

export type ElectricalProjectCircuit = Readonly<{
  id: string;
  code: ElectricalCircuitCode;
  terminalIds: readonly string[];
  segments: ElectricalTakeoffInput["segments"];
}>;

export type ElectricalProjectTakeoffInput = Readonly<{
  components: readonly ElectricalPlanComponent[];
  circuits: readonly ElectricalProjectCircuit[];
  purchase?: ElectricalTakeoffInput["purchase"];
}>;

export type ElectricalProjectTakeoffResult = Readonly<{
  status: "insufficient_data" | "professional_review" | "blocking";
  sourceComponentCount: number;
  lines: readonly (ElectricalPlanBillLine | ElectricalTakeoffLine)[];
  missingInputs: readonly string[];
  warnings: readonly Readonly<{
    ruleId: string;
    status: string;
    entityIds: readonly string[];
    explanationKey: string;
  }>[];
  ruleVersion: "electrical-project-takeoff@1";
}>;

const DEFAULT_PURCHASE: ElectricalTakeoffInput["purchase"] = {
  conductorReserveM: 0,
  conduitReserveM: 0,
  wastePercent: 10,
  commercialIncrementM: 1,
};

export function calculateElectricalProjectTakeoff(
  input: ElectricalProjectTakeoffInput,
): ElectricalProjectTakeoffResult {
  const componentResult = calculateElectricalPlanBill({ components: input.components });
  const routedCircuits = input.circuits.filter((circuit) => circuit.segments.length > 0);
  const circuitResults = routedCircuits.map((circuit) =>
    calculateElectricalTakeoff({
      jurisdiction: "ES",
      buildingUse: "dwelling",
      normativeDate: "2026-07-29",
      circuit: {
        id: circuit.id,
        code: circuit.code,
        pointCount: circuit.terminalIds.length,
      },
      segments: circuit.segments,
      purchase: input.purchase ?? DEFAULT_PURCHASE,
    }),
  );
  const missingInputs = [
    ...componentResult.missingInputs.filter((item) => item !== "electrical.routes"),
    ...(routedCircuits.length === 0 && input.components.length > 0 ? ["electrical.routes"] : []),
    ...circuitResults.flatMap((result) => result.missingInputs),
  ];
  const blocking = circuitResults.some((result) => result.status === "blocking");
  const warnings = [
    ...componentResult.warnings.filter((warning) => warning.ruleId !== "ELEC-PLAN-ROUTES-001"),
    ...(routedCircuits.length === 0 && input.components.length > 0
      ? componentResult.warnings.filter((warning) => warning.ruleId === "ELEC-PLAN-ROUTES-001")
      : []),
    ...circuitResults.flatMap((result) => result.ruleResults),
  ];

  return {
    status: blocking
      ? "blocking"
      : input.components.length === 0 || routedCircuits.length === 0
        ? "insufficient_data"
        : "professional_review",
    sourceComponentCount: componentResult.sourceComponentCount,
    lines: [...componentResult.lines, ...circuitResults.flatMap((result) => result.lines)],
    missingInputs: [...new Set(missingInputs)],
    warnings,
    ruleVersion: "electrical-project-takeoff@1",
  };
}
