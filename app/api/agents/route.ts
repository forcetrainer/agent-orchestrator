import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';
import { handleApiError } from '@/lib/utils/errors';
import { discoverBundles, AgentMetadata } from '@/lib/agents/bundleScanner';
import { join } from 'path';

/**
 * GET /api/agents
 * Returns list of available agents from bundle manifests
 *
 * Story 1.2: API Route Structure
 * Story 1.4: Error Handling Middleware
 * Story 4.4: Bundle Structure Discovery and Loading
 * - Uses discoverBundles() to discover agents from bundle.yaml manifests
 * - Returns AgentMetadata with bundle context (bundleName, bundlePath, filePath)
 * - Uses centralized error handling with handleApiError
 */
export async function GET(request: NextRequest) {
  try {
    // Get bundles root from environment or use default
    const bundlesRoot = process.env.BUNDLES_ROOT || 'bmad/custom/bundles';

    // Resolve to absolute path from project root
    const bundlesPath = join(process.cwd(), bundlesRoot);

    // Discover agents from bundle manifests
    const agents = await discoverBundles(bundlesPath);

    return NextResponse.json<ApiResponse<AgentMetadata[]>>(
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
