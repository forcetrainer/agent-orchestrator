import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { validatePath } from '@/lib/files/security';
import { buildDirectoryTree, FileTreeNode } from '@/lib/files/treeBuilder';
import { env } from '@/lib/utils/env';

/**
 * FileTreeResponse interface from Story 5.2 tech spec
 */
interface FileTreeResponse {
  success: boolean;
  root: FileTreeNode;
  error?: string;
}

/**
 * GET /api/files/tree
 *
 * Story 5.2: Display Directory Tree Structure
 * AC-1: Directory tree displays output folder structure
 * AC-5: Empty folders show as empty (not hidden from tree)
 *
 * Returns directory tree structure for output folder.
 * Security: Read-only access to OUTPUT_PATH only (Epic 4 security model).
 * Performance: NFR-1 requires tree loads within 1 second for 100 files.
 *
 * @returns FileTreeResponse with recursive tree structure
 */
export async function GET(request: NextRequest) {
  try {
    // Validate OUTPUT_PATH (security: ensure path is within allowed boundaries)
    // Using '' as relativePath returns the base OUTPUT_PATH itself
    const validatedPath = validatePath('', env.OUTPUT_PATH);

    // Build recursive directory tree
    const root = await buildDirectoryTree(validatedPath);

    return NextResponse.json<FileTreeResponse>(
      {
        success: true,
        root,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[GET /api/files/tree] Error building tree:', error);

    // Handle specific error cases
    if (error.message?.includes('Access denied')) {
      return NextResponse.json<FileTreeResponse>(
        {
          success: false,
          root: {
            name: 'root',
            path: '',
            type: 'directory',
            children: [],
          },
          error: 'Access denied',
        },
        { status: 403 }
      );
    }

    if (error.code === 'ENOENT') {
      return NextResponse.json<FileTreeResponse>(
        {
          success: false,
          root: {
            name: 'root',
            path: '',
            type: 'directory',
            children: [],
          },
          error: 'Output directory not found',
        },
        { status: 404 }
      );
    }

    // Generic error handling
    return handleApiError(error);
  }
}

/**
 * POST /api/files/tree
 *
 * Story 5.7: Security - Read-Only File Access
 * AC-2: API endpoints only support GET operations (no POST/PUT/DELETE)
 * AC-3: Write attempts return 403 error with clear message
 *
 * @returns 405 Method Not Allowed
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed - file viewer is read-only',
    },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

/**
 * PUT /api/files/tree
 *
 * Story 5.7: Security - Read-Only File Access
 * AC-2: API endpoints only support GET operations (no POST/PUT/DELETE)
 *
 * @returns 405 Method Not Allowed
 */
export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed - file viewer is read-only',
    },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

/**
 * DELETE /api/files/tree
 *
 * Story 5.7: Security - Read-Only File Access
 * AC-2: API endpoints only support GET operations (no POST/PUT/DELETE)
 *
 * @returns 405 Method Not Allowed
 */
export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed - file viewer is read-only',
    },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
