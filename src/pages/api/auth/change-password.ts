/**
 * Change Password Endpoint
 * POST /api/auth/change-password
 *
 * Allows authenticated users to change their password.
 * Requires current password for verification.
 */

import type { APIRoute } from "astro";
import { changePasswordSchema } from "../../../lib/validators/auth.validators";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { AuthSuccessDto, AuthErrorDto } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      const errorResponse: AuthErrorDto = {
        error: "Unauthorized",
        message: "Musisz być zalogowany aby zmienić hasło",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod
    const validationResult = changePasswordSchema.safeParse(body);

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

    const { currentPassword, newPassword } = validationResult.data;

    // Initialize auth service
    const authService = new AuthService(locals.supabase);

    // Attempt password change
    await authService.changePassword(locals.user.id, currentPassword, newPassword);

    // Return success response
    const successResponse: AuthSuccessDto = {
      message: "Hasło zostało zmienione pomyślnie",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle AuthError
    if (error instanceof AuthError) {
      const errorResponse: AuthErrorDto = {
        error: error.code,
        message: error.message,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse: AuthErrorDto = {
      error: "Internal server error",
      message: "Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
