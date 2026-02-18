import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite config:
 * - React plugin
 * - Maps existing REACT_APP_* variables into `process.env` for browser code compatibility.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Only inject whitelisted frontend env vars.
  const injected = Object.fromEntries(
    Object.entries(env).filter(([k]) => k.startsWith("REACT_APP_"))
  );

  return {
    plugins: [react()],
    define: {
      "process.env": injected,
    },
    server: {
      port: Number(env.REACT_APP_PORT || 5173),
    },
  };
});
