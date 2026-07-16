import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load test credentials (E2E_IDENTIFIER / E2E_PASSWORD). Prefer .env.local
// (gitignored), falling back to .env — both are already gitignored here.
dotenv.config({
  path: [
    path.resolve(__dirname, ".env.local"),
    path.resolve(__dirname, ".env"),
  ],
});

// E2E config for PickSix. Runs against the local app; reuses a dev server if one
// is already up, otherwise starts one.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
