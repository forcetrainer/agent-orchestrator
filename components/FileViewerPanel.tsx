'use client';

import { useState, useEffect } from 'react';
import { DirectoryTree } from './DirectoryTree';
import { FileContentDisplay } from './FileContentDisplay';

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
 * Story 5.3: Display File Contents
 * AC-1: Clicking file in tree loads its contents via API
 * AC-6: Currently selected file is highlighted in tree
 * AC-7: File path shown above content area (breadcrumb)
 *
 * Displays file tree and file content from agent output directory
 */

// Story Context: FileViewerState interface from tech spec
// Story 5.2.1: Import FileTreeNode from shared treeBuilder module
import type { FileTreeNode } from '@/lib/files/treeBuilder';
import type { FileContentResponse } from '@/types/api';

interface FileViewerState {
  treeData: FileTreeNode | null;
  selectedFile: string | null;
  fileContent: FileContentResponse | null;
  isLoading: boolean;
  isLoadingContent: boolean;
  viewMode: 'rendered' | 'raw';
  error: string | null;
  contentError: string | null;
  // Story 5.5: Refresh file list state additions
  isRefreshing: boolean; // True during refresh operation
  lastRefreshTimestamp: number; // Unix timestamp of last refresh
  newFiles: string[]; // Array of file paths added since last refresh
  // Story 5.6: Navigation polish state additions
  selectedFileIndex: number; // Current file index in flatFileList (-1 if no selection)
  flatFileList: string[]; // All file paths in navigation order (depth-first)
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
    isLoadingContent: false,
    viewMode: 'rendered',
    error: null,
    contentError: null,
    // Story 5.5 state initialization
    isRefreshing: false,
    lastRefreshTimestamp: 0,
    newFiles: [],
    // Story 5.6 state initialization
    selectedFileIndex: -1,
    flatFileList: [],
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

  // Story 5.5 AC-3: Auto-clear new file indicators after 10 seconds
  useEffect(() => {
    if (state.newFiles.length > 0) {
      const timeout = setTimeout(() => {
        setState((prev) => ({ ...prev, newFiles: [] }));
      }, 10000); // Clear after 10 seconds

      return () => clearTimeout(timeout);
    }
  }, [state.newFiles]);

