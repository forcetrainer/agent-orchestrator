/**
 * Error Mapping Utility
 *
 * Maps technical errors to user-friendly messages
 * Story 3.8 - Task 3: Map technical errors to user-friendly messages
 *
 * AC-8.3: Errors explain what went wrong in plain language
 * AC-8.4: Network errors show "Connection failed - please try again"
 * AC-8.5: Agent errors show agent-specific error information
 *
 * Error types handled:
 * - Network errors (fetch failures, offline state)
 * - HTTP 400 errors (bad request)
 * - HTTP 404 errors (agent not found)
 * - HTTP 500 errors (server error)
 * - OpenAI API errors (rate limits, model errors)
 * - Unknown errors (fallback)
 *
 * All technical details are logged to console but NOT shown to users
 */

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

/**
 * Maps a technical error to a user-friendly message
 * @param error - The error object (Error, Response, or unknown)
 * @returns User-friendly error message in plain language
 */
export function mapErrorToUserMessage(error: unknown): string {
  // Network error (fetch rejection, offline state)
  // TypeError with 'fetch' in message indicates network failure
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return 'Connection failed - please try again';
  }

  // HTTP error response
  if (error instanceof Response) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please try again or start a new conversation.';
      case 404:
        return 'Selected agent could not be found. Please try selecting a different agent.';
      case 500:
        return 'An error occurred on the server. Please try again in a moment.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Error object with message
  if (error instanceof Error) {
    // Check if it's an API error with specific message
    const message = error.message;

    // Empty or whitespace-only message
    if (!message || message.trim().length === 0) {
      return 'An unexpected error occurred. Please try again.';
    }

    // Rate limit errors (check before OpenAI since rate limits may include "OpenAI")
    if (message.toLowerCase().includes('rate limit')) {
      return 'Service is experiencing high demand. Please try again in a moment.';
    }

    // OpenAI API errors (model errors, etc.)
    if (message.toLowerCase().includes('openai')) {
      // Extract meaningful part of OpenAI error, but keep it user-friendly
      return 'The AI service encountered an error. Please try again.';
    }

    // Agent-specific errors (file not found, permission denied, etc.)
    if (message.includes('agent') || message.includes('Agent')) {
      return message; // Pass through agent-specific messages (AC-8.5)
    }

    // Filter out technical error messages
    if (message.includes('stack') || message.includes('undefined is not') || message.length > 100) {
      return 'An unexpected error occurred. Please try again.';
    }

    // Generic error messages that are already user-friendly
    return message;
  }

  // API error response object with error field or status code
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiErrorResponse & { status?: number };

    // Check error message first (more specific than status code)
    if (apiError.error) {
      // Rate limit errors (check before OpenAI since rate limits may include "OpenAI")
      if (apiError.error.toLowerCase().includes('rate limit')) {
        return 'Service is experiencing high demand. Please try again in a moment.';
      }

      // OpenAI API errors in error field
      if (apiError.error.toLowerCase().includes('openai')) {
        return 'The AI service encountered an error. Please try again.';
      }

      // Agent-specific errors (AC-8.5)
      if (apiError.error.includes('agent') || apiError.error.includes('Agent')) {
        return apiError.error;
      }

      // Generic API error that's already user-friendly
      if (apiError.error.length < 100) {
        return apiError.error;
      }
    }

    // Handle HTTP status codes when no specific error message
    if (apiError.status) {
      switch (apiError.status) {
        case 400:
          return 'Invalid request. Please try again or start a new conversation.';
        case 404:
          return 'Selected agent could not be found. Please try selecting a different agent.';
        case 500:
          return 'An error occurred on the server. Please try again in a moment.';
        case 429:
          return 'Too many requests. Please wait a moment before trying again.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }

    if (apiError.message) {
      return apiError.message;
    }
  }

  // Unknown error - fallback message
  return 'An unexpected error occurred. Please try again.';
}
