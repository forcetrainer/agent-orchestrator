/**
 * OpenAI SDK Client Module
 *
 * Provides a singleton instance of the OpenAI client with:
 * - Lazy initialization on first access
 * - Environment variable validation (fail-fast)
 * - Test helper for resetting the singleton
 */

import OpenAI from 'openai';
import { env } from '@/lib/utils/env';

/**
 * Singleton OpenAI client instance.
 * Initialized lazily on first call to getOpenAIClient().
 */
let openaiClient: OpenAI | null = null;

/**
 * Returns the singleton OpenAI client instance.
 * Lazy-initializes the client on first call.
 * Validates that OPENAI_API_KEY is set (throws if missing).
 *
 * @returns OpenAI client instance
 * @throws Error if OPENAI_API_KEY environment variable is not set
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    // The env.OPENAI_API_KEY getter will throw if missing
    const apiKey = env.OPENAI_API_KEY;
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Resets the OpenAI client singleton to null.
 * Primarily used for testing to ensure clean state between tests.
 */
export function resetOpenAIClient(): void {
  openaiClient = null;
}
