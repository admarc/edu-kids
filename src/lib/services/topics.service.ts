/**
 * Topics Service
 *
 * Handles business logic for topic management
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { TopicDto } from "../../types";
import type { CreateTopicInput, UpdateTopicInput } from "../validators/topics.validators";

/**
 * Service class for managing topics
 */
export class TopicsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves all topics for a specific user
   *
   * @param userId - The ID of the authenticated user
   * @returns Promise resolving to an array of topics
   * @throws Error if retrieval fails
   */
  async getTopics(userId: string): Promise<TopicDto[]> {
    const { data: topics, error } = await this.supabase
      .from("topics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching topics:", error);
      throw new Error("Failed to fetch topics");
    }

    return topics || [];
  }

  /**
   * Retrieves a single topic by ID
   *
   * @param userId - The ID of the authenticated user
   * @param topicId - The ID of the topic to retrieve
   * @returns Promise resolving to the topic or null if not found
   * @throws Error if retrieval fails
   */
  async getTopic(userId: string, topicId: number): Promise<TopicDto | null> {
    const { data: topic, error } = await this.supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      // eslint-disable-next-line no-console
      console.error("Error fetching topic:", error);
      throw new Error("Failed to fetch topic");
    }

    return topic;
  }

  /**
   * Creates a new topic for the authenticated user
   *
   * @param userId - The ID of the authenticated user
   * @param data - Validated topic data containing the name
   * @returns Promise resolving to the created topic
   * @throws Error if creation fails or topic is not returned
   */
  async createTopic(userId: string, data: CreateTopicInput): Promise<TopicDto> {
    const { data: topic, error } = await this.supabase
      .from("topics")
      .insert({
        name: data.name,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating topic:", error);
      throw new Error("Failed to create topic");
    }

    if (!topic) {
      throw new Error("Topic was not returned after creation");
    }

    return topic;
  }

  /**
   * Updates an existing topic
   *
   * @param userId - The ID of the authenticated user
   * @param topicId - The ID of the topic to update
   * @param data - Validated topic data containing the updated name
   * @returns Promise resolving to the updated topic or null if not found
   * @throws Error if update fails
   */
  async updateTopic(userId: string, topicId: number, data: UpdateTopicInput): Promise<TopicDto | null> {
    // First check if topic exists and belongs to user
    const existingTopic = await this.getTopic(userId, topicId);
    if (!existingTopic) {
      return null;
    }

    const { data: topic, error } = await this.supabase
      .from("topics")
      .update({
        name: data.name,
      })
      .eq("id", topicId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating topic:", error);
      throw new Error("Failed to update topic");
    }

    if (!topic) {
      throw new Error("Topic was not returned after update");
    }

    return topic;
  }

  /**
   * Deletes a topic
   *
   * @param userId - The ID of the authenticated user
   * @param topicId - The ID of the topic to delete
   * @returns Promise resolving to true if deleted, false if not found
   * @throws Error if deletion fails
   */
  async deleteTopic(userId: string, topicId: number): Promise<boolean> {
    // First check if topic exists and belongs to user
    const existingTopic = await this.getTopic(userId, topicId);
    if (!existingTopic) {
      return false;
    }

    const { error } = await this.supabase.from("topics").delete().eq("id", topicId).eq("user_id", userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting topic:", error);
      throw new Error("Failed to delete topic");
    }

    return true;
  }
}
