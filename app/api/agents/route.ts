import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Agent } from '@/types/api';

/**
 * GET /api/agents
 * Returns list of available agents
 *
 * Story 1.2: API Route Structure
 * - Returns placeholder sample agent for testing
 * - Uses proper ApiResponse<Agent[]> type
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
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch agents',
        code: 500,
      },
      { status: 500 }
    );
  }
}
