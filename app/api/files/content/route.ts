import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { extname } from 'path';
import { validatePath } from '@/lib/files/security';
import { env } from '@/lib/utils/env';
import type { FileContentResponse } from '@/types/api';

/**
 * Mime type mapping for common file extensions
 * Story 5.3 AC-5: Extension-based mime type detection (no external library)
 */
const mimeTypes: Record<string, string> = {
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.jsx': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
};

/**
 * Detect mime type from file extension
 */
function detectMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Check if mime type represents binary content that cannot be displayed as text
 * Story 5.3 AC-5: Binary files show "Cannot preview" message
 */
function isBinaryType(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('audio/') ||
    mimeType.startsWith('video/') ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/zip' ||
    mimeType === 'application/x-tar' ||
    mimeType === 'application/gzip' ||
    mimeType === 'application/octet-stream'
  );
}

/**
 * Truncate large file content to first N lines
 * Story 5.3 AC-4: Large files (>1MB) truncated to prevent browser crash
 *
 * @param content - Full file content
 * @param maxLines - Maximum number of lines to keep (default: 5000)
 * @returns Truncated content and truncation flag
 */
function truncateContent(
  content: string,
  maxLines: number = 5000
): { content: string; truncated: boolean } {
  const lines = content.split('\n');

  if (lines.length <= maxLines) {
    return { content, truncated: false };
  }

  const truncatedLines = lines.slice(0, maxLines);
  return {
    content: truncatedLines.join('\n'),
    truncated: true,
  };
}

/**
 * GET /api/files/content
 *
 * Story 5.3: Display File Contents
 * AC-1: Clicking file in tree loads its contents via API
 * AC-2,AC-3: Text files display with proper formatting (preserved whitespace)
 * AC-4: Large files (>1MB) load without crashing browser (truncation)
 * AC-5: Binary files show "Cannot preview" message
 *
 * Returns file contents with metadata for display.
 * Security: Read-only access to OUTPUT_PATH only (Epic 4 security model).
 * Performance: NFR-1 requires content displays within 1 second.
 *
 * Query params:
 * - path: Relative path from OUTPUT_PATH (required)
 *
 * @returns FileContentResponse with file content and metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Extract path from query params
    const { searchParams } = new URL(request.url);
    const relativePath = searchParams.get('path');

    if (!relativePath) {
      return NextResponse.json<FileContentResponse>(
        {
          success: false,
          path: '',
          content: '',
          mimeType: '',
          size: 0,
          modified: '',
          error: 'Path parameter is required',
        },
        { status: 400 }
      );
    }

    // Security: Validate path is within OUTPUT_PATH (Epic 4 security model)
    // Story 5.3 Constraint C1: ALL file paths MUST be validated using validatePath
    let absolutePath: string;
    try {
      absolutePath = validatePath(relativePath, env.OUTPUT_PATH);
    } catch (error: any) {
      console.error('[GET /api/files/content] Path validation failed:', {
        relativePath,
        error: error.message,
      });

      return NextResponse.json<FileContentResponse>(
        {
          success: false,
          path: relativePath,
          content: '',
          mimeType: '',
          size: 0,
          modified: '',
          error: 'Access denied',
        },
        { status: 403 }
      );
    }

    // Get file stats
    let fileStats;
    try {
      fileStats = await stat(absolutePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json<FileContentResponse>(
          {
            success: false,
            path: relativePath,
            content: '',
            mimeType: '',
            size: 0,
            modified: '',
            error: `File not found: ${relativePath}`,
          },
          { status: 404 }
        );
      }

      throw error; // Re-throw unexpected errors
    }

    // Ensure it's a file (not a directory)
    if (!fileStats.isFile()) {
      return NextResponse.json<FileContentResponse>(
        {
          success: false,
          path: relativePath,
          content: '',
          mimeType: '',
          size: 0,
          modified: '',
          error: 'Path is not a file',
        },
        { status: 400 }
      );
    }

    // Detect mime type and check if binary
    const mimeType = detectMimeType(absolutePath);
    const isBinary = isBinaryType(mimeType);

    // Story 5.3 AC-5: Binary files return empty content with isBinary flag
    if (isBinary) {
      return NextResponse.json<FileContentResponse>(
        {
          success: true,
          path: relativePath,
          content: '',
          mimeType,
          size: fileStats.size,
          modified: fileStats.mtime.toISOString(),
          isBinary: true,
        },
        { status: 200 }
      );
    }

    // Read file content as UTF-8
    let content: string;
    try {
      content = await readFile(absolutePath, 'utf-8');
    } catch (error: any) {
      if (error.code === 'EACCES') {
        return NextResponse.json<FileContentResponse>(
          {
            success: false,
            path: relativePath,
            content: '',
            mimeType,
            size: fileStats.size,
            modified: fileStats.mtime.toISOString(),
            error: 'Permission denied',
          },
          { status: 403 }
        );
      }

      throw error; // Re-throw unexpected errors
    }

    // Story 5.3 AC-4: Truncate large files (>1MB) to prevent browser freeze
    // Constraint C5: Files >1MB MUST be truncated to first 5000 lines
    const ONE_MB = 1024 * 1024;
    let truncated: boolean | undefined = undefined;
    if (fileStats.size > ONE_MB) {
      const result = truncateContent(content, 5000);
      content = result.content;
      truncated = result.truncated ? true : undefined;
    }

    // Return success response with content and metadata
    const response: FileContentResponse = {
      success: true,
      path: relativePath,
      content,
      mimeType,
      size: fileStats.size,
      modified: fileStats.mtime.toISOString(),
    };

    // Only include truncated field if file was actually truncated
    if (truncated) {
      response.truncated = true;
    }

    return NextResponse.json<FileContentResponse>(response, { status: 200 });
  } catch (error: any) {
    console.error('[GET /api/files/content] Unexpected error:', error);

    // Generic error handling (Story 5.3 Constraint C7)
    return NextResponse.json<FileContentResponse>(
      {
        success: false,
        path: '',
        content: '',
        mimeType: '',
        size: 0,
        modified: '',
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files/content
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
 * PUT /api/files/content
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
 * DELETE /api/files/content
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
