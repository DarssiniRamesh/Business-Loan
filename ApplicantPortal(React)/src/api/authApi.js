import { apiClient } from "./axiosConfig";
import { clearTokens, setTokens } from "./tokenStorage";

/**
 * Extract tokens from a backend auth response. We support multiple shapes because
 * the backend has evolved (and some environments may still return legacy fields).
 *
 * Examples supported:
 * - { accessToken, refreshToken }
 * - { access_token, refresh_token }
 * - { token }  (legacy access token field)
 * - { tokens: { accessToken, refreshToken } }
 */
function extractTokens(authResponse) {
  const data = authResponse || {};

  const nested = data?.tokens && typeof data.tokens === "object" ? data.tokens : {};

  const accessToken =
    data?.accessToken ||
    data?.access_token ||
    data?.token ||
    data?.jwt ||
    nested?.accessToken ||
    nested?.access_token ||
    nested?.token ||
    null;

  const refreshToken =
    data?.refreshToken ||
    data?.refresh_token ||
    nested?.refreshToken ||
    nested?.refresh_token ||
    null;

  return { accessToken, refreshToken };
}

/**
 * Normalize token strings before storage (avoid "Bearer Bearer ..." issues).
 */
function normalizeToken(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  return t.replace(/^Bearer\s+/i, "").trim();
}

/**
 * PUBLIC_INTERFACE
 * Register a new applicant user.
 * Backend: POST /api/auth/register
 */
export async function registerApplicant({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const res = await apiClient.post("/auth/register", { email: normalizedEmail, password });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Login step 1: validate credentials; may require MFA.
 * Backend: POST /api/auth/login
 *
 * Note: Some backend versions return `{ token }` (legacy) instead of `{ accessToken }`.
 * We persist either shape to ensure authenticated endpoints (e.g. draft creation) work.
 */
export async function loginStep1({ email, password }) {
  // Ensure we don't keep using stale/invalid tokens if a previous session existed.
  // This prevents authenticated calls (e.g. draft creation) from failing/redirecting
  // due to leftover tokens when the new login attempt is invalid.
  clearTokens();

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const res = await apiClient.post("/auth/login", { email: normalizedEmail, password });
  const data = res.data;

  const { accessToken, refreshToken } = extractTokens(data);
  if (accessToken || refreshToken) {
    setTokens({
      accessToken: normalizeToken(accessToken),
      refreshToken: normalizeToken(refreshToken),
    });
  } else {
    // Defensive: if backend ever returns a non-token login response, don't allow old tokens to linger.
    clearTokens();
  }

  return data; // e.g. { pendingMfa, accessToken, refreshToken }
}

/**
 * PUBLIC_INTERFACE
 * Refresh tokens (rotate refresh token).
 * Backend: POST /api/auth/refresh
 */
export async function refreshTokens({ refreshToken }) {
  const res = await apiClient.post("/auth/refresh", { refreshToken });
  const data = res.data;

  const extracted = extractTokens(data);
  setTokens({
    accessToken: normalizeToken(extracted.accessToken),
    refreshToken: normalizeToken(extracted.refreshToken),
  });

  return data;
}

/**
 * PUBLIC_INTERFACE
 * Logout (revoke refresh token).
 * Backend: POST /api/auth/logout
 */
export async function logout({ refreshToken }) {
  await apiClient.post("/auth/logout", { refreshToken });
}
