const ACCESS_TOKEN_KEY  = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * PUBLIC_INTERFACE
 * Get stored access token for Authorization header.
 * Returns null (not the string "null") if not set.
 */
export function getAccessToken() {
  try {
    const v = localStorage.getItem(ACCESS_TOKEN_KEY);
    // Guard against accidentally stored "null" / "undefined" strings
    if (!v || v === "null" || v === "undefined") return null;
    return v;
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
    const v = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!v || v === "null" || v === "undefined") return null;
    return v;
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
    if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken && refreshToken !== "null" && refreshToken !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
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