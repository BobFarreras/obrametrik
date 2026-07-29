import { describe, expect, it } from "vitest";
import {
  defaultRouteConfiguration,
  measuredPolylineLengthMm,
  requiredControlCount,
} from "./models/electrical-editor";

describe("electrical editor model", () => {
  it("measures every leg of an explicit polyline", () => {
    expect(measuredPolylineLengthMm([
      { x: 0, y: 0 },
      { x: 3000, y: 0 },
      { x: 3000, y: 4000 },
    ])).toBe(7000);
  });

  it("defines two controls and two travellers for a two-way light", () => {
    expect(requiredControlCount("two_way")).toEqual({ minimum: 2, maximum: 2 });
    expect(defaultRouteConfiguration({ circuitCode: "C1", role: "travellers" }).conductors)
      .toHaveLength(2);
  });
});
