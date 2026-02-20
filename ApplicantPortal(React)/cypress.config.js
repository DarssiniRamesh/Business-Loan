const { defineConfig } = require("cypress");

/**
 * PUBLIC_INTERFACE
 * Cypress E2E configuration for ApplicantPortal (React).
 *
 * Notes:
 * - Targets the locally running dev server at http://localhost:3002
 * - Specs live under `cypress/e2e/`
 * - These tests are intentionally public/no-login only.
 */
module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3002",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.js",
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
  },
});
