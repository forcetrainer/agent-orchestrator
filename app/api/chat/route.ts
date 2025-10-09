import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ChatRequest, ChatResponse } from '@/types/api';
import { Message } from '@/lib/types';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';
import { getAgentById } from '@/lib/agents/loader';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import {
  getConversation,
  addMessage,
} from '@/lib/utils/conversations';
import {
  validateAgentId,
  validateMessage,
  validateConversationId,
} from '@/lib/utils/validation';
import { createChatSession, incrementMessageCount } from '@/lib/sessions/chatSessions';
import { validateFilePath } from '@/lib/files/security'; // Story 6.7
import { readFileForAttachment } from '@/lib/files/reader'; // Story 6.7
import { buildFileContextMessage } from '@/lib/chat/fileContext'; // Story 6.7
import { env } from '@/lib/utils/env'; // Story 6.7
import { resolve } from 'path'; // Story 6.7
import { getOpenAIClient } from '@/lib/openai/client';
import { buildSystemPrompt } from '@/lib/agents/systemPromptBuilder';
import { processCriticalActions } from '@/lib/agents/criticalActions';
import { mapToolCallToStatus } from '@/lib/openai/status-mapper'; // Story 6.9

/**
 * POST /api/chat
 * Handles chat messages with agent orchestration and OpenAI function calling
 *
 * Story 1.2: API Route Structure
 * Story 1.4: Error Handling Middleware
 * Story 2.5: Chat API Route with Function Calling Loop
 * Story 2.6: Conversation State Management
 * Story 6.8: Streaming Responses (visual enhancement only - preserves agentic loop)
 *
 * AC-6.8.3: Tool calls from LLM pause streaming
 * AC-6.8.10: Tool execution completes before streaming resumes
 * AC-6.8.11: Tool results inject into conversation context (existing pattern)
 *
 * - Validates all inputs (agentId, message, conversationId)
 * - Manages conversation state across multiple messages
 * - Loads agent by ID (returns 404 if not found)
 * - Executes chat completion with full conversation history
 * - Streams response token-by-token (Story 6.8)
 * - Returns Server-Sent Events (SSE) stream
 * - Uses centralized error handling
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChatRequest = await request.json();

    // Validate inputs
    validateAgentId(body.agentId);
    validateMessage(body.message);
    validateConversationId(body.conversationId);

    // Load agent by ID
    const agent = await getAgentById(body.agentId);

    if (!agent) {
      throw new NotFoundError(`Agent not found: ${body.agentId}`);
    }

    // Get or create conversation
    const conversation = getConversation(body.conversationId, body.agentId);

    // Story 6.3: Create session manifest on first message
    const isFirstMessage = conversation.messages.length === 0;
    if (isFirstMessage) {
      const { sessionId } = await createChatSession(
        agent.id,
        agent.title,
        body.message,
        'Bryan' // TODO: Get from config or request context
      );
      conversation.sessionId = sessionId;
    }

    // Story 6.7: Process file attachments if present
    // Story 6.9: Track user attachments for context-aware status messages
    let fileContextMessage: ChatCompletionMessageParam | null = null;
    const userAttachmentPaths: string[] = [];

    if (body.attachments && body.attachments.length > 0) {
      const attachmentContents: Array<{ filepath: string; filename: string; content: string }> = [];

      for (const { filepath, filename } of body.attachments) {
        userAttachmentPaths.push(filepath);
        // Validate path security (AC #2, #9)
        const validation = validateFilePath(filepath, env.OUTPUT_PATH);
        if (!validation.valid) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: 'Access denied: invalid file path',
              code: 403
            },
            { status: 403 }
          );
        }

        // Resolve to absolute path for reading
        const absolutePath = resolve(env.OUTPUT_PATH, filepath);

        // Read file with size limit (AC #3, #7, #8)
        const result = await readFileForAttachment(absolutePath);
        if (!result.success) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: result.error,
              code: result.code
            },
            { status: result.code }
          );
        }

        attachmentContents.push({ filepath, filename, content: result.content });
      }

      // Build file context message (AC #4, #5, #6)
      fileContextMessage = buildFileContextMessage(attachmentContents);
    }

    // Add user message to conversation
    const userMessage = addMessage(conversation.id, {
      role: 'user',
      content: body.message,
    });

    // Story 6.3: Increment message count for subsequent messages
    if (!isFirstMessage && conversation.sessionId) {
      await incrementMessageCount(conversation.sessionId);
    }

    // Build messages array for OpenAI (convert to ChatCompletionMessageParam format)
    // Filter out 'error' and 'system' messages (system is added by executeChatCompletion)
    // Preserve function calls and tool responses to avoid re-loading files
    let messages: ChatCompletionMessageParam[] = conversation.messages
      .filter((msg) => msg.role !== 'error' && msg.role !== 'system')
      .map((msg) => {
        if (msg.role === 'user') {
          return {
            role: 'user' as const,
            content: msg.content,
          };
        } else if (msg.role === 'assistant') {
          const assistantMessage: any = {
            role: 'assistant' as const,
            content: msg.content,
          };
          // Preserve function calls (tool_calls)
          if (msg.functionCalls && msg.functionCalls.length > 0) {
            assistantMessage.tool_calls = msg.functionCalls;
          }
          return assistantMessage;
        } else {
          // msg.role === 'tool'
          return {
            role: 'tool' as const,
            content: msg.content,
            tool_call_id: (msg as any).toolCallId || '',
          };
        }
      });

    // Story 6.7: Inject file context message before the current user message (AC #4)
    if (fileContextMessage) {
      // Insert file context message right before the last user message
      messages.splice(messages.length - 1, 0, fileContextMessage);
    }

    // Story 6.8: STREAMING IMPLEMENTATION
    // AC-6.8.1: Implement streaming within existing agentic loop (DO NOT replace loop)
    // This creates a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build system prompt and critical context (same as agenticLoop.ts)
          const effectiveBundleRoot = agent.bundlePath || agent.path;
          const systemPromptContent = buildSystemPrompt(agent);
          const criticalContext = await processCriticalActions(agent, effectiveBundleRoot);

          // Build complete messages array with system prompt and critical context
          const completeMessages: ChatCompletionMessageParam[] = [
            {
              role: 'system',
              content: systemPromptContent,
            },
            ...criticalContext.messages,
            ...messages,
          ];

          // Get OpenAI client and tool definitions
          const client = getOpenAIClient();
          const model = env.OPENAI_MODEL || 'gpt-4';

          // Import tool definitions
          const { readFileTool, saveOutputTool, executeWorkflowTool } = require('@/lib/tools/toolDefinitions');
          const tools = [readFileTool, saveOutputTool, executeWorkflowTool];

          // Path context for tool execution
          const pathContext = {
            bundleRoot: agent.bundlePath || effectiveBundleRoot,
            coreRoot: 'bmad/core',
            projectRoot: process.cwd(),
            bundleConfig: criticalContext.config,
            toolCallCount: 0
          };

          // AC-6.8.3: AGENTIC LOOP with streaming
          // Loop continues until LLM returns response without tool calls
          const MAX_ITERATIONS = 50;
          let iterations = 0;
          let accumulatedContent = '';

          while (iterations < MAX_ITERATIONS) {
            iterations++;

            // AC-6.8.2: Call OpenAI with streaming enabled
            const response = await client.chat.completions.create({
              model,
              messages: completeMessages,
              tools,
              tool_choice: 'auto',
              stream: true, // Story 6.8: Enable streaming
            });

            let assistantMessage: any = {
              role: 'assistant',
              content: '',
              tool_calls: []
            };

            // AC-6.8.3: Process streaming chunks
            for await (const chunk of response) {
              const delta = chunk.choices[0]?.delta;
              const finishReason = chunk.choices[0]?.finish_reason;

              // AC-6.8.3: Stream tokens when delta.content present
              if (delta?.content) {
                assistantMessage.content += delta.content;
                accumulatedContent += delta.content;

                // Emit token event to frontend
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'token', content: delta.content })}\n\n`)
                );
              }

              // AC-6.8.4: Accumulate tool calls (streaming API sends tool calls in chunks)
              if (delta?.tool_calls) {
                for (const toolCallDelta of delta.tool_calls) {
                  const index = toolCallDelta.index;

                  // Initialize tool call if first chunk
                  if (!assistantMessage.tool_calls[index]) {
                    assistantMessage.tool_calls[index] = {
                      id: toolCallDelta.id || '',
                      type: 'function',
                      function: {
                        name: '',
                        arguments: ''
                      }
                    };
                  }

                  // Set function name (comes in first chunk, don't accumulate)
                  if (toolCallDelta.function?.name) {
                    assistantMessage.tool_calls[index].function.name = toolCallDelta.function.name;
                  }

                  // Accumulate function arguments (come in multiple chunks)
                  if (toolCallDelta.function?.arguments) {
                    assistantMessage.tool_calls[index].function.arguments += toolCallDelta.function.arguments;
                  }

                  // Set tool call ID (comes in first chunk, don't accumulate)
                  if (toolCallDelta.id) {
                    assistantMessage.tool_calls[index].id = toolCallDelta.id;
                  }
                }
              }

              // AC-6.8.7: Handle completion
              if (finishReason) {
                break;
              }
            }

            // Add assistant message to context
            completeMessages.push(assistantMessage);

            // AC-6.8.4, AC-6.8.5: PAUSE streaming for tool calls, execute tools, RESUME
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
              // Filter out empty tool calls
              assistantMessage.tool_calls = assistantMessage.tool_calls.filter((tc: any) => tc.id);

              if (assistantMessage.tool_calls.length > 0) {
                // AC-6.8.6: Emit status events for tool execution
                // Story 6.9: Context-aware status messages
                for (const toolCall of assistantMessage.tool_calls) {
                  // Emit context-aware status event (Story 6.9)
                  const statusMessage = mapToolCallToStatus(toolCall, userAttachmentPaths);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'status', message: statusMessage })}\n\n`)
                  );

                  // Execute tool (existing logic from agenticLoop.ts)
                  pathContext.toolCallCount++;
                  const result = await executeToolCall(toolCall, pathContext);

                  // Clear status after tool execution (Story 6.9: AC #8)
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'status', message: '' })}\n\n`)
                  );

                  // AC-6.8.5: Inject tool result into context before resuming
                  const toolMessage: ChatCompletionMessageParam = {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result),
                  };
                  completeMessages.push(toolMessage);
                }

                // Continue loop to resume streaming with tool results
                continue;
              }
            }

            // No tool calls - streaming complete
            // AC-6.8.7: Send conversationId before completion event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'conversationId', conversationId: conversation.id })}\n\n`)
            );
            // Send completion event
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();

            // Store messages in conversation (preserve existing pattern)
            // Add assistant message
            const savedAssistantMsg = addMessage(conversation.id, {
              role: 'assistant',
              content: assistantMessage.content || accumulatedContent,
              functionCalls: assistantMessage.tool_calls?.length > 0 ? assistantMessage.tool_calls : undefined,
            });

            // Increment message count
            if (conversation.sessionId) {
              await incrementMessageCount(conversation.sessionId);
            }

            return; // Exit successfully
          }

          // Max iterations exceeded
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Maximum iterations exceeded' })}\n\n`)
          );
          controller.close();

        } catch (error: any) {
          // AC-6.8.8: Handle streaming errors
          console.error('[/api/chat] Streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message || 'Streaming error' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    // Return SSE stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Execute a single tool call with path resolution.
 * (Copied from agenticLoop.ts to avoid circular dependencies)
 */
async function executeToolCall(toolCall: any, context: any): Promise<any> {
  const functionName = toolCall.function.name;
  const functionArgs = JSON.parse(toolCall.function.arguments);

  console.log(`[/api/chat] Executing tool: ${functionName}`, functionArgs);

  // Import file operation functions
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
    console.error(`[/api/chat] Tool ${functionName} failed:`, error);
    return {
      success: false,
      error: error
    };
  }
}

// Story 6.9: mapToolCallToStatus moved to lib/openai/status-mapper.ts
// for context-aware status messaging (distinguishes user-attached files from internal files)
