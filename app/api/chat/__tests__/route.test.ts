/**
 * Minimal Chat API Route Tests
 * Following testing strategy: docs/solution-architecture.md Section 15
 *
 * Focus: 2-3 critical failure scenarios only
 * - OpenAI API errors (most common production issue)
 * - Conversation state corruption
 * - Agent not found edge case
 *
 * @jest-environment node
 */

import { POST } from '../route';
import { getAgentById } from '@/lib/agents/loader';
import { executeAgent } from '@/lib/agents/agenticLoop';
import { clearAllConversations } from '@/lib/utils/conversations';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/agents/loader');
jest.mock('@/lib/agents/agenticLoop');
jest.mock('@/lib/utils/logger', () => ({
  log: jest.fn(),
}));

const mockGetAgentById = getAgentById as jest.MockedFunction<typeof getAgentById>;
const mockExecuteAgent = executeAgent as jest.MockedFunction<typeof executeAgent>;

describe('POST /api/chat - Critical Scenarios Only', () => {
  const mockAgent = {
    id: 'test-agent',
    name: 'Test Agent',
    title: 'Test Agent Title',
    description: 'A test agent',
    path: '/agents/test-agent',
    mainFile: '/agents/test-agent/agent.md',
    fullContent: '# Test Agent\nThis is a test agent.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearAllConversations();
  });

  /**
   * CRITICAL TEST 1: OpenAI API errors (most common production failure)
   * Tests: Error handling, logging, graceful degradation
   */
  it('should handle OpenAI API rate limit errors gracefully', async () => {
    mockGetAgentById.mockResolvedValueOnce(mockAgent);
    mockExecuteAgent.mockRejectedValueOnce(
      new Error('OpenAI API error: Rate limit exceeded')
    );

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should return 500, not crash
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);

    // Should NOT leak internal error message
    expect(data.error).toBe('An unexpected error occurred. Please try again later.');
    expect(data.error).not.toContain('OpenAI');
    expect(data.error).not.toContain('Rate limit');
  });

  /**
   * CRITICAL TEST 2: Conversation state corruption
   * Tests: Multi-message conversations maintain state correctly
   */
  it('should maintain conversation state across multiple messages', async () => {
    mockGetAgentById.mockResolvedValue(mockAgent);
    mockExecuteAgent
      .mockResolvedValueOnce({
        success: true,
        response: 'First response',
        iterations: 1,
        messages: [
          { role: 'system', content: 'Agent prompt' },
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
        ],
      })
      .mockResolvedValueOnce({
        success: true,
        response: 'Second response with context',
        iterations: 1,
        messages: [
          { role: 'system', content: 'Agent prompt' },
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
          { role: 'user', content: 'Second message' },
          { role: 'assistant', content: 'Second response with context' },
        ],
      });

    // First message
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

    // Second message - uses conversation ID
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

    // Verify conversation ID maintained
    expect(data2.data.conversationId).toBe(conversationId);

    // Verify executeAgent received history on second call
    const secondCallArgs = mockExecuteAgent.mock.calls[1];
    const conversationHistory = secondCallArgs[2];

    // Should include previous messages
    expect(conversationHistory).toBeDefined();
    expect(conversationHistory!.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * CRITICAL TEST 3: Agent not found (common user error)
   * Tests: 404 handling, helpful error messages
   */
  it('should return 404 with helpful message when agent not found', async () => {
    mockGetAgentById.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'nonexistent-agent',
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);

    // Error message should be helpful (includes agent ID)
    expect(data.error).toBe('Agent not found: nonexistent-agent');
  });
});
