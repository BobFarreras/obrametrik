/**
 * @file packages/calculations/src/index.ts
 * @description Calculates auditable purchase quantities without AI.
 */
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
