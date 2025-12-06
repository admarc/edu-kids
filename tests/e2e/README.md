# E2E Tests - Login and Create Topic

This directory contains end-to-end tests for the EduKids application using Playwright.

## Quick Start

### Running the Tests

```bash
# Run the login and create topic test
npm run test:e2e -- login-and-create-topic.spec.ts

# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

### Test Credentials

The tests use credentials from environment variables defined in `.env.test`:
- **E2E_USERNAME**: Test user email
- **E2E_PASSWORD**: Test user password

Create a `.env.test` file in the project root with your test credentials:
```env
# E2E Test User Credentials
E2E_USERNAME=...
E2E_PASSWORD=...

# Base URL
BASE_URL=http://localhost:3000

# Supabase Configuration (required!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**Important**: `SUPABASE_URL` and `SUPABASE_KEY` are **required** - without them you'll get "Invalid API key" error.

Make sure this user exists in your test database before running the tests.

**Note**: If environment variables are not set, tests will fall back to default credentials.

## Available Tests

### 1. Login and Create Topic Flow
**File**: `login-and-create-topic.spec.ts`

Complete user journey testing:
- ✅ Login with test credentials
- ✅ Navigate to topics page
- ✅ Create a new topic
- ✅ Validation for empty topic name
- ✅ Cancel topic creation
- ✅ Visual regression tests

```bash
npm run test:e2e -- login-and-create-topic
```

### 2. Create Topic (Authenticated)
**File**: `create-topic-authenticated.spec.ts`

Tests using pre-authenticated fixture:
- ✅ Create single topic
- ✅ Create multiple topics
- ✅ Validation for max length
- ✅ Rapid consecutive creation

```bash
npm run test:e2e -- create-topic-authenticated
```

## Page Objects

### LoginPage
Handles all login page interactions:

```typescript
import { LoginPage } from './pages/LoginPage';

const loginPage = new LoginPage(page);
await loginPage.navigate();
await loginPage.login('email@example.com', 'password');
```

Methods:
- `navigate()` - Go to login page
- `fillForm(email, password)` - Fill credentials
- `submit()` - Submit form
- `login(email, password)` - Complete login flow
- `hasError()` - Check for error messages
- `getErrorMessage()` - Get error text

### TopicsPage
Handles topics page interactions:

```typescript
import { TopicsPage } from './pages/TopicsPage';

const topicsPage = new TopicsPage(page);
await topicsPage.navigate();
await topicsPage.createTopic('My Topic');
```

Methods:
- `navigate()` - Go to topics page
- `openAddTopicDialog()` - Open add dialog
- `fillTopicName(name)` - Fill topic name
- `submitTopicForm()` - Submit form
- `createTopic(name)` - Complete creation flow
- `hasTopicWithName(name)` - Check if topic exists
- `getTopicsCount()` - Get total topics
- `editTopic(oldName, newName)` - Edit existing topic
- `deleteTopic(name)` - Delete topic

## Using Auth Fixture

For tests that require authenticated state, use the auth fixture to avoid repeated login:

```typescript
import { test, expect, TEST_USER } from './fixtures/auth.fixture';

test('should do something', async ({ authenticatedPage }) => {
  // Page is already logged in
  const topicsPage = new TopicsPage(authenticatedPage);
  await topicsPage.navigate();
  // ... rest of test
});
```

Benefits:
- ⚡ Faster test execution
- 🔄 Reusable across multiple tests
- 🧹 Cleaner test code
- 🎯 Focus on testing features, not login

## Visual Regression Testing

Tests include visual snapshots for regression detection:

```typescript
await expect(page).toHaveScreenshot('topics-page.png');
```

On first run, screenshots are captured as baseline. Subsequent runs compare against the baseline.

### Updating Screenshots

If UI changes intentionally:

```bash
# Update all screenshots
npm run test:e2e -- --update-snapshots

# Update specific test screenshots
npm run test:e2e -- login-and-create-topic --update-snapshots
```

## Test Coverage

These tests cover the following test cases from the Test Plan (`.ai/test-plan.md`):

- **TC-AUTH-003**: User login (happy path)
- **TC-AUTH-004**: Login with invalid credentials
- **TC-TOPICS-001**: Create new topic (happy path)
- **TC-TOPICS-002**: Topic name validation
- **TC-TOPICS-003**: Edit topic
- **TC-TOPICS-004**: Delete topic

## Debugging Tips

### 1. Use UI Mode
```bash
npm run test:e2e:ui
```
Interactive mode with time-travel debugging and step-by-step execution.

### 2. Use Debug Mode
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector for detailed debugging.

### 3. View Trace
After test failure:
```bash
npx playwright show-trace test-results/trace.zip
```

### 4. Generate Tests
Use codegen to record new tests:
```bash
npm run test:e2e:codegen
```

## Best Practices

1. ✅ **Use Page Objects** - Encapsulate page interactions
2. ✅ **Use Semantic Selectors** - `getByRole()`, `getByLabel()`, etc.
3. ✅ **Leverage Auto-waiting** - Playwright waits automatically
4. ✅ **Use Auth Fixture** - For tests requiring login
5. ✅ **Unique Test Data** - Use timestamps for unique names
6. ✅ **Clean Test State** - Each test should be independent
7. ✅ **Visual Regression** - Add screenshots for critical pages

## Test Data Cleanup

After all tests complete, a global teardown function automatically cleans up test topics from the database.

### How It Works

The teardown function:
1. Authenticates as the test user
2. Deletes all topics created by the test user
3. Signs out and reports cleanup results

### Configuration

Set up these environment variables in `.env.test`:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Supabase anon/service key
- `E2E_USERNAME` - Test user email
- `E2E_PASSWORD` - Test user password

### Logs

After test runs, check the console for cleanup status:

```
🧹 Starting global teardown...
✓ Authenticated as test user: test@example.com
✓ Deleted 5 test topic(s)
✓ Signed out test user
✅ Global teardown completed successfully
```

### Manual Cleanup

To manually run the teardown:

```bash
npx tsx tests/e2e/global-teardown.ts
```

For more details, see [TEARDOWN.md](./TEARDOWN.md).

## Common Issues

### Test User Doesn't Exist
```
Error: Invalid login credentials
```
**Solution**: Create the test user in your database or use an existing user.

### Port Already in Use
```
Error: Port 4321 is already in use
```
**Solution**: Stop the dev server or set `reuseExistingServer: true` in `playwright.config.ts`.

### Tests Failing After UI Changes
```
Error: Screenshot comparison failed
```
**Solution**: Update snapshots with `--update-snapshots` flag if changes are intentional.

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Plan](.ai/test-plan.md)

