import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Login Page Object
 * Represents the login page with authentication functionality
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator("input#email");
    this.passwordInput = page.locator("input#password");
    this.submitButton = page.getByRole("button", { name: /zaloguj się|logowanie/i });
    this.forgotPasswordLink = page.getByRole("link", { name: /zapomniałeś hasła/i });
    this.registerLink = page.getByRole("link", { name: /zarejestruj się/i });
    this.errorAlert = page.getByRole("alert");
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto("/login");
    await this.waitForPageLoad();
  }

  /**
   * Fill login form
   */
  async fillForm(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Login with credentials
   * @param email User email
   * @param password User password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillForm(email, password);
    await this.submit();
    await this.waitForPageLoad();
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorAlert.textContent()) || "";
  }
}
