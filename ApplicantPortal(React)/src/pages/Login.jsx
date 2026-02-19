import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuildingColumns,
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
  faShieldHalved,
  faTriangleExclamation,
  faSpinner,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { loginStep1, registerApplicant } from "../api/authApi";
import { getAccessToken } from "../api/tokenStorage";

function useQueryMode(defaultMode = "login") {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  return params.get("mode") || defaultMode;
}

/**
 * PUBLIC_INTERFACE
 * Login / Signup page.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode = useQueryMode("login");
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login");

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("next") || "/app";
  }, [location.search]);

  // If already authenticated, go straight to app
  useMemo(() => {
    if (getAccessToken()) navigate(nextPath, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .auth-card {
          width: 100%; max-width: 960px;
          display: grid; grid-template-columns: 1fr 1fr;
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.08);
        }
        @media (max-width: 680px) {
          .auth-card { grid-template-columns: 1fr; }
          .auth-left { display: none !important; }
        }
        .auth-left {
          background: linear-gradient(160deg, #1e3a5f 0%, #0f172a 100%);
          padding: 48px 40px;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .auth-right {
          background: #ffffff;
          padding: 0;
          display: flex; flex-direction: column;
        }
        .auth-right-head {
          padding: 28px 36px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .auth-right-body { padding: 32px 36px 36px; flex: 1; }
        .mode-toggle {
          display: inline-flex; background: #f1f5f9; border-radius: 10px; padding: 3px; gap: 2px;
        }
        .mode-btn {
          padding: 7px 18px; border: none; cursor: pointer; border-radius: 8px;
          font-family: inherit; font-size: 13px; font-weight: 600; transition: all .15s;
          background: transparent; color: #64748b;
        }
        .mode-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

        .inp-wrap {
          display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px;
        }
        .inp-lbl {
          font-size: 11.5px; font-weight: 700; letter-spacing: .06em;
          text-transform: uppercase; color: #334155;
        }
        .inp-row {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #fff;
          transition: border .15s, box-shadow .15s;
        }
        .inp-row:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,.1);
        }
        .inp-row.err { border-color: #fca5a5; }
        .inp-row input {
          flex: 1; border: none; outline: none; background: transparent;
          font-family: inherit; font-size: 13.5px; color: #0f172a;
        }
        .inp-row input::placeholder { color: #cbd5e1; }
        .inp-icon { color: #94a3b8; font-size: 14px; flex-shrink: 0; }
        .inp-icon.err { color: #f87171; }
        .inp-err { font-size: 11.5px; font-weight: 600; color: #dc2626; margin-top: 3px; display: flex; align-items: center; gap: 5px; }

        .submit-btn {
          width: 100%; height: 44px; border: none; border-radius: 10px;
          background: #2563eb; color: #fff;
          font-family: inherit; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all .15s;
          box-shadow: 0 4px 16px rgba(37,99,235,.3);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,.35); }
        .submit-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }

        .form-err {
          padding: 11px 14px; border-radius: 9px;
          background: #fff1f2; border: 1.5px solid #fecdd3;
          color: #b91c1c; font-size: 13px; font-weight: 500;
          margin-bottom: 14px; display: flex; align-items: flex-start; gap: 8px;
        }
        .form-ok {
          padding: 11px 14px; border-radius: 9px;
          background: #f0fdf4; border: 1.5px solid #bbf7d0;
          color: #15803d; font-size: 13px; font-weight: 500;
          margin-bottom: 14px; display: flex; align-items: flex-start; gap: 8px;
        }
        .switch-link { font-weight: 700; color: #2563eb; background: none; border: none; cursor: pointer; font-family: inherit; font-size: 13.5px; }
        .switch-link:hover { color: #1d4ed8; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin .7s linear infinite; display: inline-block; }
      `}</style>

      <div className="auth-card">
        {/* Left panel */}
        <div className="auth-left">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 16,
                boxShadow: "0 4px 16px rgba(37,99,235,.4)",
              }}>
                <FontAwesomeIcon icon={faBuildingColumns} />
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: "-.02em" }}>LoanPortal</div>
                <div style={{ color: "rgba(255,255,255,.55)", fontSize: 11.5, fontWeight: 500 }}>Business Finance</div>
              </div>
            </div>

            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.25, marginBottom: 14 }}>
              Secure funding workflows,<br />built for confidence.
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13.5, lineHeight: 1.7, marginBottom: 32 }}>
              Sign in to continue your application, upload documents, and track your status in real time.
            </p>

            {[
              { icon: faShieldHalved, title: "Bank-grade security", desc: "JWT-authenticated, encrypted connections." },
              { icon: faLock, title: "Privacy-first design", desc: "Built for financial compliance and trust." },
            ].map((b) => (
              <div key={b.title} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)",
                marginBottom: 10,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: "rgba(37,99,235,.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#93c5fd", fontSize: 14,
                }}>
                  <FontAwesomeIcon icon={b.icon} />
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{b.title}</div>
                  <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11.5, marginTop: 32 }}>
            Need help? Contact support once inside the portal.
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-right-head">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>
                  {mode === "login" ? "Welcome back" : "Create account"}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
                  {mode === "login" ? "Sign in to your account to continue." : "Start your application in under a minute."}
                </div>
              </div>
              <div className="mode-toggle">
                <button className={`mode-btn ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Login</button>
                <button className={`mode-btn ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Sign up</button>
              </div>
            </div>
          </div>

          <div className="auth-right-body">
            <AnimatePresence mode="wait" initial={false}>
              {mode === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm
                    onSuccess={() => navigate(nextPath, { replace: true })}
                    onSwitchToSignup={() => setMode("signup")}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <SignupForm
                    onSuccess={() => setMode("login")}
                    onSwitchToLogin={() => setMode("login")}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared input component ── */
function Field({ label, icon, type = "text", value, onChange, error, right, autoComplete, placeholder }) {
  return (
    <div className="inp-wrap">
      <div className="inp-lbl">{label}</div>
      <div className={`inp-row ${error ? "err" : ""}`}>
        <span className={`inp-icon ${error ? "err" : ""}`}><FontAwesomeIcon icon={icon} /></span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder || label}
        />
        {right}
      </div>
      {error && (
        <div className="inp-err">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {error}
        </div>
      )}
    </div>
  );
}

/* ── Login form ── */
function LoginForm({ onSuccess, onSwitchToSignup }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [touched, setTouched]   = useState({ email: false, password: false });
  const [busy, setBusy]         = useState(false);
  const [formError, setFormError] = useState("");

  const emailErr = touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? "Enter a valid email address." : "";
  const pwErr = touched.password && password.length < 8
    ? "Password must be at least 8 characters." : "";
  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setTouched({ email: true, password: true });
    if (!canSubmit) return;

    setBusy(true);
    try {
      // loginStep1 in authApi.js already calls setTokens() internally.
      await loginStep1({ email, password });

      // Critical: verify token was actually stored before navigating.
      // This catches cases where backend returns an unexpected shape
      // and extractTokens() failed to parse it.
      const stored = getAccessToken();
      if (!stored) {
        setFormError("Login succeeded but no auth token was received. Please contact support.");
        return;
      }

      onSuccess?.();
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 401 ? "Invalid email or password."
        : status === 403 ? "Account is not authorized."
        : status === 429 ? "Too many attempts — please wait a moment and try again."
        : err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      setFormError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {formError && (
        <div className="form-err">
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{formError}</span>
        </div>
      )}

      <Field
        label="Email address"
        icon={faEnvelope}
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setTouched((t) => ({ ...t, email: true })); }}
        error={emailErr}
        autoComplete="email"
        placeholder="you@company.com"
      />

      <Field
        label="Password"
        icon={faLock}
        type={showPw ? "text" : "password"}
        value={password}
        onChange={(e) => { setPassword(e.target.value); setTouched((t) => ({ ...t, password: true })); }}
        error={pwErr}
        autoComplete="current-password"
        placeholder="••••••••"
        right={
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, padding: "0 2px" }}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
          </button>
        }
      />

      <button type="submit" className="submit-btn" disabled={busy}>
        {busy ? <><FontAwesomeIcon icon={faSpinner} className="spin" /> Signing in…</> : "Sign in"}
      </button>

      <div style={{ textAlign: "center", fontSize: 13.5, color: "#64748b", marginTop: 20 }}>
        New here?{" "}
        <button type="button" className="switch-link" onClick={onSwitchToSignup}>
          Create an account
        </button>
      </div>
    </form>
  );
}

