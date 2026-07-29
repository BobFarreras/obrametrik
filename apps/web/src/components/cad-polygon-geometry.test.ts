import { describe, expect, it } from "vitest";
import { isSimplePolygon, moveVertex, resizeWall } from "./cad-polygon-geometry";

const rectangle = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 3000 },
  { x: 0, y: 3000 },
];

describe("CAD polygon constraints", () => {
  it("resizes a wall to an exact millimetre length along its axis", () => {
    expect(resizeWall(rectangle, 0, 5250)[1]).toEqual({ x: 5250, y: 0 });
  });

  it("keeps both adjacent walls orthogonal while moving a vertex", () => {
    expect(moveVertex(rectangle, 1, { x: 4800, y: 600 }, true)).toEqual([
      { x: 0, y: 600 },
      { x: 4800, y: 600 },
      { x: 4800, y: 3000 },
      { x: 0, y: 3000 },
    ]);
  });

  it("allows free vertex movement when the constraint is disabled", () => {
    expect(moveVertex(rectangle, 1, { x: 4800, y: 600 }, false)[1]).toEqual({
      x: 4800,
      y: 600,
    });
    expect(moveVertex(rectangle, 1, { x: 4800, y: 600 }, false)[0]).toEqual({ x: 0, y: 0 });
  });

  it("accepts a simple contour and rejects a self-intersecting one", () => {
    expect(isSimplePolygon(rectangle)).toBe(true);
    expect(
      isSimplePolygon([
        { x: 0, y: 0 },
        { x: 3000, y: 3000 },
        { x: 0, y: 3000 },
        { x: 3000, y: 0 },
      ]),
    ).toBe(false);
  });
});
