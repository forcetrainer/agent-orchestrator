'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
 * Story 5.4: Markdown Rendering in File Viewer
 * AC-1: .md files render with markdown formatting by default
 * AC-2: Toggle button switches between rendered and raw view
 * AC-3: Headings, lists, tables all render correctly (match Epic 3 chat rendering)
 * AC-4: Links are clickable (if safe - same security model as chat)
 * AC-5: Code blocks display with monospace font and background
 * AC-6: Markdown rendering matches chat interface styling (consistency)
 * AC-7: Default view is rendered (not raw text)
 *
 * Displays file contents with proper text formatting or binary file messaging.
 * Markdown files render with formatting using react-markdown (reuses Epic 3 Story 3.3 config).
 */

type ViewMode = 'rendered' | 'raw';

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
  // Story 5.4: ViewMode state for markdown toggle (AC-2, AC-7)
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');

  // Story 5.4: Detect markdown files (AC-1)
  const isMarkdown = content?.mimeType === 'text/markdown';

  // Story 5.4: Default to rendered view for markdown files (AC-7)
  useEffect(() => {
    if (content && isMarkdown) {
      setViewMode('rendered');
    }
  }, [content, isMarkdown]);

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
  // Story 5.4: Add markdown rendering with toggle
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Story 5.3 AC-4: Truncation warning */}
      {content.truncated && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800">
          <span className="font-medium">File truncated</span> - Showing first 5000 lines of {formatFileSize(content.size)} file
        </div>
      )}

      {/* Story 5.4 AC-2: Toggle button for markdown files */}
      {isMarkdown && (
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-600">
            {content.mimeType} • {formatFileSize(content.size)}
          </span>
          <button
            onClick={() => setViewMode(viewMode === 'rendered' ? 'raw' : 'rendered')}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            aria-label="Toggle between rendered and raw view"
          >
            {viewMode === 'rendered' ? 'View Raw' : 'View Rendered'}
          </button>
        </div>
      )}

      {/* File content with markdown rendering or preserved whitespace */}
      <div className="flex-1 overflow-auto">
        {isMarkdown && viewMode === 'rendered' ? (
          // Story 5.4 AC-1, AC-3-7: Markdown rendering (reuses Epic 3 Story 3.3 config)
          <div className="p-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Headings (AC-3)
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                h4: ({ children }) => <h4 className="text-base font-bold mb-1">{children}</h4>,
                h5: ({ children }) => <h5 className="text-sm font-bold mb-1">{children}</h5>,
                h6: ({ children }) => <h6 className="text-xs font-bold mb-1">{children}</h6>,

                // Lists (AC-3)
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-4">{children}</li>,

                // Code blocks (AC-5)
                pre: ({ children }) => <pre className="bg-gray-100 rounded p-3 mb-2 overflow-x-auto">{children}</pre>,
                code: ({ className, children }) => {
                  // Inline code vs code block
                  const isInline = !className;
                  if (isInline) {
                    return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
                  }
                  return <code className="font-mono text-sm">{children}</code>;
                },

                // Links (AC-4) - Security: rel="noopener noreferrer" for external links
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {children}
                  </a>
                ),

                // Bold and italic (AC-6)
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,

                // Paragraphs (AC-6)
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

                // Tables (AC-3)
                table: ({ children }) => (
                  <table className="border-collapse border border-gray-300 mb-2 w-full">{children}</table>
                ),
                thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
                th: ({ children }) => <th className="border border-gray-300 px-3 py-2 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
              }}
            >
              {content.content}
            </ReactMarkdown>
          </div>
        ) : (
          // Story 5.3 Constraint C10: Use 'whitespace-pre-wrap' for text preservation
          // Story 5.4: Raw view for markdown or all non-markdown text files
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words text-gray-900">
            {content.content}
          </pre>
        )}
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
