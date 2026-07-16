import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));

export default defineConfig({
  plugins: [react()],
  // Bakes the actual package.json version into the runtime bundle so the
  // About page's client-side update checker can compare against a real
  // build version instead of relying on backend-reported data (chores-web-frontend#31).
  //
  // `VITE_APP_VERSION` is the build-time frontend version surfaced on the
  // About page (chores-web-frontend#16). package.json's version is the
  // release-please-managed source of truth, so baking it here means the
  // displayed frontend version always matches the released build without a
  // separate .env. `__APP_VERSION__` remains for the legacy update checker.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.js",
  },
});
