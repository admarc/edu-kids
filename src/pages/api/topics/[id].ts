/**
 * Topic Item API Endpoints
 *
 * PUT /api/topics/:id - Updates an existing topic
 * DELETE /api/topics/:id - Deletes a topic
 */

import type { APIRoute } from "astro";
import { TopicsService } from "../../../lib/services/topics.service";
import { updateTopicSchema } from "../../../lib/validators/topics.validators";
import { z } from "zod";

export const prerender = false;

/**
 * PUT /api/topics/:id
 * Updates an existing topic
 *
 * @param id - Topic ID
 * @body { name: string } - Updated topic name (1-100 chars)
 * @returns 200 - Updated topic object
 * @returns 400 - Validation error
 * @returns 404 - Topic not found or doesn't belong to user
 * @returns 500 - Server error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    // 1. Parse and validate topic ID
    const topicId = parseInt(params.id || "", 10);
    if (isNaN(topicId)) {
      return new Response(
        JSON.stringify({
          error: "Invalid ID",
          message: "Topic ID must be a valid number",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse and validate request body
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

    const validatedData = updateTopicSchema.parse(body);

    // 3. Get user from locals (auth)
    const userId = locals.user.id;

    // 4. Create service instance and update topic
    const topicsService = new TopicsService(locals.supabase);
    const topic = await topicsService.updateTopic(userId, topicId, validatedData);

    // 5. Check if topic was found
    if (!topic) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Topic not found or doesn't belong to user",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Return success response
    return new Response(JSON.stringify(topic), {
      status: 200,
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
    console.error("Error in PUT /api/topics/:id:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to update topic",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/topics/:id
 * Deletes a topic
 *
 * @param id - Topic ID
 * @returns 200 - Success response
 * @returns 404 - Topic not found or doesn't belong to user
 * @returns 500 - Server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // 1. Parse and validate topic ID
    const topicId = parseInt(params.id || "", 10);
    if (isNaN(topicId)) {
      return new Response(
        JSON.stringify({
          error: "Invalid ID",
          message: "Topic ID must be a valid number",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Get user from locals (auth)
    const userId = locals.user.id;

    // 3. Create service instance and delete topic
    const topicsService = new TopicsService(locals.supabase);
    const deleted = await topicsService.deleteTopic(userId, topicId);

    // 4. Check if topic was found
    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Topic not found or doesn't belong to user",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5. Return success response
    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle errors
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/topics/:id:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to delete topic",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
