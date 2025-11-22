/**
 * Register Endpoint
 * POST /api/auth/register
 *
 * Creates a new user account with email and password.
 * Supabase will send a confirmation email to verify the account.
 * User cannot login until email is confirmed.
 */

import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validators/auth.validators";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { AuthSuccessDto, AuthErrorDto } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod
    const validationResult = registerSchema.safeParse(body);

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

    const { email, password } = validationResult.data;

    // Initialize auth service
    const authService = new AuthService(locals.supabase);

    // Attempt registration
    await authService.register(email, password);

    // Return success response
    // Note: We don't set cookies here because the user needs to confirm their email first
    const successResponse: AuthSuccessDto = {
      message: "Konto utworzone! Sprawdź swoją skrzynkę email i potwierdź adres, aby się zalogować.",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 201,
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
      message: "Wystąpił błąd serwera. Spróbuj ponownie",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
