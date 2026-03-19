import { apiClient } from "./axiosConfig";

/**
 * Safely stringify objects as JSON strings for backend DTOs that accept "JSON encoded as string".
 */
function toJsonString(value, fallback = "{}") {
  if (typeof value === "string") {
    // Validate it's JSON object-like; if not, let backend handle/throw.
    return value;
  }
  try {
    return JSON.stringify(value ?? JSON.parse(fallback));
  } catch {
    return fallback;
  }
}

/**
 * PUBLIC_INTERFACE
 * Create a new loan application draft for the authenticated user.
 * Backend: POST /api/loan/drafts
 */
export async function createDraft({ data = {}, sectionStatus = {}, currentStep = "businessInfo" } = {}) {
  const res = await apiClient.post("/loan/drafts", {
    data: toJsonString(data, "{}"),
    sectionStatus: toJsonString(sectionStatus, "{}"),
    currentStep,
  });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * List drafts for the authenticated user.
 * Backend: GET /api/loan/drafts
 */
export async function listDrafts() {
  const res = await apiClient.get("/loan/drafts");
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Get one draft by id.
 * Backend: GET /api/loan/drafts/{draftId}
 */
export async function getDraft(draftId) {
  const res = await apiClient.get(`/loan/drafts/${draftId}`);
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Patch a section within a draft.
 * Backend: PATCH /api/loan/drafts/{draftId}/sections
 */
export async function patchDraftSection({
  draftId,
  sectionKey,
  sectionData,
  sectionStatus,
  currentStep,
  expectedVersion,
}) {
  const res = await apiClient.patch(`/loan/drafts/${draftId}/sections`, {
    sectionKey,
    sectionData: toJsonString(sectionData, "{}"),
    sectionStatus: sectionStatus === undefined ? undefined : toJsonString(sectionStatus, "{}"),
    currentStep,
    expectedVersion,
  });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Check readiness for submission.
 * Backend: POST /api/loan/drafts/{draftId}/readiness
 */
export async function checkDraftReadiness({ draftId, requiredSections, requiredDocumentTypes, runDecisioning }) {
  const res = await apiClient.post(`/loan/drafts/${draftId}/readiness`, {
    requiredSections,
    requiredDocumentTypes,
    runDecisioning,
  });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Submit a draft (locks it).
 * Backend: POST /api/loan/drafts/{draftId}/submit
 */
export async function submitDraft({ draftId, requiredSections, requiredDocumentTypes, runDecisioning = true }) {
  const res = await apiClient.post(`/loan/drafts/${draftId}/submit`, {
    requiredSections,
    requiredDocumentTypes,
    runDecisioning,
  });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Run risk scoring + decisioning for a draft.
 * Backend: POST /api/loan/drafts/{draftId}/decision
 */
export async function decideDraft({ draftId }) {
  const res = await apiClient.post(`/loan/drafts/${draftId}/decision`);
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Delete a draft (only if not submitted).
 * Backend: DELETE /api/loan/drafts/{draftId}
 */
export async function deleteDraft({ draftId }) {
  await apiClient.delete(`/loan/drafts/${draftId}`);
}
