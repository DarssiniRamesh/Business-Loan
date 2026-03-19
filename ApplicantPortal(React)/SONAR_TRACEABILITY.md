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

### Current SonarQube snapshot (evidence-based)

Pulled from SonarQube project key **`DarssiniRamesh_Business-Loan`**:

- **Open issues:** **147** (statuses: OPEN/CONFIRMED)  
  Evidence: Sonar issue search paging total = 147.
- **Security hotspots to review:** **7** (status: TO_REVIEW)

> Note: The raw issue list is large; this section lists the highest-impact items and recurring categories, with concrete Sonar issue keys for traceability.

### Highest-impact open issues (examples with keys)

#### A) Cognitive complexity / deep nesting (CRITICAL)
- `src/api/axiosConfig.js`
  - **AZ0E9_CAIpZiw5iiU39O** — `javascript:S3776` Cognitive Complexity 33 > 15 (line ~249)
  - **AZ0E9_CAIpZiw5iiU39I** — `javascript:S3776` Cognitive Complexity 18 > 15 (line ~60)
- `src/api.js`
  - **AZ0E9_CQIpZiw5iiU39o** — `javascript:S3776` Cognitive Complexity 18 > 15 (line ~29)
- `src/pages/ApplicantPortal.jsx`
  - **AZ0E9_B3IpZiw5iiU375** — `javascript:S3776` Cognitive Complexity 20 > 15 (line ~405)
  - **AZ0E9_B3IpZiw5iiU38v** — `javascript:S3776` Cognitive Complexity 23 > 15 (line ~1092)
  - **AZ0E9_B3IpZiw5iiU374** — `javascript:S2004` nesting > 4 levels (line ~402)
  - **AZ0E9_B3IpZiw5iiU37-** — `javascript:S2004` nesting > 4 levels (line ~491)
  - **AZ0E9_B3IpZiw5iiU37_** — `javascript:S2004` nesting > 4 levels (line ~536)
  - **AZ0E9_B3IpZiw5iiU38A** — `javascript:S2004` nesting > 4 levels (line ~545)

#### B) Props validation missing (MAJOR) — large volume
Recurring rule: `javascript:S6774` across multiple React components/pages:
- `src/pages/ApplicantPortal.jsx` (many)
- `src/pages/Login.jsx` (many)
- `src/auth/RequireAuth.jsx` (**AZ0E9_CXIpZiw5iiU39v** — missing `children` validation)
- `src/components/Header.jsx` (missing `onLoginClick` validation)
- `src/components/Home.jsx` (missing `onGetStartedClick` validation)
- `src/components/Login.jsx` / `src/components/Signup.jsx` (missing handler validations)

#### C) Accessibility / form label association (MAJOR)
Recurring rule: `javascript:S6853` in `src/pages/ApplicantPortal.jsx`:
- **AZ0E9_B3IpZiw5iiU38Y**, **AZ0E9_B3IpZiw5iiU38Z**, **AZ0E9_B3IpZiw5iiU38a**, **AZ0E9_B3IpZiw5iiU38n**, **AZ0E9_B3IpZiw5iiU38p**, **AZ0E9_B3IpZiw5iiU388**, **AZ0E9_B3IpZiw5iiU389** (various lines ~919–1127)

#### D) Error propagation style (MAJOR)
Recurring rule: `javascript:S7746` in `src/api/axiosConfig.js`:
- **AZ0E9_CAIpZiw5iiU39P**, **AZ0E9_CAIpZiw5iiU39g**, **AZ0E9_CAIpZiw5iiU39T**, **AZ0E9_CAIpZiw5iiU39Y**, **AZ0E9_CAIpZiw5iiU39c** (Prefer `throw error` vs `Promise.reject`)

#### E) globalThis preference (MINOR)
Recurring rule: `javascript:S7764` in:
- `src/api/axiosConfig.js` (multiple keys e.g. **AZ0E9_CAIpZiw5iiU39d**, **AZ0E9_CAIpZiw5iiU39e**, **AZ0E9_CAIpZiw5iiU39f**…)
- `src/api.js` (multiple keys e.g. **AZ0E9_CQIpZiw5iiU39l**, **AZ0E9_CQIpZiw5iiU39m**…)

### Security hotspots (TO_REVIEW)

Pulled from SonarQube hotspot search (status: TO_REVIEW):

- `javascript:S5852` (Regex DoS / backtracking), vulnerabilityProbability=MEDIUM
  - **AZ0E9_CQIpZiw5iiU39i** — `src/api.js` (line ~5)
  - **AZ0E9_CAIpZiw5iiU39C** — `src/api/axiosConfig.js` (line ~11)
  - **AZ0E9-_aIpZiw5iiU37s** — `src/pages/Login.jsx` (line ~303)
  - **AZ0E9-_aIpZiw5iiU37t** — `src/pages/Login.jsx` (line ~307)
  - **AZ0E9-_aIpZiw5iiU37y** — `src/pages/Login.jsx` (line ~408)
  - **AZ0E9-_aIpZiw5iiU37z** — `src/pages/Login.jsx` (line ~411)
- `Web:S5725` (Subresource Integrity), vulnerabilityProbability=LOW
  - **AZ0E9_ChIpZiw5iiU39w** — `index.html` (Google Fonts; line ~13)

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
