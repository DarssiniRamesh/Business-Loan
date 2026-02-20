# E2E Traceability & Results — User Story 322427

Scope: ApplicantPortal(React) in `Business-Loan/ApplicantPortal(React)`.

Run command (local/CI):
- Start app: `npm run dev -- --host 0.0.0.0 --port 4173`
- Run E2E: `npm run test:e2e` (or `E2E_BASE_URL=http://localhost:4173 npm run test:e2e`)

## Traceability Matrix (Story → Test Case)

| Story ID | Test Case ID | Requirement / Expected Behavior (authoritative) | E2E Automation Status | Implemented In UI/Backend? | Evidence / Notes |
|---|---|---|---|---|---|
| 322427 | TC-322427-01 | Register new account sends one-time verification link and shows success (no auto-login) | Automated (partial) | UI: Yes (success + no auto-login). Verification link: Not implemented | Automated assertion validates success message and still on /login; does not validate email delivery/verification. |
| 322427 | TC-322427-02 | Unverified account login is blocked with option to resend verification email | Not automated | Not implemented | No UI/endpoint for resend/blocked-unverified behavior observed. |
| 322427 | TC-322427-03 | Verification link within validity marks account verified and invalidates token | Not automated | Not implemented | Requires backend verification-token issuance + verify endpoint + UI route to consume token. |
| 322427 | TC-322427-04 | Expired or already-used verification link shows error and preserves account state | Not automated | Not implemented | Same missing verification flow as above. |
| 322427 | TC-322427-05 | Password policy enforcement with accessible inline errors prevents submission until compliant | Automated | UI: Yes | Automated assertion validates inline error strings for invalid email / short password / mismatch confirm. |
| 322427 | TC-322427-06 | Audit log entries recorded for all auth actions with timestamp and IP | Not automated | Not E2E-verifiable from browser | Requires backend audit log retrieval interface or DB access; not available from frontend E2E. |
| 322427 | TC-322427-07 | Enforcement of TLS 1.3 in transit and AES-256 at rest per security requirements | Not automated | Not E2E-verifiable from browser | TLS version / at-rest encryption require infrastructure/security validation, not UI E2E. |

## Latest Execution Results

| Story ID | Test Case ID | Playwright Test Name | Result | Notes |
|---|---|---|---|---|
| 322427 | TC-322427-01 | `Register new account shows success (no auto-login)` | Not executed in this change request | Requires `npm run dev` running on port 4173 and backend registration endpoint reachable. |
| 322427 | TC-322427-05 | `Password policy enforcement shows accessible inline errors and blocks submit` | Not executed in this change request | Same as above. |

> Note: The initial attempt to run Playwright in this environment failed because Playwright was discovering `src/App.test.js` (React unit test) which imports `@testing-library/react` (not installed). This change fixes that by scoping Playwright `testDir` to `./e2e`.
