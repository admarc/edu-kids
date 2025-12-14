/**
 * PATCH /api/questions/[id]
 * Updates a question's status or content
 *
 * @param id - Question ID from URL path
 * @body { status?: "pending" | "accepted" | "rejected", content?: string } - Update parameters
 * @returns 200 - Updated question data
 * @returns 400 - Validation error
 * @returns 401 - Unauthorized
 * @returns 404 - Question not found or doesn't belong to user
 * @returns 500 - Server error
 */

import type { APIRoute } from "astro";
import { QuestionsService } from "../../../lib/services/questions.service";
import { updateQuestionSchema } from "../../../lib/validators/questions.validators";
import { z } from "zod";

export const prerender = false;

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  try {
    // Step 1: Validate question ID from URL
    const questionId = parseInt(params.id as string);
    if (isNaN(questionId) || questionId <= 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid ID",
          message: "Question ID must be a positive integer",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Check authentication
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

    // Step 3: Parse and validate request body
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

    // Step 4: Validate request data using Zod schema
    const validatedData = updateQuestionSchema.parse(body);

    // Step 5: Create service instance and update question
    const questionsService = new QuestionsService(locals.supabase);
    const updatedQuestion = await questionsService.updateQuestion(locals.user.id, questionId, validatedData);

    // Step 6: Return success response
    return new Response(JSON.stringify(updatedQuestion), {
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

    // Handle question not found errors
    if (error instanceof Error && error.message.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Question not found or doesn't belong to user",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/questions/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to update question",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
