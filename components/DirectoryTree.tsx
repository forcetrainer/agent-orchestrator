'use client';

import { useState, memo } from 'react';

/**
 * DirectoryTree Component
 *
 * Story 5.2: Display Directory Tree Structure
 * AC-1: Directory tree displays output folder structure
 * AC-2: Folders can be expanded/collapsed via click interaction
 * AC-3: Files are distinguishable from folders (icons or distinct styling)
 * AC-4: Nested directories display with proper indentation
 * AC-5: Empty folders show as empty (not hidden from tree)
 *
 * Story 5.2.1: Session Metadata Display Enhancement
 * - Renders displayName instead of name when present
 * - Filters out nodes with isInternal=true (manifest.json files)
 *
 * Recursively renders file tree with expand/collapse functionality.
 * Custom implementation using Tailwind CSS + React state (no external tree libraries).
 * Performance: React.memo() optimization to prevent unnecessary re-renders.
 */

import type { FileTreeNode } from '@/lib/files/treeBuilder';
export type { FileTreeNode };

export interface DirectoryTreeProps {
  /** Root node of the tree structure */
  root: FileTreeNode | null;
  /** Callback when a file is selected */
  onFileSelect?: (path: string) => void;
  /** Currently selected file path */
  selectedFile?: string | null;
}

/**
 * Folder icon component (AC-3)
 */
const FolderIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className="h-4 w-4 text-blue-500 flex-shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    {isOpen ? (
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    ) : (
      <path
        fillRule="evenodd"
        d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
        clipRule="evenodd"
      />
    )}
  </svg>
);

/**
 * File icon component (AC-3)
 */
const FileIcon = () => (
  <svg
    className="h-4 w-4 text-gray-400 flex-shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Tree node component (recursive)
 * Performance: Memoized to prevent unnecessary re-renders (NFR)
 */
const TreeNode = memo(
  ({
    node,
    depth,
    onFileSelect,
    selectedFile,
  }: {
    node: FileTreeNode;
    depth: number;
    onFileSelect?: (path: string) => void;
    selectedFile?: string | null;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isDirectory = node.type === 'directory';
    const hasChildren = isDirectory && node.children && node.children.length > 0;
    const isSelected = selectedFile === node.path;

    // Story 5.2.1 AC-2: Filter out internal files (manifest.json)
    if (node.isInternal) {
      return null;
    }

    const handleClick = () => {
      if (isDirectory) {
        // AC-2: Folders toggle expand/collapse on click
        setIsExpanded(!isExpanded);
      } else {
        // AC-7: Files trigger selection callback
        onFileSelect?.(node.path);
      }
    };

    // Story 5.2.1 AC-1: Use displayName if present, otherwise fallback to name
    const displayText = node.displayName || node.name;

    return (
      <div>
        <div
          className={`
            flex items-center gap-2 px-2 py-1 cursor-pointer
            hover:bg-gray-100 rounded transition-colors
            ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }} // AC-4: Proper indentation (16px per level)
          onClick={handleClick}
          title={node.displayName ? node.name : undefined} // Show UUID on hover for renamed sessions
        >
          {/* AC-3: Icons distinguish files from folders */}
          {isDirectory ? <FolderIcon isOpen={isExpanded} /> : <FileIcon />}

          {/* Story 5.2.1 AC-1: Display human-readable name */}
          <span className="text-sm truncate flex-1">{displayText}</span>

          {/* Show file size for files */}
          {!isDirectory && node.size !== undefined && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>

        {/* Render children when expanded (AC-2, AC-5) */}
        {isDirectory && isExpanded && (
          <div>
            {hasChildren ? (
              // Story 5.2.1 AC-2: Filter out internal nodes from children
              node.children!
                .filter((child) => !child.isInternal)
                .map((child) => (
                  <TreeNode
                    key={child.path}
                    node={child}
                    depth={depth + 1}
                    onFileSelect={onFileSelect}
                    selectedFile={selectedFile}
                  />
                ))
            ) : (
              // AC-5: Empty folders show as empty
              <div
                className="text-xs text-gray-400 italic px-2 py-1"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                Empty folder
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

TreeNode.displayName = 'TreeNode';

/**
 * Main DirectoryTree component
 */
export function DirectoryTree({ root, onFileSelect, selectedFile }: DirectoryTreeProps) {
  if (!root) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No files available
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      {/* Render root's children (don't show "root" itself) */}
      {root.children && root.children.length > 0 ? (
        root.children.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={0}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        ))
      ) : (
        // AC-5: Empty root folder
        <div className="p-4 text-sm text-gray-500 italic">
          No files yet
        </div>
      )}
    </div>
  );
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
