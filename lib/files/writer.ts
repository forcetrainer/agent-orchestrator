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
import { validateWritePath } from './security';

/**
 * Writes file content to output folder.
 *
 * Features:
 * - Auto-creates parent directories if needed (mkdir recursive)
 * - Restricted to OUTPUT_PATH only (agents folder is read-only)
 * - Path validation prevents directory traversal
 *
 * @param relativePath - Relative path to file (e.g., "results/output.json")
 * @param content - File content to write (UTF-8 string)
 * @throws Error if attempting to write to agents folder or disk full
 */
export async function writeFileContent(
  relativePath: string,
  content: string
): Promise<void> {
  const startTime = performance.now();

  try {
    // Validate write path (ensures OUTPUT_PATH only, rejects AGENTS_PATH)
    const fullPath = validateWritePath(relativePath);

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
