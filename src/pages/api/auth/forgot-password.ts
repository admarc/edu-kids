/**
 * Forgot Password Endpoint
 * POST /api/auth/forgot-password
 *
 * Sends password reset email to user.
 * Always returns success for security (doesn't reveal if email exists).
 */

import type { APIRoute } from "astro";
import { forgotPasswordSchema } from "../../../lib/validators/auth.validators";
import { AuthService } from "../../../lib/services/auth.service";
import type { AuthSuccessDto, AuthErrorDto } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      const errorDetails = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      const errorResponse: AuthErrorDto = {
        error: "Validation error",
        message: "Nieprawidłowe dane wejściowe",
        details: errorDetails,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email } = validationResult.data;

    // Initialize auth service
    const authService = new AuthService(locals.supabase);

    try {
      // Attempt to send password reset email
      await authService.sendPasswordResetEmail(email);
    } catch {
      // For security reasons, we don't reveal if the email exists or not
      // We log the error but still return success to the user
    }

    // Always return success for security (don't reveal if email exists)
    const successResponse: AuthSuccessDto = {
      message: "Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Handle unexpected errors
    const errorResponse: AuthErrorDto = {
      error: "Internal server error",
      message: "Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
