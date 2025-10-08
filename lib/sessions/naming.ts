/**
 * Session Naming Utilities
 * Story 6.3: Session Display Names & Chat Context
 *
 * Provides smart timestamp formatting and display name generation
 * for session manifests.
 */

import type { SessionManifest } from '@/lib/agents/sessionDiscovery';

/**
 * Format an ISO timestamp into a smart, age-adaptive display format
 *
 * Story 6.3 AC-3: Smart timestamp logic
 * - Today: "2:30p" or "11:00a" (5 chars)
 * - Yesterday: "Yday 2:30p" (11 chars)
 * - This week (Mon-Sun): "Mon 2:30p", "Tue 9:15a" (10 chars)
 * - Older: "Oct 5", "Sep 28" (5-6 chars)
 *
 * @param isoTimestamp - ISO 8601 timestamp string
 * @returns Formatted smart timestamp string
 */
export function formatSmartTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();

  if (isToday(date, now)) {
    return formatTime(date);
  } else if (isYesterday(date, now)) {
    return `Yday ${formatTime(date)}`;
  } else if (isThisWeek(date, now)) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} ${formatTime(date)}`;
  } else {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  }
}

/**
 * Check if a date is today
 */
function isToday(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Check if a date is yesterday
 */
function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

/**
 * Check if a date is within this week (Mon-Sun, week starts Monday)
 */
function isThisWeek(date: Date, now: Date): boolean {
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  // Adjust to Monday (0 = Sunday, 1 = Monday, ...)
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(now.getDate() + daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
}

/**
 * Format time as "2:30p" or "11:00a"
 */
function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'p' : 'a';

  // Convert to 12-hour format
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  const minutesStr = minutes.toString().padStart(2, '0');
  return `${hours}:${minutesStr}${period}`;
}

/**
 * Truncate a string to a maximum length with ellipsis
 *
 * Story 6.3: Truncate summaries to 35 characters (excluding ellipsis)
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length before ellipsis (default: 35)
 * @returns Truncated string with "..." if longer than maxLength
 */
export function truncate(str: string, maxLength: number = 35): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  // Truncate at maxLength, then add "..." (total length = maxLength + 3)
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Extract a meaningful summary from workflow inputs
 *
 * Priority: project_name > category > first non-empty value
 *
 * @param inputs - Workflow input parameters
 * @returns Summary string or null if no meaningful input found
 */
function extractInputSummary(inputs?: Record<string, any>): string | null {
  if (!inputs || Object.keys(inputs).length === 0) {
    return null;
  }

  // Priority 1: project_name
  if (inputs.project_name && typeof inputs.project_name === 'string') {
    return inputs.project_name;
  }

  // Priority 2: category
  if (inputs.category && typeof inputs.category === 'string') {
    return inputs.category;
  }

  // Priority 3: first non-empty string value
  for (const value of Object.values(inputs)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

/**
 * Generate a display name for a session manifest
 *
 * Story 6.3 AC-2, AC-4: Display name format and priority system
 *
 * Format: "{smartTimestamp} - {summary (35 char max)}"
 *
 * Summary priority:
 * 1. userSummary (chat sessions)
 * 2. workflow.name + inputSummary (workflow with inputs)
 * 3. workflow.name (workflow without inputs)
 * 4. agent.title (fallback)
 *
 * @param manifest - Session manifest
 * @returns Display name string
 */
export function generateDisplayName(manifest: SessionManifest): string {
  const timestamp = formatSmartTimestamp(manifest.execution.started_at);
  let summary: string;

  // Priority 1: User summary (chat sessions)
  if (manifest.userSummary) {
    summary = truncate(manifest.userSummary, 35);
  }
  // Priority 2: Workflow with input summary
  else if (manifest.workflow?.name && manifest.inputs) {
    const inputSummary = extractInputSummary(manifest.inputs);
    if (inputSummary) {
      summary = truncate(`${manifest.workflow.name}: ${inputSummary}`, 35);
    } else {
      summary = truncate(manifest.workflow.name, 35);
    }
  }
  // Priority 3: Workflow name only
  else if (manifest.workflow?.name) {
    summary = truncate(manifest.workflow.name, 35);
  }
  // Priority 4: Agent title fallback
  else {
    summary = truncate(manifest.agent.title, 35);
  }

  return `${timestamp} - ${summary}`;
}
