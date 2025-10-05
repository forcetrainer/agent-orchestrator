/**
 * Integration Tests for Agentic Execution Loop Module
 * Story 4.1: Implement Agentic Execution Loop
 *
 * Integration Test Coverage:
 * - AC-4.1.2: Full execution flow with multiple tool call iterations
 * - AC-4.1.8: Execution blocking behavior (cannot continue without tool results)
 * - AC-4.1.3, AC-4.1.7: Context preservation across iterations
 * - Realistic agent scenario with multiple file loads
 */

import { executeAgent } from '../agenticLoop';
import { getOpenAIClient } from '@/lib/openai/client';
import { getAgentById } from '@/lib/agents/loader';
import { readFileContent } from '@/lib/files/reader';
import { writeFileContent } from '@/lib/files/writer';
import { listFiles } from '@/lib/files/lister';
import type { Agent } from '@/types';

// Mock dependencies
jest.mock('@/lib/openai/client');
jest.mock('@/lib/agents/loader');
jest.mock('@/lib/files/reader');
jest.mock('@/lib/files/writer');
jest.mock('@/lib/files/lister');

const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>;
const mockGetAgentById = getAgentById as jest.MockedFunction<typeof getAgentById>;
const mockReadFileContent = readFileContent as jest.MockedFunction<typeof readFileContent>;
const mockWriteFileContent = writeFileContent as jest.MockedFunction<typeof writeFileContent>;
const mockListFiles = listFiles as jest.MockedFunction<typeof listFiles>;

