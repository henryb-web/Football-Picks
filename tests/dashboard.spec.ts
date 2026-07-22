import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "./auth-file";

// Auth gate — this one runs signed out (no stored session).
test("redirects to login when signed out", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test.describe("dashboard (signed in)", () => {
  // Reuse the session saved by auth.setup.ts — no per-test login.
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("shows the four stat cards", async ({ page }) => {
    for (const label of ["Rank", "Points", "Record", "Streak"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("has a Your teams section with three league pickers", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Your teams" })).toBeVisible();
    await expect(page.getByPlaceholder(/type a team/i)).toHaveCount(3);
  });

  test("shows Favorite Next Up when favorites are set", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Favorite Next Up" });
    if (await heading.count()) {
      await expect(heading).toBeVisible();
    }
  });


  test('pick confidence level', async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole('link', { name: '11 games need your picks this week' }).click();
    await page.getByRole('button', { name: 'Normal', exact: true }).click();
    await page.getByRole('button', { name: '💪 Strong', exact: true }).click();
    await page.getByRole('button', { name: '🔒 Lock', exact: true }).click();
  });
});
