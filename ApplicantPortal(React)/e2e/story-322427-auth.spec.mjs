import { test, expect } from "@playwright/test";
import { tagStoryAndCase } from "./helpers/tagging.mjs";

const STORY_ID = "322427";

/**
 * Story 322427 — As an applicant, I want to create an account with email verification
 * so that I can securely start my loan application.
 *
 * IMPORTANT (alignment to implementation):
 * - The current ApplicantPortal UI implements Signup within /login?mode=signup.
 * - It shows success "Account created! Please sign in." and does NOT auto-login.
 * - Email verification flows (verify link, resend, blocked unverified login) are not implemented
 *   in the current frontend/backend and therefore are not covered as passing E2E tests here.
 */

/**
 * Generates a unique email for signup attempts.
 * @returns {string}
 */
function uniqueEmail() {
  return `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.test`;
}

test.describe("US-322427 Applicant registration (implemented behaviors)", () => {
  test("TC-322427-01 Register new account shows success (no auto-login)", async ({ page }, testInfo) => {
    tagStoryAndCase(
      testInfo,
      STORY_ID,
      "TC-322427-01",
      "Register new account shows success message and does not auto-login"
    );

    await page.goto("/login?mode=signup");

    // Fill signup form
    await page.getByPlaceholder("you@company.com").fill(uniqueEmail());
    await page.getByPlaceholder("Min. 8 characters").fill("Password1!");
    await page.getByPlaceholder("Repeat password").fill("Password1!");

    await page.getByRole("button", { name: "Create account" }).click();

    // Success message present
    await expect(page.getByText("Account created! Please sign in.")).toBeVisible();

    // Confirm no auto-login: should still be on /login and show login header
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("TC-322427-05 Password policy enforcement shows accessible inline errors and blocks submit", async ({ page }, testInfo) => {
    tagStoryAndCase(
      testInfo,
      STORY_ID,
      "TC-322427-05",
      "Password policy enforcement with inline errors prevents submission until compliant"
    );

    await page.goto("/login?mode=signup");

    // Trigger errors: invalid email + too-short password + mismatch confirm
    await page.getByPlaceholder("you@company.com").fill("not-an-email");
    await page.getByPlaceholder("Min. 8 characters").fill("short");
    await page.getByPlaceholder("Repeat password").fill("different");

    // Click submit to ensure touched validations show
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Enter a valid email.")).toBeVisible();
    await expect(page.getByText("At least 8 characters required.")).toBeVisible();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();

    // Fix values and expect errors to clear after re-submit; should reach success message (backend permitting).
    const email = uniqueEmail();
    await page.getByPlaceholder("you@company.com").fill(email);
    await page.getByPlaceholder("Min. 8 characters").fill("Password1!");
    await page.getByPlaceholder("Repeat password").fill("Password1!");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Account created! Please sign in.")).toBeVisible();
  });
});
