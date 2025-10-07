/**
 * Manifest Reader Utility
 * Story 5.2.1: Session Metadata Display Enhancement
 *
 * Provides utilities for reading session manifest.json files and generating
 * human-readable display names for the UI.
 *
 * Features:
 * - parseManifest: Parse manifest.json from session folder
 * - generateDisplayName: Generate human-readable session name
 * - formatTimestamp: Format ISO 8601 timestamps for display
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { SessionManifest } from '@/lib/agents/sessionDiscovery';

/**
 * SessionMetadata type alias (matches SessionManifest from Story 5.0)
 * Provided for clarity in Story 5.2.1 context
 */
export type SessionMetadata = SessionManifest;

/**
 * Parse manifest.json from a session folder
 *
 * Story 5.2.1 AC-1, AC-7: Load session metadata with graceful degradation
 *
 * @param sessionPath - Absolute path to session folder (containing manifest.json)
 * @returns SessionMetadata object if valid, null if missing or malformed
 *
 * @example
 * ```typescript
 * const metadata = await parseManifest('/data/agent-outputs/abc-123-def');
 * if (metadata) {
 *   console.log(metadata.agent.title); // "Alex the Facilitator"
 * }
 * ```
 */
export async function parseManifest(sessionPath: string): Promise<SessionMetadata | null> {
  const manifestPath = join(sessionPath, 'manifest.json');

  try {
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as SessionMetadata;

    // Validate required fields exist
    if (!manifest.agent?.name || !manifest.workflow?.name || !manifest.execution?.started_at) {
      console.warn(`[parseManifest] Manifest missing required fields: ${manifestPath}`);
      return null;
    }

    return manifest;
  } catch (error: any) {
    // Graceful degradation: missing or malformed manifest
    if (error.code === 'ENOENT') {
      // Silent: manifest.json doesn't exist (expected for legacy sessions)
      return null;
    }

    // Warn on parse errors (malformed JSON)
    console.warn(`[parseManifest] Failed to parse manifest: ${manifestPath}`, error.message);
    return null;
  }
}

/**
 * Generate human-readable display name from session metadata
 *
 * Story 5.2.1 AC-1, AC-5: Display name format "{Agent Title} - {Workflow Name} ({Date})"
 *
 * Format:
 * - Running sessions: "{Agent} - {Workflow} (In Progress)"
 * - Completed sessions: "{Agent} - {Workflow} ({Date})"
 *
 * @param metadata - Session metadata from manifest.json
 * @returns Human-readable display name
 *
 * @example
 * ```typescript
 * const name = generateDisplayName(metadata);
 * // "Alex the Facilitator - Intake ITSM (Oct 6, 2025 5:09 PM)"
 * // "Pixel - Build Stories (In Progress)"
 * ```
 */
export function generateDisplayName(metadata: SessionMetadata): string {
  const agentTitle = metadata.agent.title || metadata.agent.name;
  const workflowName = metadata.workflow.name;

  // Check execution status
  const status = metadata.execution.status;

  if (status === 'running') {
    return `${agentTitle} - ${workflowName} (In Progress)`;
  }

  // Use completed_at if available, otherwise started_at
  const timestamp = metadata.execution.completed_at || metadata.execution.started_at;
  const formattedDate = formatTimestamp(timestamp);

  return `${agentTitle} - ${workflowName} (${formattedDate})`;
}

/**
 * Format ISO 8601 timestamp to human-readable format
 *
 * Story 5.2.1: Date formatting utility
 *
 * Format: "Oct 6, 2025 5:09 PM"
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Human-readable date/time string
 *
 * @example
 * ```typescript
 * formatTimestamp('2025-10-06T17:09:15.123Z');
 * // "Oct 6, 2025 5:09 PM"
 * ```
 */
export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);

    // Check for invalid date
    if (isNaN(date.getTime())) {
      console.warn(`[formatTimestamp] Invalid timestamp: ${isoString}`);
      return isoString;
    }

    // Format: "Oct 6, 2025 5:09 PM"
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC', // Use UTC to match ISO 8601 timestamps
    };

    return date.toLocaleString('en-US', options);
  } catch (error) {
    // Fallback to raw string if parsing fails
    console.warn(`[formatTimestamp] Invalid timestamp: ${isoString}`);
    return isoString;
  }
}
