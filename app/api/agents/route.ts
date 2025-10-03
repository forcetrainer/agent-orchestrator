import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Agent } from '@/types/api';
import { handleApiError } from '@/lib/utils/errors';

/**
 * GET /api/agents
 * Returns list of available agents
 *
 * Story 1.2: API Route Structure
 * Story 1.4: Error Handling Middleware
 * - Returns placeholder sample agent for testing
 * - Uses proper ApiResponse<Agent[]> type
 * - Uses centralized error handling with handleApiError
 */
export async function GET(request: NextRequest) {
  try {
    // Placeholder agent data for development
    const agents: Agent[] = [
      {
        id: 'sample-agent-1',
        name: 'Sample Agent',
        description: 'A sample agent for testing the API route structure',
        path: '/agents/sample',
      },
    ];

    return NextResponse.json<ApiResponse<Agent[]>>(
      {
        success: true,
        data: agents,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
