'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { LoadingIndicator } from './LoadingIndicator';

/**
 * MessageList Component
 *
 * Scrollable message history container with auto-scroll behavior
 * Story 3.2 - Task 3, Task 4
 * Story 3.6 - Task 3: Render loading indicator
 * Story 6.8 - Task 4: Display streaming content
 *
 * AC-1.2: Message history area shows above input field
 * AC-2.4: Messages display in chronological order (oldest to newest)
 * AC-2.5: Message history scrolls when conversation grows long
 * AC-2.6: Auto-scroll to latest message when new message arrives
 * AC-6.3: Loading indicator appears in chat history where agent response will be
 * AC-6.8.1: Streaming content displays token-by-token
 * AC-6.8.28: Chat auto-scrolls to show streaming content
 *
 * Performance: Auto-scroll completes within 300ms per NFR-1
 */
export function MessageList({
  messages,
  isLoading,
  loadingMessage,
  streamingContent,
  isStreaming
}: {
  messages: Message[];
  isLoading?: boolean;
  loadingMessage?: string;
  streamingContent?: string;
  isStreaming?: boolean;
}) {
  // Task 4.1: Ref for auto-scroll control
  const scrollRef = useRef<HTMLDivElement>(null);

  // Debug logging for Story 4.7 AC-4.7.6
  console.log('[MessageList] Rendering with:', { messageCount: messages.length, isLoading });

  // Task 4.2, 4.3, 4.4: Auto-scroll when messages change
  // Story 3.6: Also auto-scroll when loading indicator appears
  // Story 6.8 AC-6.8.28: Auto-scroll during streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth', // Smooth scroll for better UX
      });
    }
  }, [messages, isLoading, streamingContent]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50"
      role="log"
      aria-label="Message history"
      aria-live="polite"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {/* Task 3.5: Empty state - only show when not loading */}
        {messages.length === 0 && !isLoading ? (
          <div className="text-gray-400 text-center py-8">
            <p className="text-sm">No messages yet. Start a conversation below.</p>
          </div>
        ) : (
          /* Task 3.2, 3.3: Map messages in chronological order */
          /* Filter out tool messages - they're for OpenAI context persistence, not user display */
          messages
            .filter((message) => message.role !== 'tool')
            .map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))
        )}
        {/* Story 6.8 AC-6.8.1: Display streaming content as temporary message */}
        {isStreaming && streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date(),
            }}
            streaming={true}
          />
        )}
        {/* Story 3.6 Task 3.3: Render LoadingIndicator when isLoading=true */}
        {/* AC-6.3: Loading indicator appears in chat history where agent response will be */}
        {/* Story 4.7 AC-4.7.6: Show loading indicator during agent initialization */}
        {/* Story 6.8: Show loading indicator before streaming starts (waiting for first token) */}
        {(isLoading && !isStreaming) || (isStreaming && !streamingContent) ? (
          <LoadingIndicator message={loadingMessage} />
        ) : null}
      </div>
    </div>
  );
}
