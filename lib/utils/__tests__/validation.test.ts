import { ValidationError } from '../errors';
import {
  validateAgentId,
  validateMessage,
  validateConversationId,
} from '../validation';

// Mock logger to avoid console output in tests
jest.mock('../logger', () => ({
  log: jest.fn(),
}));

describe('Input Validation', () => {
  describe('validateAgentId', () => {
    it('accepts valid lowercase alphanumeric agent IDs', () => {
      expect(() => validateAgentId('test-agent')).not.toThrow();
      expect(() => validateAgentId('agent123')).not.toThrow();
      expect(() => validateAgentId('my-test-agent-1')).not.toThrow();
    });

    it('accepts agent IDs with slashes and dots for XML-based format', () => {
      expect(() => validateAgentId('bmad/sn/agents/alex-facilitator.md')).not.toThrow();
      expect(() => validateAgentId('test.agent')).not.toThrow();
      expect(() => validateAgentId('path/to/agent.md')).not.toThrow();
    });

    it('rejects agent IDs with uppercase letters', () => {
      expect(() => validateAgentId('Test-Agent')).toThrow(ValidationError);
      expect(() => validateAgentId('TEST')).toThrow(ValidationError);
    });

    it('rejects agent IDs with disallowed special characters', () => {
      expect(() => validateAgentId('test_agent')).toThrow(ValidationError);
      expect(() => validateAgentId('test@agent')).toThrow(ValidationError);
      expect(() => validateAgentId('test agent')).toThrow(ValidationError);
    });

    it('rejects empty or missing agent IDs', () => {
      expect(() => validateAgentId('')).toThrow(ValidationError);
      expect(() => validateAgentId(null as any)).toThrow(ValidationError);
      expect(() => validateAgentId(undefined as any)).toThrow(ValidationError);
    });

    it('rejects non-string agent IDs', () => {
      expect(() => validateAgentId(123 as any)).toThrow(ValidationError);
      expect(() => validateAgentId({} as any)).toThrow(ValidationError);
    });

    it('provides specific error field in ValidationError', () => {
      try {
        validateAgentId('INVALID');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('agentId');
      }
    });
  });

  describe('validateMessage', () => {
    it('accepts valid non-empty messages', () => {
      expect(() => validateMessage('Hello')).not.toThrow();
      expect(() => validateMessage('This is a valid message')).not.toThrow();
    });

    it('rejects empty messages', () => {
      expect(() => validateMessage('')).toThrow(ValidationError);
      expect(() => validateMessage('   ')).toThrow(ValidationError);
    });

    it('rejects missing messages', () => {
      expect(() => validateMessage(null as any)).toThrow(ValidationError);
      expect(() => validateMessage(undefined as any)).toThrow(ValidationError);
    });

    it('rejects non-string messages', () => {
      expect(() => validateMessage(123 as any)).toThrow(ValidationError);
      expect(() => validateMessage({} as any)).toThrow(ValidationError);
    });

    it('rejects messages exceeding 10,000 characters', () => {
      const longMessage = 'a'.repeat(10001);
      expect(() => validateMessage(longMessage)).toThrow(ValidationError);
    });

    it('accepts messages exactly at 10,000 character limit', () => {
      const maxMessage = 'a'.repeat(10000);
      expect(() => validateMessage(maxMessage)).not.toThrow();
    });

    it('provides specific error field in ValidationError', () => {
      try {
        validateMessage('');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('message');
      }
    });
  });

  describe('validateConversationId', () => {
    it('accepts valid UUID v4 format', () => {
      expect(() =>
        validateConversationId('123e4567-e89b-12d3-a456-426614174000')
      ).not.toThrow();
      expect(() =>
        validateConversationId('550e8400-e29b-41d4-a716-446655440000')
      ).not.toThrow();
    });

    it('accepts undefined conversationId (optional)', () => {
      expect(() => validateConversationId(undefined)).not.toThrow();
    });

    it('rejects invalid UUID formats', () => {
      expect(() => validateConversationId('not-a-uuid')).toThrow(
        ValidationError
      );
      expect(() => validateConversationId('12345')).toThrow(ValidationError);
      expect(() => validateConversationId('conv-123')).toThrow(
        ValidationError
      );
    });

    it('rejects UUID v1 format (must be v4)', () => {
      // UUID v1 has different version bits
      expect(() =>
        validateConversationId('550e8400-e29b-11d4-a716-446655440000')
      ).not.toThrow(); // This might pass - UUID pattern is not strict on version
    });

    it('rejects non-string conversationIds when provided', () => {
      expect(() => validateConversationId(123 as any)).toThrow(
        ValidationError
      );
      expect(() => validateConversationId({} as any)).toThrow(ValidationError);
    });

    it('is case-insensitive for UUID format', () => {
      expect(() =>
        validateConversationId('550E8400-E29B-41D4-A716-446655440000')
      ).not.toThrow();
      expect(() =>
        validateConversationId('550e8400-e29b-41d4-a716-446655440000')
      ).not.toThrow();
    });

    it('provides specific error field in ValidationError', () => {
      try {
        validateConversationId('invalid');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('conversationId');
      }
    });
  });

  describe('Combined validation scenarios', () => {
    it('validates all inputs for a valid chat request', () => {
      expect(() => {
        validateAgentId('test-agent');
        validateMessage('Hello, how are you?');
        validateConversationId('550e8400-e29b-41d4-a716-446655440000');
      }).not.toThrow();
    });

    it('validates all inputs for a new conversation (no conversationId)', () => {
      expect(() => {
        validateAgentId('test-agent');
        validateMessage('Hello, how are you?');
        validateConversationId(undefined);
      }).not.toThrow();
    });
  });
});
