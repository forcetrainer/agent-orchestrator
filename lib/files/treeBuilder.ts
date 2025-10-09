/**
 * Directory Tree Builder Module
 *
 * Story 5.2: Display Directory Tree Structure
 * AC-1: Directory tree displays output folder structure
 * AC-5: Empty folders show as empty (not hidden from tree)
 *
 * Story 5.2.1: Session Metadata Display Enhancement
 * - Detects session folders (UUID pattern)
 * - Loads manifest.json and populates displayName, metadata
 * - Marks manifest.json files as isInternal (hidden from UI)
 *
 * Recursively builds FileTreeNode hierarchy from file system.
 * Security: All paths validated through security module before file access.
 * Performance: Async/await with fs/promises for non-blocking I/O.
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { parseManifest, generateDisplayName } from './manifestReader';

/**
 * FileTreeNode interface matching Story 5.2 tech spec
 * Story 5.2.1: Extended with displayName, metadata, isInternal fields
 */
import type { SessionMetadata } from './manifestReader';

export interface FileTreeNode {
  name: string;              // Technical name (UUID for sessions)
  path: string;              // Technical path
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
  modified?: string;
  displayName?: string;      // Story 5.2.1: Human-readable name for UI display
  metadata?: SessionMetadata; // Story 5.2.1: Session metadata from manifest.json
  isInternal?: boolean;      // Story 5.2.1: Hide from UI (e.g., manifest.json files)
}

/**
 * UUID v4 pattern for detecting session folders
 * Story 5.2.1 AC-1: Detect session folders by UUID pattern
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if a directory name matches UUID v4 pattern (session folder)
 */
function isSessionFolder(name: string): boolean {
  return UUID_PATTERN.test(name);
}

/**
 * Recursively builds a directory tree structure from the specified base path.
 *
 * Story 5.2.1: Enhanced with manifest loading for session folders
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

  // Story 5.2.1 AC-2: Mark manifest.json files as internal (hide from UI)
  if (stats.isFile()) {
    node.size = stats.size;

    if (name === 'manifest.json') {
      node.isInternal = true;
    }

    return node;
  }

  // Story 5.2.1 AC-1, AC-5, AC-7: Load manifest for session folders
  if (isSessionFolder(name)) {
    const metadata = await parseManifest(fullPath);

    if (metadata) {
      // AC-1: Set human-readable display name
      node.displayName = generateDisplayName(metadata);
      // Attach metadata for UI display (AC-3)
      node.metadata = metadata;
    }
    // AC-7: If no manifest, node.displayName remains undefined (falls back to UUID)
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

    // Filter out internal files (manifest.json) and internal directories
    const visibleChildren = children.filter((child) => !child.isInternal);

    // If directory only contains internal files (e.g., only manifest.json), mark it as internal too
    if (children.length > 0 && visibleChildren.length === 0) {
      node.isInternal = true;
      node.children = []; // Set empty children array for consistency
      return node;
    }

    // AC-5: Empty folders show as empty (children array exists but is empty)
    node.children = visibleChildren;
  } catch (error: any) {
    // If directory is unreadable, return it as a directory with no children
    console.warn(`[treeBuilder] Cannot read directory ${relativePath}: ${error.message}`);
    node.children = [];
  }

  return node;
}
