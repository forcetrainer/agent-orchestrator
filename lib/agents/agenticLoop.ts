/**
 * Agentic Execution Loop Module
 * Story 4.1: Implement Agentic Execution Loop
 *
 * Implements the foundational agentic execution pattern for BMAD agents:
 * - User message → LLM call → Tool calls? → Execute tools → Loop back → Final response
 * - Execution BLOCKS on tool calls (pause-load-continue pattern)
 * - Maintains conversation context across all iterations
 * - Safety limit of MAX_ITERATIONS to prevent infinite loops
 *
 * This replaces the Epic 2 simple function calling loop with blocking execution.
 */

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getOpenAIClient } from '@/lib/openai/client';
import { getAgentById } from '@/lib/agents/loader';
import type { Agent } from '@/types';
import { env } from '@/lib/utils/env';
import { buildSystemPrompt } from './systemPromptBuilder';

/**
 * Maximum number of iterations to prevent infinite loops.
 * Normal workflows should complete in <10 iterations.
 * AC-4.1.5: Loop has safety limit (MAX_ITERATIONS = 50)
 */
const MAX_ITERATIONS = 50;

/**
 * Result of executing an agentic loop.
 *
 * AC-4.1.1: Contains success flag, final response, iteration count, and messages
 */
export interface ExecutionResult {
  /** Whether execution completed successfully */
  success: boolean;
  /** Final response content from the assistant */
  response: string;
  /** Number of iterations executed */
  iterations: number;
  /** Full conversation messages array for persistence */
  messages: Array<ChatCompletionMessageParam>;
}

/**
 * Import critical actions processor from Story 4.3
 */
import { processCriticalActions } from './criticalActions';

/**
 * Builds system prompt with tool usage instructions.
 *
 * STUB: This is a placeholder for Story 4.8 - System Prompt Builder
 * TODO: Replace with actual implementation when Story 4.8 is complete
 *
 * For now, uses the existing pattern from lib/openai/chat.ts
 *
 * @param agent - Agent metadata
 * @returns System prompt content
 */
// buildSystemPrompt is now imported from systemPromptBuilder.ts (Story 4.8)

/**
 * Gets tool definitions for OpenAI function calling.
 *
 * Story 4.9: Import all tool definitions including execute_workflow
 */
function getToolDefinitions() {
  const { readFileTool, saveOutputTool, executeWorkflowTool } = require('@/lib/tools/toolDefinitions');
  return [readFileTool, saveOutputTool, executeWorkflowTool];
}

/**
 * Executes a single tool call with path resolution.
 *
 * Story 4.9: Updated to use Story 4.5 file operation tools with PathContext
 *
 * @param toolCall - Tool call from OpenAI
 * @param context - Path resolution context (bundleRoot, coreRoot, etc.)
 * @returns Tool execution result
 */
