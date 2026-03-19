import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./tokenStorage";
import { trimTrailingChar, stripBearerPrefix } from "../utils/stringUtils";

const DEFAULT_LOCAL_API_BASE = "http://localhost:8080/api";
const DEFAULT_KAVIA_PROXY_BACKEND_PATH = "/proxy/3010";

/**
 * Ensure the returned base URL ends with `/api` (or `/api/v1`).
 * The backend in this repo exposes endpoints under `/api/*` (e.g. `/api/auth/login`).
 */
function ensureApiSuffix(baseUrl) {
  const base = trimTrailingChar(baseUrl, "/");

  if (base.endsWith("/api") || base.endsWith("/api/v1")) return base;
  return `${base}/api`;
}

/**
 * True when running inside the Kavia preview environment (vscode-internal + cloud.kavia.ai).
 * We use this to safely fall back to the preview proxy backend URL when env vars are misconfigured.
 */
function isKaviaPreviewHost(win) {
  const w = win ?? globalThis?.window;
  if (!w) return false;
  const h = w.location?.hostname || "";
  return h.includes("vscode-internal") && h.includes("cloud.kavia.ai");
}

/**
 * In Kavia preview, the backend is reached via the preview proxy on the "public" origin:
 *   https://<hostname>/proxy/<port>/...
 *
 * IMPORTANT:
 * `window.location.origin` for the frontend dev server includes `:3000` which is NOT where
 * the proxy lives, so we must NOT use `origin` here.
 */
function getKaviaPreviewPublicOrigin(win) {
  const w = win ?? globalThis?.window;
  if (!w) return "";
  return `${w.location.protocol}//${w.location.hostname}`;
}

/**
 * Proxy URLs in the Kavia preview take the form: https://<host>/proxy/<port>/
 */
function looksLikeKaviaProxyUrl(url) {
  return String(url || "").includes("/proxy/");
}

/**
 * Normalize an env-provided base URL so that:
 * - Relative values like `/proxy/3010` become absolute (especially in Kavia preview)
 * - Preview misconfigs like `https://<host>:3000/proxy/3010` are rewritten to remove `:3000`
 */
function normalizeEnvBaseUrl(rawValue, win) {
  const raw = trimTrailingChar(rawValue, "/");
  if (!raw) return "";

  const isAbsoluteHttp = /^https?:\/\//i.test(raw);

  // If env is absolute, fix the common preview mistake of pointing at the frontend dev port.
  if (isAbsoluteHttp) {
    if (isKaviaPreviewHost(win)) {
      const w = win ?? globalThis?.window;
      try {
        const u = new URL(raw);
        // If someone accidentally set :3000 in the backend URL, drop it.
        if (w && u.hostname === w.location.hostname && u.port === w.location.port) {
          u.port = "";
          return trimTrailingChar(u.toString(), "/");
        }
      } catch {
        // If parsing fails, fall back to raw.
      }
    }
    return raw;
  }

  // Handle path-like values (most common cause of "request goes to :3000/proxy/3010/...").
  if (raw.startsWith("/")) {
    const w = win ?? globalThis?.window;
    if (!w) return raw;
    const origin = isKaviaPreviewHost(w) ? getKaviaPreviewPublicOrigin(w) : w.location.origin;
    return `${origin}${raw}`;
  }

  // Convenience: allow "proxy/3010" (missing leading slash).
  if (raw.startsWith("proxy/")) {
    return normalizeEnvBaseUrl(`/${raw}`, win);
  }

  // Otherwise, return as-is.
  return raw;
}

function resolveBaseUrl(win) {
  // Vite exposes REACT_APP_* via vite.config define (process.env)
  const rawFromEnv =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_BACKEND_URL;

  const fromEnv = normalizeEnvBaseUrl(rawFromEnv, win);

  // Preview-safe fallback: when in Kavia and env base is missing or clearly not proxy-based.
  if (isKaviaPreviewHost(win)) {
    const shouldOverride = !fromEnv || !looksLikeKaviaProxyUrl(fromEnv);
    if (shouldOverride) {
      return ensureApiSuffix(`${getKaviaPreviewPublicOrigin(win)}${DEFAULT_KAVIA_PROXY_BACKEND_PATH}`);
    }
  }

  return ensureApiSuffix(fromEnv || DEFAULT_LOCAL_API_BASE);
}

function stripApiSuffix(apiBaseUrl) {
  const base = trimTrailingChar(apiBaseUrl, "/");
  if (base.endsWith("/api/v1")) return base.slice(0, -"/api/v1".length);
  if (base.endsWith("/api")) return base.slice(0, -"/api".length);
  return base;
}

/**
 * Ensure we never send "Bearer Bearer <token>".
 */
