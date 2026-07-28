import { describe, expect, it } from "vitest";
import {
  cadTemplates,
  closestWallPoint,
  documentForSpaceId,
  moveOrthogonalVertex,
  toCadPlan,
  type MobileCadDocument,
} from "./model";

describe("mobile CAD model", () => {
  it("projects a technical component to the closest host wall", () => {
    expect(closestWallPoint(cadTemplates.rectangle(4000, 3000), { x: 1900, y: 140 }, 900))
      .toEqual({ point: { x: 1900, y: 0 }, wallIndex: 0 });
  });

  it("keeps openings inside wall endpoints", () => {
    expect(closestWallPoint(cadTemplates.rectangle(4000, 3000), { x: 20, y: 20 }, 1000))
      .toEqual({ point: { x: 500, y: 0 }, wallIndex: 0 });
  });

  it("serializes millimetres without UI-specific state", () => {
    const document: MobileCadDocument = {
      name: "Bany",
      kind: "bathroom",
      vertices: cadTemplates.rectangle(3000, 2200),
      clearHeightMm: 2500,
      markers: [],
    };
    expect(toCadPlan("project-1", document)).toMatchObject({
      projectId: "project-1",
      clearHeightMm: 2500,
      components: [],
    });
  });

  it("does not silently open a different space when a requested id is unavailable", () => {
    expect(() => documentForSpaceId([], [], "space-not-authorized")).toThrow(
      "Requested CAD space is not available",
    );
  });

  it("moves a corner while keeping both adjacent walls orthogonal", () => {
    expect(
      moveOrthogonalVertex(cadTemplates.rectangle(4000, 3000), 1, { x: 4600, y: 500 }),
    ).toEqual([
      { x: 0, y: 500 },
      { x: 4600, y: 500 },
      { x: 4600, y: 3000 },
      { x: 0, y: 3000 },
    ]);
  });
});
