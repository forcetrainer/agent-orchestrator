'use client';

import type { FileContentResponse } from '@/types/api';

/**
 * FileContentDisplay Component
 *
 * Story 5.3: Display File Contents
 * AC-2: Text files display with proper formatting (preserved whitespace)
 * AC-3: Line breaks and formatting preserved in display
 * AC-4: Large files show truncation warning
 * AC-5: Binary files show "Cannot preview" message
 * AC-7: File path shown above content area
 *
 * Displays file contents with proper text formatting or binary file messaging.
 */

interface FileContentDisplayProps {
  /** File content response from API */
  content: FileContentResponse | null;
  /** Loading state while fetching content */
  isLoading: boolean;
  /** Error message if content failed to load */
  error: string | null;
}

export function FileContentDisplay({
  content,
  isLoading,
  error,
}: FileContentDisplayProps) {
  // Empty state: No file selected
  if (!content && !isLoading && !error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
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
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No file selected</p>
          <p className="mt-1 text-xs text-gray-400">
            Click a file in the tree to view its contents
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading file...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-red-50">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="mt-2 text-sm text-red-600 font-medium">Error loading file</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // Content is available
  if (!content) return null;

  // Story 5.3 AC-5: Binary file message
  if (content.isBinary) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 font-medium">Cannot preview binary file</p>
          <p className="mt-1 text-xs text-gray-400">
            {content.mimeType} • {formatFileSize(content.size)}
          </p>
        </div>
      </div>
    );
  }

  // Story 5.3 AC-2, AC-3: Text file display with preserved formatting
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Story 5.3 AC-4: Truncation warning */}
      {content.truncated && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800">
          <span className="font-medium">File truncated</span> - Showing first 5000 lines of {formatFileSize(content.size)} file
        </div>
      )}

      {/* File content with preserved whitespace */}
      {/* Story 5.3 Constraint C10: Use 'whitespace-pre-wrap' for text preservation */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words text-gray-900">
          {content.content}
        </pre>
      </div>
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
