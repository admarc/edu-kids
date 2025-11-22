/**
 * Auth Validators
 * 
 * Zod schemas for authentication-related API endpoints.
 * These schemas validate user input for login, registration, password changes, etc.
 */

import { z } from "zod";

// Common validation rules
const emailRule = z.string().email("Nieprawidłowy format email");

const passwordRule = z.string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
  .regex(/[a-z]/, "Hasło musi zawierać małą literę")
  .regex(/[0-9]/, "Hasło musi zawierać cyfrę");

// Simple password rule for login (no strict validation)
const loginPasswordRule = z.string().min(1, "Hasło jest wymagane");

/**
 * Schema for user login
 * POST /api/auth/login
 */
export const loginSchema = z.object({
  email: emailRule,
  password: loginPasswordRule,
});

/**
 * Schema for user registration
 * POST /api/auth/register
 */
export const registerSchema = z.object({
  email: emailRule,
  password: passwordRule,
});

/**
 * Schema for forgot password request
 * POST /api/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: emailRule,
});

/**
 * Schema for password reset
 * POST /api/auth/reset-password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token jest wymagany"),
  password: passwordRule,
});

/**
 * Schema for password change (logged in user)
 * POST /api/auth/change-password
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
  newPassword: passwordRule,
});

/**
 * Schema for account deletion
 * DELETE /api/auth/account
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Hasło jest wymagane"),
});

// ============================================================================
// Type exports (inferred from schemas)
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

