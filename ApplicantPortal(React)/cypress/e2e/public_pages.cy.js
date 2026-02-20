/**
 * Public (no-auth) happy-path checks.
 *
 * NOTE:
 * The `/app` route is authenticated and should redirect to `/login` when not logged in.
 * These tests intentionally avoid asserting any backend-dependent data.
 */

describe("ApplicantPortal public pages", () => {
  it("Landing page loads and shows key hero content", () => {
    cy.visit("/");

    cy.title().should("match", /Business/i);

    // Brand/context in the header (banner)
    cy.get('[role="banner"]').within(() => {
      cy.contains("BusinessLoan").should("be.visible");
      cy.contains("Applicant Portal").should("be.visible");
    });

    // Hero headline
    cy.contains('[role="heading"]', /Fund Your Business Growth/i).should("be.visible");

    // Primary CTA should link to signup
    cy.contains("a", /Check Eligibility/i)
      .should("be.visible")
      .and("have.attr", "href", "/signup");
  });

  it("Navbar actions navigate to Login and Signup", () => {
    cy.visit("/");

    cy.get('[role="banner"]').within(() => {
      cy.contains("a", /^Login$/).click();
    });
    cy.location("pathname").should("eq", "/login");

    // Back to landing then to signup via Get Started (navbar)
    cy.visit("/");
    cy.get('[role="banner"]').within(() => {
      cy.contains("a", /^Get Started$/).click();
    });

    // App routes signup through login with a mode query param.
    cy.location("pathname").should("eq", "/login");
    cy.location("search").should("match", /(^\?|\&)mode=signup(&|$)/);
  });

  it("Unknown route falls back to landing page", () => {
    cy.visit("/this-route-does-not-exist");

    // App routes wildcard -> Navigate to "/"
    cy.location("pathname").should("eq", "/");
    cy.contains('[role="heading"]', /Fund Your Business Growth/i).should("be.visible");
  });

  it("/app redirects to /login when not authenticated", () => {
    cy.visit("/app");

    cy.location("pathname").should("eq", "/login");
    // Login page should have a clear heading/label; keep assertion flexible.
    cy.contains(/login/i).should("be.visible");
  });
});
