'use client';

import { memo } from 'react';
import { Message } from '@/lib/types';

/**
 * MessageBubble Component
 *
 * Renders individual message with role-based styling
 * Story 3.2 - Task 2
 *
 * AC-2.1: User messages appear right-aligned with distinct styling
 * AC-2.2: Agent messages appear left-aligned with different styling
 * AC-2.3: Clear visual distinction between user and agent messages
 *
 * Styling follows design system from Story 3.1:
 * - User: Right-aligned, blue background (#3B82F6), white text
 * - Assistant: Left-aligned, gray background (gray-200), dark text
 * - Error: Left-aligned, red background, white text
 * - Max width 75% for readability
 * - Border radius: rounded-lg
 * - Padding: px-4 py-3
 *
 * Performance: React.memo prevents unnecessary re-renders (NFR-1: < 100ms target)
 */
export const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  // Base styles for all messages
  const baseStyles = 'max-w-[75%] px-4 py-3 rounded-lg';

  // Role-specific styling
  const roleStyles = {
    user: 'ml-auto bg-blue-500 text-white',
    assistant: 'mr-auto bg-gray-200 text-gray-900',
    error: 'mr-auto bg-red-500 text-white',
  };

  return (
    <div className={`${baseStyles} ${roleStyles[message.role]}`}>
      {message.content}
    </div>
  );
});
