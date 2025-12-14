/**
 * useBrowseQuestions Hook
 *
 * Custom hook for managing questions browsing view state and operations
 * Handles fetching existing questions with filtering and pagination
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { QuestionDto, ErrorType, PaginationDto } from "../../types";

/**
 * Filter options for questions browsing
 */
export interface BrowseQuestionsFilters {
  status?: ("pending" | "accepted" | "rejected")[];
  age_group?: number;
  topic_id?: number;
}

/**
 * State for browse questions view
 */
export interface BrowseQuestionsViewState {
  questions: QuestionDto[];
  isLoading: boolean;
  error: ErrorType | null;
  pagination: PaginationDto;
  filters: BrowseQuestionsFilters;
}

/**
 * Return type for useBrowseQuestions hook
 */
export interface UseBrowseQuestionsReturn {
  // State
  questions: QuestionDto[];
  isLoading: boolean;
  error: ErrorType | null;
  pagination: PaginationDto;
  filters: BrowseQuestionsFilters;

  // Actions
  loadQuestions: (page?: number) => Promise<void>;
  updateFilters: (newFilters: Partial<BrowseQuestionsFilters>) => void;
  handleAccept: (questionId: number) => Promise<void>;
  handleReject: (questionId: number) => Promise<void>;
  handleEdit: (questionId: number, newContent: string) => Promise<void>;

  // Error handling
  clearError: () => void;
}

/**
 * Custom hook for managing questions browsing
 */
export function useBrowseQuestions(): UseBrowseQuestionsReturn {
  const [state, setState] = useState<BrowseQuestionsViewState>({
    questions: [],
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
    },
    filters: {
      status: ["pending", "accepted"], // Default to show pending and accepted questions only
    },
  });

  /**
   * Builds query parameters from current filters and pagination
   */
  const buildQueryParams = useCallback(
    (page?: number) => {
      const params = new URLSearchParams();

      // Pagination
      params.set("page", (page || state.pagination.page).toString());
      params.set("limit", state.pagination.limit.toString());

      // Filters
      if (state.filters.status && state.filters.status.length > 0) {
        params.set("status", state.filters.status.join(","));
      }

      if (state.filters.age_group) {
        params.set("age_group", state.filters.age_group.toString());
      }

      if (state.filters.topic_id) {
        params.set("topic_id", state.filters.topic_id.toString());
      }

      return params;
    },
    [state.filters, state.pagination.page, state.pagination.limit]
  );

  /**
   * Loads questions from the API with current filters
   */
  const loadQuestions = useCallback(
    async (page?: number) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const params = buildQueryParams(page);
        const response = await fetch(`/api/questions?${params}`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          }
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          questions: data.data || [],
          pagination: data.pagination,
          isLoading: false,
          // Reset page to 1 if page was not specified (filter change)
          ...(page ? {} : { pagination: { ...data.pagination, page: 1 } }),
        }));
      } catch (error) {
        const errorMessage: ErrorType = {
          type: error instanceof Error && error.message === "Unauthorized" ? "server" : "network",
          message: "Nie udało się pobrać pytań",
          retryable: true,
        };

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        toast.error(errorMessage.message);
      }
    },
    [buildQueryParams]
  );

  // Load questions on mount and when filters change
  useEffect(() => {
    loadQuestions();
  }, [state.filters, loadQuestions]);

  /**
   * Updates filters and triggers a reload
   */
  const updateFilters = (newFilters: Partial<BrowseQuestionsFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 1 }, // Reset to first page
    }));
  };

  /**
   * Accepts a question (changes status to accepted)
   */
  const handleAccept = async (questionId: number) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Pytanie nie zostało znalezione");
        }
        throw new Error("Nie udało się zaakceptować pytania");
      }

      // Update local state
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, status: "accepted", updated_at: new Date().toISOString() } : q
        ),
      }));

      toast.success("Pytanie zaakceptowane");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się zaakceptować pytania";
      toast.error(message);
      throw error; // Re-throw to let QuestionCard handle the error state
    }
  };

  /**
   * Rejects a question (changes status to rejected)
   */
  const handleReject = async (questionId: number) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Pytanie nie zostało znalezione");
        }
        throw new Error("Nie udało się odrzucić pytania");
      }

      // Remove rejected question from the list (since we only show pending and accepted)
      setState((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1,
        },
      }));

      toast.success("Pytanie odrzucone");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się odrzucić pytania";
      toast.error(message);
      throw error; // Re-throw to let QuestionCard handle the error state
    }
  };

  /**
   * Edits a question content
   */
  const handleEdit = async (questionId: number, newContent: string) => {
    // Validate content
    if (!newContent.trim()) {
      toast.error("Treść pytania nie może być pusta");
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim() }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Pytanie nie zostało znalezione");
        }
        throw new Error("Nie udało się zaktualizować pytania");
      }

      // Update local state
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, content: newContent.trim(), updated_at: new Date().toISOString() } : q
        ),
      }));

      toast.success("Pytanie zaktualizowane");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się zaktualizować pytania";
      toast.error(message);
      throw error; // Re-throw to let QuestionCard handle the error state
    }
  };

  /**
   * Clears current error
   */
  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return {
    // State
    questions: state.questions,
    isLoading: state.isLoading,
    error: state.error,
    pagination: state.pagination,
    filters: state.filters,

    // Actions
    loadQuestions,
    updateFilters,
    handleAccept,
    handleReject,
    handleEdit,

    // Error handling
    clearError,
  };
}
