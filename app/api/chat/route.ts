import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ChatRequest, ChatResponse } from '@/types/api';
import { handleApiError, ValidationError } from '@/lib/utils/errors';

/**
 * POST /api/chat
 * Handles chat messages with agent orchestration
 *
 * Story 1.2: API Route Structure
 * Story 1.4: Error Handling Middleware
 * - Validates required fields (agentId, message)
 * - Returns placeholder echo response
 * - Uses centralized error handling with ValidationError and handleApiError
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

    // Generate placeholder response
    const conversationId = body.conversationId || `conv-${Date.now()}`;
    const messageId = `msg-${Date.now()}`;

    const response: ChatResponse = {
      conversationId,
      message: {
        id: messageId,
        role: 'assistant',
        content: `Echo: ${body.message} (Agent: ${body.agentId})`,
        timestamp: new Date().toISOString(),
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
