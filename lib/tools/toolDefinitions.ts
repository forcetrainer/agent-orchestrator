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
 * Tool definition for execute_workflow
 *
 * Enables agents to load and execute workflow configurations.
 * Returns complete workflow context: config, instructions, template.
 */
export const executeWorkflowTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'execute_workflow',
    description:
      'Load a workflow configuration by reading workflow.yaml, instructions.md, and optional template.md. Use this when you need to execute a workflow or load workflow configuration. Returns the complete workflow context including resolved variables. Supports path variables for portable workflow references.',
    parameters: {
      type: 'object',
      properties: {
        workflow_path: {
          type: 'string',
          description:
            'Path to workflow.yaml file. Can use path variables: {bundle-root}/workflows/my-workflow/workflow.yaml, {core-root}/workflows/task.yaml',
        },
        user_input: {
          type: 'object',
          description:
            'Optional user input data to pass to the workflow. Can include any key-value pairs needed by the workflow.',
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
 */
export const fileOperationTools: ChatCompletionTool[] = [
  readFileTool,
  saveOutputTool,
  executeWorkflowTool,
];

/**
 * Tool name enum for type-safe tool dispatching
 */
export enum ToolName {
  ReadFile = 'read_file',
  SaveOutput = 'save_output',
  ExecuteWorkflow = 'execute_workflow',
}
