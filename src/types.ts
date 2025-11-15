/**
 * DTO and Command Model Types
 *
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * used for API communication. All types are derived from the database
 * entity definitions to ensure type safety and consistency.
 */

import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// ============================================================================
// Base Entity DTOs (derived from database Row types)
// ============================================================================

/**
 * Topic entity DTO
 * Represents a topic as returned by the API
 */
export type TopicDto = Tables<"topics">;

/**
 * Question entity DTO
 * Represents a question as returned by the API
 */
export type QuestionDto = Tables<"questions">;

/**
 * Question Set entity DTO
 * Represents a question set as returned by the API
 */
export type QuestionSetDto = Tables<"question_sets">;

/**
 * Question Set Item entity DTO
 * Represents a join table entry linking questions to sets
 */
export type QuestionSetItemDto = Tables<"question_set_items">;

/**
 * Question status enum
 */
export type QuestionStatus = Enums<"question_status">;

// ============================================================================
// Command Models (for creating/updating entities)
// ============================================================================

/**
 * Command to create a new topic
 * POST /api/topics
 */
export type CreateTopicCommand = Pick<TablesInsert<"topics">, "name">;

/**
 * Command to update an existing topic
 * PUT /api/topics/:id
 */
export type UpdateTopicCommand = Pick<TablesUpdate<"topics">, "name">;

/**
 * Command to generate AI questions
 * POST /api/questions/generate
 */
export interface GenerateQuestionsCommand {
  age_group: number;
  topic_id: number;
  count: number; // max 10
}

/**
 * Command to update a question (content or status)
 * PATCH /api/questions/:id
 */
export interface UpdateQuestionCommand {
  content?: string;
  status?: "accepted" | "rejected";
}

/**
 * Command to create a new question set
 * POST /api/question-sets
 */
export type CreateQuestionSetCommand = Pick<TablesInsert<"question_sets">, "name">;

/**
 * Command to add a question to a set
 * POST /api/question-sets/:id/questions
 */
export interface AddQuestionToSetCommand {
  question_id: number;
}

// ============================================================================
// Query Parameter DTOs
// ============================================================================

/**
 * Query parameters for listing topics
 * GET /api/topics
 */
export interface TopicsQueryDto {
  page?: number;
  limit?: number;
  sort_by?: "name" | "created_at";
  order?: "asc" | "desc";
}

/**
 * Query parameters for listing questions
 * GET /api/questions
 */
export interface QuestionsQueryDto {
  page?: number;
  limit?: number;
  status?: "pending" | "accepted" | "rejected";
  age_group?: number;
  topic_id?: number;
  sort_by?: "created_at";
  order?: "asc" | "desc";
}

/**
 * Query parameters for listing question sets
 * GET /api/question-sets
 */
export interface QuestionSetsQueryDto {
  page?: number;
  limit?: number;
  sort_by?: "created_at";
  order?: "asc" | "desc";
}

/**
 * Query parameters for generating a question set
 * GET /api/question-sets/generate
 */
export interface GenerateQuestionSetQueryDto {
  age_group: number;
  count: number; // max 10
}

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Pagination metadata for paginated responses
 */
export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  pagination: PaginationDto;
}

/**
 * Success response for delete operations
 */
export interface SuccessResponseDto {
  success: true;
}

/**
 * Question Set with its questions
 * GET /api/question-sets/:id
 */
export interface QuestionSetWithQuestionsDto {
  id: number;
  name: string;
  created_at: string;
  user_id: string;
  questions: QuestionDto[];
}

/**
 * Generated question response (simplified)
 * POST /api/questions/generate
 */
export interface GeneratedQuestionDto {
  id: number;
  content: string;
  status: "pending";
}

// ============================================================================
// Specific API Response Types
// ============================================================================

/**
 * Response for GET /api/topics
 */
export type TopicsListResponseDto = PaginatedResponseDto<TopicDto>;

/**
 * Response for GET /api/questions
 */
export type QuestionsListResponseDto = PaginatedResponseDto<QuestionDto>;

/**
 * Response for GET /api/question-sets
 */
export type QuestionSetsListResponseDto = PaginatedResponseDto<QuestionSetDto>;

/**
 * Response for POST /api/questions/generate
 */
export type GeneratedQuestionsResponseDto = GeneratedQuestionDto[];

/**
 * Response for GET /api/question-sets/generate
 */
export type GeneratedQuestionSetResponseDto = QuestionDto[];

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Validation rules for API requests
 */
export const ValidationRules = {
  topic: {
    nameMinLength: 1,
    nameMaxLength: 100,
  },
  questionSet: {
    nameMinLength: 1,
    nameMaxLength: 100,
  },
  question: {
    contentMinLength: 1,
  },
  generation: {
    maxCount: 10,
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  },
} as const;

// ============================================================================
// Frontend ViewModel Types (Topics View)
// ============================================================================

/**
 * Error message representation for UI
 */
export interface ErrorMessage {
  type: "network" | "validation" | "server" | "not_found";
  message: string;
  details?: string[];
}

/**
 * Form data for topic creation/editing
 */
export interface TopicFormData {
  name: string;
}

/**
 * Validation state for topic form
 */
export interface TopicFormValidation {
  name: {
    isValid: boolean;
    error?: string;
  };
}

/**
 * State for topic dialogs
 */
export interface DialogState {
  addDialog: {
    isOpen: boolean;
    isSubmitting: boolean;
  };
  editDialog: {
    isOpen: boolean;
    topic: TopicDto | null;
    isSubmitting: boolean;
  };
  deleteDialog: {
    isOpen: boolean;
    topic: TopicDto | null;
    isDeleting: boolean;
  };
}

/**
 * Main state for Topics view
 */
export interface TopicsViewState {
  topics: TopicDto[];
  isLoading: boolean;
  error: ErrorMessage | null;
  dialogState: DialogState;
}

// ============================================================================
// Frontend ViewModel Types (Generate Questions View)
// ============================================================================

/**
 * Form data for question generation
 */
export interface GenerateQuestionsFormData {
  age_group: number | undefined;
  topic_id: number | undefined;
  count: number;
}

/**
 * Age group representation for UI
 */
export interface AgeGroup {
  value: number;
  label: string;
}

/**
 * Question card display mode
 */
export type QuestionCardMode = "view" | "edit";

/**
 * Error type for generate questions view
 */
export interface ErrorType {
  type: "network" | "validation" | "server" | "not_found";
  message: string;
  retryable: boolean;
}

/**
 * Question card state
 */
export interface QuestionCardState {
  mode: QuestionCardMode;
  editedContent: string;
  isAccepting: boolean;
  isEditing: boolean;
}

/**
 * Main state for Generate Questions view
 */
export interface GenerateQuestionsViewState {
  topics: TopicDto[];
  formData: GenerateQuestionsFormData;
  generatedQuestions: GeneratedQuestionDto[];
  isLoadingTopics: boolean;
  isGenerating: boolean;
  error: ErrorType | null;
}

/**
 * Predefined age groups for question generation
 */
export const AGE_GROUPS: AgeGroup[] = [
  { value: 3, label: "3-4 lata" },
  { value: 5, label: "5-6 lat" },
  { value: 7, label: "7-8 lat" },
  { value: 9, label: "9-10 lat" },
  { value: 11, label: "11-12 lat" },
] as const;
