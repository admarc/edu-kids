import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Home Page Object
 * Represents the home/landing page of the application
 */
export class HomePage extends BasePage {
  // Locators
  readonly welcomeHeading: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly navigation: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeHeading = page.getByRole("heading", { level: 1 });
    this.loginButton = page.getByRole("link", { name: /zaloguj|login/i });
    this.registerButton = page.getByRole("link", { name: /zarejestruj|register/i });
    this.navigation = page.getByRole("navigation");
  }

  /**
   * Navigate to home page
   */
  async navigate(): Promise<void> {
    await this.goto("/");
    await this.waitForPageLoad();
  }

  /**
   * Click login button and wait for navigation
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Click register button and wait for navigation
   */
  async clickRegister(): Promise<void> {
    await this.registerButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Check if navigation is visible
   */
  async hasNavigation(): Promise<boolean> {
    return await this.navigation.isVisible();
  }
}
