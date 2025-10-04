/**
 * Environment variable validation and typed access
 *
 * This module provides:
 * - Validation of required environment variables at startup
 * - Type-safe access to environment variables with defaults
 * - Clear error messages when configuration is invalid
 */

/**
 * Validates that all required environment variables are present.
 * Throws an Error with a clear message listing missing variables if validation fails.
 * Should be called at server startup in app/layout.tsx.
 */
export function validateEnv(): void {
  const missing: string[] = [];

  // Check required variables
  if (!process.env.OPENAI_API_KEY) {
    missing.push('OPENAI_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'See .env.example for the complete list of variables.'
    );
  }
}

/**
 * Typed environment variable accessor object.
 * Provides type-safe access to environment variables with defaults applied.
 * All consuming code should import from this object rather than accessing process.env directly.
 */
export const env = {
  /**
   * OpenAI API key for AI agent functionality
   * Required - must be set in .env.local
   */
  get OPENAI_API_KEY(): string {
    const value = process.env.OPENAI_API_KEY;
    if (!value) {
      throw new Error('OPENAI_API_KEY is not set. Please check your .env.local file.');
    }
    return value;
  },

  /**
   * Path to directory containing agent definition files
   * Default: ./agents
   */
  get AGENTS_PATH(): string {
    return process.env.AGENTS_PATH || './agents';
  },

  /**
   * Path to directory for generated outputs
   * Default: ./output
   */
  get OUTPUT_PATH(): string {
    return process.env.OUTPUT_PATH || './output';
  },

  /**
   * Port for Next.js development server
   * Default: 3000
   */
  get PORT(): number {
    return parseInt(process.env.PORT || '3000', 10);
  },

  /**
   * Node environment (development, production, test)
   * Auto-set by Next.js
   */
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },

  /**
   * OpenAI model to use for chat completions
   * Default: gpt-4
   */
  get OPENAI_MODEL(): string {
    return process.env.OPENAI_MODEL || 'gpt-4';
  },

  /**
   * Project root directory (absolute path)
   * Used by agents to resolve {project-root} in workflow paths
   * Default: current working directory
   */
  get PROJECT_ROOT(): string {
    return process.env.PROJECT_ROOT || process.cwd();
  },
} as const;
