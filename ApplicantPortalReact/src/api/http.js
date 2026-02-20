import { getAppConfig } from "../config/env.js";

const TOKEN_KEY = "bl.jwt";

/** @typedef {{ status: number, message: string, details?: any }} ApiError */

// PUBLIC_INTERFACE
export function getToken() {
  /** Gets current auth token from sessionStorage (preferred) falling back to localStorage. */
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

// PUBLIC_INTERFACE
export function setToken(token, persist = false) {
  /** Stores auth token. If persist is true, stores in localStorage else sessionStorage. */
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  if (!token) return;
  if (persist) localStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.setItem(TOKEN_KEY, token);
}

// PUBLIC_INTERFACE
export function clearToken() {
  /** Clears stored auth token. */
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

function buildUrl(path) {
  const { apiBase } = getAppConfig();
  if (!apiBase) return path;
  return `${apiBase.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// PUBLIC_INTERFACE
export async function httpRequest(path, { method = "GET", headers = {}, body, auth = true } = {}) {
  /**
   * Generic HTTP request helper.
   * - Adds Authorization: Bearer <token> by default.
   * - Parses JSON responses; throws structured ApiError on non-2xx.
   */
  const token = getToken();
  const finalHeaders = {
    ...headers
  };

  // If the body is a plain object, send JSON.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && body !== null && !isFormData && typeof body === "object") {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
  }

  if (auth && token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    method,
    headers: finalHeaders,
    body:
      body === undefined || body === null
        ? undefined
        : isFormData
          ? body
          : finalHeaders["Content-Type"]?.includes("application/json")
            ? JSON.stringify(body)
            : body
  });

  if (!res.ok) {
    const payload = await parseJsonSafe(res);
    /** @type {ApiError} */
    const err = {
      status: res.status,
      message: payload?.message || payload?.error || `Request failed with ${res.status}`,
      details: payload
    };
    throw err;
  }

  // No content
  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}
