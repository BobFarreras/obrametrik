import type { ElectricalCircuitCode, ElectricalRuleStatus } from "./electrical-takeoff";

const SOURCE_ID = "BOE-A-2002-18099:ITC-BT-25";

export type PreliminaryElectricalPanelInput = {
  jurisdiction: string;
  buildingUse: "dwelling" | "other";
  circuits: {
    id: string;
    code: ElectricalCircuitCode;
    breakerRatingA: number;
    breakerModules: number;
  }[];
  residualCurrentDevices: {
    id: string;
    sensitivityMa: number;
    modules: number;
  }[];
  otherDevices: {
    id: string;
    categoryId: string;
    quantity: number;
    modulesEach: number;
  }[];
  reserveModules: number;
  enclosureCapacityModules?: number;
};

export type ElectricalPanelTakeoffLine = {
  categoryId: string;
  specification: Record<string, string | number>;
  quantity: number;
  unit: "unit";
  occupiedModules: number;
  sourceEntityIds: string[];
  calculationRuleId: string;
  sourceIds: string[];
  confidence: "confirmed";
};

export type ElectricalPanelRuleResult = {
  ruleId: string;
  status: ElectricalRuleStatus;
  entityIds: string[];
  inputs: Record<string, unknown>;
  explanationKey: string;
  sourceIds: string[];
};

export type PreliminaryElectricalPanelResult = {
  status: ElectricalRuleStatus;
  circuitCount: number;
  minimumRcdCount: number;
  occupiedModules: number;
  reserveModules: number;
  minimumCapacityModules: number;
  enclosureCapacityModules?: number;
  lines: ElectricalPanelTakeoffLine[];
  missingInputs: string[];
  ruleResults: ElectricalPanelRuleResult[];
  ruleVersion: "electrical-panel@1";
};

function baseResult(
  input: PreliminaryElectricalPanelInput,
  status: ElectricalRuleStatus,
  missingInputs: string[] = [],
): PreliminaryElectricalPanelResult {
  const circuitCount = input.circuits.length;
  const minimumRcdCount = Math.max(1, Math.ceil(circuitCount / 5));
  return {
    status,
    circuitCount,
    minimumRcdCount,
    occupiedModules: 0,
    reserveModules: input.reserveModules,
    minimumCapacityModules: 0,
    ...(input.enclosureCapacityModules === undefined
      ? {}
      : { enclosureCapacityModules: input.enclosureCapacityModules }),
    lines: [],
    missingInputs,
    ruleResults: [],
    ruleVersion: "electrical-panel@1",
  };
}

