'use client';

import { memo } from 'react';
import { FlintLoadingDots } from '@/components/branding/FlintLoader';

/**
 * LoadingIndicator Component (StatusIndicator)
 *
 * Displays animated loading indicator when agent is processing
 * Story 3.6 - Task 1: Create LoadingIndicator component with animation
 * Story 4.7 - AC-4.7.6: Support custom message for different loading states
 * Story 6.9 - Task 4: Enhanced with pulsing dot animation for tool-aware status
 * Story 8.1 - Flint branding: Uses FlintLoadingDots for branded animation
 *
 * AC-6.2: Indicator shows "Agent is thinking..." or similar message
 * AC-6.5: Visual cue is clear but not distracting (subtle animation)
 * AC-6.9.9: Pulsing dot animation next to status text
 * AC-6.9.10: Accessibility (aria-live="polite", respects prefers-reduced-motion)
 *
 * Styling matches agent message appearance (left-aligned, slate background)
 * Animation: Flint loading dots with respects-reduced-motion support
 * Accessibility: aria-live="polite" for screen reader support
 */
export const LoadingIndicator = memo(function LoadingIndicator({
  message = "Agent is thinking"
}: {
  message?: string
}) {
  return (
    <div
      className="max-w-[75%] mr-auto bg-slate-100 text-slate-900 px-4 py-3 rounded-xl border-l-4 border-cyan-500"
      role="status"
      aria-live="polite"
      aria-label={`Agent status: ${message}`}
    >
      <div className="flex items-center gap-3">
        {/* Flint branded loading dots (AC #9) */}
        <FlintLoadingDots />
        <span className="text-slate-700">{message}</span>
      </div>
    </div>
  );
});