  /**
   * Loads directory tree from API
   * Story 5.2 AC-1, AC-6: Initial load and refresh after agent output
   * Story 5.5 AC-3: Detect new files and apply visual indicators
   */
  const loadDirectoryTree = async () => {
    setState((prev) => ({ ...prev, isLoading: true, isRefreshing: true, error: null }));

    try {
      const response = await fetch('/api/files/tree');
      const data = await response.json();

      if (data.success) {
        setState((prev) => {
          // AC-6: Preserve selected file if it still exists after refresh
          const selectedFileStillExists = prev.selectedFile
            ? fileExistsInTree(data.root, prev.selectedFile)
            : false;

          // Story 5.5 AC-3: Detect new files by comparing old tree with new tree
          const oldFilePaths = prev.treeData ? extractAllFilePaths(prev.treeData) : new Set<string>();
          const newFilePaths = extractAllFilePaths(data.root);
          const detectedNewFiles = Array.from(newFilePaths).filter(path => !oldFilePaths.has(path));

          // Story 5.6: Build flat file list for keyboard navigation
          const newFlatFileList = buildFlatFileList(data.root);
          const newSelectedFileIndex = selectedFileStillExists && prev.selectedFile
            ? newFlatFileList.indexOf(prev.selectedFile)
            : -1;

          return {
            ...prev,
            treeData: data.root,
            isLoading: false,
            isRefreshing: false,
            selectedFile: selectedFileStillExists ? prev.selectedFile : null,
            lastRefreshTimestamp: Date.now(),
            newFiles: detectedNewFiles,
            flatFileList: newFlatFileList,
            selectedFileIndex: newSelectedFileIndex,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          error: data.error || 'Failed to load directory tree',
          isLoading: false,
          isRefreshing: false,
        }));
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: 'Network error loading directory tree',
        isLoading: false,
        isRefreshing: false,
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
   * Helper: Extract all file paths from tree (Story 5.5 AC-3)
   * Recursively walks tree and collects all file paths
   */
  const extractAllFilePaths = (node: FileTreeNode): Set<string> => {
    const paths = new Set<string>();

    if (node.type === 'file') {
      paths.add(node.path);
    }

    if (node.children) {
      for (const child of node.children) {
        const childPaths = extractAllFilePaths(child);
        childPaths.forEach(path => paths.add(path));
      }
    }

    return paths;
  };

  /**
   * Helper: Build flat file list for keyboard navigation (Story 5.6 AC-1)
   * Extracts all file paths from tree in depth-first order (matches visual tree order)
   * Skips directories - only includes files
   */
  const buildFlatFileList = (node: FileTreeNode, result: string[] = []): string[] => {
    if (node.type === 'file') {
      result.push(node.path);
    }
    if (node.children) {
      node.children.forEach((child) => buildFlatFileList(child, result));
    }
    return result;
  };

  /**
   * Handles file selection from directory tree
   * Story 5.2 AC-7: Clicking file selects it for viewing
   * Story 5.3 AC-1: Load file contents via API when file selected
   * Story 5.6: Update selectedFileIndex for keyboard navigation
   */
  const handleFileSelect = (path: string) => {
    setState((prev) => ({
      ...prev,
      selectedFile: path,
      selectedFileIndex: prev.flatFileList.indexOf(path),
    }));
    loadFileContent(path);
  };

  /**
   * Loads file content from API
   * Story 5.3 AC-1: Fetch file contents via /api/files/content
   */
  const loadFileContent = async (path: string) => {
    setState((prev) => ({ ...prev, isLoadingContent: true, contentError: null }));

    try {
      const response = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
      const data: FileContentResponse = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          fileContent: data,
          isLoadingContent: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          contentError: data.error || 'Failed to load file content',
          isLoadingContent: false,
        }));
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        contentError: 'Network error loading file content',
        isLoadingContent: false,
      }));
    }
  };

  /**
   * Navigate to next file in flat file list (Story 5.6 AC-1)
   * Wraps around from last file to first file
   */
  const navigateToNextFile = () => {
    if (state.flatFileList.length === 0) return;

    // If no file selected, start at first file (index 0)
    // Otherwise, move to next file with wrap-around
    const nextIndex = state.selectedFileIndex === -1
      ? 0
      : (state.selectedFileIndex + 1) % state.flatFileList.length;
    const nextFilePath = state.flatFileList[nextIndex];

    handleFileSelect(nextFilePath);
  };

  /**
   * Navigate to previous file in flat file list (Story 5.6 AC-1)
   * Wraps around from first file to last file
   */
  const navigateToPreviousFile = () => {
    if (state.flatFileList.length === 0) return;

    // If no file selected, start at last file
    // Otherwise, move to previous file with wrap-around
    const prevIndex = state.selectedFileIndex === -1
      ? state.flatFileList.length - 1
      : (state.selectedFileIndex - 1 + state.flatFileList.length) % state.flatFileList.length;
    const prevFilePath = state.flatFileList[prevIndex];

    handleFileSelect(prevFilePath);
  };

  /**
   * Handle breadcrumb navigation (Story 5.6 AC-2)
   * When user clicks a breadcrumb segment, expand tree to that directory
   */
  const handleBreadcrumbNavigate = (path: string) => {
    // For now, this is a placeholder for directory expansion
    // In a full implementation, this would:
    // 1. Find the node in the tree at the given path
    // 2. Expand all parent nodes to make it visible
    // 3. Scroll the tree to show the directory
    //
    // Since DirectoryTree component doesn't expose expansion state control,
    // this would require refactoring DirectoryTree to accept controlled expansion state
    console.log('Navigate to directory:', path);
  };

  /**
   * Story 5.6 AC-1: Keyboard navigation with ArrowUp/ArrowDown
   * Prevents interference with text inputs and screen readers
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input field or textarea (accessibility)
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateToNextFile();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateToPreviousFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedFileIndex, state.flatFileList]);

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
        <div className="flex-1 flex overflow-hidden">
          {/* Story 5.2: Directory tree navigation (left pane) */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 overflow-auto">
            <DirectoryTree
              root={state.treeData}
              onFileSelect={handleFileSelect}
              selectedFile={state.selectedFile}
              newFiles={state.newFiles}
            />
          </div>

          {/* Story 5.3: File content display (right pane) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Story 5.6 AC-2: FileContentDisplay now includes breadcrumb */}
            <FileContentDisplay
              content={state.fileContent}
              isLoading={state.isLoadingContent}
              error={state.contentError}
              currentFilePath={state.selectedFile || undefined}
              treeData={state.treeData}
              onBreadcrumbNavigate={handleBreadcrumbNavigate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
