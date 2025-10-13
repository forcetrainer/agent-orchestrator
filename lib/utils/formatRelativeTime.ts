// lib/utils/formatRelativeTime.ts
// Story 10.4: Conversation Sidebar UI - Relative Timestamp Formatting
// Task 8: Implement relative timestamps (AC-10.4-3)

import { formatDistanceToNow } from 'date-fns';

/**
 * Formats an ISO 8601 date string into a relative time string.
 *
 * Examples:
 * - Less than 1 minute ago: "just now"
 * - 2 minutes ago: "2 minutes ago"
 * - 3 hours ago: "3 hours ago"
 * - 2 days ago: "2 days ago"
 *
 * @param dateString - ISO 8601 date string (e.g., "2025-10-12T14:30:00.000Z")
 * @returns Human-readable relative time string
 *
 * Story Context Reference:
 * - AC-10.4-3: Show last updated timestamp (relative: "2 hours ago")
 * - Uses date-fns formatDistanceToNow() for consistency
 * - Edge cases: "just now" for < 1 minute, standard format for others
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);

    // Validate date
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return 'unknown';
    }

    // Check if less than 1 minute ago
    const secondsAgo = (Date.now() - date.getTime()) / 1000;
    if (secondsAgo < 60) {
      return 'just now';
    }

    // Use date-fns for relative formatting
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'unknown';
  }
}
