/**
 * Tool Definitions for OpenAI Function Calling
 *
 * Defines the schemas for file operation tools that agents can use
 * within the agentic execution loop. These schemas guide the LLM
 * on when and how to use each tool.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Tool definition for read_file
 *
 * Enables agents to read files from the bundle or core BMAD system.
 * Supports path variables for portable workflows.
 */
export const readFileTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'read_file',
    description:
      'Read a file from the bundle or core BMAD system. Use this when you need to load configuration files, templates, instructions, or any other file referenced in agent instructions. Supports path variables: {bundle-root}, {core-root}, {project-root}, {config_source}:variable_name.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description:
            'Path to the file to read. Can use path variables: {bundle-root}/path/to/file.md, {core-root}/tasks/task.md, {config_source}:output_folder/file.md',
        },
      },
      required: ['file_path'],
    },
  },
};

/**
 * Tool definition for save_output
 *
 * Enables agents to save generated content to files.
 * Automatically creates parent directories if needed.
 */
export const saveOutputTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'save_output',
    description:
      'Save generated content to a file. Use this when you need to create output files, write generated documents, or save any content produced during workflow execution. Automatically creates parent directories. Supports path variables: {bundle-root}, {core-root}, {project-root}, {config_source}:variable_name.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description:
            'Path where the file should be saved. Can use path variables: {config_source}:output_folder/output.md, {bundle-root}/outputs/file.txt',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
      },
      required: ['file_path', 'content'],
    },
  },
};

/**
 * Tool definition for preload_workflow
 * Story 9.4: Smart Workflow Pre-loading
 *
 * Loads all workflow files in a single operation instead of requiring
 * the LLM to make 4-6 sequential read_file calls.
 *
 * PERFORMANCE: Reduces workflow initialization from ~110s to <20s
 * TOKEN SAVINGS: 50-70% reduction vs sequential loading
 */
export const preloadWorkflowTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'preload_workflow',
    description:
      'Load all files for a workflow execution in one call. Use this for run-workflow commands. This is MUCH faster than calling read_file multiple times. After calling this tool, all workflow files (workflow.yaml, config.yaml, instructions.md, template, workflow.md) are pre-loaded in the result. DO NOT call read_file for these files again - their content is already available in the preload_workflow result.',
    parameters: {
      type: 'object',
      properties: {
        workflow_path: {
          type: 'string',
          description:
            'Path to workflow.yaml file (e.g., {bundle-root}/workflows/intake-integration/workflow.yaml)',
        },
      },
      required: ['workflow_path'],
    },
  },
};

/**
 * All file operation tool definitions
 *
 * Export as array for easy registration with OpenAI API
 * Story 9.4: Added preload_workflow tool
 */
export const fileOperationTools: ChatCompletionTool[] = [
  preloadWorkflowTool, // Story 9.4: Smart pre-loading (use this for workflows!)
  readFileTool,
  saveOutputTool,
];

/**
 * Tool name enum for type-safe tool dispatching
 */
export enum ToolName {
  PreloadWorkflow = 'preload_workflow', // Story 9.4
  ReadFile = 'read_file',
  SaveOutput = 'save_output',
}
