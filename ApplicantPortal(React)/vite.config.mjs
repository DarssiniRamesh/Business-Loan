import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite config:
 * - React plugin
 * - Maps existing REACT_APP_* variables into `process.env` for browser code compatibility.
 *
 * IMPORTANT:
 * This project still contains JSX inside some `.js` files (e.g. src/App.js and legacy components).
 * Vite/esbuild default loader for `.js` is plain `js`, which will fail to parse JSX.
 * We explicitly configure esbuild to treat `.js` as `jsx` both:
 *   1) during dependency optimization scanning (optimizeDeps), and
 *   2) during normal source transforms (esbuild option).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Only inject whitelisted frontend env vars.
  const injected = Object.fromEntries(
    Object.entries(env).filter(([k]) => k.startsWith("REACT_APP_"))
  );

  return {
    plugins: [react()],

    // Fix dependency-scan errors like:
    // "The JSX syntax extension is not currently enabled" for src/App.js
    optimizeDeps: {
      entries: ["index.html"],
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
    },

    // Fix dev/build transforms for application source files that contain JSX.
    // NOTE: If we set `include` too narrowly (e.g. only `.js`), Vite will skip transforming
    // `.jsx` files and `vite:import-analysis` will fail to parse raw JSX.
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.(js|jsx)$/,
    },

    define: {
      "process.env": injected,
    },

    server: {
      // The preview/proxy expects the frontend to be reachable from outside the container.
      // `host: true` binds to 0.0.0.0.
      host: true,
      port: Number(env.REACT_APP_PORT || 3000),
      strictPort: true,

      // Allow the Kavia preview hostname to access the dev server (prevents Vite host blocking).
      allowedHosts: ["vscode-internal-11351-beta.beta01.cloud.kavia.ai"],
    },

    // `vite preview` uses a different server config than `vite dev`.
    // Ensure preview is also reachable on the expected port.
    preview: {
      host: true,
      port: Number(env.REACT_APP_PORT || 3000),
      strictPort: true,

      // Apply the same allowlist for `vite preview` when accessed via the preview hostname.
      allowedHosts: ["vscode-internal-21566-beta.beta01.cloud.kavia.ai"],
    },
  };
});
