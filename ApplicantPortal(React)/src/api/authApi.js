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
  return res.data; // { userId, pendingMfa }
}

/**
 * PUBLIC_INTERFACE
 * Login step 2: verify OTP and receive tokens.
 * Backend: POST /api/auth/login/{userId}/mfa/verify
 */
export async function verifyMfa({ userId, otp }) {
  const res = await apiClient.post(`/auth/login/${userId}/mfa/verify`, { otp });
  const data = res.data; // { accessToken, refreshToken, tokenType }
  setTokens({ accessToken: data?.accessToken, refreshToken: data?.refreshToken });
  return data;
}
