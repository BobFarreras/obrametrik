import { describe, expect, it } from "vitest";
import { messages } from "./index";
describe("message catalogs", () => {
  it("have identical, non-empty keys", () => {
    const expected = Object.keys(messages.ca).sort();
    for (const catalog of Object.values(messages)) {
      expect(Object.keys(catalog).sort()).toEqual(expected);
      expect(Object.values(catalog).every((value) => value.trim().length > 0)).toBe(true);
    }
  });
});
