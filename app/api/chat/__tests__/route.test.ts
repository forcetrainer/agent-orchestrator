/**
 * Tests for Chat API Route
 * Story 2.5: Chat API Route with Function Calling Loop
 * Story 2.6: Conversation State Management
 *
 * @jest-environment node
 */

import { POST } from '../route';
import { getAgentById } from '@/lib/agents/loader';
import { executeChatCompletion } from '@/lib/openai/chat';
import { clearAllConversations } from '@/lib/utils/conversations';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/agents/loader');
jest.mock('@/lib/openai/chat');
jest.mock('@/lib/utils/logger', () => ({
  log: jest.fn(),
}));

const mockGetAgentById = getAgentById as jest.MockedFunction<typeof getAgentById>;
const mockExecuteChatCompletion = executeChatCompletion as jest.MockedFunction<
  typeof executeChatCompletion
>;

describe('POST /api/chat', () => {
  const mockAgent = {
    id: 'test-agent',
    name: 'Test Agent',
    description: 'A test agent',
    path: '/agents/test-agent',
    mainFile: '/agents/test-agent/agent.md',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearAllConversations();
  });

  it('should return 200 with chat response when request is valid', async () => {
    mockGetAgentById.mockResolvedValueOnce(mockAgent);
    mockExecuteChatCompletion.mockResolvedValueOnce({
      content: 'Hello! How can I help you?',
      functionCalls: [],
    });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.conversationId).toBeDefined();
    expect(data.data.message.role).toBe('assistant');
    expect(data.data.message.content).toBe('Hello! How can I help you?');
    expect(data.data.message.timestamp).toBeDefined();
  });

  it('should include function calls in response when functions are executed', async () => {
    mockGetAgentById.mockResolvedValueOnce(mockAgent);
    mockExecuteChatCompletion.mockResolvedValueOnce({
      content: 'I read the file',
      functionCalls: [
        {
          name: 'read_file',
          arguments: { path: 'test.txt' },
          result: 'File content',
        },
      ],
    });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 'Read test.txt',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.message.functionCalls).toHaveLength(1);
    expect(data.data.message.functionCalls[0].name).toBe('read_file');
  });

  it('should return 404 when agent is not found', async () => {
    mockGetAgentById.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'nonexistent',
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Agent not found: nonexistent');
  });

  it('should return 400 when agentId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Agent ID is required');
  });

  it('should return 400 when message is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Message is required');
  });

  it('should return 400 when agentId is not a string', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 123,
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Agent ID is required');
  });

  it('should return 400 when message is not a string', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Message is required');
  });

  it('should maintain conversation state across multiple messages', async () => {
    mockGetAgentById.mockResolvedValue(mockAgent);
    mockExecuteChatCompletion
      .mockResolvedValueOnce({
        content: 'First response',
        functionCalls: [],
      })
      .mockResolvedValueOnce({
        content: 'Second response remembering context',
        functionCalls: [],
      });

    // First message - creates conversation
    const request1 = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 'First message',
      }),
    });

    const response1 = await POST(request1);
    const data1 = await response1.json();
    const conversationId = data1.data.conversationId;

    expect(response1.status).toBe(200);
    expect(conversationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Second message - uses existing conversation
    const request2 = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 'Second message',
        conversationId,
      }),
    });

    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(response2.status).toBe(200);
    expect(data2.data.conversationId).toBe(conversationId);

    // Verify executeChatCompletion received history on second call
    expect(mockExecuteChatCompletion).toHaveBeenCalledTimes(2);
    const secondCallArgs = mockExecuteChatCompletion.mock.calls[1];
    const messagesInSecondCall = secondCallArgs[1];

    // Should include both user messages and first assistant response
    expect(messagesInSecondCall.length).toBe(3); // user, assistant, user
  });

  it('should handle OpenAI API errors gracefully', async () => {
    mockGetAgentById.mockResolvedValueOnce(mockAgent);
    mockExecuteChatCompletion.mockRejectedValueOnce(new Error('OpenAI API error: Rate limit exceeded'));

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('An unexpected error occurred. Please try again later.');
  });

  it('should not include functionCalls in response when no functions executed', async () => {
    mockGetAgentById.mockResolvedValueOnce(mockAgent);
    mockExecuteChatCompletion.mockResolvedValueOnce({
      content: 'Simple response',
      functionCalls: [],
    });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.message.functionCalls).toBeUndefined();
  });

  describe('Story 2.6: Conversation State Management', () => {
    it('should return 400 for invalid conversationId format', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'test-agent',
          message: 'Hello',
          conversationId: 'invalid-uuid',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Conversation ID must be a valid UUID v4');
    });

    it('should return 400 for invalid agentId format (uppercase)', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'TEST-AGENT',
          message: 'Hello',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Agent ID must be lowercase alphanumeric and may include hyphens, slashes, or dots'
      );
    });

    it('should return 400 for empty message', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'test-agent',
          message: '   ',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Message cannot be empty');
    });

    it('should return 400 for message exceeding 10,000 characters', async () => {
      const longMessage = 'a'.repeat(10001);
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'test-agent',
          message: longMessage,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('exceeds maximum length');
    });

    it('should generate UUID format conversationId for new conversations', async () => {
      mockGetAgentById.mockResolvedValueOnce(mockAgent);
      mockExecuteChatCompletion.mockResolvedValueOnce({
        content: 'Response',
        functionCalls: [],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'test-agent',
          message: 'Hello',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.conversationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should include message IDs and timestamps', async () => {
      mockGetAgentById.mockResolvedValueOnce(mockAgent);
      mockExecuteChatCompletion.mockResolvedValueOnce({
        content: 'Response',
        functionCalls: [],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'test-agent',
          message: 'Hello',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.message.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(data.data.message.timestamp).toBeDefined();
      expect(new Date(data.data.message.timestamp)).toBeInstanceOf(Date);
    });
  });
});
