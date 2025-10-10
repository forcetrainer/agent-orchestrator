'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { FileContentResponse } from '@/types/api';
import { Breadcrumb } from '@/components/file-viewer/Breadcrumb';
import type { FileTreeNode } from '@/lib/files/treeBuilder';

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
  /** Story 5.6 AC-2: Current file path for breadcrumb */
  currentFilePath?: string;
  /** Story 5.6 AC-2: Tree data for breadcrumb display names */
  treeData?: FileTreeNode | null;
  /** Story 5.6 AC-2: Breadcrumb navigation handler */
  onBreadcrumbNavigate?: (path: string) => void;
}

export function FileContentDisplay({
  content,
  isLoading,
  error,
  currentFilePath,
  treeData,
  onBreadcrumbNavigate,
}: FileContentDisplayProps) {
  // Story 5.4: ViewMode state for markdown toggle (AC-2, AC-7)
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');
  // Story 5.6 AC-4: Delay loading spinner to prevent flicker
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  // Story 5.6 AC-5: Ref for scroll container to reset scroll position
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Story 5.4: Detect markdown files (AC-1)
  const isMarkdown = content?.mimeType === 'text/markdown';

  // Story 5.4: Default to rendered view for markdown files (AC-7)
  useEffect(() => {
    if (content && isMarkdown) {
      setViewMode('rendered');
    }
  }, [content, isMarkdown]);

  // Story 5.6 AC-4: Delay loading spinner by 200ms to prevent flicker
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowLoadingSpinner(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingSpinner(false);
    }
  }, [isLoading]);

  // Story 5.6 AC-5: Reset scroll to top when opening new file
  // Decision: Option A (reset to top) for MVP - simpler than preserving per-file scroll
  // Future enhancement: Store scroll positions in Map if user feedback requests it
  useEffect(() => {
    if (content && scrollContainerRef.current && scrollContainerRef.current.scrollTo) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [content]);

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

  // Loading state (Story 5.6 AC-4: Show spinner only after 200ms delay)
  if (isLoading && showLoadingSpinner) {
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

  // Story 5.6 AC-6: Empty file state (different from loading state)
  if (content.content.length === 0 && !content.isBinary) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">This file is empty</p>
          <p className="mt-1 text-xs text-gray-400">
            {content.mimeType} • 0 B
          </p>
        </div>
      </div>
    );
  }

  // Story 5.3 AC-2, AC-3: Text file display with preserved formatting
  // Story 5.4: Add markdown rendering with toggle
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Story 5.6 AC-2: Breadcrumb trail shows current file path */}
      {currentFilePath && (
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
          <Breadcrumb
            currentFilePath={currentFilePath}
            treeData={treeData || undefined}
            onNavigate={onBreadcrumbNavigate}
          />
        </div>
      )}

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
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        {isMarkdown && viewMode === 'rendered' ? (
          // Story 5.4 AC-1, AC-3-7: Markdown rendering (reuses Epic 3 Story 3.3 config)
          // Story 8.1: Updated to use new design system (cyan accents, slate text colors, signature borders)
          <div className="markdown-light p-4 leading-[1.7]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Headings - Story 8.1: Signature left borders (6px H1, 4px H2) with cyan accent
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mt-0 mb-6 text-slate-900 border-l-6 border-accent pl-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 border-l-4 border-accent pl-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-800">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg font-semibold mt-5 mb-2 text-slate-800">
                    {children}
                  </h4>
                ),
                h5: ({ children }) => <h5 className="text-base font-semibold mb-2 text-slate-700">{children}</h5>,
                h6: ({ children }) => <h6 className="text-sm font-semibold mb-2 text-slate-700">{children}</h6>,

                // Paragraphs - Story 8.1: Slate text colors
                p: ({ children }) => <p className="mb-4 leading-[1.7] text-slate-700">{children}</p>,

                // Bold and italic - Spec: Body Text
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,

                // Links - Story 8.1: Cyan accent with underline (2px offset)
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-hover underline decoration-2 underline-offset-2 hover:text-accent-active transition-colors duration-200"
                  >
                    {children}
                  </a>
                ),

                // Inline code - Story 8.1: Slate backgrounds, red accent for code
                code: ({ className, children }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 text-red-600 font-mono text-sm font-medium">
                        {children}
                      </code>
                    );
                  }
                  // Code inside pre blocks
                  return (
                    <code className="font-mono text-sm leading-[1.5] text-green-300">
                      {children}
                    </code>
                  );
                },

                // Code blocks - Story 8.1: Dark slate background
                pre: ({ children }) => (
                  <pre className="rounded-lg mb-4 overflow-x-auto p-4 bg-slate-800 text-slate-100 font-mono text-sm leading-[1.5]">
                    {children}
                  </pre>
                ),

                // Lists - Spec: Lists
                ul: ({ children }) => (
                  <ul className="mb-4 space-y-[6px] leading-[1.7]" style={{ paddingLeft: '30px' }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 space-y-[6px] leading-[1.7]" style={{ paddingLeft: '30px' }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="mb-[6px] leading-[1.7]">{children}</li>,

                // Blockquotes - Story 8.1: Cyan left border (signature element)
                blockquote: ({ children }) => (
                  <blockquote className="ml-0 mb-4 py-2 pl-4 italic border-l-4 border-accent bg-slate-50 text-slate-600">
                    {children}
                  </blockquote>
                ),

                // Tables - Story 8.1: Primary blue headers, slate borders
                table: ({ children }) => (
                  <table className="border-collapse w-full mb-4">
                    {children}
                  </table>
                ),
                thead: ({ children }) => (
                  <thead className="bg-primary text-white">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children, ...props }) => {
                  // Apply alternating row background (even rows)
                  const isEven = props.node?.position?.start.line ? props.node.position.start.line % 2 === 0 : false;
                  return (
                    <tr className={isEven ? 'bg-slate-50' : ''}>
                      {children}
                    </tr>
                  );
                },
                th: ({ children }) => (
                  <th className="px-3 py-3 text-left font-semibold border border-slate-200">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 border border-slate-200 text-slate-700">
                    {children}
                  </td>
                ),

                // Horizontal Rule - Story 8.1: Slate divider
                hr: () => (
                  <hr className="my-6 border-0 border-t-2 border-slate-200" />
                ),
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
