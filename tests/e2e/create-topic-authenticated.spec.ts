import { test, expect } from "./fixtures/auth.fixture";
import { TopicsPage } from "./pages/TopicsPage";

/**
 * E2E Test: Create Topic (with auth fixture)
 *
 * This test uses the auth fixture to automatically login before each test.
 *
 * Test covers:
 * - TC-TOPICS-001: Tworzenie nowego tematu (happy path)
 * - TC-TOPICS-002: Walidacja nazwy tematu
 *
 * Reference: .ai/test-plan.md
 */

test.describe("Create Topic (Authenticated)", () => {
  let topicsPage: TopicsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    topicsPage = new TopicsPage(authenticatedPage);
  });

  test("should create a new topic successfully", async ({ authenticatedPage }) => {
    // Navigate to topics page
    await topicsPage.navigate();
    await expect(authenticatedPage).toHaveURL(/\/topics/);

    // Open add topic dialog
    await topicsPage.openAddTopicDialog();
    expect(await topicsPage.isDialogOpen()).toBeTruthy();

    // Fill in topic name
    const topicName = `Matematyka ${Date.now()}`;
    await topicsPage.fillTopicName(topicName);

    // Submit form
    await topicsPage.submitTopicForm();

    // Verify dialog closes
    await topicsPage.dialog.waitFor({ state: "hidden", timeout: 5000 });

    // Verify topic appears in the list
    const hasNewTopic = await topicsPage.hasTopicWithName(topicName);
    expect(hasNewTopic).toBeTruthy();
  });

  test("should display validation error for topic name exceeding max length", async ({ authenticatedPage }) => {
    await topicsPage.navigate();

    // Open add topic dialog
    await topicsPage.openAddTopicDialog();

    // Fill in a very long topic name (> 100 characters)
    const longTopicName = "A".repeat(101);
    await topicsPage.fillTopicName(longTopicName);

    // Error message should be visible
    const errorMessage = authenticatedPage.getByText(/nazwa tematu może mieć maksymalnie/i);
    await expect(errorMessage).toBeVisible();

    // Submit button should be disabled
    await expect(topicsPage.dialogSubmitButton).toBeDisabled();
  });

  test("should handle rapid consecutive topic creation", async () => {
    await topicsPage.navigate();

    const topics = [`Język Polski ${Date.now()}`, `Informatyka ${Date.now() + 1}`, `Muzyka ${Date.now() + 2}`];

    // Create topics rapidly
    for (const topicName of topics) {
      await topicsPage.createTopic(topicName);
    }

    // Verify all topics were created
    for (const topicName of topics) {
      expect(await topicsPage.hasTopicWithName(topicName)).toBeTruthy();
    }
  });
});
