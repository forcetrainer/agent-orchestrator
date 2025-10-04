import { randomUUID } from 'crypto';
import {
  getConversation,
  addMessage,
  getConversationHistory,
  clearAllConversations,
} from '../conversations';

// Mock logger to avoid console output in tests
jest.mock('../logger', () => ({
  log: jest.fn(),
}));

describe('Conversation Manager', () => {
  beforeEach(() => {
    clearAllConversations();
  });

  describe('getConversation', () => {
    it('creates a new conversation when conversationId is undefined', () => {
      const conversation = getConversation(undefined, 'test-agent');

      expect(conversation).toBeDefined();
      expect(conversation.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(conversation.agentId).toBe('test-agent');
      expect(conversation.messages).toEqual([]);
      expect(conversation.createdAt).toBeInstanceOf(Date);
      expect(conversation.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a new conversation when conversationId does not exist', () => {
      const fakeId = randomUUID();
      const conversation = getConversation(fakeId, 'test-agent');

      expect(conversation).toBeDefined();
      expect(conversation.id).not.toBe(fakeId);
      expect(conversation.agentId).toBe('test-agent');
    });

    it('retrieves existing conversation when conversationId exists', () => {
      const conv1 = getConversation(undefined, 'test-agent');
      const conv2 = getConversation(conv1.id, 'test-agent');

      expect(conv2.id).toBe(conv1.id);
      expect(conv2.agentId).toBe(conv1.agentId);
    });

    it('generates unique UUIDs for each new conversation', () => {
      const conv1 = getConversation(undefined, 'agent-1');
      const conv2 = getConversation(undefined, 'agent-2');

      expect(conv1.id).not.toBe(conv2.id);
    });
  });

  describe('addMessage', () => {
    it('adds a message to an existing conversation', () => {
      const conversation = getConversation(undefined, 'test-agent');
      const message = addMessage(conversation.id, {
        role: 'user',
        content: 'Hello',
      });

      expect(message).toBeDefined();
      expect(message.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('throws error when conversation not found', () => {
      const fakeId = randomUUID();

      expect(() => {
        addMessage(fakeId, {
          role: 'user',
          content: 'Hello',
        });
      }).toThrow(`Conversation not found: ${fakeId}`);
    });

    it('updates conversation updatedAt timestamp when message added', () => {
      const conversation = getConversation(undefined, 'test-agent');
      const originalUpdatedAt = conversation.updatedAt;

      // Wait a tiny bit to ensure timestamp difference
      setTimeout(() => {
        addMessage(conversation.id, {
          role: 'user',
          content: 'Test',
        });

        const updated = getConversation(conversation.id, 'test-agent');
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
          originalUpdatedAt.getTime()
        );
      }, 10);
    });

    it('maintains message order in conversation', () => {
      const conversation = getConversation(undefined, 'test-agent');

      addMessage(conversation.id, { role: 'user', content: 'First' });
      addMessage(conversation.id, { role: 'assistant', content: 'Second' });
      addMessage(conversation.id, { role: 'user', content: 'Third' });

      const history = getConversationHistory(conversation.id);
      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('First');
      expect(history[1].content).toBe('Second');
      expect(history[2].content).toBe('Third');
    });

    it('includes function calls when provided', () => {
      const conversation = getConversation(undefined, 'test-agent');
      const functionCalls = [
        {
          name: 'read_file',
          arguments: { path: '/test' },
          result: 'file content',
        },
      ];

      const message = addMessage(conversation.id, {
        role: 'assistant',
        content: 'Here is the file',
        functionCalls,
      });

      expect(message.functionCalls).toEqual(functionCalls);
    });
  });

  describe('getConversationHistory', () => {
    it('returns empty array for non-existent conversation', () => {
      const fakeId = randomUUID();
      const history = getConversationHistory(fakeId);

      expect(history).toEqual([]);
    });

    it('returns all messages for existing conversation', () => {
      const conversation = getConversation(undefined, 'test-agent');

      addMessage(conversation.id, { role: 'user', content: 'Message 1' });
      addMessage(conversation.id, { role: 'assistant', content: 'Message 2' });

      const history = getConversationHistory(conversation.id);
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('Message 1');
      expect(history[1].content).toBe('Message 2');
    });
  });

  describe('clearAllConversations', () => {
    it('clears all conversations from memory', () => {
      const conv1 = getConversation(undefined, 'agent-1');
      const conv2 = getConversation(undefined, 'agent-2');

      addMessage(conv1.id, { role: 'user', content: 'Test' });
      addMessage(conv2.id, { role: 'user', content: 'Test' });

      clearAllConversations();

      // After clearing, getting by ID should create new conversations
      const history1 = getConversationHistory(conv1.id);
      const history2 = getConversationHistory(conv2.id);

      expect(history1).toEqual([]);
      expect(history2).toEqual([]);
    });
  });

  describe('Multi-turn conversation flow', () => {
    it('maintains context across multiple messages', () => {
      const conversation = getConversation(undefined, 'test-agent');

      // User message
      addMessage(conversation.id, {
        role: 'user',
        content: 'What is 2+2?',
      });

      // Assistant response
      addMessage(conversation.id, {
        role: 'assistant',
        content: '2+2 equals 4',
      });

      // Follow-up user message
      addMessage(conversation.id, {
        role: 'user',
        content: 'What about 3+3?',
      });

      // Follow-up assistant response
      addMessage(conversation.id, {
        role: 'assistant',
        content: '3+3 equals 6',
      });

      const history = getConversationHistory(conversation.id);
      expect(history).toHaveLength(4);

      // Verify conversation alternates between user and assistant
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
      expect(history[2].role).toBe('user');
      expect(history[3].role).toBe('assistant');
    });
  });
});
