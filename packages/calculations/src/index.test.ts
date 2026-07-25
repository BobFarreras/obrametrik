import { describe, expect, it } from "vitest";
import { calculatePackagedQuantity } from "./index";
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
