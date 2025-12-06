import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { TopicsService } from "@/lib/services/topics.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { TopicDto } from "@/types";

describe("TopicsService", () => {
  let service: TopicsService;
  let mockSupabase: {
    from: Mock;
  };
  let mockQueryBuilder: {
    select: Mock;
    insert: Mock;
    update: Mock;
    delete: Mock;
    eq: Mock;
    order: Mock;
    single: Mock;
  };

  beforeEach(() => {
    // Create a fresh mock query builder for each test
    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    // Create service instance with mocked client
    service = new TopicsService(mockSupabase as unknown as SupabaseClient<Database>);
  });

  describe("getTopics", () => {
    const userId = "test-user-id";

    it("should return topics successfully", async () => {
      const mockTopics: TopicDto[] = [
        {
          id: 1,
          name: "Mathematics",
          user_id: userId,
          created_at: "2024-01-02T00:00:00Z",
          updated_at: null,
        },
        {
          id: 2,
          name: "Science",
          user_id: userId,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: null,
        },
      ];

      mockQueryBuilder.order.mockResolvedValue({
        data: mockTopics,
        error: null,
      });

      const result = await service.getTopics(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith("topics");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(result).toEqual(mockTopics);
    });

    it("should return empty array when no topics exist", async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getTopics(userId);

      expect(result).toEqual([]);
    });

    it("should return empty array when data is null", async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.getTopics(userId);

      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      const dbError = {
        message: "Database connection error",
        code: "DB_ERROR",
      };

      mockQueryBuilder.order.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(service.getTopics(userId)).rejects.toThrow("Failed to fetch topics");
    });

    it("should filter topics by user_id", async () => {
      const mockTopics: TopicDto[] = [
        {
          id: 1,
          name: "Topic 1",
          user_id: userId,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: null,
        },
      ];

      mockQueryBuilder.order.mockResolvedValue({
        data: mockTopics,
        error: null,
      });

      await service.getTopics(userId);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  describe("getTopic", () => {
    const userId = "test-user-id";
    const topicId = 1;

    it("should return a single topic successfully", async () => {
      const mockTopic: TopicDto = {
        id: topicId,
        name: "Mathematics",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockTopic,
        error: null,
      });

      const result = await service.getTopic(userId, topicId);

      expect(mockSupabase.from).toHaveBeenCalledWith("topics");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", topicId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockTopic);
    });

    it("should return null when topic not found (PGRST116 error)", async () => {
      const notFoundError = {
        code: "PGRST116",
        message: "No rows found",
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: notFoundError,
      });

      const result = await service.getTopic(userId, topicId);

      expect(result).toBeNull();
    });

    it("should return null when topic belongs to different user", async () => {
      const notFoundError = {
        code: "PGRST116",
        message: "No rows found",
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: notFoundError,
      });

      const result = await service.getTopic(userId, topicId);

      expect(result).toBeNull();
    });

    it("should throw error for database errors other than not found", async () => {
      const dbError = {
        code: "DB_ERROR",
        message: "Database connection error",
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(service.getTopic(userId, topicId)).rejects.toThrow("Failed to fetch topic");
    });

    it("should enforce user_id filter for security", async () => {
      const mockTopic: TopicDto = {
        id: topicId,
        name: "Mathematics",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockTopic,
        error: null,
      });

      await service.getTopic(userId, topicId);

      // Verify both id and user_id are checked
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", topicId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  describe("createTopic", () => {
    const userId = "test-user-id";
    const createData = { name: "New Topic" };

    it("should create a topic successfully", async () => {
      const mockCreatedTopic: TopicDto = {
        id: 1,
        name: createData.name,
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockCreatedTopic,
        error: null,
      });

      const result = await service.createTopic(userId, createData);

      expect(mockSupabase.from).toHaveBeenCalledWith("topics");
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        name: createData.name,
        user_id: userId,
      });
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedTopic);
    });

    it("should throw error when database insert fails", async () => {
      const dbError = {
        message: "Unique constraint violation",
        code: "23505",
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(service.createTopic(userId, createData)).rejects.toThrow("Failed to create topic");
    });

    it("should throw error when topic is not returned after creation", async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(service.createTopic(userId, createData)).rejects.toThrow("Topic was not returned after creation");
    });

    it("should associate topic with correct user_id", async () => {
      const mockCreatedTopic: TopicDto = {
        id: 1,
        name: createData.name,
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockCreatedTopic,
        error: null,
      });

      await service.createTopic(userId, createData);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId }));
    });

    it("should trim whitespace from topic name", async () => {
      const dataWithWhitespace = { name: "  Topic with spaces  " };
      const mockCreatedTopic: TopicDto = {
        id: 1,
        name: dataWithWhitespace.name,
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockCreatedTopic,
        error: null,
      });

      await service.createTopic(userId, dataWithWhitespace);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        name: dataWithWhitespace.name,
        user_id: userId,
      });
    });
  });

  describe("updateTopic", () => {
    const userId = "test-user-id";
    const topicId = 1;
    const updateData = { name: "Updated Topic" };

    it("should update a topic successfully", async () => {
      const existingTopic: TopicDto = {
        id: topicId,
        name: "Old Name",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const updatedTopic: TopicDto = {
        ...existingTopic,
        name: updateData.name,
      };

      // Mock getTopic call (first single call)
      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: existingTopic,
          error: null,
        })
        // Mock update call (second single call)
        .mockResolvedValueOnce({
          data: updatedTopic,
          error: null,
        });

      const result = await service.updateTopic(userId, topicId, updateData);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        name: updateData.name,
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", topicId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(result).toEqual(updatedTopic);
    });

    it("should return null when topic does not exist", async () => {
      const notFoundError = {
        code: "PGRST116",
        message: "No rows found",
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: notFoundError,
      });

      const result = await service.updateTopic(userId, topicId, updateData);

      expect(result).toBeNull();
      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });

    it("should return null when topic belongs to different user", async () => {
      const notFoundError = {
        code: "PGRST116",
        message: "No rows found",
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: notFoundError,
      });

      const result = await service.updateTopic(userId, topicId, updateData);

      expect(result).toBeNull();
    });

    it("should throw error when update operation fails", async () => {
      const existingTopic: TopicDto = {
        id: topicId,
        name: "Old Name",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const dbError = {
        message: "Database error",
        code: "DB_ERROR",
      };

      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: existingTopic,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: dbError,
        });

      await expect(service.updateTopic(userId, topicId, updateData)).rejects.toThrow("Failed to update topic");
    });

    it("should throw error when updated topic is not returned", async () => {
      const existingTopic: TopicDto = {
        id: topicId,
        name: "Old Name",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: existingTopic,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      await expect(service.updateTopic(userId, topicId, updateData)).rejects.toThrow(
        "Topic was not returned after update"
      );
    });

    it("should verify topic ownership before updating", async () => {
      const existingTopic: TopicDto = {
        id: topicId,
        name: "Old Name",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const updatedTopic: TopicDto = {
        ...existingTopic,
        name: updateData.name,
      };

      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: existingTopic,
          error: null,
        })
        .mockResolvedValueOnce({
          data: updatedTopic,
          error: null,
        });

      await service.updateTopic(userId, topicId, updateData);

      // Verify getTopic was called first
      expect(mockSupabase.from).toHaveBeenCalledWith("topics");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  describe("deleteTopic", () => {
    const userId = "test-user-id";
    const topicId = 1;

    it("should delete a topic successfully", async () => {
      const existingTopic: TopicDto = {
        id: topicId,
        name: "Topic to Delete",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      // Spy on getTopic to bypass the query chain
      const getTopicSpy = vi.spyOn(service, "getTopic").mockResolvedValue(existingTopic);

      // Mock delete operation - need to chain eq twice, then resolve
      mockQueryBuilder.eq
        .mockReturnValueOnce(mockQueryBuilder) // First eq() returns this
        .mockResolvedValueOnce({ data: null, error: null }); // Second eq() resolves

      const result = await service.deleteTopic(userId, topicId);

      expect(getTopicSpy).toHaveBeenCalledWith(userId, topicId);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(result).toBe(true);

      getTopicSpy.mockRestore();
    });

    it("should return false when topic does not exist", async () => {
      // Spy on getTopic to return null (topic not found)
      const getTopicSpy = vi.spyOn(service, "getTopic").mockResolvedValue(null);

      const result = await service.deleteTopic(userId, topicId);

      expect(getTopicSpy).toHaveBeenCalledWith(userId, topicId);
      expect(result).toBe(false);
      expect(mockQueryBuilder.delete).not.toHaveBeenCalled();

      getTopicSpy.mockRestore();
    });

    it("should return false when topic belongs to different user", async () => {
      // Spy on getTopic to return null (topic belongs to different user)
      const getTopicSpy = vi.spyOn(service, "getTopic").mockResolvedValue(null);

      const result = await service.deleteTopic(userId, topicId);

      expect(getTopicSpy).toHaveBeenCalledWith(userId, topicId);
      expect(result).toBe(false);

      getTopicSpy.mockRestore();
    });

    it("should throw error when delete operation fails", async () => {
      const existingTopic: TopicDto = {
        id: topicId,
        name: "Topic to Delete",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const dbError = {
        message: "Foreign key constraint violation",
        code: "23503",
      };

      // Spy on getTopic to return existing topic
      const getTopicSpy = vi.spyOn(service, "getTopic").mockResolvedValue(existingTopic);

      // Mock delete operation to fail - chain eq twice
      mockQueryBuilder.eq
        .mockReturnValueOnce(mockQueryBuilder) // First eq() returns this
        .mockResolvedValueOnce({ data: null, error: dbError }); // Second eq() resolves with error

      await expect(service.deleteTopic(userId, topicId)).rejects.toThrow("Failed to delete topic");

      getTopicSpy.mockRestore();
    });

    it("should verify topic ownership before deleting", async () => {
      const existingTopic: TopicDto = {
        id: topicId,
        name: "Topic to Delete",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      // Spy on getTopic to verify it's called
      const getTopicSpy = vi.spyOn(service, "getTopic").mockResolvedValue(existingTopic);

      // Chain eq twice
      mockQueryBuilder.eq.mockReturnValueOnce(mockQueryBuilder).mockResolvedValueOnce({ data: null, error: null });

      await service.deleteTopic(userId, topicId);

      // Verify getTopic was called first to check ownership
      expect(getTopicSpy).toHaveBeenCalledWith(userId, topicId);

      getTopicSpy.mockRestore();
    });

    it("should enforce both topic_id and user_id in delete query", async () => {
      const existingTopic: TopicDto = {
        id: topicId,
        name: "Topic to Delete",
        user_id: userId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      // Spy on getTopic
      const getTopicSpy = vi.spyOn(service, "getTopic").mockResolvedValue(existingTopic);

      // Chain eq twice
      mockQueryBuilder.eq.mockReturnValueOnce(mockQueryBuilder).mockResolvedValueOnce({ data: null, error: null });

      await service.deleteTopic(userId, topicId);

      // Verify both conditions are applied in the delete query
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", topicId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);

      getTopicSpy.mockRestore();
    });
  });
});
