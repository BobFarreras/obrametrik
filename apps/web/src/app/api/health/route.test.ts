import { describe, expect, it } from "vitest";
import { GET } from "./route";
describe("GET /api/health", () => {
  it("returns a non-cacheable health response", async () => {
    const response = await GET();
    await expect(response.json()).resolves.toEqual({ status: "ok", service: "obrametrik-web" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
