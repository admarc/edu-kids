/**
 * Login Endpoint
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Sets HTTP-only cookies with session tokens on success.
 */

import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/validators/auth.validators";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { AuthResponseDto, AuthErrorDto } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod
    const validationResult = loginSchema.safeParse(body);

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

    // Attempt login
    const session = await authService.login(email, password);

    // Set HTTP-only cookies with session tokens
    cookies.set("sb-access-token", session.access_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    cookies.set("sb-refresh-token", session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Return success response
    const successResponse: AuthResponseDto = {
      message: "Zalogowano pomyślnie",
      user: {
        id: session.user.id,
        email: session.user.email || "",
        email_confirmed_at: session.user.email_confirmed_at,
        created_at: session.user.created_at,
      },
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
      message: "Wystąpił błąd serwera. Spróbuj ponownie",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
