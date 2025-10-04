'use client';

import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

/**
 * ChatPanel Component
 *
 * Main chat container with message history above and input below
 * Full-screen flex layout following architecture Section 7.1
 *
 * AC-1.1, AC-1.2, AC-1.3, AC-1.4: Chat interface layout
 *
 * UX Enhancement: Centers input when no messages (like ChatGPT/Claude.ai),
 * expands to full layout when conversation starts
 */
export function ChatPanel() {
  // Track if conversation has started (will be connected to actual state in Story 3.2)
  const [hasMessages] = useState(false);

  // Centered layout before first message (ChatGPT/Claude.ai style)
  if (!hasMessages) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-full max-w-3xl px-4">
          <MessageInput centered />
        </div>
      </div>
    );
  }

  // Full layout after conversation starts
  return (
    <div className="flex flex-col h-screen">
      <MessageList />
      <MessageInput />
    </div>
  );
}
