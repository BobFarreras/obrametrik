import type { Point2Mm } from "@obrametrik/domain";

export function isPointInsidePolygon(point: Point2Mm, vertices: readonly Point2Mm[]): boolean {
  let inside = false;
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index++) {
    const a = vertices[index]!;
    const b = vertices[previous]!;
    if (
      (a.y > point.y) !== (b.y > point.y) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export function moveWalkCamera(
  position: Point2Mm,
  yawDegrees: number,
  forwardMm: number,
  strafeMm: number,
  vertices: readonly Point2Mm[],
): Point2Mm {
  const yaw = (yawDegrees * Math.PI) / 180;
  const candidate = {
    x: Math.round(position.x + Math.cos(yaw) * forwardMm - Math.sin(yaw) * strafeMm),
    y: Math.round(position.y + Math.sin(yaw) * forwardMm + Math.cos(yaw) * strafeMm),
  };
  return isPointInsidePolygon(candidate, vertices) ? candidate : position;
}

export function findInteriorPoint(vertices: readonly Point2Mm[]): Point2Mm {
  const minX = Math.min(...vertices.map((point) => point.x));
  const maxX = Math.max(...vertices.map((point) => point.x));
  const minY = Math.min(...vertices.map((point) => point.y));
  const maxY = Math.max(...vertices.map((point) => point.y));
  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  if (isPointInsidePolygon(center, vertices)) return center;
  let best = vertices[0] ?? { x: 0, y: 0 };
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let row = 1; row < 20; row += 1) {
    for (let column = 1; column < 20; column += 1) {
      const candidate = {
        x: minX + ((maxX - minX) * column) / 20,
        y: minY + ((maxY - minY) * row) / 20,
      };
      if (!isPointInsidePolygon(candidate, vertices)) continue;
      const distance = Math.hypot(candidate.x - center.x, candidate.y - center.y);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return { x: Math.round(best.x), y: Math.round(best.y) };
}

export function wallOpeningCorners(
  point: Point2Mm,
  wallStart: Point2Mm,
  wallEnd: Point2Mm,
  widthMm: number,
  elevationMm: number,
  heightMm: number,
): readonly { x: number; y: number; z: number }[] {
  const length = Math.hypot(wallEnd.x - wallStart.x, wallEnd.y - wallStart.y);
  if (length === 0) return [];
  const unitX = (wallEnd.x - wallStart.x) / length;
  const unitY = (wallEnd.y - wallStart.y) / length;
  const half = widthMm / 2;
  return [
    { x: point.x - unitX * half, y: point.y - unitY * half, z: elevationMm },
    { x: point.x + unitX * half, y: point.y + unitY * half, z: elevationMm },
    { x: point.x + unitX * half, y: point.y + unitY * half, z: elevationMm + heightMm },
    { x: point.x - unitX * half, y: point.y - unitY * half, z: elevationMm + heightMm },
  ];
}
