import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for ApplicantPortal(React).
 *
 * Key goal: running `npx playwright test` should *not* require manually starting
 * the frontend server (avoids ERR_CONNECTION_REFUSED).
 *
 * Notes:
 * - We intentionally scope test discovery to ./e2e to avoid Playwright trying to
 *   transform React unit tests under src/ (e.g., src/App.test.js).
 * - We prefer testing against `vite preview` (production build) on port 4173.
 * - Port 4173 is Playwright's conventional Vite preview port and matches the
 *   previously failing URL: http://localhost:4173/login?mode=signup
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

  /**
   * Auto-start the ApplicantPortal server for E2E.
   * We use a fixed port (4173) so tests and CI are deterministic.
   */
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:4173",
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
