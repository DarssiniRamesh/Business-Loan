const DEFAULT_LOCAL_API_BASE = "http://localhost:8080/api";
const DEFAULT_KAVIA_PROXY_BACKEND_PATH = "/proxy/3010";

function stripTrailingSlashes(value) {
  return String(value || "").replace(/\/+$/, "");
}

function ensureApiSuffix(baseUrl) {
  const base = stripTrailingSlashes(baseUrl);
  if (base.endsWith("/api") || base.endsWith("/api/v1")) return base;
  return `${base}/api`;
}

function isKaviaPreviewHost() {
  if (typeof window === "undefined") return false;
  const h = window.location?.hostname || "";
  return h.includes("vscode-internal") && h.includes("cloud.kavia.ai");
}

function looksLikeKaviaProxyUrl(url) {
  return String(url || "").includes("/proxy/");
}

function resolveBaseApiUrl() {
  const fromEnv =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL;

  if (isKaviaPreviewHost()) {
    const shouldOverride = !fromEnv || !looksLikeKaviaProxyUrl(fromEnv);
    if (shouldOverride) {
      return ensureApiSuffix(`${window.location.origin}${DEFAULT_KAVIA_PROXY_BACKEND_PATH}`);
    }
  }

  return ensureApiSuffix(fromEnv || DEFAULT_LOCAL_API_BASE);
}

const BASE_API_URL = resolveBaseApiUrl();

/** PUBLIC_INTERFACE
 * Login - Authenticate user with email and password.
 */
export async function login(email, password) {
  const res = await fetch(`${BASE_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Login failed");
  }

  const data = await res.json();

  // Legacy helper: if backend returns a token field, store it for older UI flows.
  if (data && data.token) {
    try {
      localStorage.setItem("authToken", data.token);
    } catch {
      // ignore storage failures
    }
  }

  return data;
}

/** PUBLIC_INTERFACE
 * Signup - Register a new user.
 *
 * Note: backend for this repo uses POST /api/auth/register (not /auth/signup).
 */
export async function signup(name, email, password) {
  const res = await fetch(`${BASE_API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `name` kept for backwards compatibility; backend may ignore it.
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Signup failed");
  }

  return await res.json();
}
