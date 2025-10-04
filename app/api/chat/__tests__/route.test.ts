/**
 * Tests for Chat API Route
 * Story 2.5: Chat API Route with Function Calling Loop
 */

import { POST } from '../route';
import { getAgentById } from '@/lib/agents/loader';
import { executeChatCompletion } from '@/lib/openai/chat';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/agents/loader');
jest.mock('@/lib/openai/chat');

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
    expect(data.error).toBe('Missing or invalid required field: agentId');
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
    expect(data.error).toBe('Missing or invalid required field: message');
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
    expect(data.error).toBe('Missing or invalid required field: agentId');
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
    expect(data.error).toBe('Missing or invalid required field: message');
  });

  it('should use existing conversationId when provided', async () => {
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
        conversationId: 'conv-123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.conversationId).toBe('conv-123');
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
});
