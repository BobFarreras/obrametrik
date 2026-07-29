import { describe, expect, it } from "vitest";
import {
  buildElectricalLayout,
  projectElectricalPoint,
} from "./models/electrical-layout";

describe("deterministic electrical layout", () => {
  const terminals = [
    { id: "light-1", kind: "light" as const, point: { x: 2100, y: 1400 }, elevationMm: 2500 },
    { id: "switch-1", kind: "switch" as const, point: { x: 0, y: 800 }, elevationMm: 1100 },
    { id: "socket-1", kind: "socket" as const, point: { x: 3800, y: 400 }, elevationMm: 300 },
  ];

  it("keeps ceiling lights at their free plan position", () => {
    const layout = buildElectricalLayout({
      clearHeightMm: 2600,
      terminals,
      vertices: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
    });

    expect(layout.terminals.find((terminal) => terminal.id === "light-1")).toMatchObject({
      point: { x: 2100, y: 1400 },
      elevationMm: 2500,
    });
  });

  it("creates one automatic junction box for each populated circuit", () => {
    const layout = buildElectricalLayout({
      clearHeightMm: 2600,
      terminals,
      vertices: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
    });

    expect(layout.junctionBoxes.map((box) => box.circuitCode)).toEqual(["C1", "C2"]);
    expect(layout.junctionBoxes.every((box) => box.elevationMm === 2300)).toBe(true);
  });

  it("represents every conductor independently", () => {
    const layout = buildElectricalLayout({
      clearHeightMm: 2600,
      terminals,
      vertices: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
    });
    const socketRun = layout.runs.find((run) => run.terminalId === "socket-1");

    expect(socketRun?.conductors.map((conductor) => conductor.color)).toEqual([
      "brown",
      "light_blue",
      "green_yellow",
    ]);
    expect(socketRun?.path.at(-1)).toEqual({ x: 3800, y: 400, z: 300 });
  });

  it("projects the same 3D point into plan, front and right elevations", () => {
    const point = { x: 1200, y: 700, z: 300 };

    expect(projectElectricalPoint(point, "plan")).toEqual({ x: 1200, y: 700 });
    expect(projectElectricalPoint(point, "front")).toEqual({ x: 1200, y: 2300 });
    expect(projectElectricalPoint(point, "right")).toEqual({ x: 700, y: 2300 });
  });
});
