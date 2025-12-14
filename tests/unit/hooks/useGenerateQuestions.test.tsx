import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import type { TopicDto, GeneratedQuestionDto } from "@/types";
import { useGenerateQuestions } from "@/lib/hooks/useGenerateQuestions";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useGenerateQuestions Hook", () => {
  let mockTopics: TopicDto[];
  let mockGeneratedQuestions: GeneratedQuestionDto[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockTopics = [
      {
        id: 1,
        name: "Mathematics",
        user_id: "user-123",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      },
      {
        id: 2,
        name: "Science",
        user_id: "user-123",
        created_at: "2024-01-02T00:00:00Z",
        updated_at: null,
      },
    ];

    mockGeneratedQuestions = [
      {
        id: 1,
        content: "What is 2 + 2?",
        status: "pending" as const,
      },
      {
        id: 2,
        content: "How does photosynthesis work?",
        status: "pending" as const,
      },
    ];
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Initial state and mounting", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => useGenerateQuestions());

      expect(result.current.topics).toEqual([]);
      expect(result.current.formData).toEqual({
        age_group: undefined,
        topic_id: undefined,
        count: 5,
      });
      expect(result.current.generatedQuestions).toEqual([]);
      expect(result.current.isLoadingTopics).toBe(true); // Should be true initially due to fetchTopics on mount
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should fetch topics on mount", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      // Initial state
      expect(result.current.isLoadingTopics).toBe(true);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/topics");
      expect(result.current.topics).toEqual(mockTopics);
    });

    it("should handle fetch topics error on mount", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useGenerateQuestions());

      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      expect(result.current.error).toEqual({
        type: "network",
        message: "Nie udało się pobrać listy tematów",
        retryable: true,
      });
      expect(toast.error).toHaveBeenCalledWith("Nie udało się pobrać listy tematów");
    });

    it("should handle unauthorized error when fetching topics", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useGenerateQuestions());

      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      expect(result.current.error).toEqual({
        type: "server",
        message: "Nie udało się pobrać listy tematów",
        retryable: true,
      });
    });
  });

  describe("Form data management", () => {
    it("should update form data correctly", () => {
      const { result } = renderHook(() => useGenerateQuestions());

      act(() => {
        result.current.updateFormData("age_group", 7);
      });

      expect(result.current.formData.age_group).toBe(7);

      act(() => {
        result.current.updateFormData("topic_id", 1);
      });

      expect(result.current.formData.topic_id).toBe(1);

      act(() => {
        result.current.updateFormData("count", 8);
      });

      expect(result.current.formData.count).toBe(8);
    });

    it("should handle undefined values for optional fields", () => {
      const { result } = renderHook(() => useGenerateQuestions());

      act(() => {
        result.current.updateFormData("age_group", undefined);
        result.current.updateFormData("topic_id", undefined);
      });

      expect(result.current.formData.age_group).toBeUndefined();
      expect(result.current.formData.topic_id).toBeUndefined();
    });
  });

  describe("Form validation", () => {
    it("should validate missing age_group", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data with missing age_group
      act(() => {
        result.current.updateFormData("topic_id", 1);
        result.current.updateFormData("count", 5);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "validation",
        message: "Wybierz grupę wiekową",
        retryable: false,
      });
      expect(toast.error).toHaveBeenCalledWith("Wybierz grupę wiekową");
    });

    it("should validate missing topic_id", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data with missing topic_id
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("count", 5);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "validation",
        message: "Wybierz temat",
        retryable: false,
      });
      expect(toast.error).toHaveBeenCalledWith("Wybierz temat");
    });

    it("should validate count too low", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data with count too low
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
        result.current.updateFormData("count", 0);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "validation",
        message: "Liczba pytań musi być między 1 a 10",
        retryable: false,
      });
      expect(toast.error).toHaveBeenCalledWith("Liczba pytań musi być między 1 a 10");
    });

    it("should validate count too high", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data with count too high
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
        result.current.updateFormData("count", 15);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "validation",
        message: "Liczba pytań musi być między 1 a 10",
        retryable: false,
      });
      expect(toast.error).toHaveBeenCalledWith("Liczba pytań musi być między 1 a 10");
    });

    it("should validate topic existence", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data with non-existent topic
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 999);
        result.current.updateFormData("count", 5);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "validation",
        message: "Wybrany temat nie istnieje. Odśwież stronę.",
        retryable: false,
      });
      expect(toast.error).toHaveBeenCalledWith("Wybrany temat nie istnieje. Odśwież stronę.");
    });
  });

  describe("Question generation", () => {
    beforeEach(() => {
      // Mock topics fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });
    });

    it("should generate questions successfully", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
        result.current.updateFormData("count", 3);
      });

      // Mock successful generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneratedQuestions,
      });

      // Mock scrollIntoView
      const mockScrollIntoView = vi.fn();
      Object.defineProperty(document, "getElementById", {
        writable: true,
        value: vi.fn(() => ({
          scrollIntoView: mockScrollIntoView,
        })),
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age_group: 7,
          topic_id: 1,
          count: 3,
        }),
      });

      expect(result.current.generatedQuestions).toEqual(mockGeneratedQuestions);
      expect(result.current.isGenerating).toBe(false);
      expect(toast.success).toHaveBeenCalledWith("Wygenerowano 2 pytań");

      // Check scroll behavior
      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalledWith({
          behavior: "smooth",
          block: "start",
        });
      });
    });

    it("should handle generation validation error", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Try to submit with invalid form data
      act(() => {
        result.current.updateFormData("age_group", undefined);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "validation",
        message: "Wybierz grupę wiekową",
        retryable: false,
      });
      expect(toast.error).toHaveBeenCalledWith("Wybierz grupę wiekową");
      expect(mockFetch).not.toHaveBeenCalledWith("/api/questions/generate", expect.any(Object));
    });

    it("should handle 400 validation error from API", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up valid form data
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock API validation error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid topic" }),
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "server",
        message: "Invalid topic",
        retryable: true,
      });
      expect(toast.error).toHaveBeenCalledWith("Invalid topic");
    });

    it("should handle 404 topic not found error", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock 404 error and successful topics refetch
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTopics }),
        });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "server",
        message: "Wybrany temat nie został znaleziony. Odśwież listę tematów.",
        retryable: true,
      });
      // Should refetch topics on 404
      expect(mockFetch).toHaveBeenCalledTimes(3); // initial + generation attempt + refetch topics + ?
    });

    it("should handle network error during generation", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock network error with "fetch" in message to trigger network error type
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "network",
        message: "Failed to fetch",
        retryable: true,
      });
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch");
    });

    it("should handle empty response from generation API", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock empty response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "server",
        message: "Nie udało się wygenerować pytań. Spróbuj ponownie.",
        retryable: true,
      });
    });
  });

  describe("Question actions", () => {
    it("should accept a question", async () => {
      // Mock initial topics fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data and generate questions first
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock successful generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneratedQuestions,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.generatedQuestions).toHaveLength(2);

      // Mock PATCH API call for accepting question
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await act(async () => {
        await result.current.handleAccept(1);
      });

      expect(result.current.generatedQuestions).toHaveLength(1);
      expect(result.current.generatedQuestions[0].id).toBe(2);
      expect(toast.success).toHaveBeenCalledWith("Pytanie zaakceptowane");
    });

    it("should reject a question", async () => {
      // Mock initial topics fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data and generate questions first
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock successful generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneratedQuestions,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.generatedQuestions).toHaveLength(2);

      // Mock PATCH API call for rejecting question
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await act(async () => {
        await result.current.handleReject(1);
      });

      expect(result.current.generatedQuestions).toHaveLength(1);
      expect(result.current.generatedQuestions[0].id).toBe(2);
    });

    it("should edit a question content", async () => {
      // Mock initial topics fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data and generate questions first
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock successful generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneratedQuestions,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      const newContent = "Updated question content";

      // Mock PATCH API call for editing question
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await act(async () => {
        await result.current.handleEdit(1, newContent);
      });

      expect(result.current.generatedQuestions[0].content).toBe(newContent);
      expect(toast.success).toHaveBeenCalledWith("Pytanie zaktualizowane");
    });

    it("should reject empty content when editing", async () => {
      // Mock initial topics fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data and generate questions first
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock successful generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneratedQuestions,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      await act(async () => {
        await result.current.handleEdit(1, "   ");
      });

      expect(toast.error).toHaveBeenCalledWith("Treść pytania nie może być pusta");
      expect(result.current.generatedQuestions[0].content).toBe("What is 2 + 2?"); // unchanged
    });

    it("should trim whitespace when editing", async () => {
      // Mock initial topics fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data and generate questions first
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock successful generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneratedQuestions,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      const contentWithWhitespace = "  Trimmed content  ";

      // Mock PATCH API call for editing question
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await act(async () => {
        await result.current.handleEdit(1, contentWithWhitespace);
      });

      expect(result.current.generatedQuestions[0].content).toBe("Trimmed content");
    });
  });

  describe("Error handling and retry", () => {
    it("should clear error", () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Set an error
      act(() => {
        result.current = {
          ...result.current,
          error: {
            type: "network",
            message: "Test error",
            retryable: true,
          },
        };
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("should retry generation with last form data", async () => {
      // Mock initial topics fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock successful generation for retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneratedQuestions,
      });

      await act(async () => {
        await result.current.retryGeneration();
      });

      expect(result.current.generatedQuestions).toEqual(mockGeneratedQuestions);
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle null topics data gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      expect(result.current.topics).toEqual([]);
    });

    it("should handle malformed topics response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => "invalid",
      });

      const { result } = renderHook(() => useGenerateQuestions());

      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      expect(result.current.topics).toEqual([]);
    });

    it("should handle non-array generation response", async () => {
      // Mock initial topics fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTopics }),
      });

      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      // Mock non-array response for generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: mockGeneratedQuestions }),
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toEqual({
        type: "server",
        message: "Nie udało się wygenerować pytań. Spróbuj ponownie.",
        retryable: true,
      });
    });

    it("should handle question actions on non-existent questions gracefully", async () => {
      const { result } = renderHook(() => useGenerateQuestions());

      // Wait for initial topics fetch
      await waitFor(() => {
        expect(result.current.isLoadingTopics).toBe(false);
      });

      // Set up form data and generate questions first
      act(() => {
        result.current.updateFormData("age_group", 7);
        result.current.updateFormData("topic_id", 1);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneratedQuestions,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      const originalQuestions = [...result.current.generatedQuestions];

      act(() => {
        result.current.handleReject(999); // Non-existent ID
      });

      // Should not crash, questions should remain unchanged
      expect(result.current.generatedQuestions).toEqual(originalQuestions);
    });
  });
});