export function calculatePreliminaryElectricalPanel(
  input: PreliminaryElectricalPanelInput,
): PreliminaryElectricalPanelResult {
  if (input.jurisdiction !== "ES" || input.buildingUse !== "dwelling") {
    return baseResult(input, "not_applicable");
  }

  if (input.enclosureCapacityModules === undefined) {
    return baseResult(input, "insufficient_data", ["enclosureCapacityModules"]);
  }

  if (
    input.circuits.length === 0 ||
    input.circuits.some(
      (circuit) =>
        !circuit.id ||
        circuit.breakerRatingA <= 0 ||
        !Number.isInteger(circuit.breakerModules) ||
        circuit.breakerModules <= 0,
    ) ||
    input.residualCurrentDevices.some(
      (device) =>
        !device.id ||
        device.sensitivityMa <= 0 ||
        !Number.isInteger(device.modules) ||
        device.modules <= 0,
    ) ||
    input.otherDevices.some(
      (device) =>
        !device.id ||
        !device.categoryId ||
        !Number.isInteger(device.quantity) ||
        device.quantity <= 0 ||
        !Number.isInteger(device.modulesEach) ||
        device.modulesEach <= 0,
    ) ||
    !Number.isInteger(input.reserveModules) ||
    input.reserveModules < 0 ||
    !Number.isInteger(input.enclosureCapacityModules) ||
    input.enclosureCapacityModules <= 0
  ) {
    throw new RangeError("Invalid preliminary electrical panel input");
  }

  const circuitCount = input.circuits.length;
  const minimumRcdCount = Math.max(1, Math.ceil(circuitCount / 5));
  const occupiedModules =
    input.circuits.reduce((total, circuit) => total + circuit.breakerModules, 0) +
    input.residualCurrentDevices.reduce((total, device) => total + device.modules, 0) +
    input.otherDevices.reduce((total, device) => total + device.quantity * device.modulesEach, 0);
  const minimumCapacityModules = occupiedModules + input.reserveModules;
  const ruleResults: ElectricalPanelRuleResult[] = [];

  ruleResults.push({
    ruleId: "ELEC-RCD-COUNT-001",
    status:
      input.residualCurrentDevices.length < minimumRcdCount ? "blocking" : "professional_review",
    entityIds: input.residualCurrentDevices.map((device) => device.id),
    inputs: {
      circuitCount,
      installedRcdCount: input.residualCurrentDevices.length,
      minimumRcdCount,
    },
    explanationKey:
      input.residualCurrentDevices.length < minimumRcdCount
        ? "electrical.panel.rcdCount.blocking"
        : "electrical.panel.rcdCount.professionalReview",
    sourceIds: [SOURCE_ID],
  });

  const excessiveSensitivityIds = input.residualCurrentDevices
    .filter((device) => device.sensitivityMa > 30)
    .map((device) => device.id);
  ruleResults.push({
    ruleId: "ELEC-RCD-SENSITIVITY-001",
    status: excessiveSensitivityIds.length > 0 ? "blocking" : "pass",
    entityIds: input.residualCurrentDevices.map((device) => device.id),
    inputs: {
      maximumSensitivityMa: 30,
      excessiveSensitivityIds,
    },
    explanationKey:
      excessiveSensitivityIds.length > 0
        ? "electrical.panel.rcdSensitivity.blocking"
        : "electrical.panel.rcdSensitivity.pass",
    sourceIds: [SOURCE_ID],
  });

  ruleResults.push({
    ruleId: "ELEC-PANEL-CAPACITY-001",
    status: input.enclosureCapacityModules < minimumCapacityModules ? "blocking" : "pass",
    entityIds: [
      ...input.circuits.map((circuit) => circuit.id),
      ...input.residualCurrentDevices.map((device) => device.id),
      ...input.otherDevices.map((device) => device.id),
    ],
    inputs: {
      occupiedModules,
      reserveModules: input.reserveModules,
      minimumCapacityModules,
      enclosureCapacityModules: input.enclosureCapacityModules,
    },
    explanationKey:
      input.enclosureCapacityModules < minimumCapacityModules
        ? "electrical.panel.capacity.blocking"
        : "electrical.panel.capacity.pass",
    sourceIds: [SOURCE_ID],
  });

  const hasBlockingResult = ruleResults.some((result) => result.status === "blocking");
  const lines: ElectricalPanelTakeoffLine[] = hasBlockingResult
    ? []
    : [
        ...input.circuits.map((circuit) => ({
          categoryId: "electrical.miniature-circuit-breaker",
          specification: {
            circuitCode: circuit.code,
            ratingA: circuit.breakerRatingA,
          },
          quantity: 1,
          unit: "unit" as const,
          occupiedModules: circuit.breakerModules,
          sourceEntityIds: [circuit.id],
          calculationRuleId: `ELEC-${circuit.code}-SECTION-001`,
          sourceIds: [SOURCE_ID],
          confidence: "confirmed" as const,
        })),
        ...input.residualCurrentDevices.map((device) => ({
          categoryId: "electrical.residual-current-device",
          specification: { sensitivityMa: device.sensitivityMa },
          quantity: 1,
          unit: "unit" as const,
          occupiedModules: device.modules,
          sourceEntityIds: [device.id],
          calculationRuleId: "ELEC-RCD-COUNT-001",
          sourceIds: [SOURCE_ID],
          confidence: "confirmed" as const,
        })),
        ...input.otherDevices.map((device) => ({
          categoryId: device.categoryId,
          specification: {},
          quantity: device.quantity,
          unit: "unit" as const,
          occupiedModules: device.quantity * device.modulesEach,
          sourceEntityIds: [device.id],
          calculationRuleId: "ELEC-PANEL-CONFIRMED-DEVICE-001",
          sourceIds: [SOURCE_ID],
          confidence: "confirmed" as const,
        })),
      ];

  return {
    status: hasBlockingResult ? "blocking" : "professional_review",
    circuitCount,
    minimumRcdCount,
    occupiedModules,
    reserveModules: input.reserveModules,
    minimumCapacityModules,
    enclosureCapacityModules: input.enclosureCapacityModules,
    lines,
    missingInputs: [],
    ruleResults,
    ruleVersion: "electrical-panel@1",
  };
}
