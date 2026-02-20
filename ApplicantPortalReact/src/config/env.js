/**
 * Lightweight environment accessor.
 * In Vite, env vars are exposed via import.meta.env, but only those prefixed with VITE_ by default.
 * This app is required to use REACT_APP_* variables (existing container contract), so we read from:
 * - import.meta.env (if present)
 * - window.__ENV__ (optional runtime injection)
 */
function readEnv(key, fallback = undefined) {
  const fromVite = typeof import.meta !== "undefined" ? import.meta.env?.[key] : undefined;
  const fromWindow = typeof window !== "undefined" ? window.__ENV__?.[key] : undefined;
  const value = fromVite ?? fromWindow ?? fallback;
  return value;
}

// PUBLIC_INTERFACE
export function getAppConfig() {
  /** Returns app configuration derived from REACT_APP_* environment variables. */
  const apiBase =
    readEnv("REACT_APP_API_BASE") ||
    readEnv("REACT_APP_BACKEND_URL") ||
    ""; // if empty, api client will use relative paths

  const frontendUrl = readEnv("REACT_APP_FRONTEND_URL") || "";
  const wsUrl = readEnv("REACT_APP_WS_URL") || "";
  const nodeEnv = readEnv("REACT_APP_NODE_ENV") || "development";
  const logLevel = readEnv("REACT_APP_LOG_LEVEL") || "info";

  const featureFlagsRaw = readEnv("REACT_APP_FEATURE_FLAGS") || "{}";
  let featureFlags = {};
  try {
    featureFlags = JSON.parse(featureFlagsRaw);
  } catch {
    featureFlags = {};
  }

  return {
    apiBase,
    frontendUrl,
    wsUrl,
    nodeEnv,
    logLevel,
    featureFlags
  };
}
