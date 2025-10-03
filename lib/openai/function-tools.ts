/**
 * OpenAI Function Tool Definitions
 *
 * Defines function calling tools for OpenAI agents:
 * - READ_FILE_TOOL: Read files from agent instruction folder or output directory
 * - WRITE_FILE_TOOL: Write content to files in output directory
 * - LIST_FILES_TOOL: List files and directories in a given path
 *
 * Each tool follows the OpenAI ChatCompletionTool specification.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Tool for reading files from the agent's instruction folder or output directory.
 */
export const READ_FILE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'read_file',
    description: "Read a file from the agent's instruction folder or output directory",
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The relative path to the file to read (e.g., "instructions.md" or "output/result.txt")',
        },
      },
      required: ['path'],
    },
  },
};

/**
 * Tool for writing content to files in the output directory.
 */
export const WRITE_FILE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'write_file',
    description: 'Write content to a file in the output directory',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The relative path within the output directory (e.g., "result.txt" or "data/output.json")',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
};

/**
 * Tool for listing files and directories in a given path.
 */
export const LIST_FILES_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'list_files',
    description: 'List files and directories in a given path',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The relative path to list (e.g., "." for current directory or "subfolder")',
        },
      },
      required: ['path'],
    },
  },
};

/**
 * Array of all available function tools for OpenAI agents.
 * Use this when calling OpenAI chat completions with tool support.
 */
export const FUNCTION_TOOLS: ChatCompletionTool[] = [
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  LIST_FILES_TOOL,
];
