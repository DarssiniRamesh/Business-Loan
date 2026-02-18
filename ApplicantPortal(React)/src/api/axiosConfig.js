import axios from "axios";
import { getAccessToken, clearTokens } from "./tokenStorage";

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
 * Proxy URLs in the Kavia preview take the form: https://<host>/proxy/<port>/
 */
function looksLikeKaviaProxyUrl(url) {
  return String(url || "").includes("/proxy/");
}

/**
 * Resolve API base URL.
 *
 * Supported env inputs:
 * - REACT_APP_API_BASE="https://.../proxy/3010"          (we will append /api)
 * - REACT_APP_API_BASE="https://.../proxy/3010/api"      (used as-is)
 * - REACT_APP_API_BASE="http://localhost:8080/api"       (local dev default)
 *
 * IMPORTANT:
 * In Kavia preview, using raw host:port (e.g. https://...:3001) will not hit the backend.
 * The backend is reachable via the preview proxy path (e.g. /proxy/3010/).
 * If we detect preview + a non-proxy env URL, we safely override to the proxy URL to prevent 502s.
 */
function resolveBaseUrl() {
  // Vite exposes REACT_APP_* via vite.config define (process.env)
  const fromEnv =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_BACKEND_URL;

  // Preview-safe fallback: when in Kavia and env base is missing or clearly not proxy-based.
  if (isKaviaPreviewHost()) {
    const shouldOverride = !fromEnv || !looksLikeKaviaProxyUrl(fromEnv);
    if (shouldOverride) {
      return ensureApiSuffix(`${window.location.origin}${DEFAULT_KAVIA_PROXY_BACKEND_PATH}`);
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
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: global 401 handling.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearTokens();
      // Avoid react-router dependency inside the service layer.
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);
