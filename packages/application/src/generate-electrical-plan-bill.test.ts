import type { BuildingElement } from "@obrametrik/domain";
import { describe, expect, it } from "vitest";
import { GenerateElectricalPlanBillUseCase } from "./use-cases/generate-electrical-plan-bill";

function element(
  id: string,
  terminalKind: string,
  lifecycle: BuildingElement["lifecycle"] = "new",
): BuildingElement {
  return {
    id,
    projectId: "project-1",
    spaceId: "space-1",
    hostElementId: "wall-1",
    hostFace: "interior",
    kind: "terminal",
    name: terminalKind,
    transform: {
      position: { x: 0, y: 0, z: 350 },
      rotationDegrees: { x: 0, y: 0, z: 0 },
    },
    dimensionsMm: { width: 100, height: 100, depth: 50 },
    specification: { source: "cad", terminalKind, variant: "single" },
    lifecycle,
    confirmation: "confirmed",
  };
}

describe("GenerateElectricalPlanBillUseCase", () => {
  it("uses confirmed active CAD terminals and ignores removed or unrelated elements", () => {
    const result = new GenerateElectricalPlanBillUseCase().execute([
      element("socket-1", "socket"),
      element("removed-socket", "socket", "to_remove"),
      { ...element("water-1", "cold_water"), confirmation: "estimated" },
    ]);

    expect(result.sourceComponentCount).toBe(1);
    expect(
      result.lines.find((line) => line.categoryId === "electrical.device.socket"),
    ).toMatchObject({
      purchaseQuantity: 1,
      sourceEntityIds: ["socket-1"],
    });
  });
});
