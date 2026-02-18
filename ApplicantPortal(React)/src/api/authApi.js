import { apiClient } from "./axiosConfig";
import { clearTokens, setTokens } from "./tokenStorage";

/**
 * Extract tokens from a backend auth response.
 * Supports multiple response shapes for compatibility.
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
 * Normalize a token string — strip any "Bearer " prefix that might
 * have accidentally been stored, and ensure we never store "null" or "undefined" strings.
 */
function normalizeToken(token) {
  const t = String(token || "").trim();
  if (!t || t === "null" || t === "undefined") return null;
  return t.replace(/^Bearer\s+/i, "").trim() || null;
}

/**
 * Safely store tokens — only stores values that are actual non-empty strings.
 * Prevents "Bearer null" and "Bearer undefined" headers.
 */
function safeSetTokens({ accessToken, refreshToken }) {
  const a = normalizeToken(accessToken);
  const r = normalizeToken(refreshToken);
  // Only call setTokens if at least one is valid
  if (a || r) {
    setTokens({ accessToken: a, refreshToken: r });
  }
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
 * Login: validate credentials and store tokens.
 * Backend: POST /api/auth/login
 *
 * Always clears old tokens first, then stores new ones only if valid.
 * Returns the raw response data so the caller can check for pendingMfa etc.
 */
export async function loginStep1({ email, password }) {
  // Clear any stale tokens so we don't accidentally reuse them
  clearTokens();

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const res = await apiClient.post("/auth/login", { email: normalizedEmail, password });
  const data = res.data;

  const { accessToken, refreshToken } = extractTokens(data);
  safeSetTokens({ accessToken, refreshToken });

  return data;
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
  safeSetTokens({ accessToken: extracted.accessToken, refreshToken: extracted.refreshToken });

  return data;
}

/**
 * PUBLIC_INTERFACE
 * Logout — revoke refresh token on the backend.
 * Backend: POST /api/auth/logout
 */
export async function logout({ refreshToken }) {
  await apiClient.post("/auth/logout", { refreshToken });
}