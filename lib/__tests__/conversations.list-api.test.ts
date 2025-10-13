/**
 * Tests for Conversation List API Functions
 * Story 10.3: Conversation List API
 *
 * Following "Radical Simplicity" principle (Architecture Section 15):
 * - Only 3 tests focusing on critical failures
 * - Security vulnerabilities (browser ID verification)
 * - Core business logic (sorting)
 * - Error resilience (corrupted data handling)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  loadConversationsForBrowser,
  deleteConversation,
  buildConversationIndex,
} from '@/lib/utils/conversations';
import { env } from '@/lib/utils/env';
import type { PersistedConversation } from '@/types';

// Test data directory
const TEST_DATA_DIR = path.join(env.OUTPUT_PATH, '__test_conversations__');

/**
 * Helper: Create a test conversation on disk
 */
async function createTestConversation(
  conversationId: string,
  browserId: string,
  updatedAt?: Date
): Promise<PersistedConversation> {
  const conversationDir = path.join(TEST_DATA_DIR, conversationId);
  await fs.mkdir(conversationDir, { recursive: true });

  const timestamp = updatedAt || new Date();
  const conversation: PersistedConversation = {
    id: conversationId,
    browserId,
    agentId: 'test-agent',
    agentTitle: 'Test Agent',
    agentBundle: 'test',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: timestamp.toISOString(),
      },
    ],
    userSummary: 'Test message',
    messageCount: 1,
    displayName: 'Test conversation',
    displayTimestamp: 'Just now',
    folderPath: `conversations/${conversationId}`,
    createdAt: timestamp.toISOString(),
    updatedAt: timestamp.toISOString(),
    status: 'running',
    user: 'Test User',
  };

  const filePath = path.join(conversationDir, 'conversation.json');
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');

  return conversation;
}

/**
 * Helper: Create corrupted conversation file
 */
async function createCorruptedConversation(conversationId: string): Promise<void> {
  const conversationDir = path.join(TEST_DATA_DIR, conversationId);
  await fs.mkdir(conversationDir, { recursive: true });
  await fs.writeFile(
    path.join(conversationDir, 'conversation.json'),
    'invalid json {{{',
    'utf-8'
  );
}

/**
 * Helper: Clean up test data
 */
async function cleanupTestData(): Promise<void> {
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe('Conversation List API - Critical Tests', () => {
  beforeAll(() => {
    // Override OUTPUT_PATH for testing
    Object.defineProperty(env, 'OUTPUT_PATH', {
      get: () => TEST_DATA_DIR,
      configurable: true,
    });
  });

  beforeEach(async () => {
    await cleanupTestData();
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await buildConversationIndex();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  /**
   * Test 1: Security vulnerability - Browser ID verification
   * AC-10.3-6: Browser ID must be verified before deletion
   * CRITICAL: Prevents unauthorized access to other users' conversations
   */
  it('should block deletion of conversations from other browsers', async () => {
    const conversationId = 'conv-security-test';
    await createTestConversation(conversationId, 'browser-123');
    await buildConversationIndex();

    // Attempt to delete with wrong browser ID
    const success = await deleteConversation(conversationId, 'wrong-browser-id');

    expect(success).toBe(false);

    // Verify conversation NOT deleted (folder still exists)
    const exists = await fs
      .access(path.join(TEST_DATA_DIR, conversationId))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  /**
   * Test 2: Core business logic - Browser ID filtering
   * AC-10.3-1: Must only return conversations for the specified browser
   * CRITICAL: Prevents cross-browser data leakage (security + privacy)
   */
  it('should only return conversations for the specified browser ID', async () => {
    // Create conversations for different browsers
    await createTestConversation('conv-browser-1', 'browser-123');
    await createTestConversation('conv-browser-2', 'browser-123');
    await createTestConversation('conv-browser-3', 'browser-456');
    await createTestConversation('conv-browser-4', 'browser-789');

    const conversations = await loadConversationsForBrowser('browser-123');

    // Should only return conversations for browser-123
    expect(conversations).toHaveLength(2);
    expect(conversations.every(c => c.browserId === 'browser-123')).toBe(true);
    expect(conversations.find(c => c.id === 'conv-browser-1')).toBeDefined();
    expect(conversations.find(c => c.id === 'conv-browser-2')).toBeDefined();
  });

  /**
   * Test 3: Error resilience - Corrupted conversation files
   * CRITICAL: System must remain operational when data is corrupted
   * Prevents cascading failures from bad data
   */
  it('should skip corrupted conversation files and return valid conversations', async () => {
    const browserId = 'browser-123';

    // Create valid conversation
    await createTestConversation('valid-conv', browserId);

    // Create corrupted conversation (invalid JSON)
    await createCorruptedConversation('corrupted-conv');

    const conversations = await loadConversationsForBrowser(browserId);

    // Should only return valid conversation, skip corrupted
    expect(conversations).toHaveLength(1);
    expect(conversations[0].id).toBe('valid-conv');
  });
});
