'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';

/**
 * MessageList Component
 *
 * Scrollable message history container with auto-scroll behavior
 * Story 3.2 - Task 3, Task 4
 *
 * AC-1.2: Message history area shows above input field
 * AC-2.4: Messages display in chronological order (oldest to newest)
 * AC-2.5: Message history scrolls when conversation grows long
 * AC-2.6: Auto-scroll to latest message when new message arrives
 *
 * Performance: Auto-scroll completes within 300ms per NFR-1
 */
export function MessageList({ messages }: { messages: Message[] }) {
  // Task 4.1: Ref for auto-scroll control
  const scrollRef = useRef<HTMLDivElement>(null);

  // Task 4.2, 4.3, 4.4: Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth', // Smooth scroll for better UX
      });
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50"
      role="log"
      aria-label="Message history"
      aria-live="polite"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {/* Task 3.5: Empty state */}
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <p className="text-sm">No messages yet. Start a conversation below.</p>
          </div>
        ) : (
          /* Task 3.2, 3.3: Map messages in chronological order */
          messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))
        )}
      </div>
    </div>
  );
}
