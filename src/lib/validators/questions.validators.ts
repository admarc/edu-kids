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
 * Inferred type from generateQuestionsSchema
 * Should match GenerateQuestionsCommand from types.ts
 */
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
