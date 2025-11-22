/**
 * Logout Endpoint
 * POST /api/auth/logout
 *
 * Logs out the current user by invalidating their session
 * and clearing authentication cookies.
 */

import type { APIRoute } from "astro";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { AuthSuccessDto, AuthErrorDto } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // Check if user is logged in
    if (!locals.user) {
      const errorResponse: AuthErrorDto = {
        error: "Not authenticated",
        message: "Musisz być zalogowany aby się wylogować",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize auth service
    const authService = new AuthService(locals.supabase);

    // Attempt logout
    await authService.logout();

    // Clear authentication cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    // Return success response
    const successResponse: AuthSuccessDto = {
      message: "Wylogowano pomyślnie",
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
      message: "Wystąpił błąd podczas wylogowania. Spróbuj ponownie",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
