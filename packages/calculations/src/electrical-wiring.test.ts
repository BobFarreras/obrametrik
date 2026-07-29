import { describe, expect, it } from "vitest";
import { wiringForRouteRole } from "./electrical-wiring";

describe("wiringForRouteRole", () => {
  it("uses phase, neutral and protection for a C2 socket distribution route", () => {
    expect(wiringForRouteRole({ circuitCode: "C2", role: "distribution" })).toEqual([
      { function: "phase", color: "brown", sectionMm2: 2.5, count: 1 },
      { function: "neutral", color: "light_blue", sectionMm2: 2.5, count: 1 },
      { function: "protective", color: "green_yellow", sectionMm2: 2.5, count: 1 },
    ]);
  });

  it("never uses blue for the switched live of a simple light control", () => {
    expect(wiringForRouteRole({ circuitCode: "C1", role: "switch_return" })).toEqual([
      { function: "return", color: "black", sectionMm2: 1.5, count: 1 },
    ]);
  });

  it("creates two active travellers for a two-way connection", () => {
    expect(wiringForRouteRole({ circuitCode: "C1", role: "travellers" })).toEqual([
      { function: "traveller", color: "black", sectionMm2: 1.5, count: 1 },
      { function: "traveller", color: "grey", sectionMm2: 1.5, count: 1 },
    ]);
  });
});
