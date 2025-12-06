import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Topics Page Object
 * Represents the topics page with CRUD functionality
 */
export class TopicsPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly addTopicButton: Locator;
  readonly topicsList: Locator;
  readonly emptyState: Locator;

  // Dialog locators
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly topicNameInput: Locator;
  readonly dialogSubmitButton: Locator;
  readonly dialogCancelButton: Locator;

  constructor(page: Page) {
    super(page);

    // Main page elements
    this.pageTitle = page.getByRole("heading", { name: /moje tematy/i });
    this.addTopicButton = page.getByRole("button", { name: /dodaj temat/i });
    this.topicsList = page.locator('[data-testid="topics-list"], .topics-list').first();
    this.emptyState = page.getByText(/nie masz jeszcze żadnych tematów/i);

    // Dialog elements
    this.dialog = page.getByRole("dialog");
    this.dialogTitle = this.dialog.getByRole("heading", { name: /dodaj nowy temat/i });
    this.topicNameInput = this.dialog.locator("input#topic-name");
    this.dialogSubmitButton = this.dialog.getByRole("button", { name: /dodaj|zapisz/i });
    this.dialogCancelButton = this.dialog.getByRole("button", { name: /anuluj/i });
  }

  /**
   * Navigate to topics page
   */
  async navigate(): Promise<void> {
    await this.goto("/topics");
    await this.waitForPageLoad();
  }

  /**
   * Open add topic dialog
   */
  async openAddTopicDialog(): Promise<void> {
    await this.addTopicButton.click({ timeout: 2000 });
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Fill topic name in dialog
   */
  async fillTopicName(name: string): Promise<void> {
    await this.topicNameInput.fill(name);
  }

  /**
   * Submit topic form
   */
  async submitTopicForm(): Promise<void> {
    await this.dialogSubmitButton.click();
  }

  /**
   * Create a new topic
   * @param name Topic name
   */
  async createTopic(name: string): Promise<void> {
    await this.openAddTopicDialog();
    await this.fillTopicName(name);
    await this.submitTopicForm();
    // Wait for dialog to close
    await this.dialog.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * Get topic by name
   */
  getTopicByName(name: string): Locator {
    return this.page.getByText(name, { exact: true }).first();
  }

  /**
   * Check if topic exists
   */
  async hasTopicWithName(name: string): Promise<boolean> {
    try {
      await this.getTopicByName(name).waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all topics count
   */
  async getTopicsCount(): Promise<number> {
    const topics = await this.page.locator('[data-testid="topic-item"], .topic-item').count();
    return topics;
  }

  /**
   * Check if empty state is visible
   */
  async hasEmptyState(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Check if dialog is open
   */
  async isDialogOpen(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  /**
   * Edit topic
   */
  async editTopic(oldName: string, newName: string): Promise<void> {
    const topicItem = this.getTopicByName(oldName);
    const editButton = topicItem.locator("..").getByRole("button", { name: /edytuj/i });
    await editButton.click();
    await this.dialog.waitFor({ state: "visible" });
    await this.topicNameInput.clear();
    await this.fillTopicName(newName);
    await this.submitTopicForm();
    await this.dialog.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * Delete topic
   */
  async deleteTopic(name: string): Promise<void> {
    const topicItem = this.getTopicByName(name);
    const deleteButton = topicItem.locator("..").getByRole("button", { name: /usuń/i });
    await deleteButton.click();
    // Wait for confirmation dialog
    const confirmButton = this.page.getByRole("button", { name: /potwierdź|usuń/i });
    await confirmButton.click();
  }
}
