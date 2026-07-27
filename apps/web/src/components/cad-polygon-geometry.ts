import type { Point2Mm } from "@obrametrik/domain";

export function resizeWall(
  vertices: readonly Point2Mm[],
  wallIndex: number,
  lengthMm: number,
): readonly Point2Mm[] {
  const start = vertices[wallIndex];
  const endIndex = (wallIndex + 1) % vertices.length;
  const end = vertices[endIndex];
  if (!start || !end || !Number.isFinite(lengthMm) || lengthMm < 100) return vertices;
  const currentLength = Math.hypot(end.x - start.x, end.y - start.y);
  if (currentLength === 0) return vertices;
  const nextEnd = {
    x: Math.round(start.x + ((end.x - start.x) / currentLength) * lengthMm),
    y: Math.round(start.y + ((end.y - start.y) / currentLength) * lengthMm),
  };
  return vertices.map((vertex, index) => (index === endIndex ? nextEnd : vertex));
}

function isHorizontal(start: Point2Mm, end: Point2Mm): boolean {
  return Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
}

/**
 * Moves one vertex while preserving the previous orientation of both adjacent
 * walls. The neighbouring vertices are adjusted only on the perpendicular
 * coordinate, matching an orthogonal CAD constraint.
 */
export function moveVertex(
  vertices: readonly Point2Mm[],
  vertexIndex: number,
  point: Point2Mm,
  orthogonal: boolean,
): readonly Point2Mm[] {
  if (!vertices[vertexIndex]) return vertices;
  if (!orthogonal || vertices.length < 4) {
    return vertices.map((vertex, index) => (index === vertexIndex ? point : vertex));
  }
  const previousIndex = (vertexIndex - 1 + vertices.length) % vertices.length;
  const nextIndex = (vertexIndex + 1) % vertices.length;
  const previous = vertices[previousIndex]!;
  const current = vertices[vertexIndex]!;
  const next = vertices[nextIndex]!;
  const result = vertices.map((vertex) => ({ ...vertex }));
  result[vertexIndex] = point;

  if (isHorizontal(previous, current)) result[previousIndex] = { ...previous, y: point.y };
  else result[previousIndex] = { ...previous, x: point.x };

  if (isHorizontal(current, next)) result[nextIndex] = { ...next, y: point.y };
  else result[nextIndex] = { ...next, x: point.x };
  return result;
}

function orientation(a: Point2Mm, b: Point2Mm, c: Point2Mm): number {
  return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}

function segmentsIntersect(a: Point2Mm, b: Point2Mm, c: Point2Mm, d: Point2Mm): boolean {
  return orientation(a, b, c) !== orientation(a, b, d) &&
    orientation(c, d, a) !== orientation(c, d, b);
}

export function isSimplePolygon(vertices: readonly Point2Mm[]): boolean {
  if (vertices.length < 3) return false;
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]!;
    const b = vertices[(index + 1) % vertices.length]!;
    if (a.x === b.x && a.y === b.y) return false;
    for (let candidate = index + 1; candidate < vertices.length; candidate += 1) {
      if (
        candidate === index ||
        candidate === (index + 1) % vertices.length ||
        (candidate + 1) % vertices.length === index
      ) {
        continue;
      }
      const c = vertices[candidate]!;
      const d = vertices[(candidate + 1) % vertices.length]!;
      if (segmentsIntersect(a, b, c, d)) return false;
    }
  }
  return true;
}
