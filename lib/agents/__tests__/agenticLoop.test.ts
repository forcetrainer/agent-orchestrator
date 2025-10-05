/**
 * Tests for Agentic Execution Loop Module
 * Story 4.1: Implement Agentic Execution Loop
 *
 * Test Coverage:
 * - AC-4.1.1: Loop continues until no tool calls
 * - AC-4.1.2: Execution flow pattern
 * - AC-4.1.3: Messages array growth
 * - AC-4.1.4: Tool result format with tool_call_id
 * - AC-4.1.5: MAX_ITERATIONS safety limit
 * - AC-4.1.6: Iteration logging
 * - AC-4.1.7: Context preservation
 * - AC-4.1.8: Blocking behavior on tool calls
 */

import { executeAgent } from '../agenticLoop';
import { getOpenAIClient } from '@/lib/openai/client';
import { getAgentById } from '@/lib/agents/loader';
import type { Agent } from '@/types';

// Mock dependencies
jest.mock('@/lib/openai/client');
jest.mock('@/lib/agents/loader');
jest.mock('@/lib/files/reader');
jest.mock('@/lib/files/writer');
jest.mock('@/lib/files/lister');

const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>;
const mockGetAgentById = getAgentById as jest.MockedFunction<typeof getAgentById>;

describe('Agentic Execution Loop', () => {
  const mockAgent: Agent = {
    id: 'test-agent',
    name: 'Test Agent',
    title: 'Test Agent Title',
    description: 'A test agent for unit tests',
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

  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOpenAIClient.mockReturnValue(mockClient as any);
    mockGetAgentById.mockResolvedValue(mockAgent);
    process.env.OPENAI_MODEL = 'gpt-4';

    // Spy on console methods for logging tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('AC-4.1.1: Loop continues until no tool calls', () => {
    it('should execute loop until assistant returns response without tool calls', async () => {
      // First response: with tool call
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_123',
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

      // Second response: without tool calls (final)
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Here is the file content',
            },
          },
        ],
      });

      const result = await executeAgent('test-agent', 'Read test.txt');

      expect(result.success).toBe(true);
      expect(result.response).toBe('Here is the file content');
      expect(result.iterations).toBe(2);
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it('should return immediately if first response has no tool calls', async () => {
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help?',
            },
          },
        ],
      });

      const result = await executeAgent('test-agent', 'Hello');

      expect(result.success).toBe(true);
      expect(result.response).toBe('Hello! How can I help?');
      expect(result.iterations).toBe(1);
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC-4.1.2: Execution flow pattern', () => {
    it('should follow pattern: call OpenAI → check tool calls → execute → inject → loop', async () => {
      // Mock two iterations with tool calls, then final response
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: JSON.stringify({ path: 'file1.txt' }),
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
                tool_calls: [
                  {
                    id: 'call_2',
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: JSON.stringify({ path: 'file2.txt' }),
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
                content: 'Done processing files',
              },
            },
          ],
        });

      const result = await executeAgent('test-agent', 'Process files');

      expect(result.iterations).toBe(3);
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('AC-4.1.3: Messages array growth', () => {
    it('should grow messages array with each tool call and result', async () => {
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_123',
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
                content: 'Final response',
              },
            },
          ],
        });

      const result = await executeAgent('test-agent', 'Test message');

      // Expected messages:
      // 1. system (prompt)
      // 2. user (initial message)
      // 3. assistant (with tool_calls)
      // 4. tool (result)
      // 5. assistant (final response)
      expect(result.messages.length).toBe(5);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[1].role).toBe('user');
      expect(result.messages[2].role).toBe('assistant');
      expect(result.messages[3].role).toBe('tool');
      expect(result.messages[4].role).toBe('assistant');
    });

    it('should maintain full context across all iterations', async () => {
      // Start with conversation history
      const conversationHistory = [
        { role: 'user' as const, content: 'Previous message' },
        { role: 'assistant' as const, content: 'Previous response' },
      ];

      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'New response',
            },
          },
        ],
      });

      const result = await executeAgent('test-agent', 'New message', conversationHistory);

      // Should have: system + 2 history + user + assistant = 5 messages
      expect(result.messages.length).toBe(5);
      expect(result.messages[1].content).toBe('Previous message');
      expect(result.messages[2].content).toBe('Previous response');
    });
  });

  describe('AC-4.1.4: Tool result format', () => {
    it('should inject tool results with correct role and tool_call_id', async () => {
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

    it('should inject multiple tool results with matching tool_call_ids', async () => {
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: JSON.stringify({ path: 'file1.txt' }),
                    },
                  },
                  {
                    id: 'call_2',
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: JSON.stringify({ path: 'file2.txt' }),
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

      const result = await executeAgent('test-agent', 'Read files');

      const toolMessages = result.messages.filter((msg) => msg.role === 'tool');
      expect(toolMessages.length).toBe(2);
      expect(toolMessages[0]).toHaveProperty('tool_call_id', 'call_1');
      expect(toolMessages[1]).toHaveProperty('tool_call_id', 'call_2');
    });
  });

  describe('AC-4.1.5: MAX_ITERATIONS safety limit', () => {
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

      // Should have been called exactly 50 times
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(50);
    });

    it('should complete successfully before reaching MAX_ITERATIONS', async () => {
      // 10 iterations with tool calls, then final response
      for (let i = 0; i < 10; i++) {
        mockClient.chat.completions.create.mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: `call_${i}`,
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: JSON.stringify({ path: `file${i}.txt` }),
                    },
                  },
                ],
              },
            },
          ],
        });
      }

      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'All files processed',
            },
          },
        ],
      });

      const result = await executeAgent('test-agent', 'Process many files');

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(11);
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(11);
    });
  });

  describe('AC-4.1.6: Iteration logging', () => {
    it('should log iteration count at start of each iteration', async () => {
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_1',
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

      await executeAgent('test-agent', 'Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Iteration 1/50'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Iteration 2/50'));
    });

    it('should log tool call names and parameters', async () => {
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: JSON.stringify({ path: 'important.txt' }),
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

      await executeAgent('test-agent', 'Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tool call: read_file'),
        expect.objectContaining({ path: 'important.txt' })
      );
    });

    it('should log tool result success/failure status', async () => {
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_1',
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

      await executeAgent('test-agent', 'Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tool result:'));
    });

    it('should log final response when loop completes', async () => {
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Final answer',
            },
          },
        ],
      });

      await executeAgent('test-agent', 'Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Completed successfully'));
    });
  });

  describe('AC-4.1.7: Context preservation', () => {
    it('should preserve messages array across all iterations', async () => {
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_1',
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

      const result = await executeAgent('test-agent', 'Test');

      // Verify messages array is continuous and preserved
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[1].role).toBe('user');
      expect(result.messages[2].role).toBe('assistant');
      expect(result.messages[3].role).toBe('tool');
      expect(result.messages[4].role).toBe('assistant');
    });
  });

  describe('AC-4.1.8: Blocking behavior', () => {
    it('should not continue until tool results are injected', async () => {
      let toolExecuted = false;

      // Mock file reader to track when tool is executed
      const { readFileContent } = require('@/lib/files/reader');
      (readFileContent as jest.Mock).mockImplementation(async () => {
        toolExecuted = true;
        return 'file content';
      });

      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_1',
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
        .mockImplementation(async () => {
          // This should only be called AFTER tool is executed
          expect(toolExecuted).toBe(true);
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'Done',
                },
              },
            ],
          };
        });

      await executeAgent('test-agent', 'Test');
    });
  });

  describe('Error handling', () => {
    it('should throw error if agent not found', async () => {
      mockGetAgentById.mockResolvedValueOnce(null);

      await expect(executeAgent('nonexistent-agent', 'Test')).rejects.toThrow(
        'Agent not found: nonexistent-agent'
      );
    });

    it('should throw error if OpenAI API fails', async () => {
      mockClient.chat.completions.create.mockRejectedValueOnce(new Error('API error'));

      await expect(executeAgent('test-agent', 'Test')).rejects.toThrow('OpenAI API error');
    });

    it('should throw error if OpenAI returns no message', async () => {
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [{}],
      });

      await expect(executeAgent('test-agent', 'Test')).rejects.toThrow(
        'OpenAI API returned no message in response'
      );
    });
  });

  describe('ExecutionResult structure', () => {
    it('should return ExecutionResult with all required fields', async () => {
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Test response',
            },
          },
        ],
      });

      const result = await executeAgent('test-agent', 'Test');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('response', 'Test response');
      expect(result).toHaveProperty('iterations', 1);
      expect(result).toHaveProperty('messages');
      expect(Array.isArray(result.messages)).toBe(true);
    });
  });
});
