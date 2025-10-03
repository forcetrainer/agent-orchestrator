import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, FileNode } from '@/types/api';
import { handleApiError } from '@/lib/utils/errors';

/**
 * GET /api/files
 * Returns file tree structure
 *
 * Story 1.2: API Route Structure
 * Story 1.4: Error Handling Middleware
 * - Returns empty placeholder array for testing
 * - Uses proper ApiResponse<FileNode[]> type
 * - Uses centralized error handling with handleApiError
 */
export async function GET(request: NextRequest) {
  try {
    // Placeholder empty file tree for development
    const files: FileNode[] = [];

    return NextResponse.json<ApiResponse<FileNode[]>>(
      {
        success: true,
        data: files,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
