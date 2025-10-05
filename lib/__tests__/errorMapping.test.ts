/**
 * Error Mapping Utility Tests
 * Story 3.8 - Task 6: Unit tests for error handling
 *
 * Tests error mapping function for all error types
 * AC-8.3: Errors explain what went wrong in plain language
 * AC-8.4: Network errors show "Connection failed - please try again"
 * AC-8.5: Agent errors show agent-specific error information
 */

import { mapErrorToUserMessage } from '../errorMapping';

describe('mapErrorToUserMessage', () => {
  // Task 6.2: Test error mapping function for all error types

  // AC-8.4: Network errors
  describe('Network Errors', () => {
    it('maps fetch TypeError to connection failed message', () => {
      const error = new TypeError('Failed to fetch');
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('Connection failed - please try again');
    });

    it('maps network fetch error variations', () => {
      const error1 = new TypeError('fetch failed');
      const error2 = new TypeError('Network request failed - fetch error');

      expect(mapErrorToUserMessage(error1)).toBe('Connection failed - please try again');
      expect(mapErrorToUserMessage(error2)).toBe('Connection failed - please try again');
    });
  });

  // HTTP Error Responses
  describe('HTTP Error Responses', () => {
    it('maps 400 Bad Request to user-friendly message', () => {
      const response = new Response(null, { status: 400, statusText: 'Bad Request' });
      const result = mapErrorToUserMessage(response);
      expect(result).toBe('Invalid request. Please try again or start a new conversation.');
    });

    it('maps 404 Not Found to agent selection error', () => {
      const response = new Response(null, { status: 404, statusText: 'Not Found' });
      const result = mapErrorToUserMessage(response);
      expect(result).toBe('Selected agent could not be found. Please try selecting a different agent.');
    });

    it('maps 500 Server Error to server error message', () => {
      const response = new Response(null, { status: 500, statusText: 'Internal Server Error' });
      const result = mapErrorToUserMessage(response);
      expect(result).toBe('An error occurred on the server. Please try again in a moment.');
    });

    it('maps 429 Rate Limit to rate limit message', () => {
      const response = new Response(null, { status: 429, statusText: 'Too Many Requests' });
      const result = mapErrorToUserMessage(response);
      expect(result).toBe('Too many requests. Please wait a moment before trying again.');
    });

    it('maps unknown HTTP status to generic error', () => {
      const response = new Response(null, { status: 503, statusText: 'Service Unavailable' });
      const result = mapErrorToUserMessage(response);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  // OpenAI API Errors
  describe('OpenAI API Errors', () => {
    it('maps OpenAI rate limit error to user-friendly message', () => {
      const error = new Error('OpenAI API rate limit exceeded');
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('Service is experiencing high demand. Please try again in a moment.');
    });

    it('maps OpenAI API error to generic AI service error', () => {
      const error = new Error('OpenAI API error: Invalid model');
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('The AI service encountered an error. Please try again.');
    });

    it('maps rate limit in API response object', () => {
      const error = { error: 'Rate limit exceeded for requests' };
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('Service is experiencing high demand. Please try again in a moment.');
    });

    it('maps OpenAI error in API response object', () => {
      const error = { error: 'OpenAI service unavailable' };
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('The AI service encountered an error. Please try again.');
    });
  });

  // AC-8.5: Agent-specific errors
  describe('Agent-Specific Errors', () => {
    it('preserves agent-specific error messages from Error object', () => {
      const error = new Error('Agent requires file config.json which was not found');
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('Agent requires file config.json which was not found');
    });

    it('preserves agent-specific error messages from API response', () => {
      const error = { error: 'Agent configuration is invalid' };
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('Agent configuration is invalid');
    });

    it('preserves short user-friendly error messages', () => {
      const error = new Error('Please select an agent before sending a message.');
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('Please select an agent before sending a message.');
    });
  });

  // API Response Objects
  describe('API Response Error Objects', () => {
    it('extracts error field from API response', () => {
      const error = { error: 'Invalid agent ID provided' };
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('Invalid agent ID provided');
    });

    it('extracts message field from API response', () => {
      const error = { message: 'Request validation failed' };
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('Request validation failed');
    });

    it('handles API response with very long error message', () => {
      const longError = 'x'.repeat(150); // 150 characters
      const error = { error: longError };
      const result = mapErrorToUserMessage(error);
      // Should fallback to generic message for very long technical errors
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  // Unknown/Fallback Errors
  describe('Unknown Errors', () => {
    it('maps unknown error to generic message', () => {
      const error = 'some string error';
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('maps null error to generic message', () => {
      const result = mapErrorToUserMessage(null);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('maps undefined error to generic message', () => {
      const result = mapErrorToUserMessage(undefined);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('maps Error with stack trace to generic message', () => {
      const error = new Error('Internal error at line 42 in file.ts stack trace...');
      const result = mapErrorToUserMessage(error);
      // Long technical errors should use generic message
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('maps Error with undefined message to generic message', () => {
      const error = new Error('undefined is not a function');
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('handles Error object with empty message', () => {
      const error = new Error('');
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('handles API response with empty error field', () => {
      const error = { error: '' };
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('handles object without error or message fields', () => {
      const error = { status: 'failed', code: 123 };
      const result = mapErrorToUserMessage(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('is case-insensitive for network errors', () => {
      const error1 = new TypeError('FETCH failed');
      const error2 = new TypeError('Fetch Failed');
      expect(mapErrorToUserMessage(error1)).toBe('Connection failed - please try again');
      expect(mapErrorToUserMessage(error2)).toBe('Connection failed - please try again');
    });

    it('is case-insensitive for OpenAI errors', () => {
      const error1 = new Error('openai api error');
      const error2 = new Error('OPENAI service down');
      expect(mapErrorToUserMessage(error1)).toBe('The AI service encountered an error. Please try again.');
      expect(mapErrorToUserMessage(error2)).toBe('The AI service encountered an error. Please try again.');
    });

    it('is case-insensitive for rate limit errors', () => {
      const error1 = new Error('Rate Limit exceeded');
      const error2 = new Error('RATE LIMIT reached');
      expect(mapErrorToUserMessage(error1)).toBe('Service is experiencing high demand. Please try again in a moment.');
      expect(mapErrorToUserMessage(error2)).toBe('Service is experiencing high demand. Please try again in a moment.');
    });
  });
});
