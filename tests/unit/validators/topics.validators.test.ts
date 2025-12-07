import { describe, it, expect } from "vitest";
import {
  createTopicSchema,
  updateTopicSchema,
  type CreateTopicInput,
  type UpdateTopicInput,
} from "@/lib/validators/topics.validators";
import { ValidationRules } from "@/types";

/**
 * Test suite for topic validators
 *
 * Tests cover all Zod schemas used in topic endpoints,
 * including happy paths, error conditions, and edge cases.
 */
describe("Topics Validators", () => {
  describe("createTopicSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid topic names", () => {
        const validInputs: CreateTopicInput[] = [
          { name: "Mathematics" },
          { name: "Science" },
          { name: "History" },
          { name: "A" }, // minimum length (1)
          { name: "a".repeat(100) }, // maximum length (100)
          { name: "Topic with spaces" },
          { name: "Topic-with-dashes" },
          { name: "Topic_with_underscores" },
          { name: "Topic123" },
          { name: "Тема на русском" }, // unicode characters
          { name: "   Topic with leading spaces   " }, // should be trimmed
        ];

        validInputs.forEach((input) => {
          const result = createTopicSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.name).toBe(input.name.trim()); // verify trimming
          }
        });
      });

      it("should accept topic name with minimum length", () => {
        const validInput: CreateTopicInput = {
          name: "A", // exactly minimum length
        };

        const result = createTopicSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe("A");
        }
      });

      it("should accept topic name with maximum length", () => {
        const validInput: CreateTopicInput = {
          name: "a".repeat(ValidationRules.topic.nameMaxLength), // exactly maximum length
        };

        const result = createTopicSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name.length).toBe(ValidationRules.topic.nameMaxLength);
        }
      });

      it("should trim whitespace from topic names", () => {
        const inputsWithWhitespace: CreateTopicInput[] = [
          { name: "  Topic" },
          { name: "Topic  " },
          { name: "  Topic  " },
          { name: "\tTopic\t" },
          { name: "\nTopic\n" },
        ];

        inputsWithWhitespace.forEach((input) => {
          const result = createTopicSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.name).toBe("Topic"); // should be trimmed
          }
        });
      });

      it("should accept topic names with special characters", () => {
        const validInputs: CreateTopicInput[] = [
          { name: "Topic!" },
          { name: "Topic@#" },
          { name: "Topic$%^" },
          { name: "Topic&*()" },
          { name: "Topic-=_+" },
          { name: "Topic[]{}" },
          { name: 'Topic|\\:;"' },
          { name: "Topic<>?" },
        ];

        validInputs.forEach((input) => {
          const result = createTopicSchema.safeParse(input);
          expect(result.success).toBe(true);
        });
      });
    });

    describe("invalid inputs", () => {
      it("should reject empty topic names", () => {
        const invalidInputs = [
          { name: "" },
          { name: "   " }, // only whitespace
          { name: "\t" }, // only tabs
          { name: "\n" }, // only newlines
        ];

        invalidInputs.forEach((input) => {
          const result = createTopicSchema.safeParse(input);
          expect(result.success).toBe(false);
          expect(result.error?.issues[0].message).toBe("Nazwa tematu musi mieć co najmniej 1 znak");
        });
      });

      it("should reject topic names that are too long", () => {
        const invalidInputs = [
          { name: "a".repeat(ValidationRules.topic.nameMaxLength + 1) }, // 101 chars
          { name: "a".repeat(200) }, // much longer
          {
            name: "This is a very long topic name that definitely exceeds the maximum allowed length of one hundred characters for sure",
          },
        ];

        invalidInputs.forEach((input) => {
          const result = createTopicSchema.safeParse(input);
          expect(result.success).toBe(false);
          expect(result.error?.issues[0].message).toBe("Nazwa tematu może mieć maksymalnie 100 znaków");
        });
      });

      it("should reject missing name field", () => {
        const invalidInput = {};

        const result = createTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });
    });

    describe("edge cases", () => {
      it("should handle null values", () => {
        const invalidInput = {
          name: null,
        };

        const result = createTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });

      it("should handle undefined values", () => {
        const invalidInput = {
          name: undefined,
        };

        const result = createTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });

      it("should handle numeric values", () => {
        const invalidInput = {
          name: 123,
        };

        const result = createTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });

      it("should handle boolean values", () => {
        const invalidInputs = [{ name: true }, { name: false }];

        invalidInputs.forEach((input) => {
          const result = createTopicSchema.safeParse(input);
          expect(result.success).toBe(false);
          expect(result.error?.issues[0].path).toContain("name");
        });
      });

      it("should handle array values", () => {
        const invalidInput = {
          name: ["Topic"],
        };

        const result = createTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });

      it("should handle object values", () => {
        const invalidInput = {
          name: { topic: "Topic" },
        };

        const result = createTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });

      it("should handle topic name at exact boundaries", () => {
        const boundaryInputs = [
          { name: "", expected: false }, // 0 chars - invalid
          { name: "a", expected: true }, // 1 char - valid
          { name: "a".repeat(100), expected: true }, // 100 chars - valid
          { name: "a".repeat(101), expected: false }, // 101 chars - invalid
        ];

        boundaryInputs.forEach(({ name, expected }) => {
          const result = createTopicSchema.safeParse({ name });
          expect(result.success).toBe(expected);
        });
      });
    });
  });

  describe("updateTopicSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid topic names", () => {
        const validInputs: UpdateTopicInput[] = [
          { name: "Mathematics" },
          { name: "Science" },
          { name: "A" }, // minimum length
          { name: "a".repeat(100) }, // maximum length
          { name: "Topic with spaces" },
          { name: "   Topic with leading spaces   " }, // should be trimmed
        ];

        validInputs.forEach((input) => {
          const result = updateTopicSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.name).toBe(input.name.trim()); // verify trimming
          }
        });
      });

      it("should trim whitespace from topic names", () => {
        const input: UpdateTopicInput = {
          name: "  Topic Name  ",
        };

        const result = updateTopicSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe("Topic Name");
        }
      });
    });

    describe("invalid inputs", () => {
      it("should reject empty topic names", () => {
        const invalidInputs = [
          { name: "" },
          { name: "   " }, // only whitespace
        ];

        invalidInputs.forEach((input) => {
          const result = updateTopicSchema.safeParse(input);
          expect(result.success).toBe(false);
          expect(result.error?.issues[0].message).toBe("Nazwa tematu musi mieć co najmniej 1 znak");
        });
      });

      it("should reject topic names that are too long", () => {
        const invalidInput: UpdateTopicInput = {
          name: "a".repeat(ValidationRules.topic.nameMaxLength + 1),
        };

        const result = updateTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Nazwa tematu może mieć maksymalnie 100 znaków");
      });

      it("should reject missing name field", () => {
        const invalidInput = {};

        const result = updateTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });
    });

    describe("edge cases", () => {
      it("should handle null values", () => {
        const invalidInput = {
          name: null,
        };

        const result = updateTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });

      it("should handle undefined values", () => {
        const invalidInput = {
          name: undefined,
        };

        const result = updateTopicSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain("name");
      });
    });
  });

  describe("schema consistency", () => {
    it("should have identical validation rules for create and update schemas", () => {
      const testInput = { name: "Test Topic" };

      const createResult = createTopicSchema.safeParse(testInput);
      const updateResult = updateTopicSchema.safeParse(testInput);

      expect(createResult.success).toBe(updateResult.success);
      if (createResult.success && updateResult.success) {
        expect(createResult.data).toEqual(updateResult.data);
      }
    });

    it("should reject the same invalid inputs for both schemas", () => {
      const invalidInputs = [{ name: "" }, { name: "a".repeat(101) }, { name: null }];

      invalidInputs.forEach((input) => {
        const createResult = createTopicSchema.safeParse(input);
        const updateResult = updateTopicSchema.safeParse(input);

        expect(createResult.success).toBe(updateResult.success);
        expect(createResult.success).toBe(false);
      });
    });
  });

  describe("type exports", () => {
    it("should export CreateTopicInput type", () => {
      // Test that the type can be used (TypeScript compilation check)
      const input: CreateTopicInput = { name: "Test Topic" };
      expect(input).toBeDefined();
      expect(typeof input.name).toBe("string");
    });

    it("should export UpdateTopicInput type", () => {
      // Test that the type can be used (TypeScript compilation check)
      const input: UpdateTopicInput = { name: "Updated Topic" };
      expect(input).toBeDefined();
      expect(typeof input.name).toBe("string");
    });

    it("should have matching type structures", () => {
      // Both types should have the same structure since they use the same schema
      const createInput: CreateTopicInput = { name: "Topic" };
      const updateInput: UpdateTopicInput = { name: "Topic" };

      expect(createInput).toEqual(updateInput);
    });
  });
});
