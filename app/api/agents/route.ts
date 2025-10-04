import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Agent } from '@/types/api';
import { handleApiError } from '@/lib/utils/errors';
import { loadAgents } from '@/lib/agents/loader';

/**
 * GET /api/agents
 * Returns list of available agents
 *
 * Story 1.2: API Route Structure
 * Story 1.4: Error Handling Middleware
 * Story 2.10: Integrate agent loader to discover agents from filesystem
 * - Uses loadAgents() to discover agents from agents folder
 * - Uses proper ApiResponse<Agent[]> type
 * - Uses centralized error handling with handleApiError
 */
export async function GET(request: NextRequest) {
  try {
    // Load agents from agents folder using lazy-loading pattern
    const agents = await loadAgents();

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
