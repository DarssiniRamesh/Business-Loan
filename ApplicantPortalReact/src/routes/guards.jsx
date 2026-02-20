import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

// PUBLIC_INTERFACE
export function RequireAuth({ children }) {
  /** Guards a route to require authentication. */
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

// PUBLIC_INTERFACE
export function RequireRole({ role, children }) {
  /** Guards a route to require a specific role. */
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;
  return children;
}
