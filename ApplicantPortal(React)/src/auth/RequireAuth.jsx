import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken, getRefreshToken } from "../api/tokenStorage";

/**
 * PUBLIC_INTERFACE
 * Route guard: requires an authenticated session.
 *
 * We consider a user "still logged in" if they have either:
 * - an access token (used directly for Authorization), OR
 * - a refresh token (axios interceptor can refresh an expired/missing access token on 401).
 *
 * This prevents redirect-to-login loops when the access token is missing/expired but the
 * refresh token is still valid.
 */
export default function RequireAuth({ children }) {
  const location = useLocation();
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken && !refreshToken) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}
