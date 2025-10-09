/**
 * File Reader Module
 *
 * Reads files from agents (read-only) and output folders.
 * Implements dual-folder search pattern: try agents folder first, fallback to output.
 *
 * Security: All paths validated through security module before file access.
 * Performance: Async/await with fs/promises for non-blocking I/O.
 */

import { readFile, stat } from 'fs/promises';
import { validatePath } from './security';
import { env } from '@/lib/utils/env';

/**
 * Reads file content from agents, bmad, or output folder.
 *
 * Search order:
 * 1. Try AGENTS_PATH first (read-only templates, workflows, etc.)
 * 2. Try BMAD_PATH second (BMAD framework files)
 * 3. Fallback to OUTPUT_PATH if not found in agents or bmad
 *
 * @param relativePath - Relative path to file (e.g., "templates/agent.md")
 * @returns File contents as UTF-8 string
 * @throws Error if file not found in all locations or access denied
 */
export async function readFileContent(relativePath: string): Promise<string> {
  const startTime = performance.now();

  console.log(`[read_file] DEBUG: Attempting to read: ${relativePath}`);
  console.log(`[read_file] DEBUG: AGENTS_PATH = ${env.AGENTS_PATH}`);
  console.log(`[read_file] DEBUG: BMAD_PATH = ${env.BMAD_PATH}`);
  console.log(`[read_file] DEBUG: OUTPUT_PATH = ${env.OUTPUT_PATH}`);

  try {
    // Try agents folder first (read-only)
    const agentsPath = validatePath(relativePath, env.AGENTS_PATH);
    console.log(`[read_file] DEBUG: Trying agents path: ${agentsPath}`);
    try {
      const content = await readFile(agentsPath, 'utf-8');
      const duration = performance.now() - startTime;
      console.log(`[read_file] Read from agents: ${relativePath} (${duration.toFixed(2)}ms)`);
      return content;
    } catch (error: any) {
      console.log(`[read_file] DEBUG: Agents failed with code: ${error.code}`);
      // Only catch ENOENT (file not found), re-throw other errors
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Try BMAD folder second (BMAD framework files)
    const bmadPath = validatePath(relativePath, env.BMAD_PATH);
    console.log(`[read_file] DEBUG: Trying bmad path: ${bmadPath}`);
    try {
      const content = await readFile(bmadPath, 'utf-8');
      const duration = performance.now() - startTime;
      console.log(`[read_file] Read from bmad: ${relativePath} (${duration.toFixed(2)}ms)`);
      return content;
    } catch (error: any) {
      console.log(`[read_file] DEBUG: BMAD failed with code: ${error.code}`);
      // Only catch ENOENT (file not found), re-throw other errors
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Try output folder as fallback
    const outputPath = validatePath(relativePath, env.OUTPUT_PATH);
    console.log(`[read_file] DEBUG: Trying output path: ${outputPath}`);
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

/**
 * Reads a file for attachment processing with size limit enforcement.
 * Story 6.7: File attachment backend processing
 *
 * Unlike readFileContent which searches multiple folders, this function
 * reads from an explicit absolute path and enforces a 1MB size limit.
 *
 * @param filepath - Absolute file path (already validated by security module)
 * @returns Success result with content, or error result with code and message
 */
export async function readFileForAttachment(
  filepath: string
): Promise<{ success: true; content: string } | { success: false; error: string; code: number }> {
  const MAX_FILE_SIZE = 1024 * 1024; // 1MB

  try {
    // Check file size first before reading
    const stats = await stat(filepath);

    if (stats.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large (${Math.round(stats.size / 1024)}KB). Maximum size is 1MB.`,
        code: 413
      };
    }

    // Read file contents
    const content = await readFile(filepath, 'utf-8');

    return {
      success: true,
      content
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: 'File not found',
        code: 404
      };
    }

    if (error.code === 'EACCES') {
      return {
        success: false,
        error: 'Permission denied',
        code: 403
      };
    }

    return {
      success: false,
      error: 'Failed to read file',
      code: 500
    };
  }
}
