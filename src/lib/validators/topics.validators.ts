/**
 * Topic Validators
 *
 * Zod schemas for validating topic-related API requests
 */

import { z } from "zod";
import { ValidationRules } from "../../types";

/**
 * Schema for validating CreateTopicCommand
 * Used in POST /api/topics
 */
export const createTopicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(ValidationRules.topic.nameMinLength, {
      message: "Nazwa tematu musi mieć co najmniej 1 znak",
    })
    .max(ValidationRules.topic.nameMaxLength, {
      message: "Nazwa tematu może mieć maksymalnie 100 znaków",
    }),
});

/**
 * Inferred type from createTopicSchema
 * Should match CreateTopicCommand from types.ts
 */
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

/**
 * Schema for validating UpdateTopicCommand
 * Used in PUT /api/topics/:id
 */
export const updateTopicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(ValidationRules.topic.nameMinLength, {
      message: "Nazwa tematu musi mieć co najmniej 1 znak",
    })
    .max(ValidationRules.topic.nameMaxLength, {
      message: "Nazwa tematu może mieć maksymalnie 100 znaków",
    }),
});

/**
 * Inferred type from updateTopicSchema
 * Should match UpdateTopicCommand from types.ts
 */
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