describe('Agentic Execution Loop - Integration Tests', () => {
  const mockAgent: Agent = {
    id: 'workflow-agent',
    name: 'Workflow Agent',
    title: 'Workflow Executor',
    description: 'Agent for executing workflows',
    path: '/agents/workflow-agent',
    mainFile: '/agents/workflow-agent/agent.md',
    fullContent: '# Workflow Agent\nExecutes workflows with file operations.',
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
    process.env.PROJECT_ROOT = '/test/project';
  });

  describe('AC-4.1.2, AC-4.1.8: Full execution with blocking behavior', () => {
    it('should execute full workflow with 3 tool call iterations', async () => {
      // Simulate realistic workflow: list files → read workflow → read instructions → final response

      // Mock file operations
      mockListFiles.mockResolvedValue([
        { name: 'workflow.yaml', path: 'workflow.yaml', type: 'file' },
        { name: 'instructions.md', path: 'instructions.md', type: 'file' },
      ]);

      mockReadFileContent
        .mockResolvedValueOnce('name: test-workflow\ndescription: Test workflow')
        .mockResolvedValueOnce('# Instructions\nStep 1: Do something\nStep 2: Do another thing');

      // Iteration 1: List files
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'I need to list the files first.',
              tool_calls: [
                {
                  id: 'call_list',
                  type: 'function',
                  function: {
                    name: 'list_files',
                    arguments: JSON.stringify({ path: '/workflows', recursive: false }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Iteration 2: Read workflow file
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Now I need to read the workflow file.',
              tool_calls: [
                {
                  id: 'call_read_workflow',
                  type: 'function',
                  function: {
                    name: 'read_file',
                    arguments: JSON.stringify({ path: 'workflow.yaml' }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Iteration 3: Read instructions file
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Let me read the instructions.',
              tool_calls: [
                {
                  id: 'call_read_instructions',
                  type: 'function',
                  function: {
                    name: 'read_file',
                    arguments: JSON.stringify({ path: 'instructions.md' }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Final response (no tool calls)
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'I have loaded the workflow and instructions. Ready to execute.',
            },
          },
        ],
      });

      const result = await executeAgent('workflow-agent', 'Load and prepare the workflow');

      // Verify execution completed successfully
      expect(result.success).toBe(true);
      expect(result.iterations).toBe(4);
      expect(result.response).toBe('I have loaded the workflow and instructions. Ready to execute.');

      // Verify all file operations were called in correct order
      expect(mockListFiles).toHaveBeenCalledTimes(1);
      expect(mockReadFileContent).toHaveBeenCalledTimes(2);

      // Verify OpenAI was called 4 times (3 with tool calls + 1 final)
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(4);
    });

    it('should block execution until tool results are available', async () => {
      const executionOrder: string[] = [];

      // Mock file read with execution tracking
      mockReadFileContent.mockImplementation(async (path: string) => {
        executionOrder.push(`tool_executed:${path}`);
        return `content of ${path}`;
      });

      // First call: request file read
      mockClient.chat.completions.create.mockImplementationOnce(async () => {
        executionOrder.push('llm_call_1');
        return {
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
        };
      });

      // Second call: should only happen AFTER tool execution
      mockClient.chat.completions.create.mockImplementationOnce(async () => {
        executionOrder.push('llm_call_2');
        // Verify tool was executed before this call
        expect(executionOrder).toContain('tool_executed:test.txt');
        expect(executionOrder.indexOf('tool_executed:test.txt')).toBeLessThan(
          executionOrder.indexOf('llm_call_2')
        );
        return {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'File read successfully',
              },
            },
          ],
        };
      });

      await executeAgent('workflow-agent', 'Read test.txt');

      // Verify execution order: LLM call 1 → tool execution → LLM call 2
      expect(executionOrder).toEqual(['llm_call_1', 'tool_executed:test.txt', 'llm_call_2']);
    });
  });

  describe('AC-4.1.3, AC-4.1.7: Context preservation across iterations', () => {
    it('should maintain conversation context through multiple iterations', async () => {
      // Start with existing conversation history
      const conversationHistory = [
        { role: 'user' as const, content: 'What is the project root?' },
        { role: 'assistant' as const, content: 'The project root is /test/project' },
      ];

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
                      name: 'list_files',
                      arguments: JSON.stringify({ path: '/test/project', recursive: false }),
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
                content: 'Here are the files in the project root.',
              },
            },
          ],
        });

      mockListFiles.mockResolvedValue([{ name: 'package.json', path: 'package.json', type: 'file' }]);

      const result = await executeAgent('workflow-agent', 'List files in project root', conversationHistory);

      // Verify conversation history is preserved in messages
      const userMessages = result.messages.filter((m) => m.role === 'user');
      expect(userMessages.length).toBe(2); // Original + new message

      // Find the historical messages in the final messages array
      const historicalUserMsg = result.messages.find(
        (m) => m.role === 'user' && m.content === 'What is the project root?'
      );
      const historicalAssistantMsg = result.messages.find(
        (m) => m.role === 'assistant' && m.content === 'The project root is /test/project'
      );

      expect(historicalUserMsg).toBeDefined();
      expect(historicalAssistantMsg).toBeDefined();
    });

    it('should preserve all messages including tool calls in final result', async () => {
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Reading first file.',
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
                content: 'Reading second file.',
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
                content: 'Both files read successfully.',
              },
            },
          ],
        });

      mockReadFileContent.mockResolvedValue('file content');

      const result = await executeAgent('workflow-agent', 'Read both files');

      // Expected message sequence:
      // 1. system
      // 2. user
      // 3. assistant (with tool_calls)
      // 4. tool (result of call_1)
      // 5. assistant (with tool_calls)
      // 6. tool (result of call_2)
      // 7. assistant (final)
      expect(result.messages.length).toBe(7);

      const roles = result.messages.map((m) => m.role);
      expect(roles).toEqual(['system', 'user', 'assistant', 'tool', 'assistant', 'tool', 'assistant']);
    });
  });

  describe('Realistic agent scenario with multiple file loads', () => {
    it('should handle complex workflow with config loading and file writing', async () => {
      // Simulate BMAD workflow scenario:
      // 1. List workflow directory
      // 2. Read workflow.yaml
      // 3. Read instructions.md
      // 4. Write output file
      // 5. Final response

      mockListFiles.mockResolvedValue([
        { name: 'workflow.yaml', path: 'workflow.yaml', type: 'file' },
        { name: 'instructions.md', path: 'instructions.md', type: 'file' },
        { name: 'template.md', path: 'template.md', type: 'file' },
      ]);

      mockReadFileContent
        .mockResolvedValueOnce('name: epic-workflow\noutput_folder: /docs')
        .mockResolvedValueOnce('# Epic Workflow Instructions\n1. Load config\n2. Generate epic');

      mockWriteFileContent.mockResolvedValue(undefined);

      // Iteration 1: List files
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_list',
                  type: 'function',
                  function: {
                    name: 'list_files',
                    arguments: JSON.stringify({ path: '/workflows/epic', recursive: false }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Iteration 2: Read workflow config
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_workflow',
                  type: 'function',
                  function: {
                    name: 'read_file',
                    arguments: JSON.stringify({ path: '/workflows/epic/workflow.yaml' }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Iteration 3: Read instructions
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_instructions',
                  type: 'function',
                  function: {
                    name: 'read_file',
                    arguments: JSON.stringify({ path: '/workflows/epic/instructions.md' }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Iteration 4: Write output
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_write',
                  type: 'function',
                  function: {
                    name: 'write_file',
                    arguments: JSON.stringify({
                      path: '/docs/epic-output.md',
                      content: '# Epic Output\nGenerated epic content',
                    }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Final response
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Workflow executed successfully. Output saved to /docs/epic-output.md',
            },
          },
        ],
      });

      const result = await executeAgent('workflow-agent', 'Execute epic workflow');

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(5);
      expect(result.response).toContain('Workflow executed successfully');

      // Verify all file operations were executed in order
      expect(mockListFiles).toHaveBeenCalledWith('/workflows/epic', false);
      expect(mockReadFileContent).toHaveBeenCalledWith('/workflows/epic/workflow.yaml');
      expect(mockReadFileContent).toHaveBeenCalledWith('/workflows/epic/instructions.md');
      expect(mockWriteFileContent).toHaveBeenCalledWith(
        '/docs/epic-output.md',
        '# Epic Output\nGenerated epic content'
      );

      // Verify message structure includes all tool calls and results
      const toolMessages = result.messages.filter((m) => m.role === 'tool');
      expect(toolMessages.length).toBe(4); // list, read, read, write
    });
  });

  describe('Error recovery in multi-iteration execution', () => {
    it('should handle tool execution errors gracefully', async () => {
      // First tool call fails, but execution continues
      mockReadFileContent.mockRejectedValueOnce(new Error('File not found'));

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
                      arguments: JSON.stringify({ path: 'missing.txt' }),
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
                content: 'I could not find that file. Please check the path.',
              },
            },
          ],
        });

      const result = await executeAgent('workflow-agent', 'Read missing.txt');

      expect(result.success).toBe(true);
      expect(result.response).toContain('could not find that file');

      // Verify error was injected as tool result
      const toolMessage = result.messages.find((m) => m.role === 'tool');
      expect(toolMessage).toBeDefined();
      expect(toolMessage?.content).toContain('error');
    });
  });
});
