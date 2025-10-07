'use client';

import { useState } from 'react';

/**
 * FileViewerPanel Component
 *
 * Story 5.1: File Viewer UI Component
 * AC-1: File viewer panel appears in UI (split-pane layout)
 * AC-2: Panel clearly labeled "Output Files"
 * AC-3: Panel toggleable or always visible
 * AC-4: Empty state shows "No files yet" message
 *
 * Displays file tree and file content from agent output directory
 */

// Story Context: FileViewerState interface from tech spec
interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

interface FileContentResponse {
  path: string;
  content: string;
  mimeType: string;
}

interface FileViewerState {
  treeData: FileTreeNode | null;
  selectedFile: string | null;
  fileContent: FileContentResponse | null;
  isLoading: boolean;
  viewMode: 'rendered' | 'raw';
  error: string | null;
}

interface FileViewerPanelProps {
  isVisible?: boolean; // AC-3: Panel visibility control (always visible for MVP)
}

export function FileViewerPanel({ isVisible = true }: FileViewerPanelProps) {
  // State management using React hooks per tech spec constraint
  const [state, setState] = useState<FileViewerState>({
    treeData: null,
    selectedFile: null,
    fileContent: null,
    isLoading: false,
    viewMode: 'rendered',
    error: null,
  });

  // AC-4: Empty state when no files yet
  const isEmpty = state.treeData === null;

  // AC-3: Always visible for MVP (toggle can be added in Phase 2)
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white">
      {/* AC-2: Panel header with "Output Files" label */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Output Files</h2>
      </div>

      {/* AC-4: Empty state display */}
      {isEmpty && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No files yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Files created by the agent will appear here
            </p>
          </div>
        </div>
      )}

      {/* File tree and content will be implemented in later stories */}
      {!isEmpty && (
        <div className="flex-1 overflow-auto">
          {/* File tree navigation (Story 5.2) */}
          {/* File content display (Story 5.3) */}
        </div>
      )}
    </div>
  );
}
