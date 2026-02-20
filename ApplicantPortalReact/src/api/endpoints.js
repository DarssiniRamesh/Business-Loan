import { httpRequest } from "./http.js";

/**
 * NOTE:
 * The backend OpenAPI spec is not present in the workspace at this time.
 * These endpoints follow typical Spring Boot REST conventions for this product.
 * If backend paths differ, update only this file to re-wire the UI.
 */

// PUBLIC_INTERFACE
export const AuthApi = {
  /** Register applicant account (starts MFA enrollment). */
  register: (payload) => httpRequest("/api/auth/register", { method: "POST", body: payload, auth: false }),
  /** Login with email/password. Backend may return mfaRequired flag. */
  login: (payload) => httpRequest("/api/auth/login", { method: "POST", body: payload, auth: false }),
  /** Verify MFA code after login. */
  verifyMfa: (payload) => httpRequest("/api/auth/mfa/verify", { method: "POST", body: payload, auth: false }),
  /** Fetch current user profile & role. */
  me: () => httpRequest("/api/auth/me", { method: "GET" }),
  /** Logout token server-side (optional). */
  logout: () => httpRequest("/api/auth/logout", { method: "POST" })
};

// PUBLIC_INTERFACE
export const ApplicantApi = {
  /** Create a new loan application skeleton */
  createApplication: () => httpRequest("/api/applications", { method: "POST", body: {} }),
  /** Get current user's applications */
  listMyApplications: () => httpRequest("/api/applications/mine", { method: "GET" }),
  /** Get a specific application */
  getApplication: (id) => httpRequest(`/api/applications/${id}`, { method: "GET" }),
  /** Patch/update application sections (autosave) */
  updateApplication: (id, patch) => httpRequest(`/api/applications/${id}`, { method: "PATCH", body: patch }),
  /** Submit application for decisioning */
  submitApplication: (id) => httpRequest(`/api/applications/${id}/submit`, { method: "POST", body: {} }),
  /** Upload supporting documents */
  uploadDocument: (applicationId, file, docType) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);
    return httpRequest(`/api/applications/${applicationId}/documents`, { method: "POST", body: fd });
  },
  /** List uploaded documents */
  listDocuments: (applicationId) => httpRequest(`/api/applications/${applicationId}/documents`, { method: "GET" })
};

// PUBLIC_INTERFACE
export const OfficerApi = {
  /** Officer queue with filter/status */
  listQueue: (status = "ALL") => httpRequest(`/api/officer/queue?status=${encodeURIComponent(status)}`, { method: "GET" }),
  /** Officer detail view */
  getApplicationDetail: (id) => httpRequest(`/api/officer/applications/${id}`, { method: "GET" }),
  /** Set decision / move to manual review / decline */
  setDecision: (id, payload) => httpRequest(`/api/officer/applications/${id}/decision`, { method: "POST", body: payload })
};
