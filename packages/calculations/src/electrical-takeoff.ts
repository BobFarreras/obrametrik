/**
 * Deterministic phase-one takeoff for Spanish dwelling circuits.
 *
 * This module validates only the published operational minima. Voltage drop,
 * conduit occupancy and installation conditions remain explicit review items.
 */

export type ElectricalCircuitCode = "C1" | "C2" | "C3" | "C4" | "C5" | "C10" | "C11";
export type ConductorFunction =
  "phase" | "neutral" | "protective" | "return" | "traveller" | "control";
export type ConduitSystem = "embedded-tube" | "surface-tube" | "trunking";
export type ElectricalRuleStatus =
  "pass" | "warning" | "blocking" | "insufficient_data" | "professional_review" | "not_applicable";

export type ElectricalTakeoffInput = {
  jurisdiction: string;
  buildingUse: "dwelling" | "other";
  normativeDate: string;
  circuit: {
    id: string;
    code: ElectricalCircuitCode;
    pointCount: number;
  };
  segments: {
    id: string;
    lengthMm: number;
    sourceEntityIds: string[];
    conductors: {
      function: ConductorFunction;
      color?: string;
      sectionMm2: number;
      count: number;
    }[];
    conduit?: {
      system: ConduitSystem;
      diameterMm: number;
    };
  }[];
  purchase: {
    conductorReserveM: number;
    conduitReserveM: number;
    wastePercent: number;
    commercialIncrementM: number;
  };
};

export type ElectricalTakeoffLine = {
  categoryId: "electrical.conductor" | "electrical.conduit";
  specification: Record<string, string | number>;
  sourceEntityIds: string[];
  quantityBase: number;
  reserveQuantity: number;
  unit: "m";
  wasteFactor: number;
  quantityWithWaste: number;
  purchaseQuantity: number;
  commercialIncrement: number;
  roundingRule: string;
  calculationRuleId: string;
  sourceIds: string[];
  assumptions: string[];
  confidence: "confirmed" | "pending";
  formula: string;
};

export type ElectricalRuleResult = {
  ruleId: string;
  status: ElectricalRuleStatus;
  entityIds: string[];
  inputs: Record<string, unknown>;
  explanationKey: string;
  sourceIds: string[];
};

export type ElectricalTakeoffResult = {
  status: ElectricalRuleStatus;
  circuit: {
    code: ElectricalCircuitCode;
    minimumSectionMm2: number;
    referenceConduitDiameterMm: number;
    maximumPoints?: number;
    requiredCircuitCount?: number;
    additionalCircuitCount?: number;
  };
  lines: ElectricalTakeoffLine[];
  missingInputs: string[];
  ruleResults: ElectricalRuleResult[];
  ruleVersion: "electrical-takeoff@1";
};

type CircuitRule = {
  minimumSectionMm2: number;
  referenceConduitDiameterMm: number;
  maximumPoints?: number;
};

