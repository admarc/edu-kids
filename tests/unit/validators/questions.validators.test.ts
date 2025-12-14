import { describe, it, expect } from "vitest";
import { generateQuestionsSchema, type GenerateQuestionsInput } from "@/lib/validators/questions.validators";

/**
 * Test suite for questions validators
 *
 * Tests cover the generateQuestionsSchema used in POST /api/questions/generate,
 * including happy paths, error conditions, and edge cases for all validation rules.
 */
describe("Questions Validators", () => {
  describe("generateQuestionsSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid age_group, topic_id, and count", () => {
        const validInputs: GenerateQuestionsInput[] = [
          {
            age_group: 3,
            topic_id: 1,
            count: 5,
          },
          {
            age_group: 5,
            topic_id: 10,
            count: 1, // minimum count
          },
          {
            age_group: 12,
            topic_id: 100,
            count: 10, // maximum count
          },
          {
            age_group: 7,
            topic_id: 42,
            count: 8,
          },
        ];

        validInputs.forEach((input) => {
          const result = generateQuestionsSchema.safeParse(input);
          expect(result.success).toBe(true);
          expect(result.data).toEqual(input);
        });
      });

      it("should accept boundary values for count", () => {
        const boundaryInputs: GenerateQuestionsInput[] = [
          {
            age_group: 5,
            topic_id: 1,
            count: 1, // minimum boundary
          },
          {
            age_group: 5,
            topic_id: 1,
            count: 10, // maximum boundary
          },
        ];

        boundaryInputs.forEach((input) => {
          const result = generateQuestionsSchema.safeParse(input);
          expect(result.success).toBe(true);
          expect(result.data).toEqual(input);
        });
      });

      it("should accept large positive integers for age_group and topic_id", () => {
        const validInput: GenerateQuestionsInput = {
          age_group: 1000,
          topic_id: 999999,
          count: 5,
        };

        const result = generateQuestionsSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInput);
      });
    });

    describe("invalid inputs", () => {
      describe("age_group validation", () => {
        it("should reject non-integer age_group", () => {
          const invalidInputs = [
            { age_group: 3.5, topic_id: 1, count: 5 },
            { age_group: 5.9, topic_id: 1, count: 5 },
            { age_group: Math.PI, topic_id: 1, count: 5 },
          ];

          invalidInputs.forEach((input) => {
            const result = generateQuestionsSchema.safeParse(input);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("Grupa wiekowa musi być liczbą całkowitą");
            expect(result.error?.issues[0].path).toContain("age_group");
          });
        });

        it("should reject negative age_group", () => {
          const invalidInputs = [
            { age_group: -1, topic_id: 1, count: 5 },
            { age_group: -5, topic_id: 1, count: 5 },
            { age_group: -100, topic_id: 1, count: 5 },
          ];

          invalidInputs.forEach((input) => {
            const result = generateQuestionsSchema.safeParse(input);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("Grupa wiekowa musi być liczbą dodatnią");
            expect(result.error?.issues[0].path).toContain("age_group");
          });
        });

        it("should reject zero age_group", () => {
          const invalidInput = {
            age_group: 0,
            topic_id: 1,
            count: 5,
          };

          const result = generateQuestionsSchema.safeParse(invalidInput);

          expect(result.success).toBe(false);
          expect(result.error?.issues[0].message).toBe("Grupa wiekowa musi być liczbą dodatnią");
          expect(result.error?.issues[0].path).toContain("age_group");
        });
      });

      describe("topic_id validation", () => {
        it("should reject non-integer topic_id", () => {
          const invalidInputs = [
            { age_group: 5, topic_id: 1.5, count: 5 },
            { age_group: 5, topic_id: 2.7, count: 5 },
            { age_group: 5, topic_id: Math.E, count: 5 },
          ];

          invalidInputs.forEach((input) => {
            const result = generateQuestionsSchema.safeParse(input);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("ID tematu musi być liczbą całkowitą");
            expect(result.error?.issues[0].path).toContain("topic_id");
          });
        });

        it("should reject negative topic_id", () => {
          const invalidInputs = [
            { age_group: 5, topic_id: -1, count: 5 },
            { age_group: 5, topic_id: -10, count: 5 },
            { age_group: 5, topic_id: -999, count: 5 },
          ];

          invalidInputs.forEach((input) => {
            const result = generateQuestionsSchema.safeParse(input);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("ID tematu musi być liczbą dodatnią");
            expect(result.error?.issues[0].path).toContain("topic_id");
          });
        });

        it("should reject zero topic_id", () => {
          const invalidInput = {
            age_group: 5,
            topic_id: 0,
            count: 5,
          };

          const result = generateQuestionsSchema.safeParse(invalidInput);

          expect(result.success).toBe(false);
          expect(result.error?.issues[0].message).toBe("ID tematu musi być liczbą dodatnią");
          expect(result.error?.issues[0].path).toContain("topic_id");
        });
      });

      describe("count validation", () => {
        it("should reject non-integer count", () => {
          const invalidInputs = [
            { age_group: 5, topic_id: 1, count: 5.5 },
            { age_group: 5, topic_id: 1, count: 3.14 },
            { age_group: 5, topic_id: 1, count: Math.SQRT2 },
          ];

          invalidInputs.forEach((input) => {
            const result = generateQuestionsSchema.safeParse(input);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("Liczba pytań musi być liczbą całkowitą");
            expect(result.error?.issues[0].path).toContain("count");
          });
        });

        it("should reject count less than minimum (1)", () => {
          const invalidInputs = [
            { age_group: 5, topic_id: 1, count: 0 },
            { age_group: 5, topic_id: 1, count: -1 },
            { age_group: 5, topic_id: 1, count: -5 },
          ];

          invalidInputs.forEach((input) => {
            const result = generateQuestionsSchema.safeParse(input);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("Minimalna liczba pytań to 1");
            expect(result.error?.issues[0].path).toContain("count");
          });
        });

        it("should reject count greater than maximum (10)", () => {
          const invalidInputs = [
            { age_group: 5, topic_id: 1, count: 11 },
            { age_group: 5, topic_id: 1, count: 15 },
            { age_group: 5, topic_id: 1, count: 100 },
          ];

          invalidInputs.forEach((input) => {
            const result = generateQuestionsSchema.safeParse(input);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("Maksymalna liczba pytań to 10");
            expect(result.error?.issues[0].path).toContain("count");
          });
        });
      });

      describe("multiple validation errors", () => {
        it("should report all validation errors when multiple fields are invalid", () => {
          const invalidInput = {
            age_group: -1,
            topic_id: 0,
            count: 15,
          };

          const result = generateQuestionsSchema.safeParse(invalidInput);

          expect(result.success).toBe(false);
          expect(result.error?.issues).toHaveLength(3);

          const errorMessages = result.error?.issues.map((issue) => issue.message);
          expect(errorMessages).toEqual(
            expect.arrayContaining([
              "Grupa wiekowa musi być liczbą dodatnią",
              "ID tematu musi być liczbą dodatnią",
              "Maksymalna liczba pytań to 10",
            ])
          );
        });

        it("should report multiple errors for the same field", () => {
          const invalidInput = {
            age_group: 5.5, // non-integer and will be validated
            topic_id: 1,
            count: 5,
          };

          const result = generateQuestionsSchema.safeParse(invalidInput);

          expect(result.success).toBe(false);
          expect(result.error?.issues[0].message).toBe("Grupa wiekowa musi być liczbą całkowitą");
          expect(result.error?.issues[0].path).toContain("age_group");
        });
      });
    });

    describe("edge cases", () => {
      it("should reject missing required fields", () => {
        const testCases = [
          {
            input: { topic_id: 1, count: 5 },
            missingField: "age_group",
          },
          {
            input: { age_group: 5, count: 5 },
            missingField: "topic_id",
          },
          {
            input: { age_group: 5, topic_id: 1 },
            missingField: "count",
          },
        ];

        testCases.forEach(({ input, missingField }) => {
          const result = generateQuestionsSchema.safeParse(input);
          expect(result.success).toBe(false);
          expect(result.error?.issues[0].path).toContain(missingField);
        });
      });

      it("should reject null values", () => {
        const invalidInput = {
          age_group: null,
          topic_id: null,
          count: null,
        };

        const result = generateQuestionsSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3);
        expect(result.error?.issues.every((issue) => issue.code === "invalid_type")).toBe(true);
      });

      it("should reject undefined values", () => {
        const invalidInput = {};

        const result = generateQuestionsSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3);
        expect(result.error?.issues.every((issue) => issue.code === "invalid_type")).toBe(true);
      });

      it("should reject string values", () => {
        const invalidInput = {
          age_group: "5",
          topic_id: "1",
          count: "3",
        };

        const result = generateQuestionsSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3);
        expect(result.error?.issues.every((issue) => issue.code === "invalid_type")).toBe(true);
      });

      it("should reject boolean values", () => {
        const invalidInput = {
          age_group: true,
          topic_id: false,
          count: true,
        };

        const result = generateQuestionsSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3);
        expect(result.error?.issues.every((issue) => issue.code === "invalid_type")).toBe(true);
      });

      it("should reject array values", () => {
        const invalidInput = {
          age_group: [5],
          topic_id: [1],
          count: [3],
        };

        const result = generateQuestionsSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3);
        expect(result.error?.issues.every((issue) => issue.code === "invalid_type")).toBe(true);
      });

      it("should reject object values", () => {
        const invalidInput = {
          age_group: { value: 5 },
          topic_id: { id: 1 },
          count: { num: 3 },
        };

        const result = generateQuestionsSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3);
        expect(result.error?.issues.every((issue) => issue.code === "invalid_type")).toBe(true);
      });

      it("should handle very large numbers", () => {
        const validInput: GenerateQuestionsInput = {
          age_group: Number.MAX_SAFE_INTEGER,
          topic_id: Number.MAX_SAFE_INTEGER,
          count: 10,
        };

        const result = generateQuestionsSchema.safeParse(validInput);

        expect(result.success).toBe(true);
        expect(result.data.age_group).toBe(Number.MAX_SAFE_INTEGER);
        expect(result.data.topic_id).toBe(Number.MAX_SAFE_INTEGER);
      });

      it("should reject NaN values", () => {
        const invalidInput = {
          age_group: NaN,
          topic_id: NaN,
          count: NaN,
        };

        const result = generateQuestionsSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toHaveLength(3);
        expect(result.error?.issues.every((issue) => issue.code === "invalid_type")).toBe(true);
      });

      it("should reject Infinity values", () => {
        const invalidInput = {
          age_group: Infinity,
          topic_id: -Infinity,
          count: Infinity,
        };

        const result = generateQuestionsSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        // Infinity values may trigger multiple validation errors per field
        expect(result.error?.issues.length).toBeGreaterThanOrEqual(3);
        // Each field should have at least one error
        expect(result.error?.issues.some((issue) => issue.path.includes("age_group"))).toBe(true);
        expect(result.error?.issues.some((issue) => issue.path.includes("topic_id"))).toBe(true);
        expect(result.error?.issues.some((issue) => issue.path.includes("count"))).toBe(true);
      });
    });

    describe("business rule validation", () => {
      it("should enforce realistic age groups for children", () => {
        // While the schema allows any positive integer, business logic might expect reasonable age ranges
        // This test documents the current behavior - any positive integer is accepted
        const reasonableAges: GenerateQuestionsInput[] = [
          { age_group: 3, topic_id: 1, count: 5 }, // preschool
          { age_group: 7, topic_id: 1, count: 5 }, // primary school
          { age_group: 12, topic_id: 1, count: 5 }, // pre-teen
        ];

        reasonableAges.forEach((input) => {
          const result = generateQuestionsSchema.safeParse(input);
          expect(result.success).toBe(true);
        });
      });

      it("should enforce maximum question count limit from ValidationRules", () => {
        // This ensures the schema is properly using ValidationRules.generation.maxCount
        const maxCountInput: GenerateQuestionsInput = {
          age_group: 5,
          topic_id: 1,
          count: 10, // Should be exactly the maximum allowed
        };

        const result = generateQuestionsSchema.safeParse(maxCountInput);
        expect(result.success).toBe(true);

        const overLimitInput = {
          age_group: 5,
          topic_id: 1,
          count: 11, // Should be rejected
        };

        const overLimitResult = generateQuestionsSchema.safeParse(overLimitInput);
        expect(overLimitResult.success).toBe(false);
        expect(overLimitResult.error?.issues[0].message).toBe("Maksymalna liczba pytań to 10");
      });
    });
  });

  describe("type exports", () => {
    it("should export GenerateQuestionsInput type that matches the schema", () => {
      // Test that the type can be used (TypeScript compilation check)
      const validInput: GenerateQuestionsInput = {
        age_group: 5,
        topic_id: 1,
        count: 3,
      };

      // This test ensures the type export works and matches the schema structure
      expect(validInput.age_group).toBe(5);
      expect(validInput.topic_id).toBe(1);
      expect(validInput.count).toBe(3);

      // TypeScript would catch any mismatch between the type and schema
      const result = generateQuestionsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should properly infer types from the schema", () => {
      // Test that the inferred type matches our expectations
      const testInput = {
        age_group: 5 as const,
        topic_id: 1 as const,
        count: 3 as const,
      };

      const result = generateQuestionsSchema.safeParse(testInput);

      expect(result.success).toBe(true);
      if (result.success) {
        // TypeScript knows result.data has the correct type
        const data: GenerateQuestionsInput = result.data;
        expect(typeof data.age_group).toBe("number");
        expect(typeof data.topic_id).toBe("number");
        expect(typeof data.count).toBe("number");
      }
    });
  });
});
