import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ChatRequest, ChatResponse } from '@/types/api';
import { handleApiError, ValidationError, NotFoundError } from '@/lib/utils/errors';
import { getAgentById } from '@/lib/agents/loader';
import { executeChatCompletion } from '@/lib/openai/chat';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * POST /api/chat
 * Handles chat messages with agent orchestration and OpenAI function calling
 *
 * Story 1.2: API Route Structure
 * Story 1.4: Error Handling Middleware
 * Story 2.5: Chat API Route with Function Calling Loop
 * - Validates required fields (agentId, message)
 * - Loads agent by ID (returns 404 if not found)
 * - Executes chat completion with function calling loop
 * - Returns response with conversationId and assistant message
 * - Uses centralized error handling
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChatRequest = await request.json();

    // Validate required fields
    if (!body.agentId || typeof body.agentId !== 'string') {
      throw new ValidationError('Missing or invalid required field: agentId');
    }

    if (!body.message || typeof body.message !== 'string') {
      throw new ValidationError('Missing or invalid required field: message');
    }

    // Load agent by ID
    const agent = await getAgentById(body.agentId);

    if (!agent) {
      throw new NotFoundError(`Agent not found: ${body.agentId}`);
    }

    // Build conversation messages
    // For now, we'll use a simple single-message conversation
    // Story 2.6 will implement full conversation state management
    const conversationId = body.conversationId || `conv-${Date.now()}`;

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: body.message,
      },
    ];

    // Execute chat completion with function calling loop
    const result = await executeChatCompletion(agent, messages);

    // Build response
    const messageId = `msg-${Date.now()}`;

    const response: ChatResponse = {
      conversationId,
      message: {
        id: messageId,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toISOString(),
        functionCalls: result.functionCalls.length > 0 ? result.functionCalls : undefined,
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
