/**
 * Chat Session Management
 * Story 6.3: Session Display Names & Chat Context
 *
 * Creates and manages session manifests for chat conversations,
 * enabling chat sessions to appear in the file viewer with friendly names.
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { resolve, join } from 'path';
import { randomUUID } from 'crypto';
import type { SessionManifest } from '@/lib/agents/sessionDiscovery';
import { generateDisplayName, truncate } from '@/lib/sessions/naming';
import { env } from '@/lib/utils/env';

/**
 * Create a new chat session manifest
 *
 * Story 6.3 AC-5, AC-7: Create session with userSummary and displayName
 *
 * @param agentId - Agent identifier
 * @param agentTitle - Agent display title
 * @param firstUserMessage - First user message in conversation
 * @param userName - User who initiated the chat (from config or default)
 * @returns Session ID and folder path
 */
export async function createChatSession(
  agentId: string,
  agentTitle: string,
  firstUserMessage: string,
  userName: string = 'User'
): Promise<{ sessionId: string; sessionFolder: string }> {
  const sessionId = randomUUID();
  const agentOutputsFolder = resolve(env.PROJECT_ROOT, 'data/agent-outputs');
  const sessionFolder = join(agentOutputsFolder, sessionId);

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
  const agentOutputsFolder = resolve(env.PROJECT_ROOT, 'data/agent-outputs');
  const manifestPath = join(agentOutputsFolder, sessionId, 'manifest.json');

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
  const agentOutputsFolder = resolve(env.PROJECT_ROOT, 'data/agent-outputs');
  const manifestPath = join(agentOutputsFolder, sessionId, 'manifest.json');

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
