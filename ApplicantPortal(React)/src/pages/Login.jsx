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
} from "@fortawesome/free-solid-svg-icons";
import { loginStep1, registerApplicant, verifyMfa } from "../api/authApi";

function useQueryMode(defaultMode = "login") {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  return params.get("mode") || defaultMode;
}

/**
 * PUBLIC_INTERFACE
 * Login page with animated two-panel Login/Signup UI (Framer Motion).
 */
export default function Login() {
  const navigate = useNavigate();
  const initialMode = useQueryMode("login");
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl">
          <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur lg:grid-cols-2">
            {/* Left panel (brand / trust) */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 to-blue-500/20" />
              <div className="relative p-10">
                <Link to="/" className="inline-flex items-center gap-2 text-white">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <FontAwesomeIcon icon={faBuildingColumns} />
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-extrabold tracking-tight">
                      BusinessLoan
                    </div>
                    <div className="text-xs font-semibold text-white/70">
                      Applicant Portal
                    </div>
                  </div>
                </Link>

                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="mt-10 text-3xl font-extrabold tracking-tight text-white"
                >
                  Secure funding workflows,
                  <br />
                  built for confidence.
                </motion.h1>

                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
                  Sign in to continue your application, upload documents, and track
                  status. New here? Create an account in under a minute.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    {
                      icon: faShieldHalved,
                      title: "Bank-grade security",
                      desc: "Encrypted connections and token-based access.",
                    },
                    {
                      icon: faLock,
                      title: "Privacy-first",
                      desc: "Designed for financial compliance and trust.",
                    },
                  ].map((b) => (
                    <div key={b.title} className="rounded-2xl bg-white/5 p-4">
                      <div className="flex items-center gap-3 text-white">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                          <FontAwesomeIcon icon={b.icon} />
                        </span>
                        <div>
                          <div className="text-sm font-bold">{b.title}</div>
                          <div className="text-xs text-white/70">{b.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 text-xs text-white/60">
                  Need help? Contact support in the footer once inside.
                </div>
              </div>
            </div>

            {/* Right panel (forms) */}
            <div className="bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {mode === "login" ? "Sign in" : "Create your account"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {mode === "login"
                      ? "Welcome back. Please enter your details."
                      : "Start your application with a secure account."}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-bold",
                      mode === "login"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900",
                    ].join(" ")}
                    aria-pressed={mode === "login"}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-bold",
                      mode === "signup"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900",
                    ].join(" ")}
                    aria-pressed={mode === "signup"}
                  >
                    Sign up
                  </button>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-10 sm:py-10">
                <AnimatePresence mode="wait" initial={false}>
                  {mode === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                    >
                      <LoginForm
                        onSuccess={() => navigate("/", { replace: true })}
                        onSwitchToSignup={() => setMode("signup")}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                    >
                      <SignupForm
                        onSuccess={() => {
                          // After signup, bring them back to login for sign-in.
                          setMode("login");
                        }}
                        onSwitchToLogin={() => setMode("login")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 text-center text-xs text-slate-500">
                  By continuing, you agree to applicable Terms and Privacy disclosures.
                </div>

                <div className="mt-4 text-center">
                  <Link to="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Back to Landing
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-white/60">
            Deep Navy (#0f172a) · Trust Blue (#3b82f6) · Clean White (#ffffff)
          </div>
        </div>
      </div>
    </div>
  );
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Input({ label, icon, type = "text", value, onChange, error, right, autoComplete }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div
        className={[
          "flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm transition",
          error ? "border-red-300" : "border-slate-200",
          "focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:border-blue-500",
        ].join(" ")}
      >
        <span className={error ? "text-red-500" : "text-slate-400"}>
          <FontAwesomeIcon icon={icon} />
        </span>
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={label}
        />
        {right}
      </div>
      {error ? (
        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-600">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {error}
        </div>
      ) : null}
    </label>
  );
}

function PrimaryButton({ children, disabled, onClick, type = "button" }) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={[
        "mt-2 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-extrabold shadow-sm transition",
        disabled
          ? "cursor-not-allowed bg-slate-200 text-slate-500"
          : "bg-blue-500 text-white hover:bg-blue-600",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

function LoginForm({ onSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const [pendingMfa, setPendingMfa] = useState(false);
  const [mfaUserId, setMfaUserId] = useState(null);
  const [otp, setOtp] = useState("");

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const emailError =
    touched.email && !validateEmail(email) ? "Enter a valid email address." : "";
  const pwError =
    touched.password && password.length < 8 ? "Password must be at least 8 characters." : "";

  const canSubmit = validateEmail(email) && password.length >= 8;

  const submitStep1 = async (e) => {
    e.preventDefault();
    setFormError("");
    setTouched({ email: true, password: true });

    if (!canSubmit) return;

    setBusy(true);
    try {
      const res = await loginStep1({ email, password });

      if (res?.pendingMfa) {
        setPendingMfa(true);
        setMfaUserId(res?.userId || null);
      } else {
        // If backend ever returns tokens directly (future), we can handle here.
        onSuccess?.();
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitMfa = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!mfaUserId) {
      setFormError("MFA user context missing. Please retry login.");
      return;
    }
    if (!otp || otp.trim().length < 4) {
      setFormError("Enter the OTP code.");
      return;
    }

    setBusy(true);
    try {
      await verifyMfa({ userId: mfaUserId, otp: otp.trim() });
      onSuccess?.();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {!pendingMfa ? (
        <form onSubmit={submitStep1} className="space-y-5">
          <Input
            label="Email"
            icon={faEnvelope}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setTouched((t) => ({ ...t, email: true }));
            }}
            error={emailError}
            autoComplete="email"
          />

          <Input
            label="Password"
            icon={faLock}
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setTouched((t) => ({ ...t, password: true }));
            }}
            error={pwError}
            autoComplete="current-password"
            right={
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="rounded-xl px-2 py-1 text-slate-500 hover:text-slate-900"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
              </button>
            }
          />

          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {formError}
            </div>
          ) : null}

          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </PrimaryButton>

          <div className="text-center text-sm text-slate-600">
            New here?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-extrabold text-blue-600 hover:text-blue-700"
            >
              Create an account
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitMfa} className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            MFA is enabled for your account. Enter the one-time code to complete sign-in.
          </div>

          <Input
            label="One-time code (OTP)"
            icon={faLock}
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            error=""
            autoComplete="one-time-code"
          />

          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {formError}
            </div>
          ) : null}

          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Verifying..." : "Verify and continue"}
          </PrimaryButton>
        </form>
      )}
    </div>
  );
}

