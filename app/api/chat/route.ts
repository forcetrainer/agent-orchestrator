import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ChatRequest, ChatResponse } from '@/types/api';

/**
 * POST /api/chat
 * Handles chat messages with agent orchestration
 *
 * Story 1.2: API Route Structure
 * - Validates required fields (agentId, message)
 * - Returns placeholder echo response
 * - Proper error handling with ApiResponse wrapper
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChatRequest = await request.json();

    // Validate required fields
    if (!body.agentId || typeof body.agentId !== 'string') {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Missing or invalid required field: agentId',
          code: 400,
        },
        { status: 400 }
      );
    }

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Missing or invalid required field: message',
          code: 400,
        },
        { status: 400 }
      );
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
    // Handle JSON parsing errors and other exceptions
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process chat request',
        code: 500,
      },
      { status: 500 }
    );
  }
}
