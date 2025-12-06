/**
 * Test Data Constants
 *
 * Centralized test data for E2E tests
 * Reference values from .ai/test-plan.md
 */

// Test Users - loaded from environment variables
export const TEST_USERS = {
  main: {
    email: process.env.E2E_USERNAME,
    password: process.env.E2E_PASSWORD,
  },
  secondary: {
    email: "testuser2@edukids.test",
    password: "Test1234",
  },
};

// Sample Topic Names
export const SAMPLE_TOPICS = {
  mathematics: "Matematyka",
  science: "Przyroda",
  history: "Historia",
  polish: "Język Polski",
  english: "Język Angielski",
  it: "Informatyka",
  music: "Muzyka",
  art: "Plastyka",
  pe: "Wychowanie Fizyczne",
  geography: "Geografia",
} as const;

// Age Groups
export const AGE_GROUPS = {
  preschool: { value: 3, label: "3-4 lata" },
  kindergarten: { value: 5, label: "5-6 lat" },
  earlySchool: { value: 7, label: "7-8 lat" },
  midSchool: { value: 9, label: "9-10 lat" },
  lateSchool: { value: 11, label: "11-12 lat" },
} as const;

// Validation Rules (from types.ts)
export const VALIDATION_RULES = {
  topic: {
    nameMaxLength: 100,
    nameMinLength: 1,
  },
  question: {
    contentMaxLength: 500,
    contentMinLength: 5,
    maxQuestionsPerGeneration: 10,
    minQuestionsPerGeneration: 1,
  },
} as const;

// Test Timeouts
export const TIMEOUTS = {
  navigation: 10000,
  apiCall: 5000,
  dialogAnimation: 500,
  aiGeneration: 30000,
} as const;

// Error Messages (Polish)
export const ERROR_MESSAGES = {
  auth: {
    invalidCredentials: "Nieprawidłowy email lub hasło",
    emailRequired: "Email jest wymagany",
    passwordRequired: "Hasło jest wymagane",
    weakPassword: "Hasło musi mieć co najmniej 6 znaków",
  },
  topic: {
    nameRequired: "Nazwa tematu jest wymagana",
    nameTooLong: "Nazwa tematu może mieć maksymalnie",
  },
  question: {
    contentRequired: "Treść pytania jest wymagana",
    countInvalid: "Liczba pytań musi być od 1 do 10",
  },
} as const;

// Routes
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  topics: "/topics",
  generate: "/generate",
  settings: "/settings",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const;

/**
 * Generate unique topic name with timestamp
 */
export function generateUniqueTopicName(baseName = "Test Topic"): string {
  return `${baseName} ${Date.now()}`;
}

/**
 * Generate test email with timestamp
 */
export function generateTestEmail(prefix = "test"): string {
  return `${prefix}_${Date.now()}@example.com`;
}

/**
 * Get random sample topic
 */
export function getRandomTopic(): string {
  const topics = Object.values(SAMPLE_TOPICS);
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Wait helper for specific durations
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
