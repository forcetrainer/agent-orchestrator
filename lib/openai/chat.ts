/**
 * OpenAI Chat Service Module
 *
 * Implements the chat completion flow with function calling loop:
 * 1. Build system message from agent metadata
 * 2. Call OpenAI API with function tools
 * 3. Execute function calls iteratively until LLM returns final response
 * 4. Track all function calls and return final assistant message
 *
 * Security: All file operations validated through existing security layer
 * Performance: MAX_ITERATIONS limit prevents infinite loops
 */

import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { getOpenAIClient } from './client';
import { FUNCTION_TOOLS } from './function-tools';
import { readFileContent } from '@/lib/files/reader';
import { writeFileContent } from '@/lib/files/writer';
import { listFiles } from '@/lib/files/lister';
import type { Agent } from '@/types';
import { env } from '@/lib/utils/env';

/**
 * Maximum number of function calling iterations to prevent infinite loops
 */
const MAX_ITERATIONS = 10;

/**
 * Represents a function call executed during chat completion
 */
export interface ExecutedFunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}

/**
 * Result of executing a chat completion with function calling
 */
export interface ChatCompletionResult {
  content: string;
  functionCalls: ExecutedFunctionCall[];
}

/**
 * Executes a chat completion with function calling loop.
 *
 * Flow:
 * 1. Build system message from agent metadata
 * 2. Execute OpenAI API call with function tools
 * 3. If response contains tool_calls:
 *    - Execute each function call
 *    - Add tool results to messages
 *    - Loop back to step 2
 * 4. If no tool_calls or max iterations reached:
 *    - Return final assistant message with tracked function calls
 *
 * @param agent - Agent metadata with name and description
 * @param messages - Conversation messages (user/assistant/tool messages)
 * @returns ChatCompletionResult with final response and function call history
 * @throws Error if OpenAI API call fails or max iterations exceeded
 */
export async function executeChatCompletion(
  agent: Agent,
  messages: ChatCompletionMessageParam[]
): Promise<ChatCompletionResult> {
  const client = getOpenAIClient();
  const model = env.OPENAI_MODEL || 'gpt-4';

  // Build system message with full agent instructions
  const systemMessage: ChatCompletionMessageParam = {
    role: 'system',
    content: `${agent.fullContent}

ENVIRONMENT VARIABLES:
- {project-root} or {project_root} = ${env.PROJECT_ROOT}
- Agent directory = ${agent.path}
- BMAD Core path = ${env.PROJECT_ROOT}/bmad/core
- BMAD SN path = ${env.PROJECT_ROOT}/bmad/sn

You have access to the following tools:
- read_file: Read files from your instruction folder or output directory
- write_file: Write content to files in the output directory
- list_files: List files and directories in a given path

Use these tools to help users accomplish their tasks effectively.
When you see {project-root} or {project_root} in workflow paths or config files, replace it with: ${env.PROJECT_ROOT}
When you see bmad/core/ or bmad/sn/ without a full path, prepend: ${env.PROJECT_ROOT}/`,
  };

  // Combine system message with conversation messages
  const allMessages: ChatCompletionMessageParam[] = [systemMessage, ...messages];

  // Track all function calls for response
  const functionCalls: ExecutedFunctionCall[] = [];

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`[chat] Iteration ${iterations}/${MAX_ITERATIONS}`);

    try {
      // Call OpenAI API with function tools
      const response = await client.chat.completions.create({
        model,
        messages: allMessages,
        tools: FUNCTION_TOOLS,
      });

      const choice = response.choices[0];

      if (!choice?.message) {
        throw new Error('OpenAI API returned no message in response');
      }

      const assistantMessage = choice.message;

      // Add assistant message to conversation
      allMessages.push(assistantMessage);

      // Check if response contains tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`[chat] Processing ${assistantMessage.tool_calls.length} tool calls`);

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`[chat] Executing function: ${functionName}`, functionArgs);

          let result: any;
          let error: string | undefined;

          try {
            // Execute function based on name
            switch (functionName) {
              case 'read_file':
                result = await readFileContent(functionArgs.path);
                break;

              case 'write_file':
                await writeFileContent(functionArgs.path, functionArgs.content);
                result = { success: true, path: functionArgs.path };
                break;

              case 'list_files':
                result = await listFiles(functionArgs.path, functionArgs.recursive || false);
                break;

              default:
                throw new Error(`Unknown function: ${functionName}`);
            }

            console.log(`[chat] Function ${functionName} executed successfully`);
          } catch (err: any) {
            error = err.message || String(err);
            // Return structured error format for OpenAI
            result = {
              success: false,
              error: error
            };
            console.error(`[chat] Function ${functionName} failed:`, error, '\nStack:', err.stack);
          }

          // Track function call
          functionCalls.push({
            name: functionName,
            arguments: functionArgs,
            result: error ? undefined : result,
            error,
          });

          // Add tool result message to conversation
          const toolMessage: ChatCompletionMessageParam = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };

          allMessages.push(toolMessage);
        }

        // Continue loop to get next response from OpenAI
        continue;
      }

      // No tool calls - return final response
      const content = assistantMessage.content || '';

      console.log(`[chat] Completed in ${iterations} iterations with ${functionCalls.length} function calls`);

      return {
        content,
        functionCalls,
      };

    } catch (err: any) {
      console.error(`[chat] OpenAI API error:`, err);
      throw new Error(`OpenAI API error: ${err.message || String(err)}`);
    }
  }

  // Max iterations reached
  throw new Error(`Maximum function calling iterations (${MAX_ITERATIONS}) exceeded`);
}
