import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { QuestionsService } from "@/lib/services/questions.service";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { GeneratedQuestionDto } from "@/types";
import type { GenerateQuestionsInput } from "@/lib/validators/questions.validators";

// Mock OpenRouter Service
const mockSendChat = vi.fn();

vi.mock("@/lib/services/openrouter.service", () => ({
  OpenRouterService: vi.fn().mockImplementation(function (this: { sendChat: typeof mockSendChat }) {
    this.sendChat = mockSendChat;
  }),
}));

describe("QuestionsService", () => {
  let service: QuestionsService;
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

  // Test data
  const userId = "test-user-id";
  const topicId = 1;
  const topicName = "Mathematics";

  beforeEach(() => {
    // Mock environment variable
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");

    // Reset only the sendChat mock
    mockSendChat.mockReset();

    // Create a chainable mock query builder
    mockQueryBuilder = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      single: vi.fn(),
    };

    // Each method returns the builder for chaining
    mockQueryBuilder.select.mockImplementation(() => mockQueryBuilder);
    mockQueryBuilder.insert.mockImplementation(() => mockQueryBuilder);
    mockQueryBuilder.update.mockImplementation(() => mockQueryBuilder);
    mockQueryBuilder.delete.mockImplementation(() => mockQueryBuilder);
    mockQueryBuilder.eq.mockImplementation(() => mockQueryBuilder);
    mockQueryBuilder.order.mockImplementation(() => mockQueryBuilder);

    // Mock Supabase client - return same builder for all from() calls
    mockSupabase = {
      from: vi.fn(() => mockQueryBuilder),
    };

    // Create service instance with mocked client
    service = new QuestionsService(mockSupabase as unknown as SupabaseClient<Database>);
  });

  describe("constructor", () => {
    it("should initialize successfully with valid API key", () => {
      expect(service).toBeInstanceOf(QuestionsService);
      expect(vi.mocked(OpenRouterService)).toHaveBeenCalledWith("test-api-key");
    });

    it("should throw error when OPENROUTER_API_KEY is not set", () => {
      vi.unstubAllEnvs();

      expect(() => {
        new QuestionsService(mockSupabase as unknown as SupabaseClient<Database>);
      }).toThrow("OPENROUTER_API_KEY environment variable is not set");
    });

    it("should throw error when OPENROUTER_API_KEY is empty string", () => {
      vi.stubEnv("OPENROUTER_API_KEY", "");

      expect(() => {
        new QuestionsService(mockSupabase as unknown as SupabaseClient<Database>);
      }).toThrow("OPENROUTER_API_KEY environment variable is not set");
    });
  });

  describe("verifyTopicOwnership", () => {
    it("should return topic name when topic exists and belongs to user", async () => {
      const mockTopic = {
        id: topicId,
        user_id: userId,
        name: topicName,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockTopic,
        error: null,
      });

      const result = await service.verifyTopicOwnership(topicId, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith("topics");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("id, user_id, name");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", topicId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toBe(topicName);
    });

    it("should throw error when topic does not exist", async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      await expect(service.verifyTopicOwnership(topicId, userId)).rejects.toThrow(
        "Topic not found or doesn't belong to user"
      );
    });

    it("should throw error when topic belongs to different user", async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      await expect(service.verifyTopicOwnership(topicId, "different-user-id")).rejects.toThrow(
        "Topic not found or doesn't belong to user"
      );
    });

    it("should throw error when database query fails", async () => {
      const dbError = {
        code: "DB_ERROR",
        message: "Database connection error",
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(service.verifyTopicOwnership(topicId, userId)).rejects.toThrow(
        "Topic not found or doesn't belong to user"
      );
    });

    it("should enforce both topic_id and user_id filters for security", async () => {
      const mockTopic = {
        id: topicId,
        user_id: userId,
        name: topicName,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockTopic,
        error: null,
      });

      await service.verifyTopicOwnership(topicId, userId);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", topicId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  describe("generateQuestions", () => {
    const generateData: GenerateQuestionsInput = {
      topic_id: topicId,
      age_group: 7,
      count: 3,
    };

    it("should generate and save questions successfully", async () => {
      // Mock topic verification
      const mockTopic = {
        id: topicId,
        user_id: userId,
        name: topicName,
      };

      // First single() call (for verifyTopicOwnership)
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: mockTopic,
        error: null,
      });

      // Mock AI service response
      mockSendChat.mockResolvedValue({
        questions: [
          "Co to jest dodawanie?",
          "Ile to 2 + 2?",
          "Jakie znasz liczby parzyste?",
        ],
      });

      // Mock database insert - select() after insert() is terminal
      const mockInsertedQuestions = [
        { id: 1, content: "Co to jest dodawanie?", status: "pending" },
        { id: 2, content: "Ile to 2 + 2?", status: "pending" },
        { id: 3, content: "Jakie znasz liczby parzyste?", status: "pending" },
      ];

      // select() is called twice: once in verifyTopicOwnership (returns builder), once after insert (terminal)
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership - returns builder
        .mockResolvedValueOnce({
          // after insert - terminal, returns Promise
          data: mockInsertedQuestions,
          error: null,
        });

      const result = await service.generateQuestions(userId, generateData);

      // Verify topic ownership was checked
      expect(mockSupabase.from).toHaveBeenCalledWith("topics");

      // Verify AI service was called
      expect(mockSendChat).toHaveBeenCalled();

      // Verify questions were inserted
      expect(mockSupabase.from).toHaveBeenCalledWith("questions");
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        {
          user_id: userId,
          topic_id: topicId,
          age_group: 7,
          content: "Co to jest dodawanie?",
          status: "pending",
        },
        {
          user_id: userId,
          topic_id: topicId,
          age_group: 7,
          content: "Ile to 2 + 2?",
          status: "pending",
        },
        {
          user_id: userId,
          topic_id: topicId,
          age_group: 7,
          content: "Jakie znasz liczby parzyste?",
          status: "pending",
        },
      ]);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("id, content, status");

      // Verify result
      expect(result).toEqual(mockInsertedQuestions);
      expect(result).toHaveLength(3);
      expect(result[0].status).toBe("pending");
    });

    it("should throw error when topic does not exist", async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Topic not found or doesn't belong to user"
      );

      expect(mockSendChat).not.toHaveBeenCalled();
      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });

    it("should throw error when topic belongs to different user", async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Topic not found or doesn't belong to user"
      );
    });

    it("should throw error when AI service fails", async () => {
      // Mock topic verification success
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service failure
      mockSendChat.mockRejectedValue(new Error("AI service unavailable"));

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: AI service unavailable"
      );

      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });

    it("should throw error when database insert fails", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service success
      mockSendChat.mockResolvedValue({
        questions: ["Pytanie 1?", "Pytanie 2?"],
      });

      // Mock database insert failure
      const dbError = {
        code: "DB_ERROR",
        message: "Insert failed",
      };

      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: null,
          error: dbError,
        });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow("Failed to save generated questions");
    });

    it("should throw error when no questions are returned after insert", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service success
      mockSendChat.mockResolvedValue({
        questions: ["Pytanie 1?"],
      });

      // Mock database insert returning empty array
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [],
          error: null,
        });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "No questions were returned after creation"
      );
    });

    it("should throw error when inserted questions is null", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service success
      mockSendChat.mockResolvedValue({
        questions: ["Pytanie 1?"],
      });

      // Mock database insert returning null
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: null,
          error: null,
        });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "No questions were returned after creation"
      );
    });

    it("should set correct user_id and topic_id for all questions", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service
      mockSendChat.mockResolvedValue({
        questions: ["Q1?", "Q2?"],
      });

      // Mock insert
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [
            { id: 1, content: "Q1?", status: "pending" },
            { id: 2, content: "Q2?", status: "pending" },
          ],
          error: null,
        });

      await service.generateQuestions(userId, generateData);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveLength(2);
      expect(insertCall[0]).toMatchObject({
        user_id: userId,
        topic_id: topicId,
      });
      expect(insertCall[1]).toMatchObject({
        user_id: userId,
        topic_id: topicId,
      });
    });

    it("should set status as pending for all generated questions", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service
      mockSendChat.mockResolvedValue({
        questions: ["Q1?"],
      });

      // Mock insert
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [{ id: 1, content: "Q1?", status: "pending" }],
          error: null,
        });

      const result = await service.generateQuestions(userId, generateData);

      expect(result[0].status).toBe("pending");
    });

    it("should pass age_group to database for each question", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service
      mockSendChat.mockResolvedValue({
        questions: ["Q1?"],
      });

      // Mock insert
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [{ id: 1, content: "Q1?", status: "pending" }],
          error: null,
        });

      await service.generateQuestions(userId, generateData);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall[0].age_group).toBe(7);
    });
  });

  describe("callAIService (private - tested through generateQuestions)", () => {
    const generateData: GenerateQuestionsInput = {
      topic_id: topicId,
      age_group: 7,
      count: 3,
    };

    it("should throw error when AI returns invalid response format", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service returning invalid format (no questions field)
      mockSendChat.mockResolvedValue({
        invalid: "format",
      });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: Invalid response format from AI service"
      );
    });

    it("should throw error when questions field is not an array", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service returning non-array questions
      mockSendChat.mockResolvedValue({
        questions: "not an array",
      });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: Questions field is not an array"
      );
    });

    it("should throw error when AI returns empty questions array", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service returning empty array
      mockSendChat.mockResolvedValue({
        questions: [],
      });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: AI service returned no questions"
      );
    });

    it("should throw error when all questions are invalid (non-strings)", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service returning non-string questions
      mockSendChat.mockResolvedValue({
        questions: [123, null, undefined, {}],
      });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: AI service returned no valid question strings"
      );
    });

    it("should throw error when all questions are empty strings", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service returning empty strings
      mockSendChat.mockResolvedValue({
        questions: ["", "  ", "\t", "\n"],
      });

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: AI service returned no valid question strings"
      );
    });

    it("should filter out invalid questions and keep valid ones", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service returning mixed valid and invalid
      mockSendChat.mockResolvedValue({
        questions: [
          "Valid question 1?",
          123, // invalid - number
          "Valid question 2?",
          "", // invalid - empty
          null, // invalid - null
          "Valid question 3?",
        ],
      });

      // Mock insert
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [
            { id: 1, content: "Valid question 1?", status: "pending" },
            { id: 2, content: "Valid question 2?", status: "pending" },
            { id: 3, content: "Valid question 3?", status: "pending" },
          ],
          error: null,
        });

      const result = await service.generateQuestions(userId, generateData);

      // Should only insert valid questions
      expect(result).toHaveLength(3);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ content: "Valid question 1?" }),
          expect.objectContaining({ content: "Valid question 2?" }),
          expect.objectContaining({ content: "Valid question 3?" }),
        ])
      );
    });

    it("should call OpenRouter with correct message structure", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service
      mockSendChat.mockResolvedValue({
        questions: ["Q1?"],
      });

      // Mock insert
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [{ id: 1, content: "Q1?", status: "pending" }],
          error: null,
        });

      await service.generateQuestions(userId, generateData);

      // Verify sendChat was called with correct structure
      expect(mockSendChat).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" }),
        ]),
        expect.objectContaining({
          type: "json_schema",
          json_schema: expect.objectContaining({
            name: "GeneratedQuestions",
            strict: true,
            schema: expect.objectContaining({
              questions: "array",
            }),
          }),
        })
      );
    });

    it("should include age_group in user prompt", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service
      mockSendChat.mockResolvedValue({
        questions: ["Q1?"],
      });

      // Mock insert
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [{ id: 1, content: "Q1?", status: "pending" }],
          error: null,
        });

      await service.generateQuestions(userId, generateData);

      const chatCall = mockSendChat.mock.calls[0];
      const messages = chatCall[0];
      const userMessage = messages.find((m: { role: string }) => m.role === "user");

      expect(userMessage.content).toContain("7 lat");
    });

    it("should include topic name in user prompt", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service
      mockSendChat.mockResolvedValue({
        questions: ["Q1?"],
      });

      // Mock insert
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [{ id: 1, content: "Q1?", status: "pending" }],
          error: null,
        });

      await service.generateQuestions(userId, generateData);

      const chatCall = mockSendChat.mock.calls[0];
      const messages = chatCall[0];
      const userMessage = messages.find((m: { role: string }) => m.role === "user");

      expect(userMessage.content).toContain(topicName);
    });

    it("should include question count in user prompt", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service
      mockSendChat.mockResolvedValue({
        questions: ["Q1?", "Q2?", "Q3?"],
      });

      // Mock insert
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [
            { id: 1, content: "Q1?", status: "pending" },
            { id: 2, content: "Q2?", status: "pending" },
            { id: 3, content: "Q3?", status: "pending" },
          ],
          error: null,
        });

      await service.generateQuestions(userId, generateData);

      const chatCall = mockSendChat.mock.calls[0];
      const messages = chatCall[0];
      const userMessage = messages.find((m: { role: string }) => m.role === "user");

      expect(userMessage.content).toContain("3 pytań");
    });
  });

  describe("edge cases and error handling", () => {
    const generateData: GenerateQuestionsInput = {
      topic_id: topicId,
      age_group: 7,
      count: 1,
    };

    it("should handle AI service throwing non-Error objects", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service throwing string
      mockSendChat.mockRejectedValue("String error");

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: Unknown error"
      );
    });

    it("should handle null response from AI service", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service returning null
      mockSendChat.mockResolvedValue(null);

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: Invalid response format from AI service"
      );
    });

    it("should handle undefined response from AI service", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service returning undefined
      mockSendChat.mockResolvedValue(undefined);

      await expect(service.generateQuestions(userId, generateData)).rejects.toThrow(
        "Failed to generate questions: Invalid response format from AI service"
      );
    });

    it("should handle database returning data with missing fields", async () => {
      // Mock topic verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      // Mock AI service
      mockSendChat.mockResolvedValue({
        questions: ["Q1?"],
      });

      // Mock insert returning incomplete data
      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [{ id: 1 }], // missing content and status
          error: null,
        });

      const result = await service.generateQuestions(userId, generateData);

      // Should still return the data as-is (with type coercion)
      expect(result).toHaveLength(1);
    });
  });

  describe("integration scenarios", () => {
    it("should successfully generate questions for young children (3-6 years)", async () => {
      const youngChildData: GenerateQuestionsInput = {
        topic_id: topicId,
        age_group: 3,
        count: 2,
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: "Zwierzęta" },
        error: null,
      });

      mockSendChat.mockResolvedValue({
        questions: ["Jakie zwierzę robi hau hau?", "Co je kotek?"],
      });

      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [
            { id: 1, content: "Jakie zwierzę robi hau hau?", status: "pending" },
            { id: 2, content: "Co je kotek?", status: "pending" },
          ],
          error: null,
        });

      const result = await service.generateQuestions(userId, youngChildData);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Jakie zwierzę robi hau hau?");
    });

    it("should successfully generate questions for older children (7-12 years)", async () => {
      const olderChildData: GenerateQuestionsInput = {
        topic_id: topicId,
        age_group: 11,
        count: 2,
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: "Fizyka" },
        error: null,
      });

      mockSendChat.mockResolvedValue({
        questions: ["Co to jest grawitacja?", "Dlaczego planety krążą wokół Słońca?"],
      });

      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: [
            { id: 1, content: "Co to jest grawitacja?", status: "pending" },
            { id: 2, content: "Dlaczego planety krążą wokół Słońca?", status: "pending" },
          ],
          error: null,
        });

      const result = await service.generateQuestions(userId, olderChildData);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Co to jest grawitacja?");
    });

    it("should handle maximum question count (10 questions)", async () => {
      const maxCountData: GenerateQuestionsInput = {
        topic_id: topicId,
        age_group: 7,
        count: 10,
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: topicId, user_id: userId, name: topicName },
        error: null,
      });

      const tenQuestions = Array.from({ length: 10 }, (_, i) => `Pytanie ${i + 1}?`);

      mockSendChat.mockResolvedValue({
        questions: tenQuestions,
      });

      const mockInserted = tenQuestions.map((q, i) => ({
        id: i + 1,
        content: q,
        status: "pending" as const,
      }));

      mockQueryBuilder.select
        .mockImplementationOnce(() => mockQueryBuilder) // verifyTopicOwnership
        .mockResolvedValueOnce({
          // after insert - terminal
          data: mockInserted,
          error: null,
        });

      const result = await service.generateQuestions(userId, maxCountData);

      expect(result).toHaveLength(10);
    });
  });
});

