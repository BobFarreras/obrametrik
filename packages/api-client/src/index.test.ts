import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "./index";
afterEach(() => vi.unstubAllGlobals());
describe("api client", () => {
  it("returns typed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })));
    await expect(
      createApiClient({ baseUrl: "https://example.test" }).request("/health"),
    ).resolves.toEqual({ ok: true });
  });
  it("uses structured errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 403 })));
    await expect(
      createApiClient({ baseUrl: "https://example.test" }).request("/private"),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
