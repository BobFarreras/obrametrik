import type { Point2Mm } from "@obrametrik/domain";
import { edgeLengthMm, type MobileCadMarker } from "./model";

export type SceneWallSegment = Readonly<{
  wallIndex: number;
  role: "solid" | "above" | "below";
  centerMm: { x: number; y: number; z: number };
  lengthMm: number;
  heightMm: number;
  angleRad: number;
}>;

export type CadSceneModel = Readonly<{
  centerMm: Point2Mm;
  extentMm: number;
  floor: { vertices: readonly Point2Mm[] };
  wallSegments: readonly SceneWallSegment[];
}>;

type Opening = Readonly<{
  startMm: number;
  endMm: number;
  bottomMm: number;
  topMm: number;
}>;

function longitudinalOffset(point: Point2Mm, start: Point2Mm, end: Point2Mm): number {
  const length = edgeLengthMm(start, end);
  if (!length) return 0;
  return ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / length;
}

export function buildCadScene(
  vertices: readonly Point2Mm[],
  clearHeightMm: number,
  markers: readonly MobileCadMarker[],
): CadSceneModel {
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);
  const centerMm = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
  const wallSegments: SceneWallSegment[] = [];

  vertices.forEach((start, wallIndex) => {
    const end = vertices[(wallIndex + 1) % vertices.length]!;
    const wallLength = edgeLengthMm(start, end);
    if (!wallLength) return;
    const dx = (end.x - start.x) / wallLength;
    const dy = (end.y - start.y) / wallLength;
    const angleRad = Math.atan2(end.y - start.y, end.x - start.x);
    const openings: Opening[] = markers
      .filter((marker) => marker.wallIndex === wallIndex && (marker.kind === "door" || marker.kind === "window"))
      .map((marker) => {
        const center = longitudinalOffset(marker.point, start, end);
        return {
          startMm: Math.max(0, center - marker.widthMm / 2),
          endMm: Math.min(wallLength, center + marker.widthMm / 2),
          bottomMm: Math.max(0, marker.elevationMm),
          topMm: Math.min(clearHeightMm, marker.elevationMm + marker.heightMm),
        };
      })
      .sort((a, b) => a.startMm - b.startMm);

    function addSegment(
      fromMm: number,
      toMm: number,
      bottomMm: number,
      topMm: number,
      role: SceneWallSegment["role"],
    ) {
      if (toMm - fromMm < 1 || topMm - bottomMm < 1) return;
      const along = (fromMm + toMm) / 2;
      wallSegments.push({
        wallIndex,
        role,
        centerMm: {
          x: start.x + dx * along,
          y: start.y + dy * along,
          z: (bottomMm + topMm) / 2,
        },
        lengthMm: toMm - fromMm,
        heightMm: topMm - bottomMm,
        angleRad,
      });
    }

    let cursor = 0;
    openings.forEach((opening) => {
      addSegment(cursor, opening.startMm, 0, clearHeightMm, "solid");
      addSegment(opening.startMm, opening.endMm, opening.topMm, clearHeightMm, "above");
      addSegment(opening.startMm, opening.endMm, 0, opening.bottomMm, "below");
      cursor = Math.max(cursor, opening.endMm);
    });
    addSegment(cursor, wallLength, 0, clearHeightMm, "solid");
  });

  return {
    centerMm,
    extentMm: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), clearHeightMm),
    floor: { vertices },
    wallSegments,
  };
}
