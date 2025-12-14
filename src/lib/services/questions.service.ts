/**
 * Questions Service
 *
 * Handles business logic for question management and AI generation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GeneratedQuestionDto, ChatMessage, ResponseFormat, QuestionDto, QuestionStatus } from "../../types";
import type { GenerateQuestionsInput, UpdateQuestionInput } from "../validators/questions.validators";
import { OpenRouterService } from "./openrouter.service";

/**
 * Service class for managing questions
 */
export class QuestionsService {
  private openRouterService: OpenRouterService;

  constructor(private supabase: SupabaseClient<Database>) {
    // Initialize OpenRouter service with API key from environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
    this.openRouterService = new OpenRouterService(apiKey);
  }

  /**
   * Verifies that a topic exists and belongs to the specified user
   *
   * @param topicId - The ID of the topic to verify
   * @param userId - The ID of the user who should own the topic
   * @returns Promise resolving to topic name if topic exists and belongs to user
   * @throws Error if topic doesn't exist or doesn't belong to user
   */
  async verifyTopicOwnership(topicId: number, userId: string): Promise<string> {
    const { data: topic, error } = await this.supabase
      .from("topics")
      .select("id, user_id, name")
      .eq("id", topicId)
      .eq("user_id", userId)
      .single();

    if (error || !topic) {
      throw new Error("Topic not found or doesn't belong to user");
    }

    return topic.name;
  }

  /**
   * Generates questions using AI and saves them to the database
   *
   * @param userId - The ID of the authenticated user
   * @param data - Validated question generation parameters
   * @returns Promise resolving to array of generated questions
   * @throws Error if generation or database operation fails
   */
  async generateQuestions(userId: string, data: GenerateQuestionsInput): Promise<GeneratedQuestionDto[]> {
    // Step 1: Verify topic ownership and get topic name
    const topicName = await this.verifyTopicOwnership(data.topic_id, userId);

    // Step 2: Generate questions using AI
    const generatedContents = await this.callAIService(data, topicName);

    // Step 3: Batch insert questions into database
    const questionsToInsert = generatedContents.map((content) => ({
      user_id: userId,
      topic_id: data.topic_id,
      age_group: data.age_group,
      content,
      status: "pending" as const,
    }));

    const { data: insertedQuestions, error } = await this.supabase
      .from("questions")
      .insert(questionsToInsert)
      .select("id, content, status");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error inserting questions:", error);
      throw new Error("Failed to save generated questions");
    }

    if (!insertedQuestions || insertedQuestions.length === 0) {
      throw new Error("No questions were returned after creation");
    }

