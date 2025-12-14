/**
 * POST /api/questions/generate
 * Generates AI questions for a specific age group and topic
 *
 * @body { age_group: number, topic_id: number, count: number } - Generation parameters
 * @returns 201 - Array of generated questions with id, content, and status
 * @returns 400 - Validation error
 * @returns 401 - Unauthorized (not implemented yet - using default user)
 * @returns 404 - Topic not found or doesn't belong to user
 * @returns 500 - Server error (AI service or database error)
 */

import type { APIRoute } from "astro";
import { QuestionsService } from "../../../lib/services/questions.service";
import { generateQuestionsSchema } from "../../../lib/validators/questions.validators";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse and validate request body
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

    // Step 2: Validate request data using Zod schema
    const validatedData = generateQuestionsSchema.parse(body);

    // Step 3: Create service instance and generate questions
    const questionsService = new QuestionsService(locals.supabase);
    const questions = await questionsService.generateQuestions(locals.user.id, validatedData);

    // Step 4: Return success response with 201 Created
    return new Response(JSON.stringify(questions), {
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

    // Handle topic not found or ownership errors
    if (error instanceof Error && error.message.includes("not found")) {
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

    // Handle other errors (AI service, database, etc.)
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/questions/generate:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to generate questions",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
