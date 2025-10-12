/**
 * Tool Executor
 *
 * Centralized tool execution logic shared by:
 * - lib/agents/agenticLoop.ts (agentic execution loop)
 * - app/api/chat/route.ts (streaming chat API)
 *
 * This avoids code duplication and ensures consistent tool execution behavior.
 *
 * Story 9.4: Added preload_workflow tool execution
 */

import { executeReadFile, executeSaveOutput } from './fileOperations';
import { preloadWorkflowFiles } from '../workflows/workflowPreloader';

/**
 * Execute a single tool call with path resolution.
 *
 * @param toolCall - Tool call from OpenAI containing function name and arguments
 * @param context - Path resolution context (bundleRoot, coreRoot, projectRoot, etc.)
 * @returns Tool execution result
 */
export async function executeToolCall(toolCall: any, context: any): Promise<any> {
  const functionName = toolCall.function.name;
  const functionArgs = JSON.parse(toolCall.function.arguments);

  console.log(`[toolExecutor] Executing tool: ${functionName}`, functionArgs);
  console.log(`[toolExecutor] Context sessionFolder: ${context.sessionFolder}`);

  let result: any;

  try {
    switch (functionName) {
      case 'preload_workflow':
        // Story 9.4: Smart Workflow Pre-loading
        console.log(`[preload_workflow] 🚀 Pre-loading workflow: ${functionArgs.workflow_path}`);
        const preloadStart = Date.now();
        const preloadResult = await preloadWorkflowFiles(functionArgs.workflow_path, context);
        const preloadDuration = Date.now() - preloadStart;
        console.log(`[preload_workflow] ✅ Pre-loaded ${preloadResult.filesLoaded.length} files in ${preloadDuration}ms:`);
        preloadResult.filesLoaded.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

        // Return formatted result for LLM
        result = {
          success: true,
          files: {
            workflow_config: {
              path: functionArgs.workflow_path,
              content: preloadResult.workflowYaml
            },
            config: {
              path: preloadResult.filesLoaded.find(f => f.includes('config.yaml')) || 'config.yaml',
              content: preloadResult.configYaml
            },
            instructions: {
              path: preloadResult.filesLoaded.find(f => f.includes('instructions.md')) || 'instructions.md',
              content: preloadResult.instructions
            },
            template: preloadResult.template ? {
              path: preloadResult.filesLoaded.find(f => f.includes('template')) || 'template',
              content: preloadResult.template
            } : null,
            workflow_engine: {
              path: '{project-root}/bmad/core/tasks/workflow.md',
              content: preloadResult.workflowEngine
            },
            elicit_task: preloadResult.elicitTask ? {
              path: '{project-root}/bmad/core/tasks/adv-elicit.md',
              content: preloadResult.elicitTask
            } : undefined
          },
          filesLoaded: preloadResult.filesLoaded,
          message: preloadResult.message
        };
        break;

      case 'read_file':
        const timestamp = new Date().toISOString();
        console.log(`[read_file #${context.toolCallCount || 1}] 📂 Loading: ${functionArgs.file_path} at ${timestamp}`);
        result = await executeReadFile(functionArgs, context);
        if (result.success) {
          console.log(`[read_file #${context.toolCallCount || 1}] ✅ Loaded ${result.size} bytes from: ${result.path}`);
        } else {
          console.error(`[read_file #${context.toolCallCount || 1}] ❌ Failed: ${result.error}`);
        }
        break;

      case 'save_output':
        console.log(`[save_output] 💾 Writing to: ${functionArgs.file_path}`);
        result = await executeSaveOutput(functionArgs, context);
        if (result.success) {
          console.log(`[save_output] ✅ Written ${result.size} bytes to: ${result.path}`);
        } else {
          console.error(`[save_output] ❌ Failed: ${result.error}`);
        }
        break;

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    return result;
  } catch (err: any) {
    const error = err.message || String(err);
    console.error(`[toolExecutor] Tool ${functionName} failed:`, error);
    // Return structured error format for OpenAI
    return {
      success: false,
      error: error
    };
  }
}
