import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  deleteAccountSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from "@/lib/validators/auth.validators";

/**
 * Test suite for authentication validators
 *
 * Tests cover all Zod schemas used in authentication endpoints,
 * including happy paths, error conditions, and edge cases.
 */
describe("Auth Validators", () => {
  describe("loginSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid email and password", () => {
        // Arrange
        const validInput: LoginInput = {
          email: "user@example.com",
          password: "password123",
        };

        // Act
        const result = loginSchema.safeParse(validInput);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInput);
      });

      it("should accept email with subdomain", () => {
        const validInput: LoginInput = {
          email: "user@sub.example.com",
          password: "password",
        };

        const result = loginSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        expect(result.data.email).toBe("user@sub.example.com");
      });

      it("should accept password with minimum length", () => {
        const validInput: LoginInput = {
          email: "user@example.com",
          password: "a", // minimum 1 character
        };

        const result = loginSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        expect(result.data.password).toBe("a");
      });
    });

    describe("invalid inputs", () => {
      it("should reject invalid email format", () => {
        const invalidInputs = [
          { email: "invalid-email", password: "password123" },
          { email: "user@", password: "password123" },
          { email: "@example.com", password: "password123" },
          { email: "user..double@example.com", password: "password123" },
          { email: "user example.com", password: "password123" },
        ];

        invalidInputs.forEach((input) => {
          const result = loginSchema.safeParse(input);
          expect(result.success).toBe(false);
          expect(result.error?.issues[0].message).toBe("Nieprawidłowy format email");
        });
      });

      it("should reject empty password", () => {
        const invalidInput: Partial<LoginInput> = {
          email: "user@example.com",
          password: "",
        };

        const result = loginSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Hasło jest wymagane");
      });

      it("should reject missing email", () => {
        const invalidInput = {
          password: "password123",
        };

        const result = loginSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("email");
      });

      it("should reject missing password", () => {
        const invalidInput = {
          email: "user@example.com",
        };

        const result = loginSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("password");
      });
    });

    describe("edge cases", () => {
      it("should handle null values", () => {
        const invalidInput = {
          email: null,
          password: null,
        };

        const result = loginSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(2);
      });

      it("should handle undefined values", () => {
        const invalidInput = {};

        const result = loginSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(2);
      });
    });
  });

  describe("registerSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid email and strong password", () => {
        const validInputs: RegisterInput[] = [
          {
            email: "user@example.com",
            password: "Password123",
          },
          {
            email: "test.user+tag@example.co.uk",
            password: "StrongPass123",
          },
        ];

        validInputs.forEach((input) => {
          const result = registerSchema.safeParse(input);
          expect(result.success).toBe(true);
          expect(result.data).toEqual(input);
        });
      });
    });

    describe("invalid inputs", () => {
      it("should reject invalid email format", () => {
        const invalidInput: RegisterInput = {
          email: "invalid-email",
          password: "Password123",
        };

        const result = registerSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Nieprawidłowy format email");
      });

      it("should reject password shorter than 8 characters", () => {
        const invalidInput: RegisterInput = {
          email: "user@example.com",
          password: "Pass123",
        };

        const result = registerSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Hasło musi mieć co najmniej 8 znaków");
      });

      it("should reject password without uppercase letter", () => {
        const invalidInput: RegisterInput = {
          email: "user@example.com",
          password: "password123",
        };

        const result = registerSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Hasło musi zawierać wielką literę");
      });

      it("should reject password without lowercase letter", () => {
        const invalidInput: RegisterInput = {
          email: "user@example.com",
          password: "PASSWORD123",
        };

        const result = registerSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Hasło musi zawierać małą literę");
      });

      it("should reject password without digit", () => {
        const invalidInput: RegisterInput = {
          email: "user@example.com",
          password: "PasswordABC",
        };

        const result = registerSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Hasło musi zawierać cyfrę");
      });

      it("should reject password with multiple validation errors", () => {
        const invalidInput: RegisterInput = {
          email: "user@example.com",
          password: "weak",
        };

        const result = registerSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3); // length, uppercase, digit (lowercase is present)
        expect(result.error?.issues.map((issue) => issue.message)).toEqual(
          expect.arrayContaining([
            "Hasło musi mieć co najmniej 8 znaków",
            "Hasło musi zawierać wielką literę",
            "Hasło musi zawierać cyfrę",
          ])
        );
      });
    });
  });

  describe("forgotPasswordSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid email", () => {
        const validInputs: ForgotPasswordInput[] = [
          { email: "user@example.com" },
          { email: "test.email+tag@example.co.uk" },
        ];

        validInputs.forEach((input) => {
          const result = forgotPasswordSchema.safeParse(input);
          expect(result.success).toBe(true);
          expect(result.data).toEqual(input);
        });
      });
    });

    describe("invalid inputs", () => {
      it("should reject invalid email format", () => {
        const invalidInputs = [{ email: "invalid-email" }, { email: "user@" }, { email: "@example.com" }];

        invalidInputs.forEach((input) => {
          const result = forgotPasswordSchema.safeParse(input);
          expect(result.success).toBe(false);
          expect(result.error?.issues[0].message).toBe("Nieprawidłowy format email");
        });
      });

      it("should reject missing email", () => {
        const invalidInput = {};

        const result = forgotPasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("email");
      });
    });
  });

  describe("resetPasswordSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid token and strong password", () => {
        const validInput: ResetPasswordInput = {
          token: "valid-reset-token-123",
          password: "NewPassword123",
        };

        const result = resetPasswordSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInput);
      });
    });

    describe("invalid inputs", () => {
      it("should reject empty token", () => {
        const invalidInput: ResetPasswordInput = {
          token: "",
          password: "NewPassword123",
        };

        const result = resetPasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Token jest wymagany");
      });

      it("should reject weak password", () => {
        const invalidInput: ResetPasswordInput = {
          token: "valid-token",
          password: "weak",
        };

        const result = resetPasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3); // same password validation as register
        expect(result.error?.issues.map((issue) => issue.message)).toEqual(
          expect.arrayContaining([
            "Hasło musi mieć co najmniej 8 znaków",
            "Hasło musi zawierać wielką literę",
            "Hasło musi zawierać cyfrę",
          ])
        );
      });

      it("should reject missing token", () => {
        const invalidInput = {
          password: "NewPassword123",
        };

        const result = resetPasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("token");
      });

      it("should reject missing password", () => {
        const invalidInput = {
          token: "valid-token",
        };

        const result = resetPasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("password");
      });
    });
  });

  describe("changePasswordSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid current and new passwords", () => {
        const validInput: ChangePasswordInput = {
          currentPassword: "CurrentPass123",
          newPassword: "NewPassword456",
        };

        const result = changePasswordSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInput);
      });
    });

    describe("invalid inputs", () => {
      it("should reject empty current password", () => {
        const invalidInput: ChangePasswordInput = {
          currentPassword: "",
          newPassword: "NewPassword123",
        };

        const result = changePasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Aktualne hasło jest wymagane");
      });

      it("should reject weak new password", () => {
        const invalidInput: ChangePasswordInput = {
          currentPassword: "CurrentPass123",
          newPassword: "weak",
        };

        const result = changePasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3);
        expect(result.error?.issues.map((issue) => issue.message)).toEqual(
          expect.arrayContaining([
            "Hasło musi mieć co najmniej 8 znaków",
            "Hasło musi zawierać wielką literę",
            "Hasło musi zawierać cyfrę",
          ])
        );
      });

      it("should reject missing current password", () => {
        const invalidInput = {
          newPassword: "NewPassword123",
        };

        const result = changePasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("currentPassword");
      });

      it("should reject missing new password", () => {
        const invalidInput = {
          currentPassword: "CurrentPass123",
        };

        const result = changePasswordSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("newPassword");
      });
    });
  });

  describe("deleteAccountSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid password", () => {
        const validInput: DeleteAccountInput = {
          password: "CurrentPassword123",
        };

        const result = deleteAccountSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInput);
      });
    });

    describe("invalid inputs", () => {
      it("should reject empty password", () => {
        const invalidInput: DeleteAccountInput = {
          password: "",
        };

        const result = deleteAccountSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Hasło jest wymagane");
      });

      it("should reject missing password", () => {
        const invalidInput = {};

        const result = deleteAccountSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("password");
      });
    });
  });

  describe("type exports", () => {
    it("should export all required types", () => {
      // Test that types can be used (TypeScript compilation check)
      const loginInput: LoginInput = { email: "test@example.com", password: "pass" };
      const registerInput: RegisterInput = { email: "test@example.com", password: "Password123" };
      const forgotInput: ForgotPasswordInput = { email: "test@example.com" };
      const resetInput: ResetPasswordInput = { token: "token", password: "Password123" };
      const changeInput: ChangePasswordInput = { currentPassword: "old", newPassword: "Password123" };
      const deleteInput: DeleteAccountInput = { password: "pass" };

      expect(loginInput).toBeDefined();
      expect(registerInput).toBeDefined();
      expect(forgotInput).toBeDefined();
      expect(resetInput).toBeDefined();
      expect(changeInput).toBeDefined();
      expect(deleteInput).toBeDefined();
    });
  });
});
