import { describe, expect, it } from "vitest";
import { colors, radii, spacing } from "./index";

describe("canonical design tokens", () => {
  it("keeps the Obrametrik teal and amber identity", () => {
    expect(colors.blueprint).toBe("#2A4B4F");
    expect(colors.hardhat).toBe("#F4AC3D");
    expect(colors.accent).toBe(colors.hardhat);
  });

  it("keeps controls touch-friendly and cards rounded", () => {
    expect(radii.card).toBeGreaterThanOrEqual(24);
    expect(radii.pill).toBe(999);
    expect(spacing.xxxl).toBe(48);
  });
});
