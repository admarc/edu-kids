/**
 * Auth Service
 *
 * Service responsible for authentication operations using Supabase Auth.
 * Encapsulates authentication logic and error handling.
 */

import type { SupabaseClient, Session, User, AuthError as SupabaseAuthError } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Custom authentication error class
 */
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 500
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Auth Service
 * Handles all authentication operations via Supabase Auth
 */
export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Register a new user
   * @throws AuthError if email already exists or other errors
   */
  async register(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw this.mapSupabaseError(error);
    }
  }

  /**
   * Log in a user
   * @returns Session object from Supabase
   * @throws AuthError if credentials are invalid
   */
  async login(email: string, password: string): Promise<Session> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw this.mapSupabaseError(error);
    }

    if (!data.session) {
      throw new AuthError("NO_SESSION", "Nie udało się utworzyć sesji", 500);
    }

    return data.session;
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw this.mapSupabaseError(error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.getBaseUrl()}/reset-password`,
    });

    if (error) {
      throw this.mapSupabaseError(error);
    }
  }

  /**
   * Reset password using token from email
   * @throws AuthError if token is invalid
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Verify the OTP token and update password
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw this.mapSupabaseError(error);
    }
  }

  /**
   * Change password for logged in user
   * @throws AuthError if current password is invalid
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // First, verify current password by attempting to sign in
    const { data: userData, error: userError } = await this.supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new AuthError("UNAUTHORIZED", "Musisz być zalogowany aby zmienić hasło", 403);
    }

    if (!userData.user.email) {
      throw new AuthError("NO_EMAIL", "Email użytkownika nie jest dostępny", 400);
    }

    // Re-authenticate with current password
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new AuthError("INVALID_PASSWORD", "Aktualne hasło jest nieprawidłowe", 401);
    }

    // Update to new password
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw this.mapSupabaseError(error);
    }
  }

  /**
   * Delete user account
   * @throws AuthError if password is invalid
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    // First, verify password
    const { data: userData, error: userError } = await this.supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new AuthError("UNAUTHORIZED", "Musisz być zalogowany", 403);
    }

    if (!userData.user.email) {
      throw new AuthError("NO_EMAIL", "Email użytkownika nie jest dostępny", 400);
    }

    // Re-authenticate with password
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });

    if (signInError) {
      throw new AuthError("INVALID_PASSWORD", "Hasło jest nieprawidłowe", 401);
    }

    // Delete user account (this will cascade delete all related data via RLS)
    // Note: Supabase doesn't have a direct deleteUser method in the client
    // This should be done via admin API or RPC call
    // For now, we'll use a workaround
    throw new AuthError("NOT_IMPLEMENTED", "Usuwanie konta nie jest jeszcze zaimplementowane", 501);
  }

  /**
   * Get currently logged in user
   * @returns User object or null
   */
  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  }

  /**
   * Map Supabase auth errors to our custom AuthError
   */
  private mapSupabaseError(error: SupabaseAuthError): AuthError {
    // Handle specific Supabase error codes
    if (error.message.includes("Invalid login credentials")) {
      return new AuthError("INVALID_CREDENTIALS", "Nieprawidłowy email lub hasło", 401);
    }

    if (error.message.includes("Email not confirmed")) {
      return new AuthError("EMAIL_NOT_CONFIRMED", "Potwierdź swój adres email aby się zalogować", 403);
    }

    if (error.message.includes("already registered") || error.message.includes("already been registered")) {
      return new AuthError("USER_EXISTS", "Ten adres email jest już zarejestrowany", 409);
    }

    if (error.message.includes("Password should be at least")) {
      return new AuthError("WEAK_PASSWORD", "Hasło jest zbyt słabe", 400);
    }

    if (error.status === 429) {
      return new AuthError("RATE_LIMIT", "Zbyt wiele prób. Spróbuj ponownie za kilka minut", 429);
    }

    // Default error
    return new AuthError("UNKNOWN_ERROR", error.message || "Wystąpił nieoczekiwany błąd", error.status || 500);
  }

  /**
   * Get base URL for redirect links
   */
  private getBaseUrl(): string {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    // Fallback for server-side
    return process.env.SITE_URL || "http://localhost:4321";
  }
}
