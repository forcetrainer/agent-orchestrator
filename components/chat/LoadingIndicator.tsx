'use client';

import { memo } from 'react';

/**
 * LoadingIndicator Component (StatusIndicator)
 *
 * Displays animated loading indicator when agent is processing
 * Story 3.6 - Task 1: Create LoadingIndicator component with animation
 * Story 4.7 - AC-4.7.6: Support custom message for different loading states
 * Story 6.9 - Task 4: Enhanced with pulsing dot animation for tool-aware status
 *
 * AC-6.2: Indicator shows "Agent is thinking..." or similar message
 * AC-6.5: Visual cue is clear but not distracting (subtle animation)
 * AC-6.9.9: Pulsing dot animation next to status text
 * AC-6.9.10: Accessibility (aria-live="polite", respects prefers-reduced-motion)
 *
 * Styling matches agent message appearance (left-aligned, gray background)
 * Animation: Pulsing blue dot with respects-reduced-motion support
 * Accessibility: aria-live="polite" for screen reader support
 */
export const LoadingIndicator = memo(function LoadingIndicator({
  message = "Agent is thinking"
}: {
  message?: string
}) {
  return (
    <div
      className="max-w-[75%] mr-auto bg-gray-200 text-gray-900 px-4 py-3 rounded-lg"
      role="status"
      aria-live="polite"
      aria-label={`Agent status: ${message}`}
    >
      <div className="flex items-center gap-2">
        {/* Story 6.9: Pulsing dot indicator (AC #9) */}
        <div
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="text-gray-700">{message}</span>
      </div>
    </div>
  );
});
