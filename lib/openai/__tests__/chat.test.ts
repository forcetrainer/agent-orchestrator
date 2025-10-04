/**
 * Tests for OpenAI Chat Service Module
 * Story 2.5: Chat API Route with Function Calling Loop
 */

import { executeChatCompletion } from '../chat';
import { getOpenAIClient } from '../client';
import { readFileContent } from '@/lib/files/reader';
import { writeFileContent } from '@/lib/files/writer';
import { listFiles } from '@/lib/files/lister';
import type { Agent } from '@/types';

// Mock dependencies
jest.mock('../client');
jest.mock('@/lib/files/reader');
jest.mock('@/lib/files/writer');
jest.mock('@/lib/files/lister');

const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>;
const mockReadFileContent = readFileContent as jest.MockedFunction<typeof readFileContent>;
const mockWriteFileContent = writeFileContent as jest.MockedFunction<typeof writeFileContent>;
const mockListFiles = listFiles as jest.MockedFunction<typeof listFiles>;

describe('OpenAI Chat Service', () => {
  const mockAgent: Agent = {
    id: 'test-agent',
    name: 'Test Agent',
    description: 'A test agent for unit tests',
    path: '/agents/test-agent',
    mainFile: '/agents/test-agent/agent.md',
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
    process.env.OPENAI_MODEL = 'gpt-4';
  });

  describe('executeChatCompletion', () => {
    it('should execute OpenAI API call and return response without function calls', async () => {
      // Mock OpenAI response without tool calls
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
            },
          },
        ],
      });

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await executeChatCompletion(mockAgent, messages);

      expect(result.content).toBe('Hello! How can I help you?');
      expect(result.functionCalls).toEqual([]);
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should execute read_file function call and return result to OpenAI', async () => {
      // Mock file content
      mockReadFileContent.mockResolvedValueOnce('File content here');

      // Mock first response with tool call
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

      // Mock second response without tool calls (final answer)
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'The file contains: File content here',
            },
          },
        ],
      });

      const messages = [{ role: 'user' as const, content: 'Read test.txt' }];
      const result = await executeChatCompletion(mockAgent, messages);

      expect(result.content).toBe('The file contains: File content here');
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0]).toEqual({
        name: 'read_file',
        arguments: { path: 'test.txt' },
        result: 'File content here',
      });
      expect(mockReadFileContent).toHaveBeenCalledWith('test.txt');
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it('should execute write_file function call successfully', async () => {
      mockWriteFileContent.mockResolvedValueOnce(undefined);

      // Mock response with write_file tool call
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_456',
                  type: 'function',
                  function: {
                    name: 'write_file',
                    arguments: JSON.stringify({ path: 'output.txt', content: 'Hello World' }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Mock final response
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'File written successfully',
            },
          },
        ],
      });

      const messages = [{ role: 'user' as const, content: 'Write to output.txt' }];
      const result = await executeChatCompletion(mockAgent, messages);

      expect(result.content).toBe('File written successfully');
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0]).toEqual({
        name: 'write_file',
        arguments: { path: 'output.txt', content: 'Hello World' },
        result: { success: true, path: 'output.txt' },
      });
      expect(mockWriteFileContent).toHaveBeenCalledWith('output.txt', 'Hello World');
    });

    it('should execute list_files function call successfully', async () => {
      const mockFileList = [
        { name: 'file1.txt', path: 'file1.txt', type: 'file' as const },
        { name: 'file2.txt', path: 'file2.txt', type: 'file' as const },
      ];

      mockListFiles.mockResolvedValueOnce(mockFileList);

      // Mock response with list_files tool call
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_789',
                  type: 'function',
                  function: {
                    name: 'list_files',
                    arguments: JSON.stringify({ path: '.' }),
                  },
                },
              ],
            },
          },
        ],
      });

      // Mock final response
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Found 2 files',
            },
          },
        ],
      });

      const messages = [{ role: 'user' as const, content: 'List files' }];
      const result = await executeChatCompletion(mockAgent, messages);

      expect(result.content).toBe('Found 2 files');
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0]).toEqual({
        name: 'list_files',
        arguments: { path: '.' },
        result: mockFileList,
      });
      expect(mockListFiles).toHaveBeenCalledWith('.', false);
    });

    it('should handle multiple function calls in sequence', async () => {
      mockReadFileContent.mockResolvedValueOnce('Content 1');
      mockReadFileContent.mockResolvedValueOnce('Content 2');

      // First response: read first file
      mockClient.chat.completions.create.mockResolvedValueOnce({
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
      });

      // Second response: read second file
      mockClient.chat.completions.create.mockResolvedValueOnce({
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
      });

      // Final response
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Read both files',
            },
          },
        ],
      });

      const messages = [{ role: 'user' as const, content: 'Read file1.txt and file2.txt' }];
      const result = await executeChatCompletion(mockAgent, messages);

      expect(result.content).toBe('Read both files');
      expect(result.functionCalls).toHaveLength(2);
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it('should handle function execution errors gracefully', async () => {
      mockReadFileContent.mockRejectedValueOnce(new Error('File not found: test.txt'));

      // Mock response with tool call
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_error',
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

      // Mock final response acknowledging error
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Sorry, the file was not found',
            },
          },
        ],
      });

      const messages = [{ role: 'user' as const, content: 'Read test.txt' }];
      const result = await executeChatCompletion(mockAgent, messages);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0]).toEqual({
        name: 'read_file',
        arguments: { path: 'test.txt' },
        error: 'File not found: test.txt',
      });
    });

    it('should throw error when max iterations exceeded', async () => {
      // Mock infinite loop of tool calls
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_loop',
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

      mockReadFileContent.mockResolvedValue('Content');

      const messages = [{ role: 'user' as const, content: 'Test' }];

      await expect(executeChatCompletion(mockAgent, messages)).rejects.toThrow(
        'Maximum function calling iterations (10) exceeded'
      );

      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(10);
    });

    it('should throw error when OpenAI API fails', async () => {
      mockClient.chat.completions.create.mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      );

      const messages = [{ role: 'user' as const, content: 'Test' }];

      await expect(executeChatCompletion(mockAgent, messages)).rejects.toThrow(
        'OpenAI API error: API rate limit exceeded'
      );
    });

    it('should include agent name and description in system message', async () => {
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Response',
            },
          },
        ],
      });

      const messages = [{ role: 'user' as const, content: 'Test' }];
      await executeChatCompletion(mockAgent, messages);

      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      const systemMessage = callArgs.messages[0];

      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('Test Agent');
      expect(systemMessage.content).toContain('A test agent for unit tests');
      expect(systemMessage.content).toContain('read_file');
      expect(systemMessage.content).toContain('write_file');
      expect(systemMessage.content).toContain('list_files');
    });
  });
});
