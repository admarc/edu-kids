import { defineMiddleware } from "astro:middleware";
import type { User } from "@supabase/supabase-js";

import { supabaseClient } from "../db/supabase.client.ts";

/**
 * List of public paths (accessible without authentication)
 */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/confirm", // Callback endpoint for email confirmation
];

/**
 * List of public API paths (no authentication required)
 */
const PUBLIC_API_PATHS = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

/**
 * List of authenticated API paths (user must be logged in, but no redirect)
 * These endpoints handle authentication checks internally
 */
const AUTH_API_PATHS = ["/api/auth/logout", "/api/auth/change-password", "/api/auth/account"];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    PUBLIC_API_PATHS.some((path) => pathname.startsWith(path)) ||
    AUTH_API_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_") ||
    pathname.includes(".")
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect, locals } = context;
  const pathname = new URL(request.url).pathname;

  // 1. Initialize Supabase client in locals
  locals.supabase = supabaseClient;

  // 2. Get session from cookies
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  let user: User | null = null;

  if (accessToken && refreshToken) {
    // Set session in Supabase client
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (session && !error) {
      user = session.user;

      // If token was refreshed, update cookies
      if (session.access_token !== accessToken) {
        cookies.set("sb-access-token", session.access_token, {
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
        });
      }

      if (session.refresh_token !== refreshToken) {
        cookies.set("sb-refresh-token", session.refresh_token, {
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }
    } else {
      // Token expired or invalid - delete cookies
      cookies.delete("sb-access-token", { path: "/" });
      cookies.delete("sb-refresh-token", { path: "/" });
    }
  }

  // 3. Store user in locals (available in endpoints and pages)
  locals.user = user;

  // 4. Handle redirects
  const isPublic = isPublicPath(pathname);

  if (!isPublic && !user) {
    // Protected page, no login → redirect to /login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return redirect(loginUrl.toString());
  }

  if (isPublic && user && ["/login", "/register"].includes(pathname)) {
    // User is logged in trying to access /login or /register → redirect to home
    return redirect("/");
  }

  // 5. Continue with request
  return next();
});
