import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `node:sqlite` is unknown to Vite's resolver — route it through a shim.
      "node:sqlite": path.resolve(__dirname, "tests/sqlite-shim.ts"),
    },
  },
});
