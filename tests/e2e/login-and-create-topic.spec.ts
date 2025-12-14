import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { TopicsPage } from "./pages/TopicsPage";

/**
 * E2E Test: Login and Create Topic
 *
 * Test covers:
 * - TC-AUTH-003: Logowanie użytkownika (happy path)
 * - TC-TOPICS-001: Tworzenie nowego tematu (happy path)
 *
 * Reference: .ai/test-plan.md
 */

test.describe("Login and Create Topic", () => {
  let loginPage: LoginPage;
  let topicsPage: TopicsPage;

  // Test credentials from environment variables
  const TEST_USER = {
    email: process.env.E2E_USERNAME,
    password: process.env.E2E_PASSWORD,
  };

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    topicsPage = new TopicsPage(page);
  });

  test("should login successfully and create a new topic", async ({ page }) => {
    // Step 1: Navigate to login page
    await loginPage.navigate();
    await expect(page).toHaveURL(/\/login/);

    // Step 2: Fill in login credentials
    await loginPage.fillForm(TEST_USER.email, TEST_USER.password);

    // Step 3: Submit login form
    await loginPage.submit();

    // Step 4: Verify successful login - should redirect to home or topics page
    // Wait for navigation after login
    await page.waitForURL(/\/(topics|$)/, { timeout: 10000 });

    // Step 5: Navigate to topics page (if not already there)
    await topicsPage.navigate();
    await expect(page).toHaveURL(/\/topics/);

    // Step 6: Open add topic dialog
    await topicsPage.openAddTopicDialog();

    // Verify dialog is open
    expect(await topicsPage.isDialogOpen()).toBeTruthy();
    await expect(topicsPage.dialogTitle).toBeVisible();

    // Step 7: Fill in topic name
    const topicName = `Test Topic ${Date.now()}`;
    await topicsPage.fillTopicName(topicName);

    // Step 8: Submit topic form
    await topicsPage.submitTopicForm();

    // Step 9: Verify dialog closes
    await topicsPage.dialog.waitFor({ state: "hidden", timeout: 5000 });

    // Step 10: Verify topic was created and appears in the list
    const hasNewTopic = await topicsPage.hasTopicWithName(topicName);
    expect(hasNewTopic).toBeTruthy();

    // Additional verification: topic should be visible on the page
    await expect(topicsPage.getTopicByName(topicName)).toBeVisible();
  });

  test("should display validation error for empty topic name", async ({ page }) => {
    // Step 1: Navigate to login page
    await loginPage.navigate();
    await expect(page).toHaveURL(/\/login/);

    // Step 2: Fill in login credentials
    await loginPage.fillForm(TEST_USER.email, TEST_USER.password);

    // Step 3: Submit login form
    await loginPage.submit();

    // Step 4: Verify successful login - should redirect to home or topics page
    // Wait for navigation after login
    await page.waitForURL(/\/(topics|$)/, { timeout: 10000 });

    // Step 5: Navigate to topics page (if not already there)
    await topicsPage.navigate();
    await expect(page).toHaveURL(/\/topics/);

    // Step 6: Open add topic dialog
    await topicsPage.openAddTopicDialog();

    // Verify dialog is open
    expect(await topicsPage.isDialogOpen()).toBeTruthy();
    await expect(topicsPage.dialogTitle).toBeVisible();

    // Submit button should be disabled for empty topic name
    await expect(topicsPage.dialogSubmitButton).toBeDisabled();

    // Dialog should remain open
    expect(await topicsPage.isDialogOpen()).toBeTruthy();
  });

  test("should cancel topic creation", async ({ page }) => {
    // Step 1: Navigate to login page
    await loginPage.navigate();
    await expect(page).toHaveURL(/\/login/);

    // Step 2: Fill in login credentials
    await loginPage.fillForm(TEST_USER.email, TEST_USER.password);

    // Step 3: Submit login form
    await loginPage.submit();

    // Step 4: Verify successful login - should redirect to home or topics page
    // Wait for navigation after login
    await page.waitForURL(/\/(topics|$)/, { timeout: 10000 });

    // Step 5: Navigate to topics page (if not already there)
    await topicsPage.navigate();
    await expect(page).toHaveURL(/\/topics/);

    // Step 6: Open add topic dialog
    await topicsPage.openAddTopicDialog();

    // Verify dialog is open
    expect(await topicsPage.isDialogOpen()).toBeTruthy();
    await expect(topicsPage.dialogTitle).toBeVisible();

    // Fill in some data
    await topicsPage.fillTopicName("Test Topic to Cancel");

    // Click cancel button
    await topicsPage.dialogCancelButton.click();

    // Dialog should close
    await topicsPage.dialog.waitFor({ state: "hidden", timeout: 5000 });

    // Topic should not be created
    const hasNewTopic = await topicsPage.hasTopicWithName("Test Topic to Cancel");
    expect(hasNewTopic).toBeFalsy();
  });
});
