import { describe, expect, it } from "vitest";
import { createProjectSchema, loginSchema, surfaceWorkScopeSchema } from "./index";
describe("shared validation", () => {
  it("rejects weak credentials", () =>
    expect(loginSchema.safeParse({ email: "x", password: "short" }).success).toBe(false));
  it("normalizes project names", () =>
    expect(
      createProjectSchema.parse({
        organizationId: "b4c93ef2-5da5-4ac2-bf64-65c8ec43aadd",
        name: "  Bany  ",
      }).name,
    ).toBe("Bany"));
  it("requires at least one desired work for a surface scope", () =>
    expect(
      surfaceWorkScopeSchema.safeParse({
        surfaceId: "55555555-5555-4555-8555-555555555555",
        existingFinish: "tile",
        condition: "good",
        waterExposure: "wet",
        removeExisting: false,
        desiredWorks: [],
      }).success,
    ).toBe(false));
});
