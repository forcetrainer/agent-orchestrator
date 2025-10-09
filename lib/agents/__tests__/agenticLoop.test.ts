/**
 * Agentic Execution Loop Tests
 *
 * Minimal high-value tests:
 * - MAX_ITERATIONS safety limit (critical edge case)
 * - Tool result format with tool_call_id (OpenAI requirement)
 * - Error handling when agent not found (common failure)
 */

import { executeAgent } from '../agenticLoop';
import { getOpenAIClient } from '@/lib/openai/client';
import { getAgentById } from '@/lib/agents/loader';

jest.mock('@/lib/openai/client');
jest.mock('@/lib/agents/loader');
jest.mock('@/lib/files/reader');
jest.mock('@/lib/files/writer');
jest.mock('@/lib/files/lister');

const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>;
const mockGetAgentById = getAgentById as jest.MockedFunction<typeof getAgentById>;

describe('Agentic Execution Loop', () => {
  const mockAgent = {
    id: 'test-agent',
    name: 'Test Agent',
    title: 'Test Agent Title',
    description: 'A test agent',
    path: '/agents/test-agent',
    mainFile: '/agents/test-agent/agent.md',
    fullContent: '# Test Agent\nA test agent for unit tests.',
  };

  const mockClient = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOpenAIClient.mockReturnValue(mockClient as any);
    mockGetAgentById.mockResolvedValue(mockAgent);
    process.env.OPENAI_MODEL = 'gpt-4';
  });

  it('should throw error when MAX_ITERATIONS (50) is exceeded', async () => {
    // Mock API to always return tool calls (infinite loop scenario)
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            role: 'assistant',
            tool_calls: [
              {
                id: 'call_infinite',
                type: 'function',
                function: {
                  name: 'read_file',
                  arguments: JSON.stringify({ path: 'test.txt' }),
                },
              },
            ],
          },
        },
      ],
    });

    await expect(executeAgent('test-agent', 'Start infinite loop')).rejects.toThrow(
      'Maximum function calling iterations (50) exceeded'
    );

    expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(50);
  });

  it('should inject tool results with correct tool_call_id', async () => {
    const toolCallId = 'call_abc123';

    mockClient.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: toolCallId,
                  type: 'function',
                  function: {
                    name: 'read_file',
                    arguments: JSON.stringify({ path: 'test.txt' }),
                  },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Done',
            },
          },
        ],
      });

    const result = await executeAgent('test-agent', 'Read file');

    // Find the tool message
    const toolMessage = result.messages.find((msg) => msg.role === 'tool');
    expect(toolMessage).toBeDefined();
    expect(toolMessage).toHaveProperty('tool_call_id', toolCallId);
    expect(toolMessage).toHaveProperty('role', 'tool');
    expect(toolMessage).toHaveProperty('content');
  });

  it('should throw error if agent not found', async () => {
    mockGetAgentById.mockResolvedValueOnce(null);

    await expect(executeAgent('nonexistent-agent', 'Test')).rejects.toThrow(
      'Agent not found: nonexistent-agent'
    );
  });
});
