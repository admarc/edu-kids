# Testing Guide

This directory contains all tests for the edu-kids application.

## Structure

```
tests/
├── setup.ts                                      # Global test setup and configuration
├── e2e/                                          # End-to-end tests (Playwright)
│   ├── pages/                                    # Page Object Models
│   │   ├── BasePage.ts                          # Base page with common functionality
│   │   ├── HomePage.ts                          # Home page object
│   │   ├── LoginPage.ts                         # Login page object
│   │   └── TopicsPage.ts                        # Topics page object
│   ├── fixtures/                                # Test fixtures and helper data
│   │   └── auth.fixture.ts                      # Authentication fixture for logged-in tests
│   ├── home.spec.ts                             # Home page tests
│   ├── login-and-create-topic.spec.ts          # Login and topic creation flow
│   └── create-topic-authenticated.spec.ts      # Topic creation with auth fixture
└── unit/                                        # Unit and integration tests (Vitest)
    ├── services/                                # Service layer tests
    ├── validators/                              # Validator tests
    └── hooks/                                   # React hooks tests
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI mode
npm run test:ui

# Run specific test file
npm run test -- topics.validators.test.ts

# Run tests matching pattern
npm run test -- -t "should validate"
```

### E2E Tests (Playwright)

**Setup**: Create a `.env.test` file in the project root:
```env
# E2E Test User Credentials
E2E_USERNAME=...
E2E_PASSWORD=...

# Base URL
BASE_URL=http://localhost:3000

# Supabase (required - prevents "Invalid API key" error)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests in UI mode (interactive)
npm run test:e2e:ui

# Run e2e tests in debug mode
npm run test:e2e:debug

# Generate tests using codegen
npm run test:e2e:codegen

# Show test report
npm run test:e2e:report
```

## Coverage Requirements

- Minimum 70% coverage for:
  - `src/lib/services/**/*.ts`
  - `src/lib/validators/**/*.ts`
  - `src/lib/hooks/**/*.ts`

## Best Practices

### Unit Tests (Vitest)

1. **Use Arrange-Act-Assert pattern**
   ```typescript
   it('should do something', () => {
     // Arrange: Set up test data
     const input = 'test';
     
     // Act: Execute the functionality
     const result = functionToTest(input);
     
     // Assert: Verify the result
     expect(result).toBe('expected');
   });
   ```

2. **Mock external dependencies**
   ```typescript
   vi.mock('@/db/supabase.client', () => ({
     supabase: { /* mock implementation */ }
   }));
   ```

3. **Use descriptive test names**
   ```typescript
   describe('UserService', () => {
     describe('createUser', () => {
       it('should create user with valid data', () => {});
       it('should reject invalid email format', () => {});
       it('should handle database errors gracefully', () => {});
     });
   });
   ```

4. **Test both happy paths and edge cases**

### E2E Tests (Playwright)

1. **Use Page Object Model**
   - Encapsulate page interactions in page objects
   - Keep tests readable and maintainable
   - Reuse common functionality
   
   Example:
   ```typescript
   // In page object
   export class LoginPage extends BasePage {
     async login(email: string, password: string) {
       await this.emailInput.fill(email);
       await this.passwordInput.fill(password);
       await this.submitButton.click();
     }
   }
   
   // In test
   test('should login', async ({ page }) => {
     const loginPage = new LoginPage(page);
     await loginPage.login('user@example.com', 'password');
   });
   ```

2. **Use Authentication Fixtures for efficiency**
   ```typescript
   // Import auth fixture instead of logging in every test
   import { test, expect } from './fixtures/auth.fixture';
   
   test('should create topic', async ({ authenticatedPage }) => {
     // Page is already logged in
     const topicsPage = new TopicsPage(authenticatedPage);
     await topicsPage.navigate();
   });
   ```

3. **Use reliable selectors**
   ```typescript
   // Good: Semantic selectors
   page.getByRole('button', { name: 'Submit' })
   page.getByLabel('Email')
   page.getByText('Welcome')
   
   // Avoid: Brittle selectors
   page.locator('.btn-primary') // CSS classes can change
   page.locator('#submit-btn')  // IDs can change
   ```

4. **Leverage auto-waiting**
   - Playwright automatically waits for elements
   - No need for manual `sleep()` or `wait()` in most cases

5. **Use browser contexts for isolation**
   ```typescript
   test.beforeEach(async ({ page }) => {
     // Each test gets a fresh browser context
   });
   ```

6. **Visual regression testing**
   ```typescript
   await expect(page).toHaveScreenshot('page-name.png');
   ```

## Debugging Tests

### Vitest

```bash
# Run with verbose output
npm run test -- --reporter=verbose

# Debug specific test
npm run test -- --inspect-brk topics.test.ts
```

### Playwright

```bash
# Open Playwright Inspector
npm run test:e2e:debug

# View traces for failed tests
npx playwright show-trace test-results/trace.zip

# Generate tests using codegen
npm run test:e2e:codegen
```

## CI/CD Integration

Tests are automatically run in the CI/CD pipeline:
- Unit tests run on every push
- E2E tests run on pull requests
- Coverage reports are generated and enforced

## Writing New Tests

### Available E2E Tests

#### 1. Login and Create Topic Flow
**File**: `e2e/login-and-create-topic.spec.ts`

Tests the complete user journey from login to topic creation:
- User login with credentials
- Navigation to topics page
- Opening add topic dialog
- Creating a new topic
- Form validation
- Cancel functionality

Example:
```typescript
test('should login successfully and create a new topic', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const topicsPage = new TopicsPage(page);
  
  await loginPage.navigate();
  await loginPage.login(TEST_USER.email, TEST_USER.password);
  
  await topicsPage.navigate();
  await topicsPage.createTopic('My New Topic');
  
  expect(await topicsPage.hasTopicWithName('My New Topic')).toBeTruthy();
});
```

#### 2. Create Topic (Authenticated)
**File**: `e2e/create-topic-authenticated.spec.ts`

Tests topic creation with pre-authenticated user using fixtures:
- Automatic login via fixture
- Single topic creation
- Multiple topics creation
- Validation errors
- Rapid consecutive creation

Example:
```typescript
import { test, expect } from './fixtures/auth.fixture';

test('should create a new topic', async ({ authenticatedPage }) => {
  const topicsPage = new TopicsPage(authenticatedPage);
  await topicsPage.navigate();
  await topicsPage.createTopic('Matematyka');
});
```

#### 3. Using Auth Fixture

The auth fixture (`fixtures/auth.fixture.ts`) provides pre-authenticated browser contexts:

```typescript
import { test, expect, TEST_USER } from './fixtures/auth.fixture';

// authenticatedPage is already logged in
test('my test', async ({ authenticatedPage }) => {
  // Start testing from logged-in state
});
```

### Page Objects Available

- **BasePage**: Common page functionality
- **HomePage**: Landing page interactions
- **LoginPage**: Authentication flows
- **TopicsPage**: Topic management (CRUD operations)

1. Create test file next to the code you're testing (for unit tests) or in `tests/e2e` (for e2e tests)
2. Follow the naming convention: `*.test.ts` or `*.spec.ts`
3. Import necessary utilities from Vitest or Playwright
4. Write descriptive test cases
5. Run tests locally before committing
6. Ensure coverage thresholds are met

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
