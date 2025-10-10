'use client';

import { memo } from 'react';
import { Message } from '@/lib/types';

/**
 * ErrorMessage Component
 *
 * Displays error messages with distinct warning styling
 * Story 3.8 - Task 1: Error message component and styling
 *
 * AC-8.2: Error messages are clearly styled (red/warning color)
 * AC-8.3: Errors explain what went wrong in plain language
 *
 * Design:
 * - Warning icon (⚠️ or SVG exclamation triangle)
 * - Red border and light red background
 * - High contrast text (dark red on light red background)
 * - Not color-only: includes icon and border for accessibility
 * - Plain text only (no markdown to avoid confusion)
 * - Inline in message history (not modal/alert)
 *
 * Accessibility:
 * - role="alert" for screen readers
 * - High color contrast (WCAG AA compliant)
 * - Icon + color + border (not color-only indicators)
 */
export const ErrorMessage = memo(function ErrorMessage({ message }: { message: Message }) {
  return (
    <div
      className="max-w-[75%] mr-auto px-4 py-3 rounded-xl bg-red-50 text-red-900 border-l-4 border-red-600 flex items-start gap-4"
      role="alert"
      aria-live="assertive"
    >
      {/* Warning icon - visual indicator for accessibility (not color-only) */}
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>

      {/* Error message content - plain text only */}
      <div className="flex-1">
        <p className="font-medium text-sm">{message.content}</p>
      </div>
    </div>
  );
});
