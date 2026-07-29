import { describe, expect, it } from "vitest";
import {
  calculatePreliminaryElectricalPanel,
  type PreliminaryElectricalPanelInput,
} from "./electrical-panel";

const baseInput = {
  jurisdiction: "ES",
  buildingUse: "dwelling",
  circuits: [
    { id: "c1", code: "C1", breakerRatingA: 10, breakerModules: 1 },
    { id: "c2", code: "C2", breakerRatingA: 16, breakerModules: 1 },
    { id: "c3", code: "C3", breakerRatingA: 25, breakerModules: 1 },
    { id: "c4", code: "C4", breakerRatingA: 20, breakerModules: 1 },
    { id: "c5", code: "C5", breakerRatingA: 16, breakerModules: 1 },
  ],
  residualCurrentDevices: [{ id: "rcd-1", sensitivityMa: 30, modules: 2 }],
  otherDevices: [
    { id: "iga-1", categoryId: "electrical.main-breaker", quantity: 1, modulesEach: 2 },
  ],
  reserveModules: 4,
  enclosureCapacityModules: 18,
} satisfies PreliminaryElectricalPanelInput;

describe("calculatePreliminaryElectricalPanel", () => {
  it("calculates occupied modules, explicit reserve and auditable device lines", () => {
    const result = calculatePreliminaryElectricalPanel(baseInput);

    expect(result).toMatchObject({
      status: "professional_review",
      circuitCount: 5,
      minimumRcdCount: 1,
      occupiedModules: 9,
      reserveModules: 4,
      minimumCapacityModules: 13,
    });
    expect(result.lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: "electrical.miniature-circuit-breaker",
          quantity: 1,
          specification: { circuitCode: "C1", ratingA: 10 },
          sourceEntityIds: ["c1"],
        }),
        expect.objectContaining({
          categoryId: "electrical.residual-current-device",
          quantity: 1,
          specification: { sensitivityMa: 30 },
          calculationRuleId: "ELEC-RCD-COUNT-001",
        }),
      ]),
    );
  });

  it("requires a second residual-current device for the sixth circuit", () => {
    const result = calculatePreliminaryElectricalPanel({
      ...baseInput,
      circuits: [
        ...baseInput.circuits,
        { id: "c2-extra", code: "C2", breakerRatingA: 16, breakerModules: 1 },
      ],
    });

    expect(result.status).toBe("blocking");
    expect(result.minimumRcdCount).toBe(2);
    expect(result.ruleResults).toContainEqual(
      expect.objectContaining({ ruleId: "ELEC-RCD-COUNT-001", status: "blocking" }),
    );
  });

  it("blocks a residual-current device above 30 mA", () => {
    const result = calculatePreliminaryElectricalPanel({
      ...baseInput,
      residualCurrentDevices: [{ id: "rcd-1", sensitivityMa: 300, modules: 2 }],
    });

    expect(result.status).toBe("blocking");
    expect(result.ruleResults).toContainEqual(
      expect.objectContaining({ ruleId: "ELEC-RCD-SENSITIVITY-001", status: "blocking" }),
    );
  });

  it("blocks a confirmed enclosure that cannot contain occupied modules and reserve", () => {
    const result = calculatePreliminaryElectricalPanel({
      ...baseInput,
      enclosureCapacityModules: 12,
    });

    expect(result.status).toBe("blocking");
    expect(result.ruleResults).toContainEqual(
      expect.objectContaining({ ruleId: "ELEC-PANEL-CAPACITY-001", status: "blocking" }),
    );
  });

  it("returns insufficient data when enclosure capacity is not confirmed", () => {
    const { enclosureCapacityModules: _capacity, ...withoutCapacity } = baseInput;
    const result = calculatePreliminaryElectricalPanel(withoutCapacity);

    expect(result).toMatchObject({
      status: "insufficient_data",
      missingInputs: ["enclosureCapacityModules"],
      lines: [],
    });
  });
});
