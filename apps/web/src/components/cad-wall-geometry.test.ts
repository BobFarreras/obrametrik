import { describe, expect, it } from "vitest";
import {
  distributeHostedMarkers,
  hostedMarkerOffsetMm,
  hostedMarkerIdsInBox,
  offsetHostedMarkers,
  positionHostedMarker,
  reprojectHostedMarkers,
} from "./cad-wall-geometry";

describe("reprojectHostedMarkers", () => {
  it("moves a component with a translated and resized host wall", () => {
    const result = reprojectHostedMarkers(
      [{ id: "socket-1", kind: "socket", wallIndex: 0, widthMm: 100, point: { x: 1000, y: 0 } }],
      [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }],
      [{ x: 500, y: 500 }, { x: 6500, y: 500 }, { x: 6500, y: 3000 }],
    );

    expect(result[0]?.point).toEqual({ x: 2000, y: 500 });
  });

  it("follows a wall rotation while preserving the longitudinal ratio", () => {
    const result = reprojectHostedMarkers(
      [{ kind: "light", wallIndex: 0, widthMm: 100, point: { x: 2000, y: 0 } }],
      [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }],
      [{ x: 0, y: 0 }, { x: 0, y: 4000 }, { x: 3000, y: 4000 }],
    );

    expect(result[0]?.point).toEqual({ x: 0, y: 2000 });
  });

  it("keeps an opening fully inside a shortened wall", () => {
    const result = reprojectHostedMarkers(
      [{ kind: "door", wallIndex: 0, widthMm: 900, point: { x: 200, y: 0 } }],
      [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }],
      [{ x: 0, y: 0 }, { x: 1200, y: 0 }, { x: 1200, y: 3000 }],
    );

    expect(result[0]?.point).toEqual({ x: 450, y: 0 });
  });

  it("moves a group the same distance along each component's own wall", () => {
    const result = offsetHostedMarkers(
      [
        { id: "a", kind: "socket", wallIndex: 0, widthMm: 100, point: { x: 1000, y: 0 } },
        { id: "b", kind: "switch", wallIndex: 1, widthMm: 100, point: { x: 4000, y: 500 } },
      ],
      [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }],
      250,
    );

    expect(result.map((marker) => marker.point)).toEqual([
      { x: 1250, y: 0 },
      { x: 4000, y: 750 },
    ]);
  });

  it("reads and writes a precise millimetre offset on the host wall", () => {
    const vertices = [{ x: 500, y: 200 }, { x: 4500, y: 200 }, { x: 4500, y: 3000 }];
    const marker = { kind: "socket", wallIndex: 0, widthMm: 100, point: { x: 1500, y: 200 } };
    expect(hostedMarkerOffsetMm(marker, vertices)).toBe(1000);
    expect(positionHostedMarker(marker, vertices, 2750).point).toEqual({ x: 3250, y: 200 });
  });

  it("distributes three components evenly on their shared wall", () => {
    const vertices = [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }];
    const result = distributeHostedMarkers(
      [
        { id: "a", kind: "socket", wallIndex: 0, widthMm: 100, point: { x: 500, y: 0 } },
        { id: "b", kind: "socket", wallIndex: 0, widthMm: 100, point: { x: 900, y: 0 } },
        { id: "c", kind: "socket", wallIndex: 0, widthMm: 100, point: { x: 3500, y: 0 } },
      ],
      vertices,
    );
    expect(result.map((marker) => marker.point.x)).toEqual([500, 2000, 3500]);
  });

  it("selects only components inside a marquee regardless of drag direction", () => {
    const markers = [
      { id: "inside", point: { x: 1000, y: 500 } },
      { id: "outside", point: { x: 3000, y: 500 } },
    ];
    expect(hostedMarkerIdsInBox(markers, { x: 2000, y: 1000 }, { x: 0, y: 0 })).toEqual([
      "inside",
    ]);
  });
});
