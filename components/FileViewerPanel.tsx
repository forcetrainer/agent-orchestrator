'use client';

import { useState, useEffect } from 'react';
import { DirectoryTree } from './DirectoryTree';

/**
 * FileViewerPanel Component
 *
 * Story 5.1: File Viewer UI Component
 * AC-1: File viewer panel appears in UI (split-pane layout)
 * AC-2: Panel clearly labeled "Output Files"
 * AC-3: Panel toggleable or always visible
 * AC-4: Empty state shows "No files yet" message
 *
 * Story 5.2: Display Directory Tree Structure
 * AC-1: Directory tree displays output folder structure
 * AC-6: Tree updates when new files are created (auto-refresh after agent response)
 * AC-7: Clicking file selects it for viewing (triggers content load)
 *
 * Displays file tree and file content from agent output directory
 */

// Story Context: FileViewerState interface from tech spec
// Story 5.2.1: Import FileTreeNode from shared treeBuilder module
import type { FileTreeNode } from '@/lib/files/treeBuilder';

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

  // Story 5.2 AC-1: Fetch directory tree on component mount
  useEffect(() => {
    loadDirectoryTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Story 5.2 AC-6: Auto-refresh after agent response
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = 2000; // Debounce: max 1 refresh per 2 seconds

    const handleAgentComplete = () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;

      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        // Debounce: Schedule refresh after interval completes
        if (refreshTimeout) clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          lastRefreshTime = Date.now();
          loadDirectoryTree();
        }, MIN_REFRESH_INTERVAL - timeSinceLastRefresh);
      } else {
        // Refresh immediately
        lastRefreshTime = now;
        loadDirectoryTree();
      }
    };

    // Listen for custom event from chat interface
    window.addEventListener('agent-response-complete', handleAgentComplete);

    return () => {
      window.removeEventListener('agent-response-complete', handleAgentComplete);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Loads directory tree from API
   * Story 5.2 AC-1, AC-6: Initial load and refresh after agent output
   */
  const loadDirectoryTree = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/files/tree');
      const data = await response.json();

      if (data.success) {
        setState((prev) => {
          // AC-6: Preserve selected file if it still exists after refresh
          const selectedFileStillExists = prev.selectedFile
            ? fileExistsInTree(data.root, prev.selectedFile)
            : false;

          return {
            ...prev,
            treeData: data.root,
            isLoading: false,
            selectedFile: selectedFileStillExists ? prev.selectedFile : null,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          error: data.error || 'Failed to load directory tree',
          isLoading: false,
        }));
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: 'Network error loading directory tree',
        isLoading: false,
      }));
    }
  };

  /**
   * Helper: Check if a file path exists in the tree
   */
  const fileExistsInTree = (node: FileTreeNode | null, path: string): boolean => {
    if (!node) return false;
    if (node.path === path) return true;
    if (node.children) {
      return node.children.some((child) => fileExistsInTree(child, path));
    }
    return false;
  };

  /**
   * Handles file selection from directory tree
   * Story 5.2 AC-7: Clicking file selects it for viewing
   */
  const handleFileSelect = (path: string) => {
    setState((prev) => ({ ...prev, selectedFile: path }));
    // File content loading will be implemented in Story 5.3
  };

  // AC-4: Empty state when no files yet
  const isEmpty = state.treeData === null ||
    (state.treeData.children && state.treeData.children.length === 0);

  // AC-3: Always visible for MVP (toggle can be added in Phase 2)
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white">
      {/* AC-2: Panel header with "Output Files" label */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Output Files</h2>

        {/* Story 5.2 AC-6: Manual refresh button */}
        <button
          onClick={loadDirectoryTree}
          disabled={state.isLoading}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh directory tree"
        >
          <svg
            className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
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

      {/* Story 5.2: Directory tree and error handling */}
      {state.error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-200">
          {state.error}
        </div>
      )}

      {state.isLoading && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-sm text-gray-500">Loading files...</div>
        </div>
      )}

      {/* File tree and content */}
      {!isEmpty && !state.isLoading && (
        <div className="flex-1 overflow-auto">
          {/* Story 5.2: Directory tree navigation */}
          <DirectoryTree
            root={state.treeData}
            onFileSelect={handleFileSelect}
            selectedFile={state.selectedFile}
          />
          {/* File content display (Story 5.3) */}
        </div>
      )}
    </div>
  );
}
