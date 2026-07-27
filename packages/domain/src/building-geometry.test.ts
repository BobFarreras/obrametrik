import { describe, expect, it } from "vitest";
import { assertValidSpaceDraft, type BuildingSpaceDraft } from "./building-model";

const validDraft: BuildingSpaceDraft = {
  projectId: "project-1",
  levelId: "level-1",
  name: "Bany en L",
  kind: "bathroom",
  footprint: {
    kind: "polygon",
    vertices: [
      { x: 0, y: 0 },
      { x: 3000, y: 0 },
      { x: 3000, y: 1800 },
      { x: 1800, y: 1800 },
      { x: 1800, y: 3000 },
      { x: 0, y: 3000 },
    ],
  },
  clearHeightMm: 2500,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
  },
  geometrySource: "manual",
  confirmation: "confirmed",
};

describe("space geometry", () => {
  it("accepts a confirmed L-shaped polygon in integer millimetres", () => {
    expect(() => assertValidSpaceDraft(validDraft)).not.toThrow();
  });

  it("rejects decimal millimetres", () => {
    expect(() =>
      assertValidSpaceDraft({
        ...validDraft,
        footprint: {
          kind: "polygon",
          vertices: [
            { x: 0, y: 0 },
            { x: 3000.5, y: 0 },
            { x: 0, y: 3000 },
          ],
        },
      }),
    ).toThrow("integer millimetres");
  });

  it("rejects self-intersecting polygons", () => {
    expect(() =>
      assertValidSpaceDraft({
        ...validDraft,
        footprint: {
          kind: "polygon",
          vertices: [
            { x: 0, y: 0 },
            { x: 3000, y: 3000 },
            { x: 0, y: 3000 },
            { x: 3000, y: 0 },
          ],
        },
      }),
    ).toThrow("self-intersect");
  });

  it("rejects rectangles with non-positive dimensions", () => {
    expect(() =>
      assertValidSpaceDraft({
        ...validDraft,
        footprint: { kind: "rectangle", widthMm: 3000, depthMm: 0 },
      }),
    ).toThrow("dimensions");
  });
});
