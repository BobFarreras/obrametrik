import { describe, expect, it } from "vitest";
import { cadTemplates, type MobileCadMarker } from "./model";
import { buildCadScene } from "./scene-model";

describe("mobile CAD scene model", () => {
  it("creates one floor and four solid walls for an empty rectangle", () => {
    const scene = buildCadScene(cadTemplates.rectangle(4000, 3000), 2500, []);
    expect(scene.floor.vertices).toHaveLength(4);
    expect(scene.wallSegments.filter((segment) => segment.wallIndex === 0)).toHaveLength(1);
    expect(scene.wallSegments).toHaveLength(4);
  });

  it("splits a wall around a door instead of drawing over the opening", () => {
    const door: MobileCadMarker = {
      id: "door-1",
      kind: "door",
      point: { x: 2000, y: 0 },
      wallIndex: 0,
      widthMm: 900,
      heightMm: 2100,
          elevationMm: 0,
          variant: "hinged",
    };
    const segments = buildCadScene(cadTemplates.rectangle(4000, 3000), 2500, [door])
      .wallSegments.filter((segment) => segment.wallIndex === 0);
    expect(segments).toHaveLength(3);
    expect(segments.map((segment) => segment.role).sort()).toEqual(["above", "solid", "solid"]);
  });

  it("creates wall solids above and below a window", () => {
    const window: MobileCadMarker = {
      id: "window-1",
      kind: "window",
      point: { x: 2000, y: 0 },
      wallIndex: 0,
      widthMm: 1200,
      heightMm: 1000,
          elevationMm: 1000,
          variant: "casement",
    };
    const roles = buildCadScene(cadTemplates.rectangle(4000, 3000), 2500, [window])
      .wallSegments.filter((segment) => segment.wallIndex === 0)
      .map((segment) => segment.role);
    expect(roles).toContain("above");
    expect(roles).toContain("below");
  });
});
