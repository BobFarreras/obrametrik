import { describe, expect, it } from "vitest";
import { GenerateElectricalTakeoffUseCase } from "./use-cases/generate-electrical-takeoff";

describe("GenerateElectricalTakeoffUseCase", () => {
  it("delegates confirmed technical inputs to the versioned deterministic engine", () => {
    const result = new GenerateElectricalTakeoffUseCase().execute({
      jurisdiction: "ES",
      buildingUse: "dwelling",
      normativeDate: "2026-07-28",
      circuit: { id: "11111111-1111-4111-8111-111111111111", code: "C1", pointCount: 1 },
      segments: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          lengthMm: 5000,
          sourceEntityIds: [],
          conductors: [
            { function: "phase", sectionMm2: 1.5, count: 1 },
            { function: "neutral", sectionMm2: 1.5, count: 1 },
            { function: "protective", sectionMm2: 1.5, count: 1 },
          ],
          conduit: { system: "embedded-tube", diameterMm: 16 },
        },
      ],
      purchase: {
        conductorReserveM: 1,
        conduitReserveM: 0,
        wastePercent: 10,
        commercialIncrementM: 5,
      },
    });

    expect(result.ruleVersion).toBe("electrical-takeoff@1");
    expect(result.lines).toHaveLength(4);
  });
});
