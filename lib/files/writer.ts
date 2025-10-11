/**
 * File Writer Module
 *
 * Writes files to output folder only (agents folder is read-only).
 * Auto-creates parent directories as needed.
 *
 * Security: Validates write paths through security module, rejects writes to agents folder.
 * Performance: Async/await with fs/promises for non-blocking I/O.
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { validateWritePath } from '@/lib/pathResolver';
import { env } from '@/lib/utils/env';
import { createPathContext } from '@/lib/pathResolver';

/**
 * Writes file content to output folder.
 *
 * Features:
 * - Auto-creates parent directories if needed (mkdir recursive)
 * - Restricted to /data/agent-outputs ONLY (all other paths rejected)
 * - Path validation prevents directory traversal
 *
 * @param relativePath - Relative path to file (e.g., "results/output.json")
 * @param content - File content to write (UTF-8 string)
 * @throws Error if attempting to write outside /data/agent-outputs or disk full
 */
export async function writeFileContent(
  relativePath: string,
  content: string
): Promise<void> {
  const startTime = performance.now();

  try {
    // Create PathContext for secure path validation
    const context = createPathContext(''); // Empty bundle name for general file operations

    // Resolve full path from OUTPUT_PATH (legacy support for relative paths)
    const fullPath = relativePath.startsWith('/')
      ? relativePath
      : `${env.OUTPUT_PATH}/${relativePath}`;

    // Validate write path (Story 5.1: ONLY allows /data/agent-outputs, blocks everything else)
    validateWritePath(fullPath, context);

    // Auto-create parent directories if needed
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(fullPath, content, 'utf-8');

    const duration = performance.now() - startTime;
    console.log(`[write_file] Wrote to output: ${relativePath} (${duration.toFixed(2)}ms)`);
  } catch (error: any) {
    const duration = performance.now() - startTime;

    // Handle specific error cases with user-friendly messages
    if (error.code === 'EACCES') {
      console.error(
        `[write_file] Permission denied: ${relativePath} (${duration.toFixed(2)}ms)`,
        '\nStack:', error.stack
      );
      throw new Error(`Permission denied: ${relativePath}`);
    }

    if (error.code === 'ENOSPC') {
      console.error(
        `[write_file] Disk full: ${relativePath} (${duration.toFixed(2)}ms)`,
        '\nStack:', error.stack
      );
      throw new Error(`Disk full: Cannot write ${relativePath}`);
    }

    if (error.code === 'EROFS') {
      console.error(
        `[write_file] Read-only filesystem: ${relativePath} (${duration.toFixed(2)}ms)`,
        '\nStack:', error.stack
      );
      throw new Error(`Cannot write to read-only filesystem: ${relativePath}`);
    }

    // Re-throw other errors (including security validation errors)
    console.error(
      `[write_file] Error writing ${relativePath}: ${error.message} (${duration.toFixed(2)}ms)`,
      '\nStack:', error.stack
    );
    throw error;
  }
}
