import { describe, expect, it } from "vitest";
import { calculateElectricalProjectTakeoff } from "./electrical-project-takeoff";

describe("calculateElectricalProjectTakeoff", () => {
  it("keeps component materials pending when no confirmed circuit route exists", () => {
    const result = calculateElectricalProjectTakeoff({
      components: [{ id: "00000000-0000-4000-8000-000000000001", kind: "socket" }],
      circuits: [],
    });

    expect(result.lines.some((line) => line.categoryId === "electrical.device.socket")).toBe(true);
    expect(result.lines.some((line) => line.categoryId === "electrical.conductor")).toBe(false);
    expect(result.missingInputs).toContain("electrical.routes");
  });

  it("combines plan recipes with measured cable and conduit without duplicating the conduit", () => {
    const result = calculateElectricalProjectTakeoff({
      components: [{ id: "00000000-0000-4000-8000-000000000001", kind: "socket" }],
      circuits: [
        {
          id: "00000000-0000-4000-8000-000000000010",
          code: "C2",
          terminalIds: ["00000000-0000-4000-8000-000000000001"],
          segments: [
            {
              id: "00000000-0000-4000-8000-000000000020",
              lengthMm: 10_000,
              sourceEntityIds: [
                "00000000-0000-4000-8000-000000000001",
                "00000000-0000-4000-8000-000000000099",
              ],
              conductors: [
                { function: "phase", sectionMm2: 2.5, count: 1 },
                { function: "neutral", sectionMm2: 2.5, count: 1 },
                { function: "protective", sectionMm2: 2.5, count: 1 },
              ],
              conduit: { system: "embedded-tube", diameterMm: 20 },
            },
          ],
        },
      ],
      purchase: {
        conductorReserveM: 0,
        conduitReserveM: 0,
        wastePercent: 0,
        commercialIncrementM: 1,
      },
    });

    expect(
      result.lines
        .filter((line) => line.categoryId === "electrical.conductor")
        .reduce((total, line) => total + line.quantityBase, 0),
    ).toBe(30);
    expect(
      result.lines.find((line) => line.categoryId === "electrical.conduit")?.quantityBase,
    ).toBe(10);
    expect(result.missingInputs).not.toContain("electrical.routes");
  });
});
