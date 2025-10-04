'use client';

import { memo } from 'react';

/**
 * LoadingIndicator Component
 *
 * Displays animated loading indicator when agent is processing
 * Story 3.6 - Task 1: Create LoadingIndicator component with animation
 *
 * AC-6.2: Indicator shows "Agent is thinking..." or similar message
 * AC-6.5: Visual cue is clear but not distracting (subtle animation)
 *
 * Styling matches agent message appearance (left-aligned, gray background)
 * Animation: CSS-based animated dots (1.4s loop) for performance
 * Accessibility: aria-live="polite" for screen reader support
 */
export const LoadingIndicator = memo(function LoadingIndicator() {
  return (
    <div
      className="max-w-[75%] mr-auto bg-gray-200 text-gray-900 px-4 py-3 rounded-lg"
      role="status"
      aria-live="polite"
      aria-label="Agent is thinking"
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-700">Agent is thinking</span>
        <div className="flex gap-1">
          <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>.</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
        </div>
      </div>
    </div>
  );
});
