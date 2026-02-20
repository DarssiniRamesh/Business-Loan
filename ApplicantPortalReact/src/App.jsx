import React from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { getAppConfig } from "./config/env.js";
import { useAuth } from "./state/auth.jsx";
import { RequireRole } from "./routes/guards.jsx";

import Login from "./features/auth/Login.jsx";
import Register from "./features/auth/Register.jsx";
import MfaVerify from "./features/auth/MfaVerify.jsx";

import ApplicantDashboard from "./features/dashboard/ApplicantDashboard.jsx";
import ApplicationWizard from "./features/application/ApplicationWizard.jsx";
import DocumentUpload from "./features/documents/DocumentUpload.jsx";

import OfficerQueue from "./features/officer/OfficerQueue.jsx";
import OfficerDetail from "./features/officer/OfficerDetail.jsx";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "OFFICER") return <Navigate to="/officer/queue" replace />;
  return <Navigate to="/dashboard" replace />;
}

function TopNav() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const cfg = getAppConfig();

  return (
    <div className="header">
      <div className="nav">
        <div className="brand">
          <Link to="/" style={{ textDecoration: "none" }}>Business Loan</Link>
          <span className="badge">{cfg.nodeEnv}</span>
        </div>
        <div className="navSpacer" />
        {user ? (
          <div className="row">
            <span className="badge">{user.role || "USER"}</span>
            <span className="small">{user.email}</span>
            {user.role === "OFFICER" ? (
              <button className="btn" onClick={() => nav("/officer/queue")}>Queue</button>
            ) : (
              <>
                <button className="btn" onClick={() => nav("/dashboard")}>Dashboard</button>
                <button className="btn" onClick={() => nav("/apply")}>Apply</button>
              </>
            )}
            <button className="btn" onClick={logout}>Sign out</button>
          </div>
        ) : (
          <div className="row">
            <Link className="btn" to="/login" style={{ textDecoration: "none" }}>Sign in</Link>
            <Link className="btn btnPrimary" to="/register" style={{ textDecoration: "none" }}>Register</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mfa" element={<MfaVerify />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <ApplicantDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/apply"
          element={
            <RequireAuth>
              <ApplicationWizard />
            </RequireAuth>
          }
        />
        <Route
          path="/documents"
          element={
            <RequireAuth>
              <DocumentUpload />
            </RequireAuth>
          }
        />

        <Route
          path="/officer/queue"
          element={
            <RequireRole role="OFFICER">
              <OfficerQueue />
            </RequireRole>
          }
        />
        <Route
          path="/officer/applications/:id"
          element={
            <RequireRole role="OFFICER">
              <OfficerDetail />
            </RequireRole>
          }
        />

        <Route path="*" element={<div className="container"><div className="card">Not found</div></div>} />
      </Routes>
    </>
  );
}