/* ── Signup form ── */
function SignupForm({ onSuccess, onSwitchToLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [touched, setTouched]   = useState({ email: false, password: false, confirm: false });
  const [busy, setBusy]         = useState(false);
  const [formError, setFormError] = useState("");
  const [okMsg, setOkMsg]         = useState("");

  const emailErr = touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Enter a valid email." : "";
  const pwErr    = touched.password && password.length < 8 ? "At least 8 characters required." : "";
  const confErr  = touched.confirm && confirm !== password ? "Passwords do not match." : "";
  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8 && confirm === password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(""); setOkMsg("");
    setTouched({ email: true, password: true, confirm: true });
    if (!canSubmit) return;

    setBusy(true);
    try {
      await registerApplicant({ email, password });
      setOkMsg("Account created! Please sign in.");
      onSuccess?.();
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 409 ? "An account with this email already exists."
        : err?.response?.data?.message || err?.message || "Signup failed. Please try again.";
      setFormError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {formError && (
        <div className="form-err">
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{formError}</span>
        </div>
      )}
      {okMsg && (
        <div className="form-ok">
          <FontAwesomeIcon icon={faCircleCheck} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{okMsg}</span>
        </div>
      )}

      <Field
        label="Email address"
        icon={faEnvelope}
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setTouched((t) => ({ ...t, email: true })); }}
        error={emailErr}
        autoComplete="email"
        placeholder="you@company.com"
      />

      <Field
        label="Password"
        icon={faLock}
        type={showPw ? "text" : "password"}
        value={password}
        onChange={(e) => { setPassword(e.target.value); setTouched((t) => ({ ...t, password: true })); }}
        error={pwErr}
        autoComplete="new-password"
        placeholder="Min. 8 characters"
        right={
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, padding: "0 2px" }}
            aria-label={showPw ? "Hide" : "Show"}
          >
            <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
          </button>
        }
      />

      <Field
        label="Confirm password"
        icon={faLock}
        type={showPw ? "text" : "password"}
        value={confirm}
        onChange={(e) => { setConfirm(e.target.value); setTouched((t) => ({ ...t, confirm: true })); }}
        error={confErr}
        autoComplete="new-password"
        placeholder="Repeat password"
      />

      <button type="submit" className="submit-btn" disabled={busy}>
        {busy ? <><FontAwesomeIcon icon={faSpinner} className="spin" /> Creating account…</> : "Create account"}
      </button>

      <div style={{ textAlign: "center", fontSize: 13.5, color: "#64748b", marginTop: 20 }}>
        Already have an account?{" "}
        <button type="button" className="switch-link" onClick={onSwitchToLogin}>Sign in</button>
      </div>
    </form>
  );
}