import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ApplicantPortal from "./pages/ApplicantPortal";
import RequireAuth from "./auth/RequireAuth";

/**
 * PUBLIC_INTERFACE
 * App routing entrypoint (React Router v6).
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <ApplicantPortal />
          </RequireAuth>
        }
      />

      {/* Default fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
