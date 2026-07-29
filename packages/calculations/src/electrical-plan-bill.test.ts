import { describe, expect, it } from "vitest";
import { calculateElectricalPlanBill } from "./electrical-plan-bill";

describe("calculateElectricalPlanBill", () => {
  it("returns no materials or tools when the plan has no electrical objects", () => {
    const result = calculateElectricalPlanBill({ components: [] });

    expect(result.status).toBe("insufficient_data");
    expect(result.lines).toEqual([]);
    expect(result.sourceComponentCount).toBe(0);
  });

  it("only expands electrical objects that are actually present in the plan", () => {
    const result = calculateElectricalPlanBill({
      components: [
        { id: "socket-1", kind: "socket", variant: "double" },
        { id: "door-1", kind: "door", variant: "hinged" },
      ],
    });

    expect(result.sourceComponentCount).toBe(1);
    expect(
      result.lines.find((line) => line.categoryId === "electrical.device.socket"),
    ).toMatchObject({
      purchaseQuantity: 1,
      sourceEntityIds: ["socket-1"],
      specification: { variant: "double" },
    });
    expect(result.lines.some((line) => line.categoryId.includes("light"))).toBe(false);
    expect(result.lines.some((line) => line.categoryId.includes("door"))).toBe(false);
  });

  it("aggregates shared auxiliaries and includes each required tool once", () => {
    const result = calculateElectricalPlanBill({
      components: [
        { id: "switch-1", kind: "switch", variant: "single" },
        { id: "switch-2", kind: "switch", variant: "two_way" },
        { id: "light-1", kind: "light", variant: "ceiling" },
      ],
    });

    expect(result.lines.find((line) => line.categoryId === "electrical.box.flush")).toMatchObject({
      purchaseQuantity: 2,
      sourceEntityIds: ["switch-1", "switch-2"],
    });
    expect(result.lines.filter((line) => line.kind === "tool")).toHaveLength(3);
    expect(result.lines.some((line) => line.categoryId === "electrical.device.socket")).toBe(false);
    expect(result.missingInputs).toContain("electrical.routes");
    expect(result.status).toBe("professional_review");
  });

  it("keeps commercial variants as separate material lines", () => {
    const result = calculateElectricalPlanBill({
      components: [
        { id: "socket-1", kind: "socket", variant: "single" },
        { id: "socket-2", kind: "socket", variant: "double" },
      ],
    });

    const sockets = result.lines.filter((line) => line.categoryId === "electrical.device.socket");
    expect(sockets).toHaveLength(2);
    expect(sockets.map((line) => line.specification.variant).sort()).toEqual(["double", "single"]);
  });
});
