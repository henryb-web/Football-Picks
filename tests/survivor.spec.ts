import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "./auth-file";

// --- Guest (signed out) ---
test("a guest can open a public pool but is prompted to log in", async ({ page }) => {
  await page.goto("/survivor");

  // The first link that points at a specific pool (href="/survivor/<id>").
  await page.locator('a[href^="/survivor/"]').first().click();

  await expect(page).toHaveURL(/\/survivor\/[a-z0-9]+/i);
  await expect(page.getByText(/to play survivor/i)).toBeVisible();
});

// --- Signed in (reuses the saved session) ---
test.describe("signed in", () => {
  test.use({ storageState: STORAGE_STATE });

  test("create a public pool and land on it with an invite code", async ({ page }) => {
    // Unique name so repeated runs don't collide and we can assert exactly.
    const name = `E2E Pool ${Date.now()}`;

    await page.goto("/survivor");
    await page.getByLabel("Pool name").fill(name);
    await page.getByRole("button", { name: "Create pool" }).click();

    // Creating redirects to the new pool's page.
    await expect(page).toHaveURL(/\/survivor\/[a-z0-9]+/i);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);

    // As the owner you're a member, so the invite code is shown.
    await expect(page.getByText("Invite code")).toBeVisible();
  });

  test("a created pool shows under Your pools", async ({ page }) => {
    const name = `E2E YourPools ${Date.now()}`;
    await page.goto("/survivor");
    await page.getByLabel("Pool name").fill(name);
    await page.getByRole("button", { name: "Create pool" }).click();
    await expect(page).toHaveURL(/\/survivor\/[a-z0-9]+/i);

    // Back on the list, it should now be listed under "Your pools".
    await page.goto("/survivor");
    await expect(page.getByRole("heading", { name: "Your pools" })).toBeVisible();
    await expect(page.getByRole("link", { name })).toBeVisible();
  });

  test("join a pool by its invite code", async ({ page }) => {
    // Codes are auto-generated, so create a private pool to get a real one,
    // then read its code off the page — no dependency on pre-existing data.
    const name = `E2E Private ${Date.now()}`;
    await page.goto("/survivor");
    await page.getByLabel("Pool name").fill(name);
    await page.getByRole("button", { name: "Private" }).click(); // visibility toggle
    await page.getByRole("button", { name: "Create pool" }).click();
    await expect(page).toHaveURL(/\/survivor\/[a-z0-9]+/i);

    const code = (await page.getByTestId("invite-code").textContent())?.trim() ?? "";
    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    // Use that code in the join-by-code form on the list page.
    await page.goto("/survivor");
    await page.getByPlaceholder("Enter code").fill(code);
    // `exact` avoids matching the "Public/Private" toggles, whose labels
    // contain the word "join" (name matching is substring by default).
    await page.getByRole("button", { name: "Join", exact: true }).click();

    // Joining resolves the code to the pool and redirects into it.
    await expect(page).toHaveURL(/\/survivor\/[a-z0-9]+/i);
    await expect(page.getByText("Invite code")).toBeVisible();
  });

  test("join a pool owned by another user, by invite code", async ({ page }) => {
    // Unlike the test above (which "joins" a pool you own), this exercises the
    // real foreign-join path. Depends on a local pool with this code owned by
    // someone other than the test user (seeded manually as `henryb`); it will
    // fail on a fresh/CI DB. TODO: seed via a second user for full portability.
    const code = "B7HPHU";

    await page.goto("/survivor");
    await page.getByPlaceholder("Enter code").fill(code);
    await page.getByRole("button", { name: "Join", exact: true }).click();

    // Joining resolves the code and redirects into the pool.
    await expect(page).toHaveURL(/\/survivor\/[a-z0-9]+/i);
  });

  test("can make a survivor pick", async ({ page }) => {
    // A fresh NFL pool guarantees the current week has pickable games.
    const name = `E2E Pick ${Date.now()}`;
    await page.goto("/survivor");
    await page.getByLabel("Pool name").fill(name);
    await page.getByRole("button", { name: "Create pool" }).click();
    await expect(page).toHaveURL(/\/survivor\/[a-z0-9]+/i);

    // The weekly picker shows for a still-alive member.
    const weekHeading = page.getByRole("heading", { name: /Week \d+ pick/i });
    await expect(weekHeading).toBeVisible();

    // Click the first team button inside the picker section.
    const picker = page.locator("section", { has: weekHeading });
    const firstTeam = picker.getByRole("button").first();
    await firstTeam.click();
    await expect(firstTeam).toHaveAttribute("aria-pressed", "true");

    // Reload to prove it saved server-side (a button stays selected).
    await page.reload();
    const pickerAfter = page.locator("section", {
      has: page.getByRole("heading", { name: /Week \d+ pick/i }),
    });
    await expect(pickerAfter.getByRole("button", { pressed: true })).toBeVisible();
  });
});

