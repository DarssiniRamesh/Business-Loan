import { apiClient } from "./axiosConfig";
import { setTokens } from "./tokenStorage";

/**
 * PUBLIC_INTERFACE
 * Register a new applicant user.
 * Backend: POST /api/auth/register
 */
export async function registerApplicant({ email, password }) {
  const res = await apiClient.post("/auth/register", { email, password });
  return res.data;
}

/**
 * PUBLIC_INTERFACE
 * Login step 1: validate credentials; may require MFA.
 * Backend: POST /api/auth/login
 */
export async function loginStep1({ email, password }) {
  const res = await apiClient.post("/auth/login", { email, password });
  const data = res.data;
  if (data?.accessToken || data?.refreshToken) {
    setTokens({ accessToken: data?.accessToken, refreshToken: data?.refreshToken });
  }
  return data; // { userId, pendingMfa }
}

/**
 * PUBLIC_INTERFACE
 * Refresh tokens (rotate refresh token).
 * Backend: POST /api/auth/refresh
 */
export async function refreshTokens({ refreshToken }) {
  const res = await apiClient.post("/auth/refresh", { refreshToken });
  const data = res.data; // { accessToken, refreshToken, tokenType }
  setTokens({ accessToken: data?.accessToken, refreshToken: data?.refreshToken });
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