    // Return as GeneratedQuestionDto[]
    return insertedQuestions.map((q) => ({
      id: q.id,
      content: q.content,
      status: q.status as "pending",
    }));
  }

  /**
   * Gets a paginated list of questions for a user with optional filtering
   *
   * @param userId - The ID of the authenticated user
   * @param filters - Optional filters for status, age_group, topic_id
   * @param pagination - Pagination parameters
   * @returns Promise resolving to paginated questions list
   */
  async getQuestions(
    userId: string,
    filters: { status?: QuestionStatus[]; age_group?: number; topic_id?: number } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 10 }
  ): Promise<{ data: QuestionDto[]; pagination: { page: number; limit: number; total: number } }> {
    let query = this.supabase
      .from("questions")
      .select("*, topics(name)", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

    if (filters.age_group) {
      query = query.eq("age_group", filters.age_group);
    }

    if (filters.topic_id) {
      query = query.eq("topic_id", filters.topic_id);
    }

    // Apply pagination
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching questions:", error);
      throw new Error("Failed to fetch questions");
    }

    return {
      data: data || [],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: count || 0,
      },
    };
  }

  /**
   * Updates a question's status or content
   *
   * @param userId - The ID of the authenticated user
   * @param questionId - The ID of the question to update
   * @param data - The update data (status and/or content)
   * @returns Promise resolving to the updated question
   * @throws Error if question doesn't exist, doesn't belong to user, or update fails
   */
  async updateQuestion(userId: string, questionId: number, data: UpdateQuestionInput): Promise<QuestionDto> {
    // First verify the question exists and belongs to the user
    const { data: existingQuestion, error: fetchError } = await this.supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingQuestion) {
      throw new Error("Question not found or doesn't belong to user");
    }

    // Prepare update data
    const updateData: { status?: QuestionStatus; content?: string; updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.content) {
      updateData.content = data.content;
    }

    // Update the question
    const { data: updatedQuestion, error: updateError } = await this.supabase
      .from("questions")
      .update(updateData)
      .eq("id", questionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError || !updatedQuestion) {
      // eslint-disable-next-line no-console
      console.error("Error updating question:", updateError);
      throw new Error("Failed to update question");
    }

    return updatedQuestion;
  }

  /**
   * Calls external AI service (Openrouter.ai) to generate question content
   *
   * @param data - Question generation parameters
   * @param topicName - Name of the topic for better context
   * @returns Promise resolving to array of question content strings
   * @throws Error if AI service call fails
   * @private
   */
  private async callAIService(data: GenerateQuestionsInput, topicName: string): Promise<string[]> {
    // Prepare chat messages
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: this.buildSystemPrompt(),
      },
      {
        role: "user",
        content: this.buildUserPrompt(data, topicName),
      },
    ];

    // Define response format schema
    const responseFormat: ResponseFormat = {
      type: "json_schema",
      json_schema: {
        name: "GeneratedQuestions",
        strict: true,
        schema: {
          questions: "array",
        },
      },
    };

    try {
      // Call OpenRouter service
      const response = await this.openRouterService.sendChat(messages, responseFormat);
      // Parse and validate response
      if (!response || typeof response !== "object" || !("questions" in response)) {
        throw new Error("Invalid response format from AI service");
      }

      const questions = (response as { questions: unknown }).questions;

      if (!Array.isArray(questions)) {
        throw new Error("Questions field is not an array");
      }

      // Validate that we got the expected number of questions
      if (questions.length === 0) {
        throw new Error("AI service returned no questions");
      }

      // Ensure all questions are strings
      const validQuestions = questions.filter((q): q is string => typeof q === "string" && q.trim().length > 0);

      if (validQuestions.length === 0) {
        throw new Error("AI service returned no valid question strings");
      }

      return validQuestions;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error calling AI service:", error);
      throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Builds the system prompt for AI question generation
   *
   * @private
   * @returns System prompt string
   */
  private buildSystemPrompt(): string {
    return `Jesteś asystentem edukacyjnym specjalizującym się w tworzeniu pytań dla dzieci.

Twoim zadaniem jest generowanie pytań edukacyjnych dopasowanych do wieku dziecka i określonego tematu.

Zasady tworzenia pytań:
1. Pytania muszą być odpowiednie dla podanej grupy wiekowej
2. Używaj prostego, zrozumiałego języka dostosowanego do wieku
3. Pytania powinny być konkretne i jednoznaczne
4. Unikaj pytań tak/nie - preferuj pytania otwarte
5. Pytania powinny zachęcać do myślenia i rozwijać ciekawość
6. Dla młodszych dzieci (3-6 lat): krótkie, proste pytania o podstawowe rzeczy
7. Dla starszych dzieci (7-12 lat): pytania mogą być bardziej złożone i wymagać głębszego myślenia
8. Wszystkie pytania muszą być w języku polskim
9. Każde pytanie powinno kończyć się znakiem zapytania

Zwróć odpowiedź w formacie JSON z polem "questions" zawierającym tablicę pytań.`;
  }

  /**
   * Builds the user prompt for AI question generation
   *
   * @private
   * @param data - Question generation parameters
   * @param topicName - Name of the topic
   * @returns User prompt string
   */
  private buildUserPrompt(data: GenerateQuestionsInput, topicName: string): string {
    return `Wygeneruj ${data.count} pytań edukacyjnych na następujący temat: "${topicName}"

Grupa wiekowa: ${data.age_group} lat

Wymagania:
- Dokładnie ${data.count} pytań
- Pytania dostosowane do poziomu rozwoju dzieci w wieku ${data.age_group} lat
- Pytania związane z tematem: "${topicName}"
- Format: tablica stringów w JSON

Przykład odpowiedzi:
{
  "questions": [
    "Pierwsze pytanie?",
    "Drugie pytanie?",
    "Trzecie pytanie?"
  ]
}`;
  }
}
