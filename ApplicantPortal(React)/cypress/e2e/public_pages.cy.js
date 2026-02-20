/**
 * Public (no-auth) happy-path checks.
 *
 * NOTE:
 * The `/app` route is authenticated and should redirect to `/login` when not logged in.
 * These tests intentionally avoid asserting any backend-dependent data.
 */

describe("ApplicantPortal public pages", () => {
  it("Landing page loads and shows primary navigation CTAs", () => {
    cy.visit("/");

    cy.title().should("match", /Business/i);

    // Use semantic element selectors rather than ARIA roles (the app does not set role=banner).
    cy.get("header").should("be.visible");

    // Brand link should route back to home.
    cy.get("header")
      .find('a[href="/"]')
      .should("be.visible")
      .within(() => {
        cy.contains("BusinessLoan").should("be.visible");
        cy.contains("Applicant Portal").should("be.visible");
      });

    // Primary CTAs should exist and point to the right routes.
    cy.get('a[href="/signup"]').contains(/Get Started/i).should("be.visible");
    cy.get('a[href="/signup"]').contains(/Check Eligibility/i).should("be.visible");
    cy.get('a[href="/login"]').contains(/^Login$/).should("be.visible");
  });

  it("Navbar actions navigate to Login and Signup", () => {
    cy.visit("/");

    // Login CTA in navbar
    cy.get('header a[href="/login"]').contains(/^Login$/).click();
    cy.location("pathname").should("eq", "/login");

    // Back to landing then to signup via Get Started (navbar)
    cy.visit("/");
    cy.get('header a[href="/signup"]').contains(/Get Started/i).click();
    cy.location("pathname").should("eq", "/signup");
  });

  it("Unknown route falls back to landing page", () => {
    cy.visit("/this-route-does-not-exist");

    // App routes wildcard -> Navigate to "/"
    cy.location("pathname").should("eq", "/");

    // Confirm we're on landing page by presence of stable nav CTAs.
    cy.get('header a[href="/signup"]').contains(/Get Started/i).should("be.visible");
    cy.get('a[href="/signup"]').contains(/Check Eligibility/i).should("be.visible");
  });

  it("/app redirects to /login when not authenticated", () => {
    cy.visit("/app");

    cy.location("pathname").should("eq", "/login");
    // The page contains a strong, stable heading in the right panel:
    cy.contains(/welcome back|create account/i).should("be.visible");
  });
});
