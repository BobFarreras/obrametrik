/**
 * @file packages/calculations/src/index.ts
 * @description Calculates auditable purchase quantities without AI.
 */
export * from "./electrical-takeoff";

export type MeasurementUnit = "m" | "m2" | "m3" | "kg" | "unit";
export type CalculationResult = {
  netQuantity: number;
  wasteQuantity: number;
  purchaseQuantity: number;
  unit: MeasurementUnit;
  formula: string;
  assumptions: string[];
  warnings: string[];
  ruleVersion: string;
};
export function calculateNetSurfaceArea(input: {
  widthM: number;
  heightM: number;
  adjustments: { widthM: number; heightM: number; operation: "add" | "subtract" }[];
}) {
  if (input.widthM <= 0 || input.heightM <= 0) throw new RangeError("Invalid surface dimensions");
  const grossAreaM2 = input.widthM * input.heightM;
  const adjustmentAreaM2 = input.adjustments.reduce((total, adjustment) => {
    if (adjustment.widthM <= 0 || adjustment.heightM <= 0)
      throw new RangeError("Invalid adjustment dimensions");
    const signedArea = adjustment.widthM * adjustment.heightM;
    return total + (adjustment.operation === "add" ? signedArea : -signedArea);
  }, 0);
  const netAreaM2 = grossAreaM2 + adjustmentAreaM2;
  if (netAreaM2 < 0) throw new RangeError("Adjustments exceed gross surface area");
  return {
    grossAreaM2,
    adjustmentAreaM2,
    netAreaM2,
    formula: "width × height + Σ(signed adjustment width × height)",
    ruleVersion: "net-surface-area@1",
  };
}
export function calculatePackagedQuantity(input: {
  netQuantity: number;
  wastePercent: number;
  packageSize: number;
  unit: MeasurementUnit;
}): CalculationResult {
  if (input.netQuantity < 0 || input.wastePercent < 0 || input.packageSize <= 0)
    throw new RangeError("Invalid quantity input");
  const wasteQuantity = input.netQuantity * (input.wastePercent / 100);
  const purchaseQuantity =
    Math.ceil((input.netQuantity + wasteQuantity) / input.packageSize) * input.packageSize;
  return {
    netQuantity: input.netQuantity,
    wasteQuantity,
    purchaseQuantity,
    unit: input.unit,
    formula: "ceil((netQuantity + netQuantity × wastePercent / 100) / packageSize) × packageSize",
    assumptions: ["Retailer sells full packages only"],
    warnings: [],
    ruleVersion: "packaged-quantity@1",
  };
}
