/**
 * Tests for OpenAI Client Module
 * Story 2.1: OpenAI SDK Integration & Function Tool Definitions
 *
 * @jest-environment node
 */

import { getOpenAIClient, resetOpenAIClient } from '../client';

describe('OpenAI Client', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    // Reset client singleton before each test
    resetOpenAIClient();
  });

  afterEach(() => {
    // Restore original environment
    process.env.OPENAI_API_KEY = originalEnv;
    resetOpenAIClient();
  });

  describe('getOpenAIClient', () => {
    it('should create client instance when API key is set', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      const client = getOpenAIClient();

      expect(client).toBeDefined();
      expect(client.constructor.name).toBe('OpenAI');
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      const client1 = getOpenAIClient();
      const client2 = getOpenAIClient();

      expect(client1).toBe(client2);
    });

    it('should throw error when OPENAI_API_KEY is missing', () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY is not set');
    });

    it('should throw error when OPENAI_API_KEY is empty string', () => {
      process.env.OPENAI_API_KEY = '';

      expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY is not set');
    });
  });

  describe('resetOpenAIClient', () => {
    it('should reset client instance when resetOpenAIClient() called', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      const client1 = getOpenAIClient();
      resetOpenAIClient();

      process.env.OPENAI_API_KEY = 'different-api-key';
      const client2 = getOpenAIClient();

      expect(client1).not.toBe(client2);
    });
  });
});
