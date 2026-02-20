import { defineConfig, devices } from "@playwright/test";

/**
 * PUBLIC_INTERFACE
 * Playwright configuration for ApplicantPortal (React).
 *
 * - Targets the locally running dev server (default: http://localhost:3002)
 * - Limits test discovery to the `e2e/` folder to avoid picking up unit tests in `src/`
 * - Captures traces/screenshots/videos on failure for CI debugging
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },

  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    // IMPORTANT: dev server is expected to already be running on port 3002.
    // Override in CI with: PLAYWRIGHT_BASE_URL=http://localhost:3002
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3002",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
