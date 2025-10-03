import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, FileNode } from '@/types/api';

/**
 * GET /api/files
 * Returns file tree structure
 *
 * Story 1.2: API Route Structure
 * - Returns empty placeholder array for testing
 * - Uses proper ApiResponse<FileNode[]> type
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
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch files',
        code: 500,
      },
      { status: 500 }
    );
  }
}
