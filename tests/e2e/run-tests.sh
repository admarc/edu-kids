#!/bin/bash

# Quick E2E Test Runner
# Run specific E2E tests with common configurations

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   EduKids E2E Tests - Quick Runner${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${YELLOW}⚠️  npx not found. Please install Node.js and npm${NC}"
    exit 1
fi

# Function to run tests
run_test() {
    local test_name=$1
    local description=$2
    
    echo -e "\n${GREEN}▶ Running: ${description}${NC}"
    npm run test:e2e -- "$test_name"
}

# Check for arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [test-option]"
    echo ""
    echo "Available options:"
    echo "  all             - Run all E2E tests"
    echo "  login           - Run login and create topic test"
    echo "  auth            - Run authenticated topic creation tests"
    echo "  ui              - Run tests in UI mode"
    echo "  debug           - Run tests in debug mode"
    echo "  update-snapshots - Update visual snapshots"
    echo ""
    echo "Example: $0 login"
    exit 1
fi

case "$1" in
    all)
        echo -e "${GREEN}Running all E2E tests...${NC}"
        npm run test:e2e
        ;;
    login)
        run_test "login-and-create-topic.spec.ts" "Login and Create Topic Flow"
        ;;
    auth)
        run_test "create-topic-authenticated.spec.ts" "Authenticated Topic Creation"
        ;;
    ui)
        echo -e "${GREEN}Opening Playwright UI...${NC}"
        npm run test:e2e:ui
        ;;
    debug)
        echo -e "${GREEN}Opening Playwright Debug Mode...${NC}"
        npm run test:e2e:debug
        ;;
    update-snapshots)
        echo -e "${YELLOW}Updating visual snapshots...${NC}"
        npm run test:e2e -- --update-snapshots
        ;;
    report)
        echo -e "${GREEN}Opening test report...${NC}"
        npm run test:e2e:report
        ;;
    *)
        echo -e "${YELLOW}Unknown option: $1${NC}"
        echo "Run '$0' without arguments to see available options"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✓ Done!${NC}\n"

