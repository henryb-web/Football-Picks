import { test, expect } from "@playwright/test";

test.describe("public pages load", () => {
  test("home shows the hero and slate", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pick");
    await expect(page.getByText(/Pick your winner for NFL/i)).toBeVisible();
  });

  test("games page loads", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByRole("heading", { name: "Games", level: 1 })).toBeVisible();
  });

  test("survivor page loads with pools section", async ({ page }) => {
    await page.goto("/survivor");
    await expect(page.getByRole("heading", { name: "Survivor", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Public pools" })).toBeVisible();
  });

  test("leaderboard loads", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

// Guards against the page ever scrolling sideways (runs on desktop + true mobile).
const routes = ["/", "/games", "/survivor", "/leaderboard"];
for (const route of routes) {
  test(`no horizontal overflow: ${route}`, async ({ page }) => {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1); // allow sub-pixel rounding
  });
}
