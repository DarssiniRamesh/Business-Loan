import axios from "axios";
import { getAccessToken, clearTokens } from "./tokenStorage";

/**
 * Resolve API base URL.
 * - Requirements mention `http://localhost:8080/api/v1` as a default.
 * - This project backend currently exposes routes under `/api/*` (e.g. `/api/auth/login`).
 *
 * We support both via env overrides; default stays compatible with the Spring Boot codebase.
 */
function resolveBaseUrl() {
  // Vite exposes REACT_APP_* via vite.config define (process.env)
  // Keep compatibility with existing `.env` naming.
  const fromEnv =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_BACKEND_URL;

  // If none configured, default to backend's current base path.
  return fromEnv || "http://localhost:8080/api";
}

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true, // allow HttpOnly cookie auth if backend uses it
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
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);
