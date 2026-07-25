import { expect, test } from "@playwright/test";
test("Catalan landing page is reachable", async ({ page }) => {
  await page.goto("/ca");
  await expect(page.getByRole("heading")).toBeVisible();
});
