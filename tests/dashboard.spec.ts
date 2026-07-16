import { test, expect } from "@playwright/test";

test("redirects to login when signed out", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});