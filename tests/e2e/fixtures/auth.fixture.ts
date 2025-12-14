import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

interface AuthFixtures {
  authenticatedPage: Page;
}

// Test user credentials from environment variables
export const TEST_USER = {
  email: process.env.E2E_USERNAME || "test@example.com",
  password: process.env.E2E_PASSWORD || "test123456",
};

// Validate that required environment variables are set
if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD) {
  throw new Error("E2E_USERNAME or E2E_PASSWORD not found in environment variables");
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Wait for successful login redirect
    await page.waitForURL(/\/(topics|$)/, { timeout: 10000 });

    // Provide the authenticated page to the test
    await use(page);

    // Teardown: Logout after each test (optional)
    // Could add logout logic here if needed
  },
});

export { expect } from "@playwright/test";
