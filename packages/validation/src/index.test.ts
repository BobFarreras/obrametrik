import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  electricalRouteSchema,
  loginSchema,
  surfaceWorkScopeSchema,
} from "./index";
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
  it("requires at least two measured route points", () =>
    expect(
      electricalRouteSchema.safeParse({
        projectId: "00000000-0000-4000-8000-000000000001",
        circuitId: "00000000-0000-4000-8000-000000000002",
        spaceId: "00000000-0000-4000-8000-000000000003",
        role: "distribution",
        points: [{ x: 0, y: 0 }],
      }).success,
    ).toBe(false));
});
