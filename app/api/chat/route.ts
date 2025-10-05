import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ChatRequest, ChatResponse } from '@/types/api';
import { Message } from '@/lib/types';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';
import { getAgentById } from '@/lib/agents/loader';
import { executeChatCompletion } from '@/lib/openai/chat';
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

/**
 * POST /api/chat
 * Handles chat messages with agent orchestration and OpenAI function calling
 *
 * Story 1.2: API Route Structure
 * Story 1.4: Error Handling Middleware
 * Story 2.5: Chat API Route with Function Calling Loop
 * Story 2.6: Conversation State Management
 * - Validates all inputs (agentId, message, conversationId)
 * - Manages conversation state across multiple messages
 * - Loads agent by ID (returns 404 if not found)
 * - Executes chat completion with full conversation history
 * - Returns response with conversationId and assistant message
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

    // Add user message to conversation
    const userMessage = addMessage(conversation.id, {
      role: 'user',
      content: body.message,
    });

    // Build messages array for OpenAI (convert to ChatCompletionMessageParam format)
    // Filter out 'error' and 'system' messages (system is added by executeChatCompletion)
    // Preserve function calls and tool responses to avoid re-loading files
    const messages: ChatCompletionMessageParam[] = conversation.messages
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

    // Execute chat completion with full conversation history
    const result = await executeChatCompletion(agent, messages);

    // Store all new messages from the completion (assistant messages and tool messages)
    // Skip the system message (first message) and any messages we already have
    const existingMessageCount = conversation.messages.length;
    const newMessages = result.allMessages.slice(1 + existingMessageCount); // Skip system message + existing messages

    // Add all new messages to conversation
    for (const msg of newMessages) {
      if (msg.role === 'assistant') {
        addMessage(conversation.id, {
          role: 'assistant',
          content: typeof msg.content === 'string' ? msg.content : '',
          functionCalls: 'tool_calls' in msg ? (msg.tool_calls as any) : undefined,
        });
      } else if (msg.role === 'tool' && 'tool_call_id' in msg) {
        addMessage(conversation.id, {
          role: 'tool' as any,
          content: typeof msg.content === 'string' ? msg.content : '',
          toolCallId: msg.tool_call_id as string,
        } as any);
      }
    }

    // Get the final assistant message for the response
    const assistantMessage = conversation.messages[conversation.messages.length - 1];

    // Build response
    const response: ChatResponse = {
      conversationId: conversation.id,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp.toISOString(),
        functionCalls: assistantMessage.functionCalls,
      },
    };

    return NextResponse.json<ApiResponse<ChatResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
