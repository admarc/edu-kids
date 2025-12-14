/**
 * Questions API Endpoints
 *
 * GET /api/questions - Retrieves questions for the authenticated user with filtering
 */

import type { APIRoute } from "astro";
import { QuestionsService } from "../../../lib/services/questions.service";
import { z } from "zod";

// Query parameters schema for GET /api/questions
const getQuestionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  status: z.string().optional(), // Comma-separated statuses: "pending,accepted"
  age_group: z.coerce.number().optional(),
  topic_id: z.coerce.number().optional(),
  sort_by: z.enum(["created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const prerender = false;

/**
 * GET /api/questions
 * Retrieves questions for the authenticated user with optional filtering
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 50)
 * @query status - Comma-separated status filters (e.g., "pending,accepted")
 * @query age_group - Filter by age group
 * @query topic_id - Filter by topic ID
 * @query sort_by - Sort field (default: created_at)
 * @query order - Sort order (default: desc)
 * @returns 200 - Paginated questions list
 * @returns 400 - Validation error
 * @returns 401 - Unauthorized
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Check authentication
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

    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    let validatedQuery;
    try {
      validatedQuery = getQuestionsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation error",
            message: "Invalid query parameters",
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
      throw error;
    }

    // Step 3: Parse status parameter (comma-separated)
    let statusFilters: ("pending" | "accepted" | "rejected")[] | undefined;
    if (validatedQuery.status) {
      const statuses = validatedQuery.status.split(",").filter((s) => s.trim());
      // Validate each status
      const validStatuses = ["pending", "accepted", "rejected"] as const;
      const filteredStatuses = statuses.filter((s) =>
        validStatuses.includes(s as "pending" | "accepted" | "rejected")
      ) as ("pending" | "accepted" | "rejected")[];
      if (filteredStatuses.length > 0) {
        statusFilters = filteredStatuses;
      }
    }

    // Step 4: Create service instance and fetch questions
    const questionsService = new QuestionsService(locals.supabase);
    const result = await questionsService.getQuestions(
      locals.user.id,
      {
        status: statusFilters,
        age_group: validatedQuery.age_group,
        topic_id: validatedQuery.topic_id,
      },
      {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
      }
    );

    // Step 5: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/questions:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to fetch questions",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
