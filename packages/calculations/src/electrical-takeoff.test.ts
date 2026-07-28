import { describe, expect, it } from "vitest";
import { calculateElectricalTakeoff, type ElectricalTakeoffInput } from "./electrical-takeoff";

const baseSegment = {
  id: "segment-panel-box",
  lengthMm: 4000,
  sourceEntityIds: ["panel-1", "box-1"],
  conductors: [
    { function: "phase", sectionMm2: 1.5, count: 1 },
    { function: "neutral", sectionMm2: 1.5, count: 1 },
    { function: "protective", sectionMm2: 1.5, count: 1 },
  ],
  conduit: { system: "embedded-tube", diameterMm: 16 },
} satisfies ElectricalTakeoffInput["segments"][number];

const baseInput = {
  jurisdiction: "ES",
  buildingUse: "dwelling" as const,
  normativeDate: "2026-07-26",
  circuit: {
    id: "circuit-c1",
    code: "C1" as const,
    pointCount: 2,
  },
  segments: [baseSegment],
  purchase: {
    conductorReserveM: 1,
    conduitReserveM: 0,
    wastePercent: 10,
    commercialIncrementM: 5,
  },
} satisfies ElectricalTakeoffInput;

const { conduit: _confirmedConduit, ...segmentWithoutConduit } = baseSegment;

describe("calculateElectricalTakeoff", () => {
  it("calculates auditable conductors and counts a physical conduit only once", () => {
    const result = calculateElectricalTakeoff(baseInput);

    expect(result.status).toBe("professional_review");
    expect(result.circuit.requiredCircuitCount).toBe(1);
    expect(result.lines).toHaveLength(4);
    expect(result.lines.find((line) => line.categoryId === "electrical.conduit")).toMatchObject({
      quantityBase: 4,
      quantityWithWaste: 4.4,
      purchaseQuantity: 5,
      sourceEntityIds: ["circuit-c1", "segment-panel-box", "panel-1", "box-1"],
    });
    expect(
      result.lines.find(
        (line) =>
          line.categoryId === "electrical.conductor" && line.specification.function === "phase",
      ),
    ).toMatchObject({
      quantityBase: 5,
      quantityWithWaste: 5.5,
      purchaseQuantity: 10,
      calculationRuleId: "ELEC-CONDUCTOR-TAKEOFF-001",
      sourceIds: ["BOE-A-2002-18099:ITC-BT-25"],
    });
  });

  it("keeps the exact circuit limit without requesting an extra circuit", () => {
    const result = calculateElectricalTakeoff({
      ...baseInput,
      circuit: { ...baseInput.circuit, pointCount: 30 },
    });

    expect(result.circuit).toMatchObject({
      maximumPoints: 30,
      requiredCircuitCount: 1,
      additionalCircuitCount: 0,
    });
  });

  it("requests additional circuits instead of silently exceeding the point limit", () => {
    const result = calculateElectricalTakeoff({
      ...baseInput,
      circuit: { ...baseInput.circuit, pointCount: 31 },
    });

    expect(result.circuit).toMatchObject({
      requiredCircuitCount: 2,
      additionalCircuitCount: 1,
    });
    expect(result.ruleResults).toContainEqual(
      expect.objectContaining({
        ruleId: "ELEC-EXTRA-CIRCUIT-001",
        status: "warning",
      }),
    );
  });

  it("returns insufficient data when a required technical value is absent", () => {
    const result = calculateElectricalTakeoff({
      ...baseInput,
      segments: [segmentWithoutConduit],
    });

    expect(result).toMatchObject({
      status: "insufficient_data",
      lines: [],
      missingInputs: ["segments[0].conduit"],
    });
  });

  it("does not apply Spanish dwelling rules to another jurisdiction", () => {
    const result = calculateElectricalTakeoff({
      ...baseInput,
      jurisdiction: "FR",
    });

    expect(result).toMatchObject({
      status: "not_applicable",
      lines: [],
    });
  });

  it("blocks takeoff when confirmed section or conduit is below the rule minimum", () => {
    const result = calculateElectricalTakeoff({
      ...baseInput,
      segments: [
        {
          ...baseSegment,
          conductors: [
            { function: "phase", sectionMm2: 1, count: 1 },
            { function: "neutral", sectionMm2: 1.5, count: 1 },
          ],
          conduit: { system: "embedded-tube", diameterMm: 12 },
        },
      ],
    });

    expect(result.status).toBe("blocking");
    expect(result.lines).toEqual([]);
    expect(result.ruleResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "ELEC-C1-SECTION-001", status: "blocking" }),
        expect.objectContaining({ ruleId: "ELEC-C1-CONDUIT-001", status: "blocking" }),
      ]),
    );
  });
});
