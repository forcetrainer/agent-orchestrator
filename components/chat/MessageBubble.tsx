'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/lib/types';
import { ErrorMessage } from './ErrorMessage';

/**
 * MessageBubble Component
 *
 * Renders individual message with role-based styling
 * Story 3.2 - Task 2: Role-based message rendering
 * Story 3.3 - Task 2: Markdown rendering for assistant messages
 * Story 3.8 - Task 1: Error message rendering
 * Story 3.10 - Task 3: System message display for agent greetings
 *
 * AC-2.1: User messages appear right-aligned with distinct styling
 * AC-2.2: Agent messages appear left-aligned with different styling
 * AC-2.3: Clear visual distinction between user and agent messages
 * AC-3.1 to AC-3.7: Markdown rendering for assistant messages (headings, lists, code, links, bold, italic, tables)
 * AC-8.2: Error messages are clearly styled (red/warning color)
 * AC-10.4: Agent greeting/welcome message displays automatically
 * AC-10.5: Agent command list displays if defined in agent instructions
 *
 * Styling follows design system from Story 3.1:
 * - User: Right-aligned, blue background (#3B82F6), white text (plain text, no markdown)
 * - Assistant: Left-aligned, gray background (gray-200), dark text (markdown rendered)
 * - System: Left-aligned, blue-gray background (blue-50), dark text, blue border (markdown rendered - for agent greetings)
 * - Error: Left-aligned, red border, light red background, warning icon (plain text, no markdown)
 * - Max width 75% for readability
 * - Border radius: rounded-lg
 * - Padding: px-4 py-3
 *
 * Security: react-markdown with remark-gfm, no dangerouslySetInnerHTML, external links use rel="noopener noreferrer"
 * Performance: React.memo prevents unnecessary re-renders (NFR-1: < 100ms target)
 */
export const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  // Story 3.8 Task 1.5: Delegate error messages to ErrorMessage component
  if (message.role === 'error') {
    return <ErrorMessage message={message} />;
  }
  // Base styles for all messages
  const baseStyles = 'max-w-[75%] px-4 py-3 rounded-lg';

  // Role-specific styling
  const roleStyles: Record<string, string> = {
    user: 'ml-auto bg-blue-500 text-white',
    assistant: 'mr-auto bg-gray-200 text-gray-900',
    // Story 3.10 Task 3.2: System messages styled for agent greetings (AC-10.4, AC-10.5)
    system: 'mr-auto bg-blue-50 text-gray-900 border-2 border-blue-200', // System messages (agent greetings)
    // Tool messages should not be rendered (filtered in MessageList), but add style for safety
    tool: 'hidden',
  };

  // Render markdown for assistant and system messages
  // Story 3.10 Task 3.3: System messages render markdown (AC-10.5 - command lists may use markdown)
  const renderContent = () => {
    if (message.role === 'assistant' || message.role === 'system') {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Headings (AC-3.1)
            h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
            h4: ({ children }) => <h4 className="text-base font-bold mb-1">{children}</h4>,
            h5: ({ children }) => <h5 className="text-sm font-bold mb-1">{children}</h5>,
            h6: ({ children }) => <h6 className="text-xs font-bold mb-1">{children}</h6>,

            // Lists (AC-3.2)
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="ml-4">{children}</li>,

            // Code blocks (AC-3.3)
            pre: ({ children }) => <pre className="bg-gray-100 rounded p-3 mb-2 overflow-x-auto">{children}</pre>,
            code: ({ className, children }) => {
              // Inline code vs code block
              const isInline = !className;
              if (isInline) {
                return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
              }
              return <code className="font-mono text-sm">{children}</code>;
            },

            // Links (AC-3.4) - Security: rel="noopener noreferrer" for external links
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

            // Bold and italic (AC-3.5)
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,

            // Paragraphs (AC-3.6)
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

            // Tables (AC-3.7)
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
          {message.content}
        </ReactMarkdown>
      );
    }

    // User and system messages: plain text only (no markdown)
    return message.content;
  };

  return (
    <div className={`${baseStyles} ${roleStyles[message.role]}`}>
      {renderContent()}
    </div>
  );
});
