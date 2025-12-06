/**
 * Account Management Endpoint
 * DELETE /api/auth/account
 *
 * Allows authenticated users to delete their account.
 * Requires password confirmation for security.
 */

import type { APIRoute } from "astro";
import { deleteAccountSchema } from "../../../lib/validators/auth.validators";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { AuthSuccessDto, AuthErrorDto } from "../../../types";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      const errorResponse: AuthErrorDto = {
        error: "Unauthorized",
        message: "Musisz być zalogowany aby usunąć konto",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod
    const validationResult = deleteAccountSchema.safeParse(body);

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

    const { password } = validationResult.data;

    // Initialize auth service
    const authService = new AuthService(locals.supabase);

    // Attempt account deletion
    await authService.deleteAccount(locals.user.id, password);

    // Clear authentication cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    // Return success response
    const successResponse: AuthSuccessDto = {
      message: "Konto zostało usunięte pomyślnie",
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
      message: "Wystąpił błąd podczas usuwania konta. Spróbuj ponownie",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
