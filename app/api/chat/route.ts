import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ChatRequest, ChatResponse } from '@/types/api';
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
    const messages: ChatCompletionMessageParam[] = conversation.messages.map(
      (msg) => ({
        role: msg.role,
        content: msg.content,
      })
    );

    // Execute chat completion with full conversation history
    const result = await executeChatCompletion(agent, messages);

    // Add assistant message to conversation
    const assistantMessage = addMessage(conversation.id, {
      role: 'assistant',
      content: result.content,
      functionCalls: result.functionCalls.length > 0 ? result.functionCalls : undefined,
    });

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
