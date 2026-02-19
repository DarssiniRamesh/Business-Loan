import { apiClient, getResolvedApiBaseUrl } from "./axiosConfig";

/**
 * PUBLIC_INTERFACE
 * Upload a supporting document (PDF/JPG/PNG). Optionally link to a loan draft and include metadata JSON.
 * Backend: POST /api/documents (multipart/form-data)
 */
export async function uploadDocument({ file, loanDraftId, metadata }) {
  const form = new FormData();
  form.append("file", file);

  if (loanDraftId) form.append("loanDraftId", loanDraftId);
  if (metadata !== undefined && metadata !== null) {
    form.append("metadata", typeof metadata === "string" ? metadata : JSON.stringify(metadata));
  }

  const res = await apiClient.post("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * List supporting documents for the current user (optionally filtered by loanDraftId).
 * Backend: GET /api/documents
 */
export async function listDocuments({ loanDraftId } = {}) {
  const res = await apiClient.get("/documents", {
    params: loanDraftId ? { loanDraftId } : {},
  });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Replace document metadata JSON string.
 * Backend: PUT /api/documents/{documentId}/metadata
 */
export async function updateDocumentMetadata({ documentId, metadata }) {
  const res = await apiClient.put(`/documents/${documentId}/metadata`, {
    metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata),
  });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Construct a download URL for a document.
 * Backend: GET /api/documents/{documentId}/download
 */
export function getDocumentDownloadUrl(documentId) {
  const apiBase = getResolvedApiBaseUrl(); // ends with /api
  return `${apiBase}/documents/${documentId}/download`;
}

/**
 * PUBLIC_INTERFACE
 * Delete a supporting document.
 * Backend: DELETE /api/documents/{documentId}
 */
export async function deleteDocument({ documentId }) {
  await apiClient.delete(`/documents/${documentId}`);
}
