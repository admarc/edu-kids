# Quick Start: Running E2E Tests

## Prerequisites

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Install Playwright browsers** (first time only):
```bash
npx playwright install chromium
```

3. **Create `.env.test` file** in the project root:
```env
# E2E Test User Credentials
E2E_USERNAME=...
E2E_PASSWORD=...

# Base URL
BASE_URL=http://localhost:3000

# Supabase Configuration (same as your .env or test database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

4. **Verify your configuration** (optional but recommended):
```bash
npm run test:e2e:check
```
This will check if all required environment variables are set correctly.

5. **Start the development server**:
```bash
npm run dev
```
Server should be running on `http://localhost:3000`

## Running Tests

### Option 1: Using npm scripts

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e -- login-and-create-topic.spec.ts

# Run in interactive UI mode
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

### Option 2: Using the test runner script

```bash
# Make script executable (first time only)
chmod +x tests/e2e/run-tests.sh

# Run login test
./tests/e2e/run-tests.sh login

# Run authenticated tests
./tests/e2e/run-tests.sh auth

# Run all tests
./tests/e2e/run-tests.sh all

# Open UI mode
./tests/e2e/run-tests.sh ui
```

## What the Tests Do

### Test 1: Login and Create Topic
**File**: `login-and-create-topic.spec.ts`

This test:
1. ✅ Opens the login page
2. ✅ Logs in with test credentials
3. ✅ Navigates to topics page
4. ✅ Opens "Add Topic" dialog
5. ✅ Creates a new topic
6. ✅ Verifies the topic appears in the list

### Test 2: Create Topic (Authenticated)
**File**: `create-topic-authenticated.spec.ts`

This test:
1. ✅ Uses pre-authenticated session (faster)
2. ✅ Creates single topics
3. ✅ Creates multiple topics
4. ✅ Tests validation errors

## Test Credentials

The tests use credentials from `.env.test` file:
- **E2E_USERNAME**: Your test user email
- **E2E_PASSWORD**: Your test user password

Example `.env.test`:
```env
E2E_USERNAME=ab@o2.pl
E2E_PASSWORD=keeper
BASE_URL=http://localhost:3000
```

⚠️ **Important**: 
- Create the `.env.test` file in the project root
- This user must exist in your database for tests to work
- Never commit `.env.test` to version control (it's in `.gitignore`)

## Expected Output

When tests pass, you should see:
```
Running 4 tests using 1 worker

  ✓ Login and Create Topic > should login successfully and create a new topic
  ✓ Login and Create Topic > should display validation error for empty topic name
  ✓ Login and Create Topic > should cancel topic creation
  ✓ Login and Create Topic - Visual Tests > should match visual snapshot

  4 passed (15s)
```

## Troubleshooting

### Problem: "Test user doesn't exist"
**Solution**: Create the test user in your database or use existing credentials.

### Problem: "Port 4321 already in use"
**Solution**: The test will reuse existing dev server. Make sure it's running.

### Problem: "Timeout waiting for page"
**Solution**: Ensure dev server is running and accessible at `http://localhost:4321`

### Problem: "Screenshot comparison failed"
**Solution**: If UI changes are intentional, update snapshots:
```bash
npm run test:e2e -- --update-snapshots
```

## Viewing Test Reports

After running tests:
```bash
# Open HTML report
npm run test:e2e:report
```

## Interactive Debugging

Best way to debug tests:
```bash
# Open Playwright UI
npm run test:e2e:ui
```

This opens an interactive viewer where you can:
- ⏯️ Step through tests
- 🔍 Inspect elements
- 📸 View screenshots
- 🎬 Watch test execution

## Next Steps

- Read `tests/e2e/README.md` for detailed documentation
- Check `tests/e2e/IMPLEMENTATION.md` for technical details
- Review `.ai/test-plan.md` for full test coverage plan

## Quick Reference

```bash
# Most common commands
npm run test:e2e                    # Run all tests
npm run test:e2e:ui                 # Interactive mode
npm run test:e2e -- --headed        # See browser
npm run test:e2e -- --debug         # Debug mode
npm run test:e2e:report             # View report
```

---

**Happy Testing! 🎭**

