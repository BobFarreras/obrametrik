import type { BuildingElement } from "@obrametrik/domain";
import { describe, expect, it } from "vitest";
import { GenerateElectricalProjectTakeoffUseCase } from "./use-cases/generate-electrical-project-takeoff";

const socket: BuildingElement = {
  id: "00000000-0000-4000-8000-000000000001",
  projectId: "00000000-0000-4000-8000-000000000002",
  spaceId: "00000000-0000-4000-8000-000000000003",
  hostElementId: null,
  hostFace: null,
  kind: "terminal",
  name: "socket",
  transform: {
    position: { x: 0, y: 0, z: 350 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
  },
  dimensionsMm: { width: 80, height: 80, depth: 40 },
  specification: { terminalKind: "socket", componentVariant: "double" },
  lifecycle: "new",
  confirmation: "confirmed",
};

describe("GenerateElectricalProjectTakeoffUseCase", () => {
  it("maps confirmed CAD variants and explicit circuits into one takeoff", () => {
    const result = new GenerateElectricalProjectTakeoffUseCase().execute({
      elements: [socket],
      circuits: [],
    });

    expect(
      result.lines.find((line) => line.categoryId === "electrical.device.socket"),
    ).toMatchObject({ specification: { variant: "double" } });
  });
});
