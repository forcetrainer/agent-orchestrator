/**
 * Agentic Execution Loop Module
 * Story 4.1: Implement Agentic Execution Loop
 *
 * Implements the foundational agentic execution pattern for BMAD agents using the
 * pause-load-continue pattern inspired by Claude Code.
 *
 * EXECUTION FLOW:
 * 1. User message → LLM generates tool call (e.g., read_file)
 * 2. Execution PAUSES - cannot continue without tool result
 * 3. Tool executes, file content loaded
 * 4. Result injected into conversation context
 * 5. Execution CONTINUES - LLM processes loaded content
 * 6. Repeat until LLM returns final response without tool calls
 *
 * KEY FEATURES:
 * - Execution BLOCKS on tool calls (pause-load-continue pattern)
 * - Maintains conversation context across all iterations
 * - Safety limit of MAX_ITERATIONS to prevent infinite loops
 * - Each iteration grows message context with tool results
 *
 * This replaces the Epic 2 simple function calling loop with blocking execution.
 *
 * For complete specification, see: docs/AGENT-EXECUTION-SPEC.md Section 3
 * @see https://github.com/your-repo/docs/AGENT-EXECUTION-SPEC.md#3-agentic-execution-loop
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
 * Import shared tool executor
 */
import { executeToolCall } from '@/lib/tools/toolExecutor';

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
 * Story 9.1: Only read_file and save_output tools remain
 */
function getToolDefinitions() {
  const { readFileTool, saveOutputTool } = require('@/lib/tools/toolDefinitions');
  return [readFileTool, saveOutputTool];
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
  // IMPORTANT: Use kebab-case keys to match PathContext interface (lib/pathResolver.ts)
  const pathContext = {
    'bundle-root': agent.bundlePath || effectiveBundleRoot,
    'core-root': `${process.cwd()}/bmad/core`,
    'project-root': process.cwd(),
    bundleConfig: criticalContext.config,
    toolCallCount: 0,
    'session-folder': undefined // Will be set by session manager if needed
  };

  // AC-4.1.5: Initialize iteration counter
  let iterations = 0;

  // AC-4.1.1: AGENTIC LOOP - While loop that continues until no tool calls
  // This is the core of the pause-load-continue pattern:
  // - Each iteration represents one LLM call
  // - If LLM returns tool calls, we execute them and loop back
  // - If LLM returns text response, we're done
  // - Safety limit prevents infinite loops
  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // AC-4.1.6: Log iteration count for debugging
    const iterationStartTime = performance.now();
    console.log(`[agenticLoop] Iteration ${iterations}/${MAX_ITERATIONS}`);

    try {
      // AC-4.1.2: Call OpenAI with messages and tools
      // Task 3: OpenAI Integration
      // PAUSE POINT: We send the current conversation state to OpenAI
      // The messages array contains:
      // - System prompt with tool usage instructions
      // - Critical context (config files loaded during initialization)
      // - Conversation history from previous iterations
      // - Tool results from previous iterations (if any)
      // - Current user message
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
      // This preserves the full conversation context for the next iteration
      messages.push(assistantMessage);

      // Task 3.4: Check for presence of tool_calls
      // AC-4.1.2: Check for tool calls
      // DECISION POINT: Does LLM want to load files or return final response?
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // AC-4.1.6: Log tool call information
        console.log(`[agenticLoop] Processing ${assistantMessage.tool_calls.length} tool calls`);

        // AC-4.1.8: EXECUTION PAUSES - Execution blocks on tool calls
        // This is the "pause" part of pause-load-continue:
        // - LLM requested file(s) to be loaded
        // - We MUST execute these tools before continuing
        // - LLM cannot proceed without the tool results
        // Task 4: Tool Execution and Result Injection
        // Task 4.1: Iterate through each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          // AC-4.1.6: Log tool call names and parameters
          console.log(`[agenticLoop] Tool call: ${functionName}`, functionArgs);

          // Task 4.2: EXECUTE TOOL - This is the "load" part of pause-load-continue
          // Tool executes (e.g., reads file from disk using path resolution)
          // Result contains file content or workflow configuration
          pathContext.toolCallCount++;
          const result = await executeToolCall(toolCall, pathContext);

          // AC-4.1.6: Log tool result status
          const success = result && (!result.error || result.success !== false);
          console.log(`[agenticLoop] Tool result: ${success ? '✅ success' : '❌ error'}`);

          // Task 4.3: Create tool result message with role: 'tool'
          // AC-4.1.4: INJECT RESULT - Tool results injected as 'tool' role messages with tool_call_id
          // The tool_call_id links this result to the specific tool call that requested it
          // This is how OpenAI knows which tool result corresponds to which tool call
          const toolMessage: ChatCompletionMessageParam = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };

          // Task 4.4: Append tool result message to messages array
          // AC-4.1.3: Messages array grows with each tool result
          // Now the file content is in the conversation context for next iteration
          messages.push(toolMessage);
        }

        // Task 4.5: Continue loop only after ALL tool results injected
        // AC-4.1.8: Execution blocks - cannot continue without tool results
        // All tool results are now in context, ready for next iteration
        const iterationDuration = performance.now() - iterationStartTime;
        console.log(`[agenticLoop] Iteration ${iterations} completed in ${iterationDuration.toFixed(2)}ms, looping back to LLM`);

        // AC-4.1.2: CONTINUE - Loop back to LLM with tool results
        // This is the "continue" part of pause-load-continue:
        // - Tool results now in messages array
        // - Next iteration: LLM processes loaded content
        // - LLM may generate more tool calls or return final response
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
