import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for ApplicantPortal(React).
 *
 * Notes:
 * - We intentionally scope test discovery to ./e2e to avoid Playwright trying to
 *   transform React unit tests under src/ (e.g., src/App.test.js).
 * - baseURL defaults to http://localhost:4173 which matches our recommended
 *   Vite dev server port for E2E.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/*.spec.{js,ts,mjs}"],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }], ["line"]],

  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:4173",
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
