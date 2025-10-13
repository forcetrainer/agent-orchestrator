/**
 * Chat Session Management
 * Story 6.3: Session Display Names & Chat Context
 *
 * Creates and manages session manifests for chat conversations,
 * enabling chat sessions to appear in the file viewer with friendly names.
 */

import { writeFile, mkdir, readFile, readdir, rm } from 'fs/promises';
import { resolve, join } from 'path';
import { randomUUID } from 'crypto';
import type { SessionManifest } from '@/lib/agents/sessionDiscovery';
import { generateDisplayName, truncate } from '@/lib/sessions/naming';
import { env } from '@/lib/utils/env';

/**
 * Create a new chat session manifest
 *
 * Story 6.3 AC-5, AC-7: Create session with userSummary and displayName
 * Story 10.0: conversationId === sessionId (1:1 relationship enforced)
 *
 * @param conversationId - Conversation/session ID (same value per Story 10.0)
 * @param agentId - Agent identifier
 * @param agentTitle - Agent display title
 * @param firstUserMessage - First user message in conversation
 * @param userName - User who initiated the chat (from config or default)
 * @returns Session ID and folder path
 */
export async function createChatSession(
  conversationId: string,
  agentId: string,
  agentTitle: string,
  firstUserMessage: string,
  userName: string = 'User'
): Promise<{ sessionId: string; sessionFolder: string }> {
  // Clean up abandoned sessions for this user (async, don't wait)
  cleanupAbandonedSessions(userName).catch((error) => {
    console.error('[createChatSession] Failed to cleanup abandoned sessions:', error);
  });

  // Story 10.0: Use provided conversationId instead of generating new UUID
  const sessionId = conversationId;
  const conversationsFolder = resolve(env.PROJECT_ROOT, 'data/conversations');
  const sessionFolder = join(conversationsFolder, sessionId);

  // Create session directory
  await mkdir(sessionFolder, { recursive: true });

  // Truncate first user message to 35 characters
  const userSummary = truncate(firstUserMessage, 35);

  // Create initial manifest
  const manifest: SessionManifest = {
    version: '1.0.0',
    session_id: sessionId,
    agent: {
      name: agentId,
      title: agentTitle,
      bundle: 'chat', // Mark as chat session (not workflow)
    },
    workflow: {
      name: 'chat',
      description: 'Interactive chat conversation',
    },
    execution: {
      started_at: new Date().toISOString(),
      status: 'running',
      user: userName,
    },
    outputs: [],
    userSummary,
    messageCount: 1, // First user message
  };

  // Generate and cache display name
  manifest.displayName = generateDisplayName(manifest);
  manifest.displayTimestamp = manifest.displayName.split(' - ')[0];

  // Write manifest to file
  const manifestPath = join(sessionFolder, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  return { sessionId, sessionFolder };
}

/**
 * Update message count in session manifest
 *
 * Story 6.3 AC-6: Increment messageCount on each message exchange
 *
 * @param sessionId - UUID of the chat session
 * @returns true if successful, false if session not found
 */
export async function incrementMessageCount(sessionId: string): Promise<boolean> {
  const conversationsFolder = resolve(env.PROJECT_ROOT, 'data/conversations');
  const manifestPath = join(conversationsFolder, sessionId, 'manifest.json');

  try {
    // Read current manifest
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as SessionManifest;

    // Increment message count
    manifest.messageCount = (manifest.messageCount || 0) + 1;

    // Update timestamp
    manifest.execution.completed_at = new Date().toISOString();

    // Write back
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`[incrementMessageCount] Session not found: ${sessionId}`);
      return false;
    }
    throw error;
  }
}

/**
 * Finalize a chat session by marking it as completed
 *
 * @param sessionId - UUID of the chat session
 * @returns true if successful, false if session not found
 */
export async function finalizeChatSession(sessionId: string): Promise<boolean> {
  const conversationsFolder = resolve(env.PROJECT_ROOT, 'data/conversations');
  const manifestPath = join(conversationsFolder, sessionId, 'manifest.json');

  try {
    // Read current manifest
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as SessionManifest;

    // Update execution metadata
    manifest.execution.completed_at = new Date().toISOString();
    manifest.execution.status = 'completed';

    // Write back
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`[finalizeChatSession] Session not found: ${sessionId}`);
      return false;
    }
    throw error;
  }
}

/**
 * Clean up abandoned chat sessions for a specific user
 *
 * Removes sessions that are:
 * - Status: "running" (never completed)
 * - No output files (only manifest.json exists)
 * - Belong to the specified user
 * - Older than 1 hour (to avoid deleting active sessions in another tab)
 *
 * This is safe to call on new session creation to clean up orphaned sessions
 * from previous browser sessions.
 *
 * @param userName - User whose abandoned sessions should be cleaned
 * @returns Number of sessions cleaned up
 */
export async function cleanupAbandonedSessions(userName: string): Promise<number> {
  const conversationsFolder = resolve(env.PROJECT_ROOT, 'data/conversations');
  let cleanedCount = 0;
  const oneHourAgo = Date.now() - (60 * 60 * 1000);

  try {
    const sessionDirs = await readdir(conversationsFolder);

    for (const sessionId of sessionDirs) {
      const sessionFolder = join(conversationsFolder, sessionId);
      const manifestPath = join(sessionFolder, 'manifest.json');

      try {
        // Read manifest
        const manifestContent = await readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent) as SessionManifest;

        // Check if this is an abandoned session for this user
        const isAbandonedSession =
          manifest.execution.user === userName &&
          manifest.execution.status === 'running' &&
          manifest.outputs.length === 0;

        if (!isAbandonedSession) continue;

        // Check age (must be older than 1 hour to avoid deleting active sessions)
        const sessionStartTime = new Date(manifest.execution.started_at).getTime();
        if (sessionStartTime > oneHourAgo) {
          const sessionAge = Date.now() - sessionStartTime;
          console.log(`[cleanupAbandonedSessions] Skipping recent session: ${sessionId} (${Math.round(sessionAge / 1000 / 60)}min old)`);
          continue;
        }

        // Check that only manifest.json exists (no other files)
        const files = await readdir(sessionFolder);
        const hasOnlyManifest = files.length === 1 && files[0] === 'manifest.json';

        if (hasOnlyManifest) {
          // Safe to delete - this is truly an abandoned session
          await rm(sessionFolder, { recursive: true, force: true });
          cleanedCount++;
          console.log(`[cleanupAbandonedSessions] Removed abandoned session: ${sessionId}`);
        }
      } catch (error: any) {
        // Skip sessions we can't read or parse
        if (error.code !== 'ENOENT') {
          console.warn(`[cleanupAbandonedSessions] Error processing session ${sessionId}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('[cleanupAbandonedSessions] Error scanning sessions:', error.message);
  }

  return cleanedCount;
}
