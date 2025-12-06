import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Playwright Configuration for E2E Tests
 * Following guidelines for Chromium-only testing with modern best practices
 */
export default defineConfig({
  // Test directory
  testDir: "./tests/e2e",

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for page.goto() shorthand
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Browser context options
    contextOptions: {
      // Respect reduced motion preference
      reducedMotion: "reduce",
    },
  },

  // Configure projects for major browsers - Chromium only as per guidelines
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Enable browser context isolation for better test reliability
        contextOptions: {
          strictSelectors: true,
        },
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Pass test environment variables to the dev server
      NODE_ENV: "test",
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_KEY: process.env.SUPABASE_KEY || "",
    },
  },

  // Output directory for test artifacts
  outputDir: "test-results/",

  // Global teardown - runs after all tests complete
  globalTeardown: "./tests/e2e/global-teardown.ts",
});
