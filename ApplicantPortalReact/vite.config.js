import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite will also read .env.* files. Here we specifically map REACT_APP_PORT for local dev consistency.
const port = Number(process.env.REACT_APP_PORT || 5173);

export default defineConfig({
  plugins: [react()],
  server: {
    port,
    strictPort: false,
    host: true
  }
});
