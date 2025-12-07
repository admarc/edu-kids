/**
 * Questions Service
 *
 * Handles business logic for question management and AI generation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GeneratedQuestionDto, ChatMessage, ResponseFormat } from "../../types";
import type { GenerateQuestionsInput } from "../validators/questions.validators";
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
