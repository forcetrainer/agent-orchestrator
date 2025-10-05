/**
 * File Lister Module
 *
 * Lists files and directories from agents or output folders.
 * Implements dual-folder search pattern and supports recursive listing.
 *
 * Security: All paths validated through security module before file access.
 * Performance: Async/await with fs/promises for non-blocking I/O.
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { validatePath } from './security';
import { env } from '@/lib/utils/env';
import type { FileNode } from '@/types';

/**
 * Lists files and directories at the specified path.
 *
 * Search order:
 * 1. Try AGENTS_PATH first
 * 2. Try BMAD_PATH second
 * 3. Fallback to OUTPUT_PATH if not found in agents or bmad
 *
 * @param relativePath - Relative path to directory (e.g., "templates")
 * @param recursive - If true, recursively list subdirectories (default: false)
 * @returns Array of FileNode objects with metadata
 * @throws Error if directory not found in all locations or access denied
 */
export async function listFiles(
  relativePath: string = '',
  recursive: boolean = false
): Promise<FileNode[]> {
  const startTime = performance.now();

  try {
    let basePath: string;
    let location: 'agents' | 'bmad' | 'output';

    // Try agents folder first
    try {
      basePath = validatePath(relativePath, env.AGENTS_PATH);
      // Test if directory exists and is accessible
      await stat(basePath);
      location = 'agents';
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Try BMAD folder second
        try {
          basePath = validatePath(relativePath, env.BMAD_PATH);
          await stat(basePath);
          location = 'bmad';
        } catch (bmadError: any) {
          if (bmadError.code === 'ENOENT') {
            // Try output folder as last fallback
            try {
              basePath = validatePath(relativePath, env.OUTPUT_PATH);
              await stat(basePath);
              location = 'output';
            } catch (outputError: any) {
              // None of the paths exist - throw error with all locations tried
              throw new Error(`Directory not found in agents, bmad, or output: ${relativePath}`);
            }
          } else {
            throw bmadError;
          }
        }
      } else {
        throw error;
      }
    }

    // Read directory contents
    const entries = await readdir(basePath);
    const nodes: FileNode[] = [];

    // Process each entry
    for (const entry of entries) {
      const fullPath = join(basePath, entry);
      const entryRelativePath = relativePath ? join(relativePath, entry) : entry;

      try {
        const stats = await stat(fullPath);

        const node: FileNode = {
          name: entry,
          path: entryRelativePath,
          type: stats.isDirectory() ? 'directory' : 'file',
        };

        // Add size for files only
        if (stats.isFile()) {
          node.size = stats.size;
        }

        // Recursively list subdirectories if requested
        if (recursive && stats.isDirectory()) {
          node.children = await listFiles(entryRelativePath, true);
        }

        nodes.push(node);
      } catch (error: any) {
        // Log and skip entries that can't be read (e.g., permission issues)
        console.warn(`[list_files] Skipping ${entry}: ${error.message}`);
      }
    }

    const duration = performance.now() - startTime;
    console.log(
      `[list_files] Listed ${location}: ${relativePath || '.'} (${nodes.length} entries, ${duration.toFixed(2)}ms)`
    );

    return nodes;
  } catch (error: any) {
    const duration = performance.now() - startTime;

    // Handle specific error cases with user-friendly messages
    if (error.code === 'ENOENT') {
      console.error(
        `[list_files] Directory not found: ${relativePath} (${duration.toFixed(2)}ms)`,
        '\nStack:', error.stack
      );
      throw new Error(`Directory not found: ${relativePath}`);
    }

    if (error.code === 'EACCES') {
      console.error(
        `[list_files] Permission denied: ${relativePath} (${duration.toFixed(2)}ms)`,
        '\nStack:', error.stack
      );
      throw new Error(`Permission denied: ${relativePath}`);
    }

    if (error.code === 'ENOTDIR') {
      console.error(
        `[list_files] Not a directory: ${relativePath} (${duration.toFixed(2)}ms)`,
        '\nStack:', error.stack
      );
      throw new Error(`Not a directory: ${relativePath}`);
    }

    // Re-throw other errors (including security validation errors)
    console.error(
      `[list_files] Error listing ${relativePath}: ${error.message} (${duration.toFixed(2)}ms)`,
      '\nStack:', error.stack
    );
    throw error;
  }
}
