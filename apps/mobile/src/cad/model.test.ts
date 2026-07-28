import { describe, expect, it } from "vitest";
import {
  cadTemplates,
  closestWallPoint,
  documentForSpaceId,
  edgeLengthMm,
  moveOrthogonalVertex,
  reprojectHostedMarkers,
  resizeWall,
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

  it("resizes a selected wall in millimetres", () => {
    const resized = resizeWall(cadTemplates.rectangle(4000, 3000), 0, 5200);
    expect(resized[1]).toEqual({ x: 5200, y: 0 });
    expect(edgeLengthMm(resized[0]!, resized[1]!)).toBe(5200);
  });

  it("keeps hosted components attached when their wall is resized", () => {
    const previous = cadTemplates.rectangle(4000, 3000);
    const next = resizeWall(previous, 0, 6000);
    const marker = {
      id: "door-1",
      kind: "door" as const,
      point: { x: 2000, y: 0 },
      wallIndex: 0,
      widthMm: 900,
      heightMm: 2100,
      elevationMm: 0,
    };
    expect(reprojectHostedMarkers([marker], previous, next)[0]?.point).toEqual({ x: 3000, y: 0 });
  });
});
