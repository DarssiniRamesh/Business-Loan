const ACCESS_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * PUBLIC_INTERFACE
 * Get stored access token for Authorization header (MVP).
 */
export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Get stored refresh token used for rotating access tokens.
 */
export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Store access/refresh tokens (if provided).
 */
export function setTokens({ accessToken, refreshToken }) {
  try {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

/**
 * PUBLIC_INTERFACE
 * Clear tokens (used on logout / 401).
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
 * True when we have at least one token stored.
 */
export function hasAnyToken() {
  return Boolean(getAccessToken() || getRefreshToken());
}
