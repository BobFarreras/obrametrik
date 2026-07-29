import { describe, expect, it } from "vitest";
import {
  doorLeafCorners,
  findInteriorPoint,
  isPointInsidePolygon,
  moveWalkCamera,
  wallOpeningCorners,
} from "./cad-camera";

const room = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 3000 },
  { x: 0, y: 3000 },
];

describe("technical camera geometry", () => {
  it("keeps the person camera inside the room contour", () => {
    expect(isPointInsidePolygon({ x: 2000, y: 1500 }, room)).toBe(true);
    expect(moveWalkCamera({ x: 2000, y: 1500 }, 0, 500, 0, room)).toEqual({
      x: 2500,
      y: 1500,
    });
    expect(moveWalkCamera({ x: 3800, y: 1500 }, 0, 500, 0, room)).toEqual({
      x: 3800,
      y: 1500,
    });
  });

  it("slides along a wall instead of stopping diagonal movement completely", () => {
    expect(moveWalkCamera({ x: 3800, y: 1500 }, 45, 500, 0, room)).toEqual({
      x: 3800,
      y: 1854,
    });
  });

  it("builds a correctly sized opening plane on its host wall", () => {
    expect(
      wallOpeningCorners({ x: 2000, y: 0 }, room[0]!, room[1]!, 1000, 900, 1200),
    ).toEqual([
      { x: 1500, y: 0, z: 900 },
      { x: 2500, y: 0, z: 900 },
      { x: 2500, y: 0, z: 2100 },
      { x: 1500, y: 0, z: 2100 },
    ]);
  });

  it("opens a door leaf ninety degrees towards the room interior", () => {
    expect(doorLeafCorners({ x: 2000, y: 0 }, room[0]!, room[1]!, 900, 2100, room)).toEqual([
      { x: 1550, y: 0, z: 0 },
      { x: 1550, y: 900, z: 0 },
      { x: 1550, y: 900, z: 2100 },
      { x: 1550, y: 0, z: 2100 },
    ]);
  });

  it("finds a valid camera start inside a concave U-shaped room", () => {
    const uShape = [
      { x: 0, y: 0 },
      { x: 5000, y: 0 },
      { x: 5000, y: 3500 },
      { x: 3600, y: 3500 },
      { x: 3600, y: 1600 },
      { x: 1400, y: 1600 },
      { x: 1400, y: 3500 },
      { x: 0, y: 3500 },
    ];
    expect(isPointInsidePolygon(findInteriorPoint(uShape), uShape)).toBe(true);
  });
});
