import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment configuration for DOM testing
    environment: "jsdom",

    // Global test setup
    setupFiles: ["./tests/setup.ts"],

    // Include patterns for test files
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}", "src/**/__tests__/**/*.{test,spec}.{ts,tsx}"],

    // Exclude e2e tests from unit test runs
    exclude: ["node_modules/", "dist/", "tests/e2e/**"],

    // Globals configuration (enables describe, it, expect without imports)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/lib/services/**/*.ts", "src/lib/validators/**/*.ts", "src/lib/hooks/**/*.ts"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*", "**/mockData/", "dist/"],
      // Minimum 70% coverage for services and validators
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Test execution configuration
    testTimeout: 10000,
    hookTimeout: 10000,

    // Watch mode configuration
    watch: false,

    // Reporters
    reporters: ["verbose"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/types": path.resolve(__dirname, "./src/types.ts"),
      "@/db": path.resolve(__dirname, "./src/db"),
    },
  },
});
