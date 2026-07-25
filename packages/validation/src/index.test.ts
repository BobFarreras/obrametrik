import { describe, expect, it } from "vitest";
import { createProjectSchema, loginSchema } from "./index";
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
});
