import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { AuthService, AuthError } from "@/lib/services/auth.service";
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

// Interface for Supabase query builder mock
interface MockQueryBuilder {
  delete: Mock;
  eq: Mock;
}

// Mock window for getBaseUrl tests
Object.defineProperty(window, "location", {
  value: {
    origin: "http://localhost:4321",
  },
  writable: true,
});

// Mock process.env for server-side getBaseUrl tests
vi.stubGlobal("process", {
  ...process,
  env: {
    ...process.env,
    SITE_URL: "http://localhost:3000",
  },
});

// Note: This test file uses 'as any' to access private methods for comprehensive testing.
// This is an accepted pattern in TypeScript testing where private method behavior needs validation.
describe("AuthService", () => {
  let service: AuthService;
  let mockSupabase: {
    auth: {
      signUp: Mock;
      signInWithPassword: Mock;
      signOut: Mock;
      resetPasswordForEmail: Mock;
      updateUser: Mock;
      getUser: Mock;
    };
    from: Mock;
  };

  // Test data constants
  const validEmail = "test@example.com";
  const validPassword = "Password123";
  const weakPassword = "weak";
  const invalidEmail = "invalid-email";
  const userId = "test-user-id";

  const mockSession: Session = {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: userId,
      email: validEmail,
      created_at: new Date().toISOString(),
    } as User,
  };

  const mockUser: User = {
    id: userId,
    email: validEmail,
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create comprehensive mock for Supabase auth methods
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    // Create service instance
    service = new AuthService(mockSupabase as unknown as SupabaseClient<Database>);
  });

  describe("constructor", () => {
    it("should initialize successfully with valid Supabase client", () => {
      expect(service).toBeInstanceOf(AuthService);
    });
  });

  describe("register", () => {
    it("should register user successfully", async () => {
      // Arrange
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      await expect(service.register(validEmail, validPassword)).resolves.toBeUndefined();

      // Assert
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });
      expect(mockSupabase.auth.signUp).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthError when email already exists", async () => {
      // Arrange
      const supabaseError = {
        message: "User already registered",
        status: 400,
      };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.register(validEmail, validPassword)).rejects.toThrow(AuthError);
      await expect(service.register(validEmail, validPassword)).rejects.toMatchObject({
        code: "USER_EXISTS",
        message: "Ten adres email jest już zarejestrowany",
        statusCode: 409,
      });
    });

    it("should throw AuthError for weak password", async () => {
      // Arrange
      const supabaseError = {
        message: "Password should be at least 6 characters",
        status: 400,
      };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.register(validEmail, weakPassword)).rejects.toThrow(AuthError);
      await expect(service.register(validEmail, weakPassword)).rejects.toMatchObject({
        code: "WEAK_PASSWORD",
        message: "Hasło jest zbyt słabe",
        statusCode: 400,
      });
    });

    it("should throw AuthError for rate limiting", async () => {
      // Arrange
      const supabaseError = {
        message: "Too many requests",
        status: 429,
      };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.register(validEmail, validPassword)).rejects.toThrow(AuthError);
      await expect(service.register(validEmail, validPassword)).rejects.toMatchObject({
        code: "RATE_LIMIT",
        message: "Zbyt wiele prób. Spróbuj ponownie za kilka minut",
        statusCode: 429,
      });
    });

    it("should throw AuthError for generic signup error", async () => {
      // Arrange
      const supabaseError = {
        message: "Database connection failed",
        status: 500,
      };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.register(validEmail, validPassword)).rejects.toThrow(AuthError);
      await expect(service.register(validEmail, validPassword)).rejects.toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Database connection failed",
        statusCode: 500,
      });
    });

    it("should throw AuthError for network errors without status", async () => {
      // Arrange
      const supabaseError = {
        message: "Network error",
      };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.register(validEmail, validPassword)).rejects.toThrow(AuthError);
      await expect(service.register(validEmail, validPassword)).rejects.toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Network error",
        statusCode: 500,
      });
    });
  });

  describe("login", () => {
    it("should login user successfully and return session", async () => {
      // Arrange
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Act
      const result = await service.login(validEmail, validPassword);

      // Assert
      expect(result).toEqual(mockSession);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthError for invalid credentials", async () => {
      // Arrange
      const supabaseError = {
        message: "Invalid login credentials",
        status: 400,
      };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.login(validEmail, "wrongpassword")).rejects.toThrow(AuthError);
      await expect(service.login(validEmail, "wrongpassword")).rejects.toMatchObject({
        code: "INVALID_CREDENTIALS",
        message: "Nieprawidłowy email lub hasło",
        statusCode: 401,
      });
    });

    it("should throw AuthError when email not confirmed", async () => {
      // Arrange
      const supabaseError = {
        message: "Email not confirmed",
        status: 400,
      };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.login(validEmail, validPassword)).rejects.toThrow(AuthError);
      await expect(service.login(validEmail, validPassword)).rejects.toMatchObject({
        code: "EMAIL_NOT_CONFIRMED",
        message: "Potwierdź swój adres email aby się zalogować",
        statusCode: 403,
      });
    });

    it("should throw AuthError when no session returned", async () => {
      // Arrange
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Act & Assert
      await expect(service.login(validEmail, validPassword)).rejects.toThrow(AuthError);
      await expect(service.login(validEmail, validPassword)).rejects.toMatchObject({
        code: "NO_SESSION",
        message: "Nie udało się utworzyć sesji",
        statusCode: 500,
      });
    });

    it("should throw AuthError for rate limiting", async () => {
      // Arrange
      const supabaseError = {
        message: "Too many requests",
        status: 429,
      };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.login(validEmail, validPassword)).rejects.toThrow(AuthError);
      await expect(service.login(validEmail, validPassword)).rejects.toMatchObject({
        code: "RATE_LIMIT",
        message: "Zbyt wiele prób. Spróbuj ponownie za kilka minut",
        statusCode: 429,
      });
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      // Act
      await expect(service.logout()).resolves.toBeUndefined();

      // Assert
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthError when logout fails", async () => {
      // Arrange
      const supabaseError = {
        message: "Logout failed",
        status: 500,
      };
      mockSupabase.auth.signOut.mockResolvedValue({
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.logout()).rejects.toThrow(AuthError);
      await expect(service.logout()).rejects.toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Logout failed",
        statusCode: 500,
      });
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email successfully", async () => {
      // Arrange
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      // Act
      await expect(service.sendPasswordResetEmail(validEmail)).resolves.toBeUndefined();

      // Assert
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(validEmail, {
        redirectTo: "http://localhost:4321/reset-password",
      });
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthError when sending reset email fails", async () => {
      // Arrange
      const supabaseError = {
        message: "Invalid email",
        status: 400,
      };
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.sendPasswordResetEmail(invalidEmail)).rejects.toThrow(AuthError);
      await expect(service.sendPasswordResetEmail(invalidEmail)).rejects.toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Invalid email",
        statusCode: 400,
      });
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      // Arrange
      const token = "valid-reset-token";
      const newPassword = "NewPassword123";
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      await expect(service.resetPassword(token, newPassword)).resolves.toBeUndefined();

      // Assert
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthError when password reset fails", async () => {
      // Arrange
      const token = "invalid-token";
      const newPassword = "NewPassword123";
      const supabaseError = {
        message: "Invalid token",
        status: 400,
      };
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(AuthError);
      await expect(service.resetPassword(token, newPassword)).rejects.toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Invalid token",
        statusCode: 400,
      });
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      // Arrange
      const currentPassword = "CurrentPassword123";
      const newPassword = "NewPassword123";

      // Mock getUser (user is logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock signInWithPassword (current password verification)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock updateUser (password change)
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      await expect(service.changePassword(userId, currentPassword, newPassword)).resolves.toBeUndefined();

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validEmail,
        password: currentPassword,
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it("should throw AuthError when user is not logged in", async () => {
      // Arrange
      const currentPassword = "CurrentPassword123";
      const newPassword = "NewPassword123";

      // Mock getUser (user not logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      // Act & Assert
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(AuthError);
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "Musisz być zalogowany aby zmienić hasło",
        statusCode: 403,
      });
    });

    it("should throw AuthError when user has no email", async () => {
      // Arrange
      const currentPassword = "CurrentPassword123";
      const newPassword = "NewPassword123";

      // Mock getUser (user without email)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { ...mockUser, email: undefined } },
        error: null,
      });

      // Act & Assert
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(AuthError);
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toMatchObject({
        code: "NO_EMAIL",
        message: "Email użytkownika nie jest dostępny",
        statusCode: 400,
      });
    });

    it("should throw AuthError when current password is incorrect", async () => {
      // Arrange
      const wrongCurrentPassword = "WrongPassword123";
      const newPassword = "NewPassword123";

      // Mock getUser (user is logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock signInWithPassword (current password verification fails)
      const supabaseError = {
        message: "Invalid login credentials",
        status: 400,
      };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.changePassword(userId, wrongCurrentPassword, newPassword)).rejects.toThrow(AuthError);
      await expect(service.changePassword(userId, wrongCurrentPassword, newPassword)).rejects.toMatchObject({
        code: "INVALID_PASSWORD",
        message: "Aktualne hasło jest nieprawidłowe",
        statusCode: 401,
      });
    });

    it("should throw AuthError when password update fails", async () => {
      // Arrange
      const currentPassword = "CurrentPassword123";
      const newPassword = "NewPassword123";

      // Mock getUser (user is logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock signInWithPassword (current password verification succeeds)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock updateUser (password change fails)
      const supabaseError = {
        message: "Password update failed",
        status: 500,
      };
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(AuthError);
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Password update failed",
        statusCode: 500,
      });
    });
  });

  describe("deleteAccount", () => {
    let mockTopicsQuery: MockQueryBuilder;

    beforeEach(() => {
      // Mock the topics table query builder
      mockTopicsQuery = {
        delete: vi.fn(),
        eq: vi.fn(),
      };

      // Chain the query builder methods
      mockTopicsQuery.delete.mockReturnValue(mockTopicsQuery);
      mockTopicsQuery.eq.mockResolvedValue({ error: null });

      // Mock the from method to return the query builder
      mockSupabase.from.mockReturnValue(mockTopicsQuery);
    });

    it("should delete account successfully", async () => {
      // Arrange
      const password = "CurrentPassword123";

      // Mock getUser (user is logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock signInWithPassword (password verification)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock topics deletion (succeeds)
      mockTopicsQuery.eq.mockResolvedValue({ error: null });

      // Mock signOut (succeeds)
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      // Act
      await expect(service.deleteAccount(userId, password)).resolves.toBeUndefined();

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validEmail,
        password,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith("topics");
      expect(mockTopicsQuery.delete).toHaveBeenCalledTimes(1);
      expect(mockTopicsQuery.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthError when user is not logged in", async () => {
      // Arrange
      const password = "CurrentPassword123";

      // Mock getUser (user not logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      // Act & Assert
      await expect(service.deleteAccount(userId, password)).rejects.toThrow(AuthError);
      await expect(service.deleteAccount(userId, password)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "Musisz być zalogowany",
        statusCode: 403,
      });
    });

    it("should throw AuthError when user has no email", async () => {
      // Arrange
      const password = "CurrentPassword123";

      // Mock getUser (user without email)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { ...mockUser, email: undefined } },
        error: null,
      });

      // Act & Assert
      await expect(service.deleteAccount(userId, password)).rejects.toThrow(AuthError);
      await expect(service.deleteAccount(userId, password)).rejects.toMatchObject({
        code: "NO_EMAIL",
        message: "Email użytkownika nie jest dostępny",
        statusCode: 400,
      });
    });

    it("should throw AuthError when password is incorrect", async () => {
      // Arrange
      const wrongPassword = "WrongPassword123";

      // Mock getUser (user is logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock signInWithPassword (password verification fails)
      const supabaseError = {
        message: "Invalid login credentials",
        status: 400,
      };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.deleteAccount(userId, wrongPassword)).rejects.toThrow(AuthError);
      await expect(service.deleteAccount(userId, wrongPassword)).rejects.toMatchObject({
        code: "INVALID_PASSWORD",
        message: "Hasło jest nieprawidłowe",
        statusCode: 401,
      });
    });

    it("should throw AuthError when topics deletion fails", async () => {
      // Arrange
      const password = "CurrentPassword123";

      // Mock getUser (user is logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock signInWithPassword (password verification)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock topics deletion (fails)
      const deleteError = { message: "Database error", code: "PGRST116" };
      mockTopicsQuery.eq.mockResolvedValue({ error: deleteError });

      // Act & Assert
      await expect(service.deleteAccount(userId, password)).rejects.toThrow(AuthError);
      await expect(service.deleteAccount(userId, password)).rejects.toMatchObject({
        code: "DELETE_DATA_ERROR",
        message: "Błąd podczas usuwania danych użytkownika",
        statusCode: 500,
      });
    });

    it("should still sign out user even if signOut fails", async () => {
      // Arrange
      const password = "CurrentPassword123";

      // Mock getUser (user is logged in)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock signInWithPassword (password verification)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock topics deletion (succeeds)
      mockTopicsQuery.eq.mockResolvedValue({ error: null });

      // Mock signOut (fails but doesn't throw)
      const signOutError = { message: "Sign out failed" };
      mockSupabase.auth.signOut.mockResolvedValue({
        error: signOutError,
      });

      // Act & Assert - should not throw because data deletion succeeded
      await expect(service.deleteAccount(userId, password)).resolves.toBeUndefined();

      // Verify signOut was still called
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("getCurrentUser", () => {
    it("should return user when authenticated", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.getCurrentUser();

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it("should return null when not authenticated", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      // Act
      const result = await service.getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it("should return null when getUser fails", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Network error" },
      });

      // Act
      const result = await service.getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("mapSupabaseError", () => {
    // Note: Using 'as any' to access private methods for testing purposes
    it("should map 'Invalid login credentials' to INVALID_CREDENTIALS", () => {
      // Arrange
      const supabaseError = {
        message: "Invalid login credentials",
        status: 400,
      };

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).mapSupabaseError(supabaseError);

      // Assert
      expect(result).toBeInstanceOf(AuthError);
      expect(result).toMatchObject({
        code: "INVALID_CREDENTIALS",
        message: "Nieprawidłowy email lub hasło",
        statusCode: 401,
      });
    });

    it("should map 'Email not confirmed' to EMAIL_NOT_CONFIRMED", () => {
      // Arrange
      const supabaseError = {
        message: "Email not confirmed",
        status: 400,
      };

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).mapSupabaseError(supabaseError);

      // Assert
      expect(result).toBeInstanceOf(AuthError);
      expect(result).toMatchObject({
        code: "EMAIL_NOT_CONFIRMED",
        message: "Potwierdź swój adres email aby się zalogować",
        statusCode: 403,
      });
    });

    it("should map 'already registered' messages to USER_EXISTS", () => {
      // Arrange
      const supabaseError1 = {
        message: "User already registered",
        status: 400,
      };
      const supabaseError2 = {
        message: "Email has already been registered",
        status: 400,
      };

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result1 = (service as any).mapSupabaseError(supabaseError1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result2 = (service as any).mapSupabaseError(supabaseError2);

      // Assert
      expect(result1).toMatchObject({
        code: "USER_EXISTS",
        message: "Ten adres email jest już zarejestrowany",
        statusCode: 409,
      });
      expect(result2).toMatchObject({
        code: "USER_EXISTS",
        message: "Ten adres email jest już zarejestrowany",
        statusCode: 409,
      });
    });

    it("should map weak password messages to WEAK_PASSWORD", () => {
      // Arrange
      const supabaseError = {
        message: "Password should be at least 6 characters",
        status: 400,
      };

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).mapSupabaseError(supabaseError);

      // Assert
      expect(result).toBeInstanceOf(AuthError);
      expect(result).toMatchObject({
        code: "WEAK_PASSWORD",
        message: "Hasło jest zbyt słabe",
        statusCode: 400,
      });
    });

    it("should map status 429 to RATE_LIMIT", () => {
      // Arrange
      const supabaseError = {
        message: "Too many requests",
        status: 429,
      };

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).mapSupabaseError(supabaseError);

      // Assert
      expect(result).toBeInstanceOf(AuthError);
      expect(result).toMatchObject({
        code: "RATE_LIMIT",
        message: "Zbyt wiele prób. Spróbuj ponownie za kilka minut",
        statusCode: 429,
      });
    });

    it("should map unknown errors to UNKNOWN_ERROR", () => {
      // Arrange
      const supabaseError = {
        message: "Some unexpected error",
        status: 418, // I'm a teapot
      };

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).mapSupabaseError(supabaseError);

      // Assert
      expect(result).toBeInstanceOf(AuthError);
      expect(result).toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Some unexpected error",
        statusCode: 418,
      });
    });

    it("should handle errors without status code", () => {
      // Arrange
      const supabaseError = {
        message: "Network error",
      };

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).mapSupabaseError(supabaseError);

      // Assert
      expect(result).toBeInstanceOf(AuthError);
      expect(result).toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Network error",
        statusCode: 500,
      });
    });
  });

  describe("getBaseUrl", () => {
    // Note: Using 'as any' to access private methods for testing purposes
    it("should return window.location.origin in browser environment", () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = { location: { origin: "http://localhost:4321" } };

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).getBaseUrl();

      // Assert
      expect(result).toBe("http://localhost:4321");
    });

    it("should return SITE_URL environment variable in server environment", () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).getBaseUrl();

      // Assert
      expect(result).toBe("http://localhost:3000");
    });

    it("should return default URL when window and SITE_URL are not available", () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;
      const originalEnv = process.env.SITE_URL;
      delete process.env.SITE_URL;

      try {
        // Act
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (service as any).getBaseUrl();

        // Assert
        expect(result).toBe("http://localhost:4321");
      } finally {
        // Restore environment
        process.env.SITE_URL = originalEnv;
      }
    });
  });
});
