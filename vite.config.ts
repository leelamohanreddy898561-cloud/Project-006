import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    // The Firebase SDK is loaded via dynamic import() in src/lib/firebase.ts,
    // so Rollup splits it into its own async chunk automatically (R14.1).
    chunkSizeWarningLimit: 500,
  },
});