const SOURCE_ID = "BOE-A-2002-18099:ITC-BT-25";
const CIRCUIT_RULES: Record<ElectricalCircuitCode, CircuitRule> = {
  C1: { minimumSectionMm2: 1.5, referenceConduitDiameterMm: 16, maximumPoints: 30 },
  C2: { minimumSectionMm2: 2.5, referenceConduitDiameterMm: 20, maximumPoints: 20 },
  C3: { minimumSectionMm2: 6, referenceConduitDiameterMm: 25, maximumPoints: 2 },
  C4: { minimumSectionMm2: 4, referenceConduitDiameterMm: 20, maximumPoints: 3 },
  C5: { minimumSectionMm2: 2.5, referenceConduitDiameterMm: 20, maximumPoints: 6 },
  C10: { minimumSectionMm2: 2.5, referenceConduitDiameterMm: 20, maximumPoints: 1 },
  C11: { minimumSectionMm2: 1.5, referenceConduitDiameterMm: 16 },
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function roundForPurchase(quantity: number, increment: number): number {
  return Math.ceil(quantity / increment) * increment;
}

function makeLine(input: {
  categoryId: ElectricalTakeoffLine["categoryId"];
  specification: ElectricalTakeoffLine["specification"];
  measuredQuantity: number;
  reserveQuantity: number;
  sourceEntityIds: string[];
  wastePercent: number;
  commercialIncrementM: number;
  calculationRuleId: string;
  formula: string;
  assumptions: string[];
}): ElectricalTakeoffLine {
  const quantityBase = input.measuredQuantity + input.reserveQuantity;
  const wasteFactor = 1 + input.wastePercent / 100;
  const quantityWithWaste = quantityBase * wasteFactor;

  return {
    categoryId: input.categoryId,
    specification: input.specification,
    sourceEntityIds: unique(input.sourceEntityIds),
    quantityBase,
    reserveQuantity: input.reserveQuantity,
    unit: "m",
    wasteFactor,
    quantityWithWaste,
    purchaseQuantity: roundForPurchase(quantityWithWaste, input.commercialIncrementM),
    commercialIncrement: input.commercialIncrementM,
    roundingRule: "ceil(quantityWithWaste / commercialIncrement) × commercialIncrement",
    calculationRuleId: input.calculationRuleId,
    sourceIds: [SOURCE_ID],
    assumptions: input.assumptions,
    confidence: "confirmed",
    formula: input.formula,
  };
}

function validateInput(input: ElectricalTakeoffInput): string[] {
  const missingInputs: string[] = [];

  if (!input.normativeDate) missingInputs.push("normativeDate");
  if (!input.circuit.id) missingInputs.push("circuit.id");
  input.segments.forEach((segment, index) => {
    if (!segment.conduit) missingInputs.push(`segments[${index}].conduit`);
  });

  return missingInputs;
}

function emptyResult(
  input: ElectricalTakeoffInput,
  status: ElectricalRuleStatus,
  missingInputs: string[] = [],
): ElectricalTakeoffResult {
  const rule = CIRCUIT_RULES[input.circuit.code];
  return {
    status,
    circuit: {
      code: input.circuit.code,
      minimumSectionMm2: rule.minimumSectionMm2,
      referenceConduitDiameterMm: rule.referenceConduitDiameterMm,
    },
    lines: [],
    missingInputs,
    ruleResults: [],
    ruleVersion: "electrical-takeoff@1",
  };
}

export function calculateElectricalTakeoff(input: ElectricalTakeoffInput): ElectricalTakeoffResult {
  const rule = CIRCUIT_RULES[input.circuit.code];

  if (input.jurisdiction !== "ES" || input.buildingUse !== "dwelling") {
    return emptyResult(input, "not_applicable");
  }

  const missingInputs = validateInput(input);
  if (missingInputs.length > 0) {
    return emptyResult(input, "insufficient_data", missingInputs);
  }

  if (
    input.circuit.pointCount < 0 ||
    input.segments.some(
      (segment) =>
        !Number.isInteger(segment.lengthMm) ||
        segment.lengthMm <= 0 ||
        segment.conductors.length === 0 ||
        segment.conductors.some(
          (conductor) =>
            conductor.sectionMm2 <= 0 || !Number.isInteger(conductor.count) || conductor.count <= 0,
        ),
    ) ||
    input.purchase.conductorReserveM < 0 ||
    input.purchase.conduitReserveM < 0 ||
    input.purchase.wastePercent < 0 ||
    input.purchase.commercialIncrementM <= 0
  ) {
    throw new RangeError("Invalid electrical takeoff input");
  }

  const ruleResults: ElectricalRuleResult[] = [];
  const undersizedSections = input.segments.flatMap((segment) =>
    segment.conductors
      .filter((conductor) => conductor.sectionMm2 < rule.minimumSectionMm2)
      .map((conductor) => ({
        segmentId: segment.id,
        function: conductor.function,
        sectionMm2: conductor.sectionMm2,
      })),
  );
  if (undersizedSections.length > 0) {
    ruleResults.push({
      ruleId: `ELEC-${input.circuit.code}-SECTION-001`,
      status: "blocking",
      entityIds: unique([input.circuit.id, ...undersizedSections.map((item) => item.segmentId)]),
      inputs: { minimumSectionMm2: rule.minimumSectionMm2, undersizedSections },
      explanationKey: "electrical.rule.minimumSection.blocking",
      sourceIds: [SOURCE_ID],
    });
  }

  const undersizedConduits = input.segments
    .filter(
      (segment) =>
        segment.conduit !== undefined &&
        segment.conduit.diameterMm < rule.referenceConduitDiameterMm,
    )
    .map((segment) => segment.id);
  if (undersizedConduits.length > 0) {
    ruleResults.push({
      ruleId: `ELEC-${input.circuit.code}-CONDUIT-001`,
      status: "blocking",
      entityIds: unique([input.circuit.id, ...undersizedConduits]),
      inputs: { referenceConduitDiameterMm: rule.referenceConduitDiameterMm },
      explanationKey: "electrical.rule.referenceConduit.blocking",
      sourceIds: [SOURCE_ID],
    });
  }

  if (ruleResults.some((result) => result.status === "blocking")) {
    return {
      ...emptyResult(input, "blocking"),
      ruleResults,
    };
  }

  const requiredCircuitCount =
    rule.maximumPoints === undefined
      ? undefined
      : Math.max(1, Math.ceil(input.circuit.pointCount / rule.maximumPoints));
  const additionalCircuitCount =
    requiredCircuitCount === undefined ? undefined : requiredCircuitCount - 1;

  if (additionalCircuitCount !== undefined && additionalCircuitCount > 0) {
    ruleResults.push({
      ruleId: "ELEC-EXTRA-CIRCUIT-001",
      status: "warning",
      entityIds: [input.circuit.id],
      inputs: {
        pointCount: input.circuit.pointCount,
        maximumPoints: rule.maximumPoints,
        requiredCircuitCount,
      },
      explanationKey: "electrical.rule.additionalCircuit.required",
      sourceIds: [SOURCE_ID],
    });
  }

  const conductorGroups = new Map<
    string,
    {
      function: ConductorFunction;
      color?: string;
      sectionMm2: number;
      measuredQuantity: number;
      sourceEntityIds: string[];
    }
  >();
  const conduitGroups = new Map<
    string,
    {
      system: ConduitSystem;
      diameterMm: number;
      measuredQuantity: number;
      sourceEntityIds: string[];
    }
  >();

  for (const segment of input.segments) {
    const segmentLengthM = segment.lengthMm / 1000;
    for (const conductor of segment.conductors) {
      const key = `${conductor.function}:${conductor.color ?? "unconfirmed"}:${conductor.sectionMm2}`;
      const group = conductorGroups.get(key) ?? {
        function: conductor.function,
        ...(conductor.color ? { color: conductor.color } : {}),
        sectionMm2: conductor.sectionMm2,
        measuredQuantity: 0,
        sourceEntityIds: [input.circuit.id],
      };
      group.measuredQuantity += segmentLengthM * conductor.count;
      group.sourceEntityIds.push(segment.id, ...segment.sourceEntityIds);
      conductorGroups.set(key, group);
    }

    // Presence was checked before calculation; the guard preserves type safety.
    if (segment.conduit) {
      const key = `${segment.conduit.system}:${segment.conduit.diameterMm}`;
      const group = conduitGroups.get(key) ?? {
        system: segment.conduit.system,
        diameterMm: segment.conduit.diameterMm,
        measuredQuantity: 0,
        sourceEntityIds: [input.circuit.id],
      };
      group.measuredQuantity += segmentLengthM;
      group.sourceEntityIds.push(segment.id, ...segment.sourceEntityIds);
      conduitGroups.set(key, group);
    }
  }

  const conductorLines = [...conductorGroups.values()].map((group) =>
    makeLine({
      categoryId: "electrical.conductor",
      specification: {
        function: group.function,
        ...(group.color ? { color: group.color } : {}),
        sectionMm2: group.sectionMm2,
      },
      measuredQuantity: group.measuredQuantity,
      reserveQuantity: input.purchase.conductorReserveM,
      sourceEntityIds: group.sourceEntityIds,
      wastePercent: input.purchase.wastePercent,
      commercialIncrementM: input.purchase.commercialIncrementM,
      calculationRuleId: "ELEC-CONDUCTOR-TAKEOFF-001",
      formula:
        "Σ(segmentLengthMm / 1000 × conductorCount) + fixedReserveM; then margin and commercial rounding",
      assumptions: [
        "Conductor composition and section are confirmed inputs",
        "Voltage drop and installation conditions require professional review",
      ],
    }),
  );
  const conduitLines = [...conduitGroups.values()].map((group) =>
    makeLine({
      categoryId: "electrical.conduit",
      specification: { system: group.system, diameterMm: group.diameterMm },
      measuredQuantity: group.measuredQuantity,
      reserveQuantity: input.purchase.conduitReserveM,
      sourceEntityIds: group.sourceEntityIds,
      wastePercent: input.purchase.wastePercent,
      commercialIncrementM: input.purchase.commercialIncrementM,
      calculationRuleId: "ELEC-CONDUIT-TAKEOFF-001",
      formula:
        "Σ(uniquePhysicalSegmentLengthMm / 1000) + fixedReserveM; then margin and commercial rounding",
      assumptions: [
        "Each segment represents one unique physical conduit route",
        "Conduit occupancy and maintainability require professional review",
      ],
    }),
  );

  ruleResults.push({
    ruleId: `ELEC-${input.circuit.code}-SECTION-001`,
    status: "professional_review",
    entityIds: [input.circuit.id, ...input.segments.map((segment) => segment.id)],
    inputs: {
      minimumSectionMm2: rule.minimumSectionMm2,
      referenceConduitDiameterMm: rule.referenceConduitDiameterMm,
    },
    explanationKey: "electrical.rule.operationalMinimum.professionalReview",
    sourceIds: [SOURCE_ID],
  });

  return {
    status: "professional_review",
    circuit: {
      code: input.circuit.code,
      minimumSectionMm2: rule.minimumSectionMm2,
      referenceConduitDiameterMm: rule.referenceConduitDiameterMm,
      ...(rule.maximumPoints === undefined ? {} : { maximumPoints: rule.maximumPoints }),
      ...(requiredCircuitCount === undefined ? {} : { requiredCircuitCount }),
      ...(additionalCircuitCount === undefined ? {} : { additionalCircuitCount }),
    },
    lines: [...conductorLines, ...conduitLines],
    missingInputs: [],
    ruleResults,
    ruleVersion: "electrical-takeoff@1",
  };
}
