import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios, { type AxiosInstance } from "axios";
import { OpenRouterService, OpenRouterServiceError } from "@/lib/services/openrouter.service";
import type {
  ChatMessage,
  ResponseFormat,
  OpenRouterServiceOptions,
  OpenRouterChatRequest,
  OpenRouterChatResponse,
} from "@/types";

// Mock axios
vi.mock("axios");
const mockAxios = vi.mocked(axios);
const mockAxiosInstance = {
  post: vi.fn(),
  defaults: {
    baseURL: "",
    headers: {},
  },
} as unknown as AxiosInstance;

// Mock axios.isAxiosError to return true for our mock errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockAxios.isAxiosError.mockImplementation((error: any) => {
  return error && error.isAxiosError === true;
});

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  const validApiKey = "test-api-key-123";

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup axios mock
    mockAxios.create.mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize successfully with valid API key and default options", () => {
      service = new OpenRouterService(validApiKey);

      expect(service).toBeInstanceOf(OpenRouterService);
      expect(service.apiKey).toBe(validApiKey);
      expect(service.apiUrl).toBe("https://openrouter.ai/api/v1");
      expect(service.defaultModel).toBe("mistralai/mistral-7b-instruct:free");
      expect(service.defaultParams).toEqual({
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Verify axios was created with correct config
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: "https://openrouter.ai/api/v1",
        headers: {
          Authorization: `Bearer ${validApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://edu-kids.app",
          "X-Title": "Edu Kids App",
        },
        timeout: 60000,
      });
    });

    it("should initialize with custom options", () => {
      const customOptions: OpenRouterServiceOptions = {
        apiUrl: "https://custom-api.example.com",
        defaultModel: "gpt-3.5-turbo",
        defaultParams: {
          temperature: 0.5,
          max_tokens: 500,
        },
      };

      service = new OpenRouterService(validApiKey, customOptions);

      expect(service.apiUrl).toBe("https://custom-api.example.com");
      expect(service.defaultModel).toBe("gpt-3.5-turbo");
      expect(service.defaultParams).toEqual({
        temperature: 0.5,
        max_tokens: 500,
      });
    });

    it("should throw OpenRouterServiceError when API key is empty string", () => {
      expect(() => {
        new OpenRouterService("");
      }).toThrow(OpenRouterServiceError);

      expect(() => {
        new OpenRouterService("");
      }).toThrow("API key is required");
    });

    it("should throw OpenRouterServiceError when API key is whitespace only", () => {
      expect(() => {
        new OpenRouterService("   ");
      }).toThrow(OpenRouterServiceError);

      expect(() => {
        new OpenRouterService("   ");
      }).toThrow("API key is required");
    });

    it("should throw OpenRouterServiceError when API key is null", () => {
      expect(() => {
        new OpenRouterService(null as unknown as string);
      }).toThrow(OpenRouterServiceError);
    });

    it("should throw OpenRouterServiceError when API key is undefined", () => {
      expect(() => {
        new OpenRouterService(undefined as unknown as string);
      }).toThrow(OpenRouterServiceError);
    });

    it("should accept custom options with partial configuration", () => {
      const partialOptions: Partial<OpenRouterServiceOptions> = {
        defaultModel: "custom-model",
      };

      service = new OpenRouterService(validApiKey, partialOptions);

      expect(service.defaultModel).toBe("custom-model");
      expect(service.apiUrl).toBe("https://openrouter.ai/api/v1"); // default
      expect(service.defaultParams.temperature).toBe(0.7); // default
    });
  });

  describe("sendChat", () => {
    let service: OpenRouterService;
    const validMessages: ChatMessage[] = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello!" },
    ];

    beforeEach(() => {
      service = new OpenRouterService(validApiKey);
    });

    describe("message validation", () => {
      it("should throw error when messages array is empty", async () => {
        await expect(service.sendChat([])).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat([])).rejects.toThrow("Messages array cannot be empty");
      });

      it("should throw error when messages is null", async () => {
        await expect(service.sendChat(null as unknown as ChatMessage[])).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(null as unknown as ChatMessage[])).rejects.toThrow(
          "Messages array cannot be empty"
        );
      });

      it("should throw error when message has no role", async () => {
        const invalidMessages = [{ content: "Hello" }] as ChatMessage[];

        await expect(service.sendChat(invalidMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(invalidMessages)).rejects.toThrow("Each message must have role and content");
      });

      it("should throw error when message has no content", async () => {
        const invalidMessages = [{ role: "user" }] as ChatMessage[];

        await expect(service.sendChat(invalidMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(invalidMessages)).rejects.toThrow("Each message must have role and content");
      });

      it("should throw error when message role is invalid", async () => {
        const invalidMessages = [{ role: "invalid" as "system", content: "Hello" }] as ChatMessage[];

        await expect(service.sendChat(invalidMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(invalidMessages)).rejects.toThrow("Message role must be 'system' or 'user'");
      });

      it("should throw error when message content is empty string", async () => {
        const invalidMessages: ChatMessage[] = [{ role: "user", content: "" }];

        await expect(service.sendChat(invalidMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(invalidMessages)).rejects.toThrow("Each message must have role and content");
      });

      it("should accept valid messages with system and user roles", async () => {
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "Hello there!" },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        const result = await service.sendChat(validMessages);

        expect(mockAxiosInstance.post).toHaveBeenCalled();
        expect(result).toBe("Hello there!");
      });
    });

    describe("successful API calls", () => {
      const mockResponse: OpenRouterChatResponse = {
        id: "test-id-123",
        model: "mistralai/mistral-7b-instruct:free",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "This is a test response." },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      };

      beforeEach(() => {
        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });
      });

      it("should send chat successfully with default parameters", async () => {
        const result = await service.sendChat(validMessages);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith("/chat/completions", {
          model: "mistralai/mistral-7b-instruct:free",
          messages: validMessages,
          temperature: 0.7,
          max_tokens: 1000,
        });
        expect(result).toBe("This is a test response.");
      });

      it("should send chat with custom model", async () => {
        const result = await service.sendChat(validMessages, undefined, "gpt-4");

        const callArgs = mockAxiosInstance.post.mock.calls[0][1] as OpenRouterChatRequest;
        expect(callArgs.model).toBe("gpt-4");
        expect(result).toBe("This is a test response.");
      });

      it("should send chat with custom parameters", async () => {
        const customParams = { temperature: 0.9, max_tokens: 2000, top_p: 0.8 };

        await service.sendChat(validMessages, undefined, undefined, customParams);

        const callArgs = mockAxiosInstance.post.mock.calls[0][1] as OpenRouterChatRequest;
        expect(callArgs).toMatchObject({
          model: "mistralai/mistral-7b-instruct:free",
          messages: validMessages,
          temperature: 0.9,
          max_tokens: 2000,
          top_p: 0.8,
        });
      });

      it("should send chat with response format", async () => {
        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "TestSchema",
            strict: true,
            schema: { answer: "string" }, // Simplified schema for basic validation
          },
        };

        // Mock response with JSON content that matches the simple schema
        const jsonMockResponse: OpenRouterChatResponse = {
          ...mockResponse,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: '{"answer": "test"}' },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: jsonMockResponse });

        const result = await service.sendChat(validMessages, responseFormat);

        const callArgs = mockAxiosInstance.post.mock.calls[0][1] as OpenRouterChatRequest;
        expect(callArgs.response_format).toBe(responseFormat);
        expect(result).toEqual({ answer: "test" });
      });

      it("should merge custom params with default params", async () => {
        const customParams = { temperature: 0.5 };

        await service.sendChat(validMessages, undefined, undefined, customParams);

        const callArgs = mockAxiosInstance.post.mock.calls[0][1] as OpenRouterChatRequest;
        expect(callArgs).toMatchObject({
          temperature: 0.5, // custom
          max_tokens: 1000, // default
        });
      });

      it("should handle response with usage information", async () => {
        const result = await service.sendChat(validMessages);

        expect(result).toBe("This is a test response.");
        // Usage info is part of the response but not returned by sendChat
      });
    });

    describe("error handling", () => {
      it("should handle timeout errors", async () => {
        const timeoutError = {
          isAxiosError: true,
          code: "ECONNABORTED",
          message: "Timeout",
        };
        mockAxiosInstance.post.mockRejectedValue(timeoutError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow(
          "Request timeout - the API took too long to respond"
        );
      });

      it("should handle network errors", async () => {
        const networkError = {
          isAxiosError: true,
          code: "ENOTFOUND",
          message: "Network Error",
        };
        mockAxiosInstance.post.mockRejectedValue(networkError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Network error - unable to reach OpenRouter API");
      });

      it("should handle 400 Bad Request errors", async () => {
        const axiosError = {
          isAxiosError: true,
          response: {
            status: 400,
            data: { error: { code: "INVALID_REQUEST", message: "Bad request parameters" } },
          },
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Bad request parameters");
      });

      it("should handle 401 Unauthorized errors", async () => {
        const axiosError = {
          isAxiosError: true,
          response: {
            status: 401,
            data: { error: { code: "UNAUTHORIZED", message: "Invalid API key" } },
          },
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Invalid API key");
      });

      it("should handle 403 Forbidden errors", async () => {
        const axiosError = {
          isAxiosError: true,
          response: { status: 403, data: {} },
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Forbidden - access denied");
      });

      it("should handle 404 Not Found errors", async () => {
        const axiosError = {
          isAxiosError: true,
          response: { status: 404, data: {} },
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Not found - invalid endpoint or model");
      });

      it("should handle 429 Rate Limit errors", async () => {
        const axiosError = {
          isAxiosError: true,
          response: { status: 429, data: {} },
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Rate limit exceeded - too many requests");
      });

      it("should handle 500 Server errors", async () => {
        const axiosError = {
          isAxiosError: true,
          response: { status: 500, data: {} },
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Server error - OpenRouter API is unavailable");
      });

      it("should handle generic HTTP errors", async () => {
        const axiosError = {
          isAxiosError: true,
          response: { status: 418, data: {} }, // I'm a teapot
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("HTTP error 418");
      });

      it("should handle non-axios errors", async () => {
        mockAxiosInstance.post.mockRejectedValue(new Error("Some other error"));

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Some other error");
      });

      it("should handle errors thrown as strings", async () => {
        mockAxiosInstance.post.mockRejectedValue("String error");

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("An unknown error occurred");
      });

      it("should preserve OpenRouterServiceError instances", async () => {
        const customError = new OpenRouterServiceError("Custom error", "CUSTOM_CODE", 418);
        mockAxiosInstance.post.mockRejectedValue(customError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(customError);
      });
    });

    describe("response parsing", () => {
      it("should return raw content when no response format specified", async () => {
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "Raw text response" },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        const result = await service.sendChat(validMessages);

        expect(result).toBe("Raw text response");
      });

      it("should parse and return JSON when response format specified", async () => {
        const jsonContent = '{"answer": "42", "confidence": 0.95}';
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: jsonContent },
              finish_reason: "stop",
            },
          ],
        };

        // Use simple schema format that matches the basic validation implementation
        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "AnswerSchema",
            strict: true,
            schema: { answer: "string", confidence: "number" }, // Simple key-value pairs
          },
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        const result = await service.sendChat(validMessages, responseFormat);

        expect(result).toEqual({ answer: "42", confidence: 0.95 });
      });

      it("should throw error when response has no choices", async () => {
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("No choices in API response");
      });

      it("should throw error when JSON parsing fails", async () => {
        const invalidJson = '{"invalid": json content}';
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: invalidJson },
              finish_reason: "stop",
            },
          ],
        };

        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "TestSchema",
            strict: true,
            schema: { answer: "string" },
          },
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await expect(service.sendChat(validMessages, responseFormat)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages, responseFormat)).rejects.toThrow("Failed to parse JSON response");
      });

      it("should skip schema validation when strict is false", async () => {
        const jsonContent = '{"unexpectedField": "value"}';
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: jsonContent },
              finish_reason: "stop",
            },
          ],
        };

        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "TestSchema",
            strict: false, // Not strict
            schema: { expectedField: "string" },
          },
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        const result = await service.sendChat(validMessages, responseFormat);

        expect(result).toEqual({ unexpectedField: "value" });
      });

      it("should throw error when schema validation fails", async () => {
        const invalidJson = '{"missingRequiredField": "value"}';
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: invalidJson },
              finish_reason: "stop",
            },
          ],
        };

        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "TestSchema",
            strict: true,
            schema: { requiredField: "string" }, // Expects 'requiredField' to exist
          },
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await expect(service.sendChat(validMessages, responseFormat)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages, responseFormat)).rejects.toThrow(
          "Response does not match expected schema"
        );
      });

      it("should handle empty message content", async () => {
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "" },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        const result = await service.sendChat(validMessages);

        expect(result).toBe("");
      });
    });
  });

  describe("configure", () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService(validApiKey);
    });

    it("should update apiUrl and axios baseURL", () => {
      service.configure({ apiUrl: "https://new-api.example.com" });

      expect(service.apiUrl).toBe("https://new-api.example.com");
      expect(mockAxiosInstance.defaults.baseURL).toBe("https://new-api.example.com");
    });

    it("should update defaultModel", () => {
      service.configure({ defaultModel: "new-model" });

      expect(service.defaultModel).toBe("new-model");
    });

    it("should merge defaultParams", () => {
      service.configure({
        defaultParams: {
          temperature: 0.8,
          new_param: "value",
        },
      });

      expect(service.defaultParams).toEqual({
        temperature: 0.8, // updated
        max_tokens: 1000, // preserved
        new_param: "value", // added
      });
    });

    it("should handle partial configuration updates", () => {
      const originalApiUrl = service.apiUrl;
      const originalModel = service.defaultModel;

      service.configure({ defaultParams: { temperature: 0.9 } });

      expect(service.apiUrl).toBe(originalApiUrl);
      expect(service.defaultModel).toBe(originalModel);
      expect(service.defaultParams.temperature).toBe(0.9);
    });

    it("should handle empty configuration object", () => {
      const originalConfig = {
        apiUrl: service.apiUrl,
        defaultModel: service.defaultModel,
        defaultParams: { ...service.defaultParams },
      };

      service.configure({});

      expect(service.apiUrl).toBe(originalConfig.apiUrl);
      expect(service.defaultModel).toBe(originalConfig.defaultModel);
      expect(service.defaultParams).toEqual(originalConfig.defaultParams);
    });
  });

  describe("private methods (tested through public interface)", () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService(validApiKey);
    });

    describe("formatPayload", () => {
      it("should format payload with defaults", async () => {
        const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];

        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "Hi there!" },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await service.sendChat(messages);

        const callArgs = mockAxiosInstance.post.mock.calls[0][1] as OpenRouterChatRequest;
        expect(callArgs).toEqual({
          model: "mistralai/mistral-7b-instruct:free",
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        });
      });

      it("should include response_format when provided", async () => {
        const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "Test",
            strict: true,
            schema: { type: "object" },
          },
        };

        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: '{"type": "object"}' }, // Must include 'type' field
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await service.sendChat(messages, responseFormat);

        const callArgs = mockAxiosInstance.post.mock.calls[0][1] as OpenRouterChatRequest;
        expect(callArgs.response_format).toBe(responseFormat);
      });
    });

    describe("validateSchema", () => {
      it("should validate simple object schema", async () => {
        const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "Test",
            strict: true,
            schema: { name: "string", age: "number" }, // Simple schema format
          },
        };

        // Valid response
        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: '{"name": "John", "age": 30}' },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        const result = await service.sendChat(messages, responseFormat);
        expect(result).toEqual({ name: "John", age: 30 });
      });

      it("should reject non-object data", async () => {
        const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "Test",
            strict: true,
            schema: { type: "object" }, // Schema expects 'type' field
          },
        };

        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: '"string instead of object"' },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await expect(service.sendChat(messages, responseFormat)).rejects.toThrow(
          "Response does not match expected schema"
        );
      });

      it("should reject null data", async () => {
        const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "Test",
            strict: true,
            schema: { type: "object" },
          },
        };

        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "null" },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await expect(service.sendChat(messages, responseFormat)).rejects.toThrow(
          "Response does not match expected schema"
        );
      });

      it("should reject data missing required fields", async () => {
        const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
        const responseFormat: ResponseFormat = {
          type: "json_schema",
          json_schema: {
            name: "Test",
            strict: true,
            schema: { requiredField: "string" }, // Expects 'requiredField' to exist
          },
        };

        const mockResponse: OpenRouterChatResponse = {
          id: "test-id",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: '{"optionalField": "value"}' },
              finish_reason: "stop",
            },
          ],
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await expect(service.sendChat(messages, responseFormat)).rejects.toThrow(
          "Response does not match expected schema"
        );
      });
    });

    describe("handleError edge cases", () => {
      const validMessages: ChatMessage[] = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" },
      ];

      beforeEach(() => {
        service = new OpenRouterService(validApiKey);
      });

      it("should handle axios errors without response", async () => {
        const axiosError = {
          isAxiosError: true,
          code: "NETWORK_ERROR",
          message: "Network failed",
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Network error");
      });

      it("should handle axios errors with malformed response data", async () => {
        const axiosError = {
          isAxiosError: true,
          response: {
            status: 400,
            data: "string instead of object", // malformed
          },
        };
        mockAxiosInstance.post.mockRejectedValue(axiosError);

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("Bad request");
      });

      it("should handle unknown error types", async () => {
        mockAxiosInstance.post.mockRejectedValue(42); // number error

        await expect(service.sendChat(validMessages)).rejects.toThrow(OpenRouterServiceError);
        await expect(service.sendChat(validMessages)).rejects.toThrow("An unknown error occurred");
      });
    });
  });

  describe("integration scenarios", () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService(validApiKey);
    });

    it("should handle complete conversation flow", async () => {
      const conversation: ChatMessage[] = [
        { role: "system", content: "You are a math tutor for kids." },
        { role: "user", content: "What is 2 + 2?" },
      ];

      const responseFormat: ResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "MathAnswer",
          strict: true,
          schema: { answer: "string", explanation: "string" }, // Simple schema format
        },
      };

      const mockResponse: OpenRouterChatResponse = {
        id: "conversation-id",
        model: "mistralai/mistral-7b-instruct:free",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: '{"answer": "4", "explanation": "2 + 2 equals 4"}',
            },
            finish_reason: "stop",
          },
        ],
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await service.sendChat(conversation, responseFormat, "custom-model", {
        temperature: 0.3,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/chat/completions", {
        model: "custom-model",
        messages: conversation,
        response_format: responseFormat,
        temperature: 0.3,
        max_tokens: 1000, // default
      });

      expect(result).toEqual({
        answer: "4",
        explanation: "2 + 2 equals 4",
      });
    });

    it("should handle service reconfiguration mid-usage", async () => {
      // First call with defaults
      const mockResponse1: OpenRouterChatResponse = {
        id: "test-id-1",
        model: "default-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Response 1" },
            finish_reason: "stop",
          },
        ],
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse1 });

      await service.sendChat([{ role: "user", content: "Hello" }]);

      let callArgs = mockAxiosInstance.post.mock.calls[0][1] as OpenRouterChatRequest;
      expect(callArgs.model).toBe("mistralai/mistral-7b-instruct:free");

      // Reconfigure service
      service.configure({
        defaultModel: "reconfigured-model",
        defaultParams: { temperature: 0.5 },
      });

      // Second call with new defaults
      const mockResponse2: OpenRouterChatResponse = {
        id: "test-id-2",
        model: "reconfigured-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Response 2" },
            finish_reason: "stop",
          },
        ],
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse2 });

      await service.sendChat([{ role: "user", content: "Hello again" }]);

      callArgs = mockAxiosInstance.post.mock.calls[1][1] as OpenRouterChatRequest;
      expect(callArgs.model).toBe("reconfigured-model");
      expect(callArgs.temperature).toBe(0.5);
    });
  });
});
