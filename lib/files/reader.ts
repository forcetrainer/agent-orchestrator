/**
 * File Reader Module
 *
 * Reads files from agents (read-only) and output folders.
 * Implements dual-folder search pattern: try agents folder first, fallback to output.
 *
 * Security: All paths validated through security module before file access.
 * Performance: Async/await with fs/promises for non-blocking I/O.
 */

import { readFile } from 'fs/promises';
import { validatePath } from './security';
import { env } from '@/lib/utils/env';

/**
 * Reads file content from agents or output folder.
 *
 * Search order:
 * 1. Try AGENTS_PATH first (read-only templates, workflows, etc.)
 * 2. Fallback to OUTPUT_PATH if not found in agents
 *
 * @param relativePath - Relative path to file (e.g., "templates/agent.md")
 * @returns File contents as UTF-8 string
 * @throws Error if file not found in both locations or access denied
 */
export async function readFileContent(relativePath: string): Promise<string> {
  const startTime = performance.now();

  try {
    // Try agents folder first (read-only)
    const agentsPath = validatePath(relativePath, env.AGENTS_PATH);
    try {
      const content = await readFile(agentsPath, 'utf-8');
      const duration = performance.now() - startTime;
      console.log(`[read_file] Read from agents: ${relativePath} (${duration.toFixed(2)}ms)`);
      return content;
    } catch (error: any) {
      // Only catch ENOENT (file not found), re-throw other errors
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Try output folder as fallback
    const outputPath = validatePath(relativePath, env.OUTPUT_PATH);
    const content = await readFile(outputPath, 'utf-8');
    const duration = performance.now() - startTime;
    console.log(`[read_file] Read from output: ${relativePath} (${duration.toFixed(2)}ms)`);
    return content;
  } catch (error: any) {
    const duration = performance.now() - startTime;

    // Handle specific error cases with user-friendly messages
    if (error.code === 'ENOENT') {
      console.error(
        `[read_file] File not found: ${relativePath} (${duration.toFixed(2)}ms)`,
        '\nStack:', error.stack
      );
      throw new Error(`File not found: ${relativePath}`);
    }

    if (error.code === 'EACCES') {
      console.error(
        `[read_file] Permission denied: ${relativePath} (${duration.toFixed(2)}ms)`,
        '\nStack:', error.stack
      );
      throw new Error(`Permission denied: ${relativePath}`);
    }

    // Re-throw other errors (including security validation errors)
    console.error(
      `[read_file] Error reading ${relativePath}: ${error.message} (${duration.toFixed(2)}ms)`,
      '\nStack:', error.stack
    );
    throw error;
  }
}
