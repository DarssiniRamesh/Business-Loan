import { stripBearerPrefix } from "../utils/stringUtils";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Legacy keys from earlier iterations (kept for migration/backwards compatibility).
const LEGACY_ACCESS_TOKEN_KEY = "authToken";

/**
 * Return a valid token string or null.
 * Treats "", "null", "undefined" as missing.
 */
function normalizeStoredToken(value) {
  const v = String(value || "").trim();
  if (!v || v === "null" || v === "undefined") return null;
  return v;
}

/**
 * Some callers may have accidentally stored "Bearer <token>".
 * We store raw token only; axios will add "Bearer " when sending.
 */
function normalizeToken(token) {
  const t = normalizeStoredToken(token);
  return stripBearerPrefix(t);
}

/**
 * PUBLIC_INTERFACE
 * Get stored access token for Authorization header.
 * Returns null (not the string "null") if not set.
 */
export function getAccessToken() {
  try {
    const primary = normalizeToken(localStorage.getItem(ACCESS_TOKEN_KEY));
    if (primary) return primary;

    // Backwards compatible fallback: migrate from legacy key if present.
    const legacy = normalizeToken(localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY));
    if (legacy) {
      localStorage.setItem(ACCESS_TOKEN_KEY, legacy);
      // Keep legacy key for now (do not remove) to avoid breaking older code paths.
      return legacy;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Get stored refresh token.
 */
export function getRefreshToken() {
  try {
    return normalizeToken(localStorage.getItem(REFRESH_TOKEN_KEY));
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Store access/refresh tokens — only stores valid non-empty strings.
 */
export function setTokens({ accessToken, refreshToken }) {
  try {
    const a = normalizeToken(accessToken);
    const r = normalizeToken(refreshToken);

    if (a) {
      localStorage.setItem(ACCESS_TOKEN_KEY, a);
      // Also write legacy key for compatibility with any older reads.
      localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, a);
    }
    if (r) {
      localStorage.setItem(REFRESH_TOKEN_KEY, r);
    }
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

/**
 * PUBLIC_INTERFACE
 * Clear both tokens (logout / 401 unrecoverable).
 */
export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * PUBLIC_INTERFACE
 * True when a valid (non-null-string) access or refresh token is stored.
 */
export function hasAnyToken() {
  return Boolean(getAccessToken() || getRefreshToken());
}
