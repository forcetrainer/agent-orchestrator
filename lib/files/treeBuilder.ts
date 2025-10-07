/**
 * Directory Tree Builder Module
 *
 * Story 5.2: Display Directory Tree Structure
 * AC-1: Directory tree displays output folder structure
 * AC-5: Empty folders show as empty (not hidden from tree)
 *
 * Recursively builds FileTreeNode hierarchy from file system.
 * Security: All paths validated through security module before file access.
 * Performance: Async/await with fs/promises for non-blocking I/O.
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';

/**
 * FileTreeNode interface matching Story 5.2 tech spec
 * Reuses interface from components/FileViewerPanel.tsx:18-23
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
  modified?: string;
}

/**
 * Recursively builds a directory tree structure from the specified base path.
 *
 * @param basePath - Absolute path to the root directory (already validated)
 * @param relativePath - Relative path from basePath for recursion (default: '')
 * @returns FileTreeNode representing the directory structure
 * @throws Error if directory is unreadable or access denied
 */
export async function buildDirectoryTree(
  basePath: string,
  relativePath: string = ''
): Promise<FileTreeNode> {
  const fullPath = relativePath ? join(basePath, relativePath) : basePath;
  const stats = await stat(fullPath);

  // Get the name from the path
  const name = relativePath ? relativePath.split('/').pop()! : 'root';

  // Build base node
  const node: FileTreeNode = {
    name,
    path: relativePath,
    type: stats.isDirectory() ? 'directory' : 'file',
    modified: stats.mtime.toISOString(),
  };

  // Add size for files only
  if (stats.isFile()) {
    node.size = stats.size;
    return node;
  }

  // For directories, recursively build children
  try {
    const entries = await readdir(fullPath);
    const children: FileTreeNode[] = [];

    for (const entry of entries) {
      const entryRelativePath = relativePath ? join(relativePath, entry) : entry;

      try {
        const childNode = await buildDirectoryTree(basePath, entryRelativePath);
        children.push(childNode);
      } catch (error: any) {
        // Log and skip entries that can't be read (e.g., permission issues)
        console.warn(`[treeBuilder] Skipping ${entry}: ${error.message}`);
      }
    }

    // AC-5: Empty folders show as empty (children array exists but is empty)
    node.children = children;
  } catch (error: any) {
    // If directory is unreadable, return it as a directory with no children
    console.warn(`[treeBuilder] Cannot read directory ${relativePath}: ${error.message}`);
    node.children = [];
  }

  return node;
}
