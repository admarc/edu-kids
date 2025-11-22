/**
 * OpenRouter Service
 *
 * Service for communicating with OpenRouter API for LLM-based chat completions.
 * Provides structured JSON responses with error handling and validation.
 */

import axios, { type AxiosInstance, type AxiosError } from "axios";
import type {
  ChatMessage,
  ResponseFormat,
  OpenRouterServiceOptions,
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterError,
} from "../../types";

/**
 * Custom error class for OpenRouter service errors
 */
export class OpenRouterServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterServiceError";
  }
}

/**
 * OpenRouter Service class for LLM chat completions
 */
export class OpenRouterService {
  private readonly axiosInstance: AxiosInstance;

  public readonly apiKey: string;
  public apiUrl: string;
  public defaultModel: string;
  public defaultParams: Record<string, number | string | boolean>;

  /**
   * Creates a new OpenRouter service instance
   *
   * @param apiKey - OpenRouter API key (should be from environment variables)
   * @param options - Optional configuration options
   */
  constructor(apiKey: string, options?: OpenRouterServiceOptions) {
    // Validate API key
    if (!apiKey || apiKey.trim() === "") {
      throw new OpenRouterServiceError("API key is required", "MISSING_API_KEY");
    }

    this.apiKey = apiKey;
    this.apiUrl = options?.apiUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = options?.defaultModel || "mistralai/mistral-7b-instruct:free";
    this.defaultParams = options?.defaultParams || {
      temperature: 0.7,
      max_tokens: 1000,
    };

    // Initialize axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://edu-kids.app",
        "X-Title": "Edu Kids App",
      },
      timeout: 60000, // 60 seconds timeout
    });
  }

  /**
   * Sends chat messages to OpenRouter API and returns parsed response
   *
   * @param messages - Array of chat messages (system + user)
   * @param responseFormat - Optional JSON schema for structured response
   * @param model - Optional model name (defaults to defaultModel)
   * @param params - Optional model parameters (temperature, max_tokens, etc.)
   * @returns Parsed response according to responseFormat schema
   */
  public async sendChat(
    messages: ChatMessage[],
    responseFormat?: ResponseFormat,
    model?: string,
    params?: Record<string, number | string | boolean>
  ): Promise<unknown> {
    // Validate messages
    if (!messages || messages.length === 0) {
      throw new OpenRouterServiceError("Messages array cannot be empty", "INVALID_MESSAGES");
    }

    // Validate message structure
    for (const message of messages) {
      if (!message.role || !message.content) {
        throw new OpenRouterServiceError("Each message must have role and content", "INVALID_MESSAGE_FORMAT");
      }
      if (message.role !== "system" && message.role !== "user") {
        throw new OpenRouterServiceError("Message role must be 'system' or 'user'", "INVALID_MESSAGE_ROLE");
      }
    }

    try {
      // Format payload
      const payload = this.formatPayload(messages, responseFormat, model, params);

      // Send request
      const response = await this.axiosInstance.post<OpenRouterChatResponse>("/chat/completions", payload);

      // Parse and return response
      return this.parseResponse(response.data, responseFormat);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates default configuration options
   *
   * @param options - Configuration options to update
   */
  public configure(options: Partial<OpenRouterServiceOptions>): void {
    if (options.apiUrl !== undefined) {
      this.apiUrl = options.apiUrl;
      this.axiosInstance.defaults.baseURL = options.apiUrl;
    }
    if (options.defaultModel !== undefined) {
      this.defaultModel = options.defaultModel;
    }
    if (options.defaultParams !== undefined) {
      this.defaultParams = { ...this.defaultParams, ...options.defaultParams };
    }
  }

  /**
   * Formats the request payload for OpenRouter API
   *
   * @private
   * @param messages - Chat messages
   * @param responseFormat - Response format specification
   * @param model - Model name
   * @param params - Model parameters
   * @returns Formatted request payload
   */
  private formatPayload(
    messages: ChatMessage[],
    responseFormat?: ResponseFormat,
    model?: string,
    params?: Record<string, number | string | boolean>
  ): OpenRouterChatRequest {
    const payload: OpenRouterChatRequest = {
      model: model || this.defaultModel,
      messages,
      ...this.defaultParams,
      ...params,
    };

    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    return payload;
  }

  /**
   * Parses the API response and validates against schema if provided
   *
   * @private
   * @param response - OpenRouter API response
   * @param responseFormat - Expected response format with schema
   * @returns Parsed and validated response data
   */
  private parseResponse(response: OpenRouterChatResponse, responseFormat?: ResponseFormat): unknown {
    // Check if response has choices
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterServiceError("No choices in API response", "INVALID_RESPONSE", undefined, response);
    }

    const messageContent = response.choices[0].message.content;

    // If no response format specified, return raw content
    if (!responseFormat) {
      return messageContent;
    }

    // Parse JSON content
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(messageContent);
    } catch (error) {
      throw new OpenRouterServiceError("Failed to parse JSON response", "JSON_PARSE_ERROR", undefined, {
        content: messageContent,
        error,
      });
    }

    // Validate against schema (basic validation)
    if (responseFormat.json_schema.strict) {
      const schema = responseFormat.json_schema.schema;
      const isValid = this.validateSchema(parsedContent, schema);

      if (!isValid) {
        throw new OpenRouterServiceError(
          "Response does not match expected schema",
          "SCHEMA_VALIDATION_ERROR",
          undefined,
          { expected: schema, received: parsedContent }
        );
      }
    }

    return parsedContent;
  }

  /**
   * Validates data against a simple schema
   *
   * @private
   * @param data - Data to validate
   * @param schema - Schema definition
   * @returns true if valid, false otherwise
   */
  private validateSchema(data: unknown, schema: Record<string, unknown>): boolean {
    // Basic schema validation
    // Check if data is an object
    if (typeof data !== "object" || data === null) {
      return false;
    }

    // Check if all required fields from schema exist in data
    for (const key of Object.keys(schema)) {
      if (!(key in data)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Handles errors from API calls and converts them to OpenRouterServiceError
   *
   * @private
   * @param error - Error from axios or other sources
   * @returns OpenRouterServiceError with appropriate details
   */
  private handleError(error: unknown): OpenRouterServiceError {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<OpenRouterError>;

      // Network errors
      if (axiosError.code === "ECONNABORTED" || axiosError.code === "ETIMEDOUT") {
        return new OpenRouterServiceError(
          "Request timeout - the API took too long to respond",
          "TIMEOUT_ERROR",
          undefined,
          { originalError: axiosError.message }
        );
      }

      if (!axiosError.response) {
        return new OpenRouterServiceError(
          "Network error - unable to reach OpenRouter API",
          "NETWORK_ERROR",
          undefined,
          { originalError: axiosError.message }
        );
      }

      // HTTP errors
      const statusCode = axiosError.response.status;
      const responseData = axiosError.response.data;

      // Handle OpenRouter API error format
      if (responseData && typeof responseData === "object" && "error" in responseData) {
        const apiError = responseData.error;
        return new OpenRouterServiceError(
          apiError.message || "API error",
          apiError.code || "API_ERROR",
          statusCode,
          responseData
        );
      }

      // Handle standard HTTP errors
      switch (statusCode) {
        case 400:
          return new OpenRouterServiceError("Bad request - invalid parameters", "BAD_REQUEST", 400, responseData);
        case 401:
          return new OpenRouterServiceError("Unauthorized - invalid API key", "UNAUTHORIZED", 401, responseData);
        case 403:
          return new OpenRouterServiceError("Forbidden - access denied", "FORBIDDEN", 403, responseData);
        case 404:
          return new OpenRouterServiceError("Not found - invalid endpoint or model", "NOT_FOUND", 404, responseData);
        case 429:
          return new OpenRouterServiceError("Rate limit exceeded - too many requests", "RATE_LIMIT", 429, responseData);
        case 500:
        case 502:
        case 503:
        case 504:
          return new OpenRouterServiceError(
            "Server error - OpenRouter API is unavailable",
            "SERVER_ERROR",
            statusCode,
            responseData
          );
        default:
          return new OpenRouterServiceError(`HTTP error ${statusCode}`, "HTTP_ERROR", statusCode, responseData);
      }
    }

    // Handle OpenRouterServiceError (already formatted)
    if (error instanceof OpenRouterServiceError) {
      return error;
    }

    // Handle other errors
    if (error instanceof Error) {
      return new OpenRouterServiceError(error.message, "UNKNOWN_ERROR", undefined, { originalError: error });
    }

    // Handle unknown error types
    return new OpenRouterServiceError("An unknown error occurred", "UNKNOWN_ERROR", undefined, { error });
  }
}
