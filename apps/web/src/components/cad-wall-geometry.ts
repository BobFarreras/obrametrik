import type { Point2Mm } from "@obrametrik/domain";

export type WallHostedMarker = Readonly<{
  wallIndex: number;
  point: Point2Mm;
  kind: string;
  widthMm: number;
}>;

function positionRatio(point: Point2Mm, start: Point2Mm, end: Point2Mm): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return 0.5;
  return Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
  );
}

function clampHostedRatio(marker: WallHostedMarker, ratio: number, wallLength: number): number {
  const bounded = Math.max(0, Math.min(1, ratio));
  if ((marker.kind !== "door" && marker.kind !== "window") || wallLength <= 0) return bounded;
  const edgeRatio = marker.widthMm / 2 / wallLength;
  return edgeRatio >= 0.5 ? 0.5 : Math.max(edgeRatio, Math.min(1 - edgeRatio, bounded));
}

/**
 * Preserves every hosted element's longitudinal position when its wall moves.
 * Openings are clamped by their physical width so their centre cannot leave
 * part of the opening outside the resulting wall.
 */
export function reprojectHostedMarkers<T extends WallHostedMarker>(
  markers: readonly T[],
  previousVertices: readonly Point2Mm[],
  nextVertices: readonly Point2Mm[],
): readonly T[] {
  return markers.map((marker) => {
    const previousStart = previousVertices[marker.wallIndex];
    const previousEnd = previousVertices[(marker.wallIndex + 1) % previousVertices.length];
    const nextStart = nextVertices[marker.wallIndex];
    const nextEnd = nextVertices[(marker.wallIndex + 1) % nextVertices.length];
    if (!previousStart || !previousEnd || !nextStart || !nextEnd) return marker;

    let ratio = positionRatio(marker.point, previousStart, previousEnd);
    const nextDx = nextEnd.x - nextStart.x;
    const nextDy = nextEnd.y - nextStart.y;
    const nextLength = Math.hypot(nextDx, nextDy);
    ratio = clampHostedRatio(marker, ratio, nextLength);

    return {
      ...marker,
      point: {
        x: Math.round(nextStart.x + nextDx * ratio),
        y: Math.round(nextStart.y + nextDy * ratio),
      },
    };
  });
}

/** Moves each component the same physical distance along its own host wall. */
export function offsetHostedMarkers<T extends WallHostedMarker>(
  markers: readonly T[],
  vertices: readonly Point2Mm[],
  offsetMm: number,
): readonly T[] {
  return markers.map((marker) => {
    const start = vertices[marker.wallIndex];
    const end = vertices[(marker.wallIndex + 1) % vertices.length];
    if (!start || !end) return marker;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const wallLength = Math.hypot(dx, dy);
    if (wallLength === 0) return marker;
    const ratio = clampHostedRatio(
      marker,
      positionRatio(marker.point, start, end) + offsetMm / wallLength,
      wallLength,
    );
    return {
      ...marker,
      point: {
        x: Math.round(start.x + dx * ratio),
        y: Math.round(start.y + dy * ratio),
      },
    };
  });
}

export function hostedMarkerOffsetMm(
  marker: WallHostedMarker,
  vertices: readonly Point2Mm[],
): number {
  const start = vertices[marker.wallIndex];
  const end = vertices[(marker.wallIndex + 1) % vertices.length];
  if (!start || !end) return 0;
  return Math.round(positionRatio(marker.point, start, end) * Math.hypot(end.x - start.x, end.y - start.y));
}

export function positionHostedMarker<T extends WallHostedMarker>(
  marker: T,
  vertices: readonly Point2Mm[],
  offsetMm: number,
): T {
  const start = vertices[marker.wallIndex];
  const end = vertices[(marker.wallIndex + 1) % vertices.length];
  if (!start || !end) return marker;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const wallLength = Math.hypot(dx, dy);
  if (wallLength === 0) return marker;
  const ratio = clampHostedRatio(marker, offsetMm / wallLength, wallLength);
  return {
    ...marker,
    point: {
      x: Math.round(start.x + dx * ratio),
      y: Math.round(start.y + dy * ratio),
    },
  };
}

/** Evenly distributes groups of three or more components on each host wall. */
export function distributeHostedMarkers<T extends WallHostedMarker>(
  markers: readonly T[],
  vertices: readonly Point2Mm[],
): readonly T[] {
  const result = [...markers];
  const wallIndexes = new Set(markers.map((marker) => marker.wallIndex));
  for (const wallIndex of wallIndexes) {
    const indexes = result
      .map((marker, index) => ({ marker, index }))
      .filter(({ marker }) => marker.wallIndex === wallIndex)
      .sort(
        (a, b) =>
          hostedMarkerOffsetMm(a.marker, vertices) - hostedMarkerOffsetMm(b.marker, vertices),
      );
    if (indexes.length < 3) continue;
    const first = hostedMarkerOffsetMm(indexes[0]!.marker, vertices);
    const last = hostedMarkerOffsetMm(indexes.at(-1)!.marker, vertices);
    const interval = (last - first) / (indexes.length - 1);
    indexes.forEach(({ marker, index }, position) => {
      result[index] = positionHostedMarker(marker, vertices, first + interval * position);
    });
  }
  return result;
}

export function hostedMarkerIdsInBox<T extends Pick<WallHostedMarker, "point"> & { id: string }>(
  markers: readonly T[],
  start: Point2Mm,
  end: Point2Mm,
): readonly string[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  return markers
    .filter(
      (marker) =>
        marker.point.x >= minX &&
        marker.point.x <= maxX &&
        marker.point.y >= minY &&
        marker.point.y <= maxY,
    )
    .map((marker) => marker.id);
}
