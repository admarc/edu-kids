/**
 * useGenerateQuestions Hook
 *
 * Custom hook for managing question generation view state and operations
 * Handles fetching topics, generating questions, and managing question actions
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type {
  TopicDto,
  GeneratedQuestionDto,
  GenerateQuestionsFormData,
  GenerateQuestionsViewState,
  ErrorType,
  GenerateQuestionsCommand,
} from "../../types";

/**
 * Return type for useGenerateQuestions hook
 */
export interface UseGenerateQuestionsReturn {
  // State
  topics: TopicDto[];
  formData: GenerateQuestionsFormData;
  generatedQuestions: GeneratedQuestionDto[];
  isLoadingTopics: boolean;
  isGenerating: boolean;
  error: ErrorType | null;

  // Form actions
  updateFormData: (field: keyof GenerateQuestionsFormData, value: number | undefined) => void;
  handleSubmit: () => Promise<void>;

  // Question actions
  handleAccept: (questionId: number) => Promise<void>;
  handleReject: (questionId: number) => void;
  handleEdit: (questionId: number, newContent: string) => Promise<void>;

  // Error handling
  clearError: () => void;
  retryGeneration: () => Promise<void>;
}

/**
 * Custom hook for managing question generation
 */
export function useGenerateQuestions(): UseGenerateQuestionsReturn {
  const [state, setState] = useState<GenerateQuestionsViewState>({
    topics: [],
    formData: {
      age_group: undefined,
      topic_id: undefined,
      count: 5,
    },
    generatedQuestions: [],
    isLoadingTopics: false,
    isGenerating: false,
    error: null,
  });

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  /**
   * Fetches all topics from the API
   */
  const fetchTopics = async () => {
    setState((prev) => ({ ...prev, isLoadingTopics: true, error: null }));

    try {
      const response = await fetch("/api/topics");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch topics");
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        topics: data.data || [],
        isLoadingTopics: false,
      }));
    } catch (error) {
      const errorMessage: ErrorType = {
        type: error instanceof Error && error.message === "Unauthorized" ? "server" : "network",
        message: "Nie udało się pobrać listy tematów",
        retryable: true,
      };

      setState((prev) => ({
        ...prev,
        isLoadingTopics: false,
        error: errorMessage,
      }));

      toast.error(errorMessage.message);
    }
  };

  /**
   * Updates a single field in the form data
   */
  const updateFormData = (field: keyof GenerateQuestionsFormData, value: number | undefined) => {
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value,
      },
    }));
  };

  /**
   * Validates form data before submission
   */
  const validateFormData = (): ErrorType | null => {
    if (!state.formData.age_group) {
      return {
        type: "validation",
        message: "Wybierz grupę wiekową",
        retryable: false,
      };
    }

    if (!state.formData.topic_id) {
      return {
        type: "validation",
        message: "Wybierz temat",
        retryable: false,
      };
    }

    if (state.formData.count < 1 || state.formData.count > 10) {
      return {
        type: "validation",
        message: "Liczba pytań musi być między 1 a 10",
        retryable: false,
      };
    }

    // Check if selected topic still exists in the list
    const topicExists = state.topics.some((topic) => topic.id === state.formData.topic_id);
    if (!topicExists) {
      return {
        type: "validation",
        message: "Wybrany temat nie istnieje. Odśwież stronę.",
        retryable: false,
      };
    }

    return null;
  };

  /**
   * Submits the form and generates questions
   */
  const handleSubmit = async () => {
    // Validate form data
    const validationError = validateFormData();
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      toast.error(validationError.message);
      return;
    }

    setState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      // TypeScript guard - we've already validated these values exist
      if (!state.formData.age_group || !state.formData.topic_id) {
        return;
      }

      const command: GenerateQuestionsCommand = {
        age_group: state.formData.age_group,
        topic_id: state.formData.topic_id,
        count: state.formData.count,
      };

      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      // Handle error responses
      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Błąd walidacji danych");
        }

        if (response.status === 404) {
          // Topic not found, refresh topics
          await fetchTopics();
          throw new Error("Wybrany temat nie został znaleziony. Odśwież listę tematów.");
        }

        if (response.status === 500) {
          throw new Error("Nie udało się wygenerować pytań. Spróbuj ponownie.");
        }

        throw new Error("Wystąpił nieoczekiwany błąd");
      }

      const questions: GeneratedQuestionDto[] = await response.json();

      // Validate response
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Nie udało się wygenerować pytań. Spróbuj ponownie.");
      }

      setState((prev) => ({
        ...prev,
        generatedQuestions: questions,
        isGenerating: false,
      }));

      toast.success(`Wygenerowano ${questions.length} pytań`);

      // Smooth scroll to questions list
      setTimeout(() => {
        const questionsList = document.getElementById("generated-questions-list");
        if (questionsList) {
          questionsList.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (error) {
      const errorMessage: ErrorType = {
        type: error instanceof Error && error.message.includes("fetch") ? "network" : "server",
        message: error instanceof Error ? error.message : "Nie udało się wygenerować pytań",
        retryable: true,
      };

      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));

      toast.error(errorMessage.message);
    }
  };

  /**
   * Accepts a generated question (saves to database with accepted status)
   */
  const handleAccept = async (questionId: number) => {
    try {
      // TODO: Implement when PATCH /api/questions/:id endpoint is ready
      // For now, just remove from list and show success toast
      setState((prev) => ({
        ...prev,
        generatedQuestions: prev.generatedQuestions.filter((q) => q.id !== questionId),
      }));

      toast.success("Pytanie zaakceptowane");
    } catch {
      toast.error("Nie udało się zaakceptować pytania");
    }
  };

  /**
   * Rejects a generated question (removes from local list)
   */
  const handleReject = (questionId: number) => {
    setState((prev) => ({
      ...prev,
      generatedQuestions: prev.generatedQuestions.filter((q) => q.id !== questionId),
    }));
  };

  /**
   * Edits a generated question (updates content)
   */
  const handleEdit = async (questionId: number, newContent: string) => {
    // Validate content
    if (!newContent.trim()) {
      toast.error("Treść pytania nie może być pusta");
      return;
    }

    try {
      // TODO: Implement when PATCH /api/questions/:id endpoint is ready
      // For now, just update locally
      setState((prev) => ({
        ...prev,
        generatedQuestions: prev.generatedQuestions.map((q) =>
          q.id === questionId ? { ...q, content: newContent.trim() } : q
        ),
      }));

      toast.success("Pytanie zaktualizowane");
    } catch {
      toast.error("Nie udało się zaktualizować pytania");
    }
  };

  /**
   * Clears current error
   */
  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  /**
   * Retries the last generation operation
   */
  const retryGeneration = async () => {
    await handleSubmit();
  };

  return {
    // State
    topics: state.topics,
    formData: state.formData,
    generatedQuestions: state.generatedQuestions,
    isLoadingTopics: state.isLoadingTopics,
    isGenerating: state.isGenerating,
    error: state.error,

    // Form actions
    updateFormData,
    handleSubmit,

    // Question actions
    handleAccept,
    handleReject,
    handleEdit,

    // Error handling
    clearError,
    retryGeneration,
  };
}
