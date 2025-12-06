/**
 * Topics API Endpoints
 *
 * GET /api/topics - Retrieves all topics for the authenticated user
 * POST /api/topics - Creates a new topic for the authenticated user
 */

import type { APIRoute } from "astro";
import { TopicsService } from "../../../lib/services/topics.service";
import { createTopicSchema } from "../../../lib/validators/topics.validators";
import { z } from "zod";

export const prerender = false;

/**
 * GET /api/topics
 * Retrieves all topics for the authenticated user
 *
 * @returns 200 - Array of topics
 * @returns 401 - Unauthorized
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 1. Get user from locals (auth)
    const userId = locals.user.id;

    // 2. Create service instance and fetch topics
    const topicsService = new TopicsService(locals.supabase);
    const topics = await topicsService.getTopics(userId);

    // 3. Return success response
    return new Response(
      JSON.stringify({
        data: topics,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle errors
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/topics:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to fetch topics",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/topics
 * Creates a new topic for the authenticated user
 *
 * @body { name: string } - Topic name (1-100 chars)
 * @returns 201 - Created topic object
 * @returns 400 - Validation error
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // 1. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = createTopicSchema.parse(body);

    const userId = locals.user.id;

    // 3. Create service instance and call method
    const topicsService = new TopicsService(locals.supabase);
    const topic = await topicsService.createTopic(userId, validatedData);

    // 4. Return success response
    return new Response(JSON.stringify(topic), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/topics:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to create topic",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