function SignupForm({ onSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const emailError =
    touched.email && !validateEmail(email) ? "Enter a valid email address." : "";
  const pwError =
    touched.password && password.length < 8 ? "Password must be at least 8 characters." : "";
  const confirmError =
    touched.confirm && confirm !== password ? "Passwords do not match." : "";

  const canSubmit = validateEmail(email) && password.length >= 8 && confirm === password;

  const submit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setFormError("");
    setTouched({ email: true, password: true, confirm: true });

    if (!canSubmit) return;

    setBusy(true);
    try {
      await registerApplicant({ email, password });
      setOkMsg("Account created. Please sign in.");
      onSuccess?.();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Signup failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Input
        label="Email"
        icon={faEnvelope}
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setTouched((t) => ({ ...t, email: true }));
        }}
        error={emailError}
        autoComplete="email"
      />

      <Input
        label="Password"
        icon={faLock}
        type={showPw ? "text" : "password"}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setTouched((t) => ({ ...t, password: true }));
        }}
        error={pwError}
        autoComplete="new-password"
        right={
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="rounded-xl px-2 py-1 text-slate-500 hover:text-slate-900"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
          </button>
        }
      />

      <Input
        label="Confirm password"
        icon={faLock}
        type={showPw ? "text" : "password"}
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          setTouched((t) => ({ ...t, confirm: true }));
        }}
        error={confirmError}
        autoComplete="new-password"
      />

      {formError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {formError}
        </div>
      ) : null}

      {okMsg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {okMsg}
        </div>
      ) : null}

      <PrimaryButton type="submit" disabled={busy}>
        {busy ? "Creating account..." : "Create account"}
      </PrimaryButton>

      <div className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-extrabold text-blue-600 hover:text-blue-700"
        >
          Sign in
        </button>
      </div>

      <div className="text-center text-xs text-slate-500">
        Note: MFA may be enabled by default for MVP.
      </div>
    </form>
  );
}
