/**
 * Question Validators
 *
 * Zod schemas for validating question-related API requests
 */

import { z } from "zod";
import { ValidationRules } from "../../types";

/**
 * Schema for validating GenerateQuestionsCommand
 * Used in POST /api/questions/generate
 */
export const generateQuestionsSchema = z.object({
  age_group: z
    .number()
    .int({ message: "Grupa wiekowa musi być liczbą całkowitą" })
    .positive({ message: "Grupa wiekowa musi być liczbą dodatnią" }),
  topic_id: z
    .number()
    .int({ message: "ID tematu musi być liczbą całkowitą" })
    .positive({ message: "ID tematu musi być liczbą dodatnią" }),
  count: z
    .number()
    .int({ message: "Liczba pytań musi być liczbą całkowitą" })
    .min(1, { message: "Minimalna liczba pytań to 1" })
    .max(ValidationRules.generation.maxCount, {
      message: `Maksymalna liczba pytań to ${ValidationRules.generation.maxCount}`,
    }),
});

/**
 * Schema for validating UpdateQuestionCommand
 * Used in PATCH /api/questions/[id]
 */
export const updateQuestionSchema = z
  .object({
    status: z
      .enum(["pending", "accepted", "rejected"], {
        message: "Status musi być jednym z: pending, accepted, rejected",
      })
      .optional(),
    content: z
      .string()
      .min(ValidationRules.question.contentMinLength, { message: "Treść pytania nie może być pusta" })
      .max(ValidationRules.question.maxContentLength, {
        message: `Treść pytania może mieć maksymalnie ${ValidationRules.question.maxContentLength} znaków`,
      })
      .optional(),
  })
  .refine((data) => data.status !== undefined || data.content !== undefined, {
    message: "Przynajmniej jedno pole (status lub content) musi zostać podane",
  });

/**
 * Inferred type from generateQuestionsSchema
 * Should match GenerateQuestionsCommand from types.ts
 */
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;

/**
 * Inferred type from updateQuestionSchema
 */
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
