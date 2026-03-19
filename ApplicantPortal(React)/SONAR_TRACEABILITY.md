# SonarQube Remediation Traceability — Business-Loan Applicant Portal (React)

This document tracks SonarQube-driven remediation work for the **Business-Loan / ApplicantPortal(React)** frontend, with an emphasis on CRITICAL/MAJOR categories (complexity, nesting, props validation, a11y label association, negated conditions, throw vs Promise.reject, globalThis usage, unused imports, formatting).

> Scope: `Business-Loan/ApplicantPortal(React)` only  
> Note: This is a “living” trace log. Items marked **Needs verification** should be validated by re-running SonarQube analysis.

---

## Fix Log (Implemented)

### 1) Props validation (React / PropTypes)
**Category:** Props validation / reliability  
**Status:** Implemented

- Added/confirmed `prop-types` dependency:
  - `ApplicantPortal(React)/package.json` (already present at time of this update)
- Added `PropTypes` definitions to internal components previously lacking explicit validation:
  - `src/pages/ApplicantPortal.jsx`
    - `Toasts.propTypes`
    - `DraftsPanel.propTypes`
    - `DocumentsPanel.propTypes`
    - `SubmitPanel.propTypes`
  - `src/pages/Login.jsx`
    - `Field.propTypes`
    - `LoginForm.propTypes`
    - `SignupForm.propTypes`

---

### 2) Accessibility: label association (a11y)
**Category:** Accessibility / a11y label-control association  
**Status:** Implemented

- Fixed label association using `htmlFor` + `id` with `useId()`:
  - `src/pages/ApplicantPortal.jsx`
    - Section editor labels now bind to input/select/textarea.
    - Document type label now binds to select.
    - Submit “required sections/doc types” labels now bind to inputs.
  - `src/pages/Login.jsx`
    - `Field` now renders a proper `<label htmlFor>` associated with its `<input>`.

---

### 3) React hooks correctness (side effects)
**Category:** Bug / reliability (hook misuse)  
**Status:** Implemented

- Replaced `useMemo()` used for navigation side-effects with `useEffect()`:
  - `src/pages/Login.jsx`
    - Authenticated redirect now runs in `useEffect`.

---

## Remaining / Pending Items (Needs verification)

These were identified as common Sonar categories in the work item, but require a current Sonar run to confirm status after code changes:

1) **Cognitive complexity / nesting**
   - `src/pages/ApplicantPortal.jsx` is very large and may still trigger cognitive complexity thresholds.
   - If Sonar still flags complexity, next step should be a flow refactor:
     - Extract panels into separate files (`DraftsPanel`, `DocumentsPanel`, `SubmitPanel`) and/or
     - Extract reusable “flow helpers” (e.g., readiness parsing, API run wrappers).

2) **Unused imports / formatting**
   - Needs a fresh Sonar/ESLint pass to confirm no remaining unused symbols.

3) **Negated conditions**
   - There may still be occurrences that Sonar flags as readability issues.
   - Recommend addressing only those that remain after the next Sonar pass to avoid churn.

4) **throw vs Promise.reject**
   - `src/api/axiosConfig.js` already uses `throw` at interceptor boundaries.
   - Needs Sonar verification to confirm all instances conform.

5) **globalThis usage**
   - `src/api/axiosConfig.js` and `src/components/Home.jsx` already use `globalThis?.window` guards.
   - Needs Sonar verification to confirm rule compliance for the project configuration.

---

## Files Touched (This update)
- `ApplicantPortal(React)/src/pages/Login.jsx`
- `ApplicantPortal(React)/src/pages/ApplicantPortal.jsx`
- `ApplicantPortal(React)/SONAR_TRACEABILITY.md`

---

## How to Verify
Re-run SonarQube analysis for the project and confirm:
- No remaining **CRITICAL/MAJOR** issues for:
  - a11y label association
  - missing PropTypes
  - hook misuse (useMemo for side-effects)

Then update the “Remaining / Pending Items” section above with:
- issue keys (if available)
- file paths + brief remediation notes
- resolution status
