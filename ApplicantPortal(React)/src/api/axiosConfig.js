import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./tokenStorage";

const DEFAULT_LOCAL_API_BASE = "http://localhost:8080/api";
const DEFAULT_KAVIA_PROXY_BACKEND_PATH = "/proxy/3010";

/**
 * Remove trailing slashes to avoid double-slash URL joins.
 */
function stripTrailingSlashes(value) {
  return String(value || "").replace(/\/+$/, "");
}

/**
 * Ensure the returned base URL ends with `/api` (or `/api/v1`).
 * The backend in this repo exposes endpoints under `/api/*` (e.g. `/api/auth/login`).
 */
function ensureApiSuffix(baseUrl) {
  const base = stripTrailingSlashes(baseUrl);

  if (base.endsWith("/api") || base.endsWith("/api/v1")) return base;
  return `${base}/api`;
}

/**
 * True when running inside the Kavia preview environment (vscode-internal + cloud.kavia.ai).
 * We use this to safely fall back to the preview proxy backend URL when env vars are misconfigured.
 */
function isKaviaPreviewHost() {
  if (typeof window === "undefined") return false;
  const h = window.location?.hostname || "";
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
function getKaviaPreviewPublicOrigin() {
  if (typeof window === "undefined") return "";
  return `${window.location.protocol}//${window.location.hostname}`;
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
function normalizeEnvBaseUrl(rawValue) {
  const raw = stripTrailingSlashes(rawValue);
  if (!raw) return "";

  const isAbsoluteHttp = /^https?:\/\//i.test(raw);

  // If env is absolute, fix the common preview mistake of pointing at the frontend dev port.
  if (isAbsoluteHttp) {
    if (isKaviaPreviewHost() && typeof window !== "undefined") {
      try {
        const u = new URL(raw);
        // If someone accidentally set :3000 in the backend URL, drop it.
        if (u.hostname === window.location.hostname && u.port === window.location.port) {
          u.port = "";
          return stripTrailingSlashes(u.toString());
        }
      } catch {
        // If parsing fails, fall back to raw.
      }
    }
    return raw;
  }

  // Handle path-like values (most common cause of "request goes to :3000/proxy/3010/...").
  if (raw.startsWith("/")) {
    if (typeof window === "undefined") return raw;
    const origin = isKaviaPreviewHost() ? getKaviaPreviewPublicOrigin() : window.location.origin;
    return `${origin}${raw}`;
  }

  // Convenience: allow "proxy/3010" (missing leading slash).
  if (raw.startsWith("proxy/")) {
    return normalizeEnvBaseUrl(`/${raw}`);
  }

  // Otherwise, return as-is (e.g. localhost:8080/api without scheme is not supported here).
  return raw;
}

/**
 * Resolve API base URL.
 *
 * Supported env inputs:
 * - REACT_APP_API_BASE="https://.../proxy/3010"          (we will append /api)
 * - REACT_APP_API_BASE="https://.../proxy/3010/api"      (used as-is)
 * - REACT_APP_API_BASE="/proxy/3010"                    (converted to absolute in preview; we append /api)
 * - REACT_APP_API_BASE="/proxy/3010/api"                (converted to absolute in preview; used as-is)
 * - REACT_APP_API_BASE="http://localhost:8080/api"       (local dev default)
 *
 * IMPORTANT (Kavia preview):
 * The backend is reachable via the preview proxy path (e.g. /proxy/3010/).
 * Requests MUST be sent to https://<hostname>/proxy/3010/... (no :3000).
 */
function resolveBaseUrl() {
  // Vite exposes REACT_APP_* via vite.config define (process.env)
  const rawFromEnv =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_BACKEND_URL;

  const fromEnv = normalizeEnvBaseUrl(rawFromEnv);

  // Preview-safe fallback: when in Kavia and env base is missing or clearly not proxy-based.
  if (isKaviaPreviewHost()) {
    const shouldOverride = !fromEnv || !looksLikeKaviaProxyUrl(fromEnv);
    if (shouldOverride) {
      return ensureApiSuffix(`${getKaviaPreviewPublicOrigin()}${DEFAULT_KAVIA_PROXY_BACKEND_PATH}`);
    }
  }

  return ensureApiSuffix(fromEnv || DEFAULT_LOCAL_API_BASE);
}

function stripApiSuffix(apiBaseUrl) {
  const base = stripTrailingSlashes(apiBaseUrl);
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
  return /^Bearer\s+/i.test(t) ? t : `Bearer ${t}`;
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
  return `${stripTrailingSlashes(backendRoot)}/v3/api-docs`;
}

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  /**
   * We primarily use Authorization Bearer tokens (localStorage) in this MVP.
   * Keeping credentials off avoids accidental cookie/CORS issues when the frontend and backend
   * are on different origins in non-preview environments.
   */
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
  (error) => Promise.reject(error)
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
  return u.includes("/auth/login") || u.includes("/auth/refresh") || u.includes("/auth/logout") || u.includes("/auth/register");
}

let refreshInFlightPromise = null;

// Response interceptor: refresh-once then retry (single-flight).
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    // If we don't have a request to retry, just bubble up.
    if (!originalRequest) return Promise.reject(error);

    // Avoid refresh loops on auth endpoints themselves.
    if (status === 401 && !isAuthEndpoint(originalRequest.url)) {
      // Prevent infinite retry loops.
      if (originalRequest.__isRetryAfterRefresh) {
        clearTokens();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
        return Promise.reject(error);
      }

      const refreshToken = getRefreshToken();

      // If we have a refresh token, try to refresh exactly once (single-flight).
      if (refreshToken) {
        try {
          if (!refreshInFlightPromise) {
            refreshInFlightPromise = (async () => {
              // refreshToken is stored raw; ensure no accidental "Bearer " prefix is sent
              const cleanRefreshToken = String(refreshToken || "").replace(/^Bearer\s+/i, "").trim();

              const res = await refreshClient.post("/auth/refresh", { refreshToken: cleanRefreshToken });
              const { accessToken, refreshToken: newRefreshToken } = extractTokensFromResponse(res.data);

              // Persist (tokenStorage handles normalization + keying)
              setTokens({ accessToken, refreshToken: newRefreshToken });

              return accessToken || null;
            })().finally(() => {
              refreshInFlightPromise = null;
            });
          }

          const newAccessToken = await refreshInFlightPromise;

          // If refresh didn't return a usable access token, treat as logged out.
          if (!newAccessToken) {
            clearTokens();
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
              window.location.assign("/login");
            }
            return Promise.reject(error);
          }

          // Retry original request with fresh Authorization header.
          originalRequest.__isRetryAfterRefresh = true;
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = formatAuthorizationHeaderValue(newAccessToken);

          return apiClient.request(originalRequest);
        } catch (refreshErr) {
          // Refresh failed: clear session and force re-login.
          clearTokens();
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.assign("/login");
          }
          return Promise.reject(refreshErr);
        }
      }

      // No refresh token => logged out.
      clearTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

