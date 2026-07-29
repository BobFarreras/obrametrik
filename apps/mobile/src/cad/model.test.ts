import { describe, expect, it } from "vitest";
import {
  cadTemplates,
  closestWallPoint,
  documentForSpaceId,
  edgeLengthMm,
  moveWall,
  moveOrthogonalVertex,
  openingClearancesMm,
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

  it("serializes the selected technical variant as shared CAD metadata", () => {
    const document: MobileCadDocument = {
      name: "Bany",
      kind: "bathroom",
      vertices: cadTemplates.rectangle(3000, 2200),
      clearHeightMm: 2500,
      markers: [{
        id: "door-1",
        kind: "door",
        variant: "sliding",
        swing: "left_in",
        point: { x: 1500, y: 0 },
        wallIndex: 0,
        widthMm: 900,
        heightMm: 2100,
        elevationMm: 0,
      }],
    };
    expect(toCadPlan("project-1", document).components[0]).toMatchObject({
      kind: "door",
      variant: "sliding",
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
      variant: "hinged" as const,
    };
    expect(reprojectHostedMarkers([marker], previous, next)[0]?.point).toEqual({ x: 3000, y: 0 });
  });

  it("moves a complete wall without changing its length", () => {
    const moved = moveWall(cadTemplates.rectangle(4000, 3000), 0, { x: 0, y: 500 });
    expect(moved[0]).toEqual({ x: 0, y: 500 });
    expect(moved[1]).toEqual({ x: 4000, y: 500 });
    expect(edgeLengthMm(moved[0]!, moved[1]!)).toBe(4000);
  });

  it("calculates both clearances around a centred opening", () => {
    expect(openingClearancesMm({
      id: "door-1",
      kind: "door",
      point: { x: 500, y: 0 },
      wallIndex: 0,
      widthMm: 500,
      heightMm: 2100,
      elevationMm: 0,
      swing: "left_in",
      variant: "hinged",
    }, cadTemplates.rectangle(1000, 800))).toEqual({ beforeMm: 250, afterMm: 250 });
  });
});
