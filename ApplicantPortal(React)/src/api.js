import { trimTrailingChar } from "./utils/stringUtils";

const DEFAULT_LOCAL_API_BASE = "http://localhost:8080/api";
const DEFAULT_KAVIA_PROXY_BACKEND_PATH = "/proxy/3010";

/**
 * Determine if we are running inside Kavia preview environment.
 */
function isKaviaPreviewHost(win) {
  const w = win ?? globalThis?.window;
  if (!w) return false;
  const hostname = w.location?.hostname || "";
  return hostname.includes("vscode-internal") && hostname.includes("cloud.kavia.ai");
}

function getKaviaPreviewPublicOrigin(win) {
  const w = win ?? globalThis?.window;
  if (!w) return "";
  return `${w.location.protocol}//${w.location.hostname}`;
}

function looksLikeKaviaProxyUrl(url) {
  return String(url || "").includes("/proxy/");
}

/**
 * Ensure the returned base URL ends with `/api` (or `/api/v1`).
 */
function ensureApiSuffix(baseUrl) {
  const base = trimTrailingChar(baseUrl, "/");
  if (base.endsWith("/api") || base.endsWith("/api/v1")) return base;
  return `${base}/api`;
}

function normalizeEnvBaseUrl(rawValue, win) {
  const raw = trimTrailingChar(rawValue, "/");
  if (!raw) return "";

  const isAbsoluteHttp = /^https?:\/\//i.test(raw);

  if (isAbsoluteHttp) {
    if (isKaviaPreviewHost(win)) {
      try {
        const w = win ?? globalThis?.window;
        const u = new URL(raw);
        if (w && u.hostname === w.location.hostname && u.port === w.location.port) {
          u.port = "";
          return trimTrailingChar(u.toString(), "/");
        }
      } catch {
        // ignore parsing issues; fall back to raw below
      }
    }
    return raw;
  }

  // Path-like values: "/proxy/3010" or "/proxy/3010/api"
  if (raw.startsWith("/")) {
    const w = win ?? globalThis?.window;
    if (!w) return raw;
    const origin = isKaviaPreviewHost(w) ? getKaviaPreviewPublicOrigin(w) : w.location.origin;
    return `${origin}${raw}`;
  }

  // Convenience: allow "proxy/3010"
  if (raw.startsWith("proxy/")) {
    return normalizeEnvBaseUrl(`/${raw}`, win);
  }

  return raw;
}

function getEnvApiBaseValue() {
  return (
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    ""
  );
}

function resolveBaseApiUrl(win) {
  const fromEnv = normalizeEnvBaseUrl(getEnvApiBaseValue(), win);

  if (isKaviaPreviewHost(win)) {
    const shouldOverride = !fromEnv || !looksLikeKaviaProxyUrl(fromEnv);
    if (shouldOverride) {
      return ensureApiSuffix(`${getKaviaPreviewPublicOrigin(win)}${DEFAULT_KAVIA_PROXY_BACKEND_PATH}`);
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
  if (data?.token) {
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
