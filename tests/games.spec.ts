import { test, expect } from "@playwright/test";

// Examples of testing *interactions*, not just that a page loads.

test("clicking a game opens its detail modal", async ({ page }) => {
  await page.goto("/games");

  // Each game card is a button that opens a dialog (aria-haspopup="dialog").
  await page.locator('[aria-haspopup="dialog"]').first().click();

  // The modal has role="dialog"; check it appeared and shows expected content.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Pool consensus");

  // Close it with Escape and confirm it's gone.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("league tabs filter the games list via the URL", async ({ page }) => {
  await page.goto("/games");

  await page.getByRole("link", { name: "NFL", exact: true }).click();

  // Clicking the tab navigates to a filtered URL.
  await expect(page).toHaveURL(/league=NFL/);
});

test("home slate tabs switch the featured league", async ({ page }) => {
  await page.goto("/");

  const collegeTab = page.getByRole("button", { name: "College", exact: true });
  await collegeTab.click();

  // The clicked tab becomes the active/pressed one.
  await expect(collegeTab).toHaveAttribute("aria-pressed", "true");
});
