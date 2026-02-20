import { test, expect } from "@playwright/test";

/**
 * Public (no-auth) happy-path checks.
 *
 * NOTE:
 * The `/app` route is authenticated and should redirect to `/login` when not logged in.
 * These tests intentionally avoid asserting any backend-dependent data.
 */

test.describe("ApplicantPortal public pages", () => {
  test("Landing page loads and shows key hero content", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Business/i);

    // Brand + context (scope to header to avoid strict-mode collisions with footer)
    const banner = page.getByRole("banner");
    await expect(banner.getByText("BusinessLoan", { exact: true })).toBeVisible();
    await expect(banner.getByText("Applicant Portal", { exact: true })).toBeVisible();

    // Hero headline (stable text)
    await expect(page.getByRole("heading", { name: /Fund Your Business Growth/i })).toBeVisible();

    // Primary CTA should be present and link to signup
    const cta = page.getByRole("link", { name: /Check Eligibility/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/signup");
  });

  test("Navbar actions navigate to Login and Signup", async ({ page }) => {
    await page.goto("/");

    const banner = page.getByRole("banner");

    // Login (navbar)
    await banner.getByRole("link", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/login(\?.*)?$/);

    // Back to landing then to signup via Get Started (navbar)
    await page.goto("/");
    await banner.getByRole("link", { name: "Get Started", exact: true }).click();
    // App routes signup through login with a mode query param.
    await expect(page).toHaveURL(/\/login\?mode=signup(&.*)?$/);
  });

  test("Unknown route falls back to landing page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    // App routes wildcard -> Navigate to "/"
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Fund Your Business Growth/i })).toBeVisible();
  });

  test("/app redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/app");

    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    // Login page should have a clear heading/label; keep assertion flexible.
    await expect(page.getByText(/login/i)).toBeVisible();
  });
});
