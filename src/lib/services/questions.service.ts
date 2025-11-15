/**
 * Questions Service
 *
 * Handles business logic for question management and AI generation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GeneratedQuestionDto } from "../../types";
import type { GenerateQuestionsInput } from "../validators/questions.validators";

/**
 * Service class for managing questions
 */
export class QuestionsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Verifies that a topic exists and belongs to the specified user
   *
   * @param topicId - The ID of the topic to verify
   * @param userId - The ID of the user who should own the topic
   * @returns Promise resolving to true if topic exists and belongs to user
   * @throws Error if topic doesn't exist or doesn't belong to user
   */
  async verifyTopicOwnership(topicId: number, userId: string): Promise<boolean> {
    const { data: topic, error } = await this.supabase
      .from("topics")
      .select("id, user_id")
      .eq("id", topicId)
      .eq("user_id", userId)
      .single();

    if (error || !topic) {
      throw new Error("Topic not found or doesn't belong to user");
    }

    return true;
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
    // eslint-disable-next-line no-console
    console.log("Generating questions:", { userId, data });

    // Step 1: Verify topic ownership
    await this.verifyTopicOwnership(data.topic_id, userId);

    // Step 2: Generate questions using AI
    const generatedContents = await this.callAIService(data);

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

    // eslint-disable-next-line no-console
    console.log("Questions generated successfully:", insertedQuestions.length);

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
   * @returns Promise resolving to array of question content strings
   * @throws Error if AI service call fails
   * @private
   */
  private async callAIService(data: GenerateQuestionsInput): Promise<string[]> {
    // TODO: Implement actual Openrouter.ai integration
    // For now, return mock data for testing
    // eslint-disable-next-line no-console
    console.log("Calling AI service with:", data);

    // Placeholder implementation - will be replaced with actual AI service
    const mockQuestions: string[] = [];
    for (let i = 0; i < data.count; i++) {
      mockQuestions.push(`Pytanie ${i + 1} dla grupy wiekowej ${data.age_group} na temat ID ${data.topic_id}`);
    }

    // eslint-disable-next-line no-console
    console.log("AI service returned:", mockQuestions.length, "questions");

    return mockQuestions;
  }
}
