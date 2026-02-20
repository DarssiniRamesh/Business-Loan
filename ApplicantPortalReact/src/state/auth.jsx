import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthApi } from "../api/endpoints.js";
import { clearToken, getToken, setToken } from "../api/http.js";

/**
 * user: { id, email, role } | null
 * role: "APPLICANT" | "OFFICER" | ...
 */
const AuthCtx = createContext(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** React hook for accessing auth state and actions. */
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides authentication state, including MFA-required flow. */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mfaPending, setMfaPending] = useState(false);
  const [mfaContext, setMfaContext] = useState(null); // { loginId, email } or similar

  async function refreshMe() {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await AuthApi.me();
      setUser(me?.user || me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login({ email, password, remember }) {
    const res = await AuthApi.login({ email, password });
    // Expected shapes:
    // A) { token, user }
    // B) { mfaRequired: true, loginId }
    if (res?.mfaRequired) {
      setMfaPending(true);
      setMfaContext({ loginId: res.loginId, email });
      return { mfaRequired: true };
    }
    if (res?.token) {
      setToken(res.token, Boolean(remember));
      setUser(res.user || null);
      return { mfaRequired: false };
    }
    // If backend returns token directly as string
    if (typeof res === "string") {
      setToken(res, Boolean(remember));
      await refreshMe();
      return { mfaRequired: false };
    }
    await refreshMe();
    return { mfaRequired: false };
  }

  async function verifyMfa({ code, remember }) {
    if (!mfaContext?.loginId) throw new Error("No pending MFA context");
    const res = await AuthApi.verifyMfa({ loginId: mfaContext.loginId, code });
    if (res?.token) {
      setToken(res.token, Boolean(remember));
      setMfaPending(false);
      setMfaContext(null);
      await refreshMe();
      return;
    }
    throw new Error(res?.message || "MFA verification failed");
  }

  async function register(payload) {
    // payload: { email, password, phone? }
    return AuthApi.register(payload);
  }

  async function logout() {
    try {
      await AuthApi.logout();
    } catch {
      // ignore
    } finally {
      clearToken();
      setUser(null);
      setMfaPending(false);
      setMfaContext(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      mfaPending,
      mfaContext,
      login,
      verifyMfa,
      register,
      logout,
      refreshMe
    }),
    [user, loading, mfaPending, mfaContext]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