function formatAuthorizationHeaderValue(rawToken) {
  const t = String(rawToken || "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  return lower.startsWith("bearer ") ? t : `Bearer ${t}`;
}

/**
 * Extract tokens from refresh responses that may be legacy-shaped.
 */
function extractTokensFromResponse(data) {
  const d = data || {};
  const nested = d?.tokens && typeof d.tokens === "object" ? d.tokens : {};

  // Spring backend returns: { accessToken, refreshToken, tokenType: "Bearer" }
  // Keep compatibility with legacy shapes from earlier iterations.
  const accessToken =
    d?.accessToken ||
    d?.access_token ||
    d?.authToken ||
    d?.token ||
    d?.jwt ||
    nested?.accessToken ||
    nested?.access_token ||
    nested?.authToken ||
    nested?.token ||
    null;

  const refreshToken =
    d?.refreshToken ||
    d?.refresh_token ||
    nested?.refreshToken ||
    nested?.refresh_token ||
    null;

  return { accessToken, refreshToken };
}

/**
 * PUBLIC_INTERFACE
 * Return the resolved API base URL used by Axios (ends with `/api` or `/api/v1`).
 */
export function getResolvedApiBaseUrl() {
  return resolveBaseUrl();
}

/**
 * PUBLIC_INTERFACE
 * Return the OpenAPI docs URL for the backend (e.g. .../v3/api-docs).
 * This is helpful for quickly verifying backend reachability from the frontend preview.
 */
export function getOpenApiDocsUrl() {
  const apiBase = resolveBaseUrl();
  const backendRoot = stripApiSuffix(apiBase);
  return `${trimTrailingChar(backendRoot, "/")}/v3/api-docs`;
}

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Authorization token (MVP localStorage).
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = formatAuthorizationHeaderValue(token);
    }
    return config;
  },
  (error) => {
    // Sonar javascript:S7746: prefer throw
    throw error;
  }
);

/**
 * A tiny axios client without interceptors, used only for token refresh.
 * This avoids infinite loops (refresh request itself getting intercepted).
 */
const refreshClient = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

function isAuthEndpoint(url) {
  const u = String(url || "");
  // All auth endpoints are mounted under /api/auth/*, but axios calls them as /auth/*
  // because baseURL already includes /api.
  return (
    u.includes("/auth/login") ||
    u.includes("/auth/refresh") ||
    u.includes("/auth/logout") ||
    u.includes("/auth/register")
  );
}

/**
 * Reusable “auth retry flow” to reduce interceptor complexity.
 *
 * Flow name: RefreshAuthRetryFlow
 * Entrypoint: runRefreshAuthRetryFlow(...)
 *
 * Contract:
 * - Inputs:
 *   - error: axios error
 *   - originalRequest: axios request config that failed
 * - Outputs:
 *   - axios response of the retried request
 * - Errors:
 *   - throws refresh errors or original errors
 * - Side effects:
 *   - updates token storage on successful refresh
 *   - clears tokens + redirects to /login on unrecoverable auth
 */
let refreshInFlightPromise = null;

function redirectToLoginIfNeeded() {
  const w = globalThis?.window;
  if (!w) return;
  if (w.location.pathname !== "/login") {
    w.location.assign("/login");
  }
}

function logoutAndRedirect() {
  clearTokens();
  redirectToLoginIfNeeded();
}

function shouldAttemptRefresh({ status, originalRequest }) {
  if (status !== 401) return false;
  if (!originalRequest) return false;
  if (isAuthEndpoint(originalRequest.url)) return false;
  return true;
}

async function refreshAccessTokenSingleFlight() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return { ok: false, accessToken: null };

  if (!refreshInFlightPromise) {
    refreshInFlightPromise = (async () => {
      const cleanRefreshToken = stripBearerPrefix(refreshToken);

      const res = await refreshClient.post("/auth/refresh", {
        refreshToken: cleanRefreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = extractTokensFromResponse(res.data);

      // Persist (tokenStorage handles normalization + keying)
      setTokens({ accessToken, refreshToken: newRefreshToken });

      return accessToken || null;
    })().finally(() => {
      refreshInFlightPromise = null;
    });
  }

  const accessToken = await refreshInFlightPromise;
  return { ok: Boolean(accessToken), accessToken: accessToken || null };
}

async function runRefreshAuthRetryFlow({ error, originalRequest }) {
  const status = error?.response?.status;

  if (!shouldAttemptRefresh({ status, originalRequest })) {
    throw error;
  }

  // Prevent infinite retry loops.
  if (originalRequest.__isRetryAfterRefresh) {
    logoutAndRedirect();
    throw error;
  }

  const refreshResult = await refreshAccessTokenSingleFlight();
  if (!refreshResult.ok) {
    logoutAndRedirect();
    throw error;
  }

  // Retry original request with fresh Authorization header.
  originalRequest.__isRetryAfterRefresh = true;
  originalRequest.headers = originalRequest.headers ?? {};
  originalRequest.headers.Authorization = formatAuthorizationHeaderValue(refreshResult.accessToken);

  return apiClient.request(originalRequest);
}

// Response interceptor: refresh-once then retry (single-flight).
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error?.config;

    // If we don't have a request to retry, just bubble up.
    if (!originalRequest) throw error;

    try {
      return await runRefreshAuthRetryFlow({ error, originalRequest });
    } catch (e) {
      // If refresh flow decided to log out, it already redirected.
      throw e;
    }
  }
);
