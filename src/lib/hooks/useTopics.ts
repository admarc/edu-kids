/**
 * useTopics Hook
 *
 * Custom hook for managing topics view state and operations
 * Handles fetching, creating, updating, and deleting topics
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type {
  TopicDto,
  CreateTopicCommand,
  UpdateTopicCommand,
  TopicsViewState,
  DialogState,
  ErrorMessage,
} from "../../types";

/**
 * Return type for useTopics hook
 */
export interface UseTopicsReturn {
  // State
  topics: TopicDto[];
  isLoading: boolean;
  error: ErrorMessage | null;

  // Dialog state
  addDialog: DialogState["addDialog"];
  editDialog: DialogState["editDialog"];
  deleteDialog: DialogState["deleteDialog"];

  // Dialog actions
  openAddDialog: () => void;
  closeAddDialog: () => void;
  openEditDialog: (topic: TopicDto) => void;
  closeEditDialog: () => void;
  openDeleteDialog: (topic: TopicDto) => void;
  closeDeleteDialog: () => void;

  // CRUD actions
  createTopic: (data: CreateTopicCommand) => Promise<void>;
  updateTopic: (id: number, data: UpdateTopicCommand) => Promise<void>;
  deleteTopic: (id: number) => Promise<void>;

  // Helper actions
  refreshTopics: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing topics
 */
export function useTopics(): UseTopicsReturn {
  const [state, setState] = useState<TopicsViewState>({
    topics: [],
    isLoading: false,
    error: null,
    dialogState: {
      addDialog: { isOpen: false, isSubmitting: false },
      editDialog: { isOpen: false, topic: null, isSubmitting: false },
      deleteDialog: { isOpen: false, topic: null, isDeleting: false },
    },
  });

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  /**
   * Fetches all topics from the API
   */
  const fetchTopics = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

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
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage: ErrorMessage = {
        type: error instanceof Error && error.message === "Unauthorized" ? "server" : "network",
        message: "Nie udało się pobrać listy tematów",
      };

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  /**
   * Creates a new topic
   */
  const createTopic = async (data: CreateTopicCommand) => {
    // Set submitting state
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        addDialog: { ...prev.dialogState.addDialog, isSubmitting: true },
      },
    }));

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create topic");
      }

      const newTopic: TopicDto = await response.json();

      // Optimistic update + close dialog
      setState((prev) => ({
        ...prev,
        topics: [newTopic, ...prev.topics],
        dialogState: {
          ...prev.dialogState,
          addDialog: { isOpen: false, isSubmitting: false },
        },
      }));

      // Show success toast
      toast.success("Temat został utworzony");
    } catch (error) {
      // Handle error
      const errorMessage: ErrorMessage = {
        type: "server",
        message: error instanceof Error ? error.message : "Nie udało się utworzyć tematu",
      };

      setState((prev) => ({
        ...prev,
        dialogState: {
          ...prev.dialogState,
          addDialog: { ...prev.dialogState.addDialog, isSubmitting: false },
        },
        error: errorMessage,
      }));

      // Show error toast
      toast.error(errorMessage.message);
      throw error; // Re-throw for component handling
    }
  };

  /**
   * Updates an existing topic
   */
  const updateTopic = async (id: number, data: UpdateTopicCommand) => {
    // Set submitting state
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        editDialog: { ...prev.dialogState.editDialog, isSubmitting: true },
      },
    }));

    try {
      const response = await fetch(`/api/topics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Topic not found, refresh list
          setState((prev) => ({
            ...prev,
            dialogState: {
              ...prev.dialogState,
              editDialog: { isOpen: false, topic: null, isSubmitting: false },
            },
          }));
          await fetchTopics();
          throw new Error("Temat nie został znaleziony");
        }

        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update topic");
      }

      const updatedTopic: TopicDto = await response.json();

      // Optimistic update + close dialog
      setState((prev) => ({
        ...prev,
        topics: prev.topics.map((topic) => (topic.id === id ? updatedTopic : topic)),
        dialogState: {
          ...prev.dialogState,
          editDialog: { isOpen: false, topic: null, isSubmitting: false },
        },
      }));

      // Show success toast
      toast.success("Temat został zaktualizowany");
    } catch (error) {
      // Handle error
      const errorMessage: ErrorMessage = {
        type: "server",
        message: error instanceof Error ? error.message : "Nie udało się zaktualizować tematu",
      };

      setState((prev) => ({
        ...prev,
        dialogState: {
          ...prev.dialogState,
          editDialog: { ...prev.dialogState.editDialog, isSubmitting: false },
        },
        error: errorMessage,
      }));

      // Show error toast
      toast.error(errorMessage.message);
      throw error; // Re-throw for component handling
    }
  };

  /**
   * Deletes a topic
   */
  const deleteTopic = async (id: number) => {
    // Set deleting state
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        deleteDialog: { ...prev.dialogState.deleteDialog, isDeleting: true },
      },
    }));

    try {
      const response = await fetch(`/api/topics/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Topic not found, refresh list
          setState((prev) => ({
            ...prev,
            dialogState: {
              ...prev.dialogState,
              deleteDialog: { isOpen: false, topic: null, isDeleting: false },
            },
          }));
          await fetchTopics();
          throw new Error("Temat nie został znaleziony");
        }

        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete topic");
      }

      // Optimistic update + close dialog
      setState((prev) => ({
        ...prev,
        topics: prev.topics.filter((topic) => topic.id !== id),
        dialogState: {
          ...prev.dialogState,
          deleteDialog: { isOpen: false, topic: null, isDeleting: false },
        },
      }));

      // Show success toast
      toast.success("Temat został usunięty");
    } catch (error) {
      // Handle error
      const errorMessage: ErrorMessage = {
        type: "server",
        message: error instanceof Error ? error.message : "Nie udało się usunąć tematu",
      };

      setState((prev) => ({
        ...prev,
        dialogState: {
          ...prev.dialogState,
          deleteDialog: { ...prev.dialogState.deleteDialog, isDeleting: false },
        },
        error: errorMessage,
      }));

      // Show error toast
      toast.error(errorMessage.message);
      throw error; // Re-throw for component handling
    }
  };

  // Dialog management functions
  const openAddDialog = () => {
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        addDialog: { isOpen: true, isSubmitting: false },
      },
    }));
  };

  const closeAddDialog = () => {
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        addDialog: { isOpen: false, isSubmitting: false },
      },
    }));
  };

  const openEditDialog = (topic: TopicDto) => {
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        editDialog: { isOpen: true, topic, isSubmitting: false },
      },
    }));
  };

  const closeEditDialog = () => {
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        editDialog: { isOpen: false, topic: null, isSubmitting: false },
      },
    }));
  };

  const openDeleteDialog = (topic: TopicDto) => {
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        deleteDialog: { isOpen: true, topic, isDeleting: false },
      },
    }));
  };

  const closeDeleteDialog = () => {
    setState((prev) => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        deleteDialog: { isOpen: false, topic: null, isDeleting: false },
      },
    }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return {
    // State
    topics: state.topics,
    isLoading: state.isLoading,
    error: state.error,

    // Dialog state
    addDialog: state.dialogState.addDialog,
    editDialog: state.dialogState.editDialog,
    deleteDialog: state.dialogState.deleteDialog,

    // Dialog actions
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,

    // CRUD actions
    createTopic,
    updateTopic,
    deleteTopic,

    // Helper actions
    refreshTopics: fetchTopics,
    clearError,
  };
}
