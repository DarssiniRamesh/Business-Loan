import React from "react";
import { Navigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * Signup page route wrapper.
 * We implement the two-panel auth UI in /login and open it in signup mode via query param.
 */
export default function Signup() {
  return <Navigate to="/login?mode=signup" replace />;
}
