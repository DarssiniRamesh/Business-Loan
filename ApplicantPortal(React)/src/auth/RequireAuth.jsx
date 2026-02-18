import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken } from "../api/tokenStorage";

/**
 * PUBLIC_INTERFACE
 * Route guard: requires access token presence. If token expired, axios interceptor will refresh.
 */
export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}
