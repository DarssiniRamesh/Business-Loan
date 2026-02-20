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

    // Stable navbar root (data-cy) instead of relying on tag/structure.
    cy.get('[data-cy="navbar"]').should("be.visible");

    // Brand link should route back to home.
    cy.get('[data-cy="navbar-brand"]')
      .should("have.attr", "href", "/")
      .within(() => {
        cy.contains("BusinessLoan").should("be.visible");
        cy.contains("Applicant Portal").should("be.visible");
      });

    // Primary CTAs should exist and point to the right routes.
    cy.get('[data-cy="navbar-signup"]')
      .should("have.attr", "href", "/signup")
      .contains(/Get Started/i)
      .should("be.visible");

    cy.get('a[href="/signup"]').contains(/Check Eligibility/i).should("be.visible");

    cy.get('[data-cy="navbar-login"]')
      .should("have.attr", "href", "/login")
      .contains(/^Login$/)
      .should("be.visible");
  });

  it("Navbar actions navigate to Login and Signup", () => {
    cy.visit("/");

    // Click Login via stable selector.
    cy.get('[data-cy="navbar-login"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/login");
    cy.contains(/welcome back|create account/i).should("be.visible");

    // Go back home, then click Signup/Get Started via stable selector.
    cy.visit("/");
    cy.get('[data-cy="navbar-signup"]').should("be.visible").click();

    // /signup route is implemented as /login?mode=signup redirect.
    cy.location("pathname").should("eq", "/login");
    cy.location("search").should("contain", "mode=signup");
    cy.contains(/welcome back|create account/i).should("be.visible");
  });

  it("Unknown route falls back to landing page", () => {
    cy.visit("/this-route-does-not-exist");

    // App routes wildcard -> Navigate to "/"
    cy.location("pathname").should("eq", "/");

    // Confirm we're on landing page by presence of stable nav CTAs.
    cy.get('[data-cy="navbar-signup"]').contains(/Get Started/i).should("be.visible");
    cy.get('a[href="/signup"]').contains(/Check Eligibility/i).should("be.visible");
  });

  it("/app redirects to /login when not authenticated", () => {
    cy.visit("/app");

    cy.location("pathname").should("eq", "/login");
    // The page contains a strong, stable heading in the right panel:
    cy.contains(/welcome back|create account/i).should("be.visible");
  });
});
