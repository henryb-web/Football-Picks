import { test as setup } from "@playwright/test";
import { STORAGE_STATE } from "./auth-file";

// Runs before the browser projects (see playwright.config.ts `dependencies`).
// Logs in once and writes the session (cookies) to disk so authenticated tests
// can start already signed in instead of logging in every time.
setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email or username").fill(process.env.E2E_IDENTIFIER!);
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));

  await page.context().storageState({ path: STORAGE_STATE });
});
