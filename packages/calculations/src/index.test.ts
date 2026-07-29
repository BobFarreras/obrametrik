import { describe, expect, it } from "vitest";
import { calculateNetSurfaceArea, calculatePackagedQuantity } from "./index";
describe("calculatePackagedQuantity", () => {
  it("rounds to full packages and preserves audit data", () =>
    expect(
      calculatePackagedQuantity({
        netQuantity: 10,
        wastePercent: 10,
        packageSize: 1.5,
        unit: "m2",
      }),
    ).toMatchObject({
      wasteQuantity: 1,
      purchaseQuantity: 12,
      ruleVersion: "packaged-quantity@1",
    }));
  it("rejects invalid package sizes", () =>
    expect(() =>
      calculatePackagedQuantity({ netQuantity: 1, wastePercent: 0, packageSize: 0, unit: "kg" }),
    ).toThrow(RangeError));
});

describe("calculateNetSurfaceArea", () => {
  it("subtracts openings from the gross surface", () => {
    expect(
      calculateNetSurfaceArea({
        widthM: 4,
        heightM: 2.5,
        adjustments: [{ widthM: 0.8, heightM: 2, operation: "subtract" }],
      }),
    ).toMatchObject({ grossAreaM2: 10, adjustmentAreaM2: -1.6, netAreaM2: 8.4 });
  });

  it("rejects deductions larger than the surface", () => {
    expect(() =>
      calculateNetSurfaceArea({
        widthM: 1,
        heightM: 1,
        adjustments: [{ widthM: 2, heightM: 2, operation: "subtract" }],
      }),
    ).toThrow(RangeError);
  });
});
