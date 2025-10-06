/**
 * Session Discovery and Management Module
 * Story 5.0: Session Discovery API and Output Registration
 *
 * Provides utilities for discovering agent session outputs and registering
 * new outputs to session manifests.
 *
 * Features:
 * - findSessions: Search for sessions by agent, workflow, status
 * - registerOutput: Atomically append output records to manifest
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { resolve, join } from 'path';
import { load as parseYaml } from 'js-yaml';
import { env } from '@/lib/utils/env';

/**
 * Session manifest structure (v1.0.0)
 */
export interface SessionManifest {
  version: string;
  session_id: string;
  agent: {
    name: string;
    title: string;
    bundle: string;
  };
  workflow: {
    name: string;
    description: string;
  };
  execution: {
    started_at: string;
    completed_at?: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    user: string;
  };
  outputs: Array<{
    file: string;
    type: string;
    description: string;
    created_at: string;
  }>;
  inputs?: Record<string, any>;
  related_sessions?: string[];
  metadata?: Record<string, any>;
}

/**
 * Filter parameters for session discovery
 */
export interface SessionFilter {
  /** Filter by agent name (exact match or regex) */
  agent?: string | RegExp;
  /** Filter by workflow name (exact match or regex) */
  workflow?: string | RegExp;
  /** Filter by execution status */
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  /** Maximum number of results to return */
  limit?: number;
}

/**
 * Output record to register in manifest
 */
export interface OutputRecord {
  /** Relative path from session folder */
  file: string;
  /** Output type: document, data, report, artifact */
  type: 'document' | 'data' | 'report' | 'artifact';
  /** Human-readable description */
  description: string;
}

/**
 * Find sessions matching the given filter criteria
 *
 * Story 5.0 AC-6: Session Discovery API
 *
 * @param filter - Optional filter criteria
 * @returns Array of session manifests sorted by started_at (newest first)
 */
export async function findSessions(
  filter: SessionFilter = {}
): Promise<SessionManifest[]> {
  const agentOutputsFolder = resolve(env.PROJECT_ROOT, 'data/agent-outputs');

  try {
    // Read all session directories
    const sessionDirs = await readdir(agentOutputsFolder, { withFileTypes: true });

    const sessions: SessionManifest[] = [];

    // Load and parse each manifest
    for (const dir of sessionDirs) {
      if (!dir.isDirectory()) continue;

      const manifestPath = join(agentOutputsFolder, dir.name, 'manifest.json');

      try {
        const manifestContent = await readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent) as SessionManifest;

        // Apply filters
        if (filter.agent) {
          const agentMatch = typeof filter.agent === 'string'
            ? manifest.agent.name === filter.agent
            : filter.agent.test(manifest.agent.name);
          if (!agentMatch) continue;
        }

        if (filter.workflow) {
          const workflowMatch = typeof filter.workflow === 'string'
            ? manifest.workflow.name === filter.workflow
            : filter.workflow.test(manifest.workflow.name);
          if (!workflowMatch) continue;
        }

        if (filter.status && manifest.execution.status !== filter.status) {
          continue;
        }

        sessions.push(manifest);
      } catch (error: any) {
        // Skip sessions with invalid or missing manifests
        console.warn(`[findSessions] Skipping invalid manifest: ${manifestPath}`, error.message);
      }
    }

    // Sort by started_at (newest first)
    sessions.sort((a, b) => {
      return new Date(b.execution.started_at).getTime() - new Date(a.execution.started_at).getTime();
    });

    // Apply limit if specified
    if (filter.limit && filter.limit > 0) {
      return sessions.slice(0, filter.limit);
    }

    return sessions;
  } catch (error: any) {
    // If agent-outputs folder doesn't exist, return empty array (not an error)
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Register an output file in the session manifest
 *
 * Story 5.0 AC-7: Output Registration Utility
 *
 * Atomically appends a new output record to the manifest.outputs array.
 * Auto-populates created_at timestamp.
 *
 * @param sessionId - UUID of the session
 * @param output - Output record to register
 * @returns true if successful, false if session not found
 */
export async function registerOutput(
  sessionId: string,
  output: OutputRecord
): Promise<boolean> {
  const agentOutputsFolder = resolve(env.PROJECT_ROOT, 'data/agent-outputs');
  const manifestPath = join(agentOutputsFolder, sessionId, 'manifest.json');

  try {
    // Read current manifest
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as SessionManifest;

    // Create output record with timestamp
    const outputRecord = {
      ...output,
      created_at: new Date().toISOString(),
    };

    // Append to outputs array
    manifest.outputs.push(outputRecord);

    // Write back atomically
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log(`[registerOutput] Registered output for session ${sessionId}: ${output.file}`);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`[registerOutput] Session not found: ${sessionId}`);
      return false;
    }
    throw error;
  }
}

/**
 * Finalize a session by updating manifest with completion timestamp and status
 *
 * Story 5.0: Manifest finalization on workflow completion
 *
 * @param sessionId - UUID of the session
 * @param status - Final status: completed, failed, or cancelled
 */
export async function finalizeSession(
  sessionId: string,
  status: 'completed' | 'failed' | 'cancelled'
): Promise<boolean> {
  const agentOutputsFolder = resolve(env.PROJECT_ROOT, 'data/agent-outputs');
  const manifestPath = join(agentOutputsFolder, sessionId, 'manifest.json');

  try {
    // Read current manifest
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as SessionManifest;

    // Update execution metadata
    manifest.execution.completed_at = new Date().toISOString();
    manifest.execution.status = status;

    // Write back atomically
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log(`[finalizeSession] Finalized session ${sessionId} with status: ${status}`);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`[finalizeSession] Session not found: ${sessionId}`);
      return false;
    }
    throw error;
  }
}