async function executeToolCall(toolCall: any, context: any): Promise<any> {
  const functionName = toolCall.function.name;
  const functionArgs = JSON.parse(toolCall.function.arguments);

  console.log(`[agenticLoop] Executing tool: ${functionName}`, functionArgs);

  // Import new file operation functions from Story 4.5
  const { executeReadFile, executeSaveOutput, executeWorkflow } = require('@/lib/tools/fileOperations');

  let result: any;

  try {
    switch (functionName) {
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

      case 'execute_workflow':
        console.log(`[execute_workflow] 🔄 Loading workflow: ${functionArgs.workflow_path}`);
        result = await executeWorkflow(functionArgs, context);
        if (result.success) {
          console.log(`[execute_workflow] ✅ Workflow loaded: ${result.workflow?.name || 'unknown'}`);
        } else {
          console.error(`[execute_workflow] ❌ Failed: ${result.error}`);
        }
        break;

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    return result;
  } catch (err: any) {
    const error = err.message || String(err);
    console.error(`[agenticLoop] Tool ${functionName} failed:`, error);
    // Return structured error format for OpenAI
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Executes an agentic loop for the given agent and user message.
 *
 * AC-4.1.1: Implements while loop that continues until LLM returns response without tool calls
 * AC-4.1.2: Each iteration follows pattern: call OpenAI → check for tool calls → execute tools → inject results → loop back
 * AC-4.1.3: Conversation messages array grows with each tool call and result, maintaining full context
 * AC-4.1.4: Tool results injected as 'tool' role messages with tool_call_id matching the tool call
 * AC-4.1.5: Loop has safety limit (MAX_ITERATIONS = 50) to prevent infinite loops
 * AC-4.1.6: Each iteration logged for debugging with iteration count and tool call information
 * AC-4.1.7: Loop maintains conversation context across all iterations (messages array preserved)
 * AC-4.1.8: Agent cannot continue without tool results - execution blocks on tool calls
 *
 * @param agentId - Agent identifier
 * @param userMessage - User's message content
 * @param conversationHistory - Previous conversation messages (optional)
 * @returns ExecutionResult with final response and conversation state
 * @throws Error if agent not found, OpenAI API fails, or max iterations exceeded
 */
export async function executeAgent(
  agentId: string,
  userMessage: string,
  conversationHistory: Array<ChatCompletionMessageParam> = [],
  bundleRoot?: string
): Promise<ExecutionResult> {
  const startTime = performance.now();

  // AC-4.1.7: Load agent metadata
  const agent = await getAgentById(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  console.log(`[agenticLoop] Starting execution for agent: ${agentId}`);

  // AC-4.1.3, AC-4.1.7: Build initial messages array
  // Task 2: Message Context Building
  const messages: ChatCompletionMessageParam[] = [];

  // Task 2.1: Add system prompt
  const systemPromptContent = buildSystemPrompt(agent);
  messages.push({
    role: 'system',
    content: systemPromptContent,
  });

  // Task 2.2: Add critical context messages (from Story 4.3)
  // Story 4.7: Use provided bundleRoot or fall back to agent.path
  const effectiveBundleRoot = bundleRoot || agent.path;
  const criticalContext = await processCriticalActions(agent, effectiveBundleRoot);
  messages.push(...criticalContext.messages);

  // Task 2.3: Append conversation history from previous turns
  messages.push(...conversationHistory);

  // Task 2.4: Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  // Get OpenAI client and tool definitions
  const client = getOpenAIClient();
  const model = env.OPENAI_MODEL || 'gpt-4';
  const tools = getToolDefinitions();

  // Story 4.9: Build PathContext for tool execution
  // Use agent.bundlePath (from bundleScanner) or fall back to effectiveBundleRoot
  const pathContext = {
    bundleRoot: agent.bundlePath || effectiveBundleRoot,
    coreRoot: 'bmad/core',
    projectRoot: process.cwd(),
    bundleConfig: criticalContext.config,
    toolCallCount: 0
  };

  // AC-4.1.5: Initialize iteration counter
  let iterations = 0;

  // AC-4.1.1: While loop that continues until no tool calls
  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // AC-4.1.6: Log iteration count for debugging
    const iterationStartTime = performance.now();
    console.log(`[agenticLoop] Iteration ${iterations}/${MAX_ITERATIONS}`);

    try {
      // AC-4.1.2: Call OpenAI with messages and tools
      // Task 3: OpenAI Integration
      const response = await client.chat.completions.create({
        model,
        messages,
        tools,
        tool_choice: 'auto', // Task 3.5: Allow LLM to choose when to call tools
      });

      const choice = response.choices[0];

      if (!choice?.message) {
        throw new Error('OpenAI API returned no message in response');
      }

      // Task 3.2: Extract assistant message
      const assistantMessage = choice.message;

      // Task 3.3: Append assistant message to messages array
      // AC-4.1.3: Messages array grows with each response
      messages.push(assistantMessage);

      // Task 3.4: Check for presence of tool_calls
      // AC-4.1.2: Check for tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // AC-4.1.6: Log tool call information
        console.log(`[agenticLoop] Processing ${assistantMessage.tool_calls.length} tool calls`);

        // AC-4.1.8: Execution blocks on tool calls
        // Task 4: Tool Execution and Result Injection
        // Task 4.1: Iterate through each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          // AC-4.1.6: Log tool call names and parameters
          console.log(`[agenticLoop] Tool call: ${functionName}`, functionArgs);

          // Task 4.2: Execute each tool call
          pathContext.toolCallCount++;
          const result = await executeToolCall(toolCall, pathContext);

          // AC-4.1.6: Log tool result status
          const success = result && (!result.error || result.success !== false);
          console.log(`[agenticLoop] Tool result: ${success ? '✅ success' : '❌ error'}`);

          // Task 4.3: Create tool result message with role: 'tool'
          // AC-4.1.4: Tool results injected as 'tool' role messages with tool_call_id
          const toolMessage: ChatCompletionMessageParam = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };

          // Task 4.4: Append tool result message to messages array
          // AC-4.1.3: Messages array grows with each tool result
          messages.push(toolMessage);
        }

        // Task 4.5: Continue loop only after ALL tool results injected
        // AC-4.1.8: Execution blocks - cannot continue without tool results
        const iterationDuration = performance.now() - iterationStartTime;
        console.log(`[agenticLoop] Iteration ${iterations} completed in ${iterationDuration.toFixed(2)}ms, looping back to LLM`);

        // AC-4.1.2: Loop back to LLM with tool results
        continue;
      }

      // No tool calls - return final response
      // Task 6: Loop Completion
      const content = assistantMessage.content || '';
      const totalDuration = performance.now() - startTime;

      // AC-4.1.6: Log final response
      console.log(`[agenticLoop] Completed successfully in ${iterations} iterations (${totalDuration.toFixed(2)}ms)`);

      // Task 6.1, 6.2, 6.3, 6.4: Return ExecutionResult
      return {
        success: true,
        response: content,
        iterations,
        messages, // AC-4.1.7: Include final messages array for conversation history
      };

    } catch (err: any) {
      // Task 6.6: Log error details
      console.error(`[agenticLoop] Error in iteration ${iterations}:`, err.message);
      throw new Error(`OpenAI API error: ${err.message || String(err)}`);
    }
  }

  // AC-4.1.5: Max iterations reached
  // Task 6.5: Throw error with clear message when MAX_ITERATIONS exceeded
  // Task 6.6: Log error details
  const totalDuration = performance.now() - startTime;
  console.error(`[agenticLoop] Maximum iterations (${MAX_ITERATIONS}) exceeded after ${totalDuration.toFixed(2)}ms`);
  throw new Error(`Maximum function calling iterations (${MAX_ITERATIONS}) exceeded. Possible infinite loop detected.`);
}
