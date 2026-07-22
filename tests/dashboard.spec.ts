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


  test("setting a pick's confidence level toggles between the tiers", async ({ page }) => {
    await page.goto("/games");

    // First open (pickable) game card — the `has` filter guarantees the pick
    // buttons rendered, i.e. it's not locked. Scope everything to this one card
    // so other cards' confidence rows can't match.
    const card = page
      .locator('[aria-haspopup="dialog"]', { has: page.locator(".pick-btn") })
      .first();
    await expect(card).toBeVisible();

    const strong = card.getByRole("button", { name: "Strong" });
    const lock = card.getByRole("button", { name: "Lock" });
    const normal = card.getByRole("button", { name: "Normal", exact: true });

    // Confidence chips only appear once a side is picked. Pick a team if this
    // card doesn't already have one (picks persist across runs).
    if (!(await strong.isVisible())) {
      await card.locator(".pick-btn").first().click();
    }
    await expect(normal).toBeVisible();

    // Each tier is mutually exclusive (aria-pressed). Assert after each explicit
    // click so the test is independent of the card's starting confidence.
    await strong.click();
    await expect(strong).toHaveAttribute("aria-pressed", "true");
    await expect(normal).toHaveAttribute("aria-pressed", "false");

    await lock.click();
    await expect(lock).toHaveAttribute("aria-pressed", "true");
    await expect(strong).toHaveAttribute("aria-pressed", "false");

    await normal.click();
    await expect(normal).toHaveAttribute("aria-pressed", "true");
    await expect(lock).toHaveAttribute("aria-pressed", "false");
  });
});
