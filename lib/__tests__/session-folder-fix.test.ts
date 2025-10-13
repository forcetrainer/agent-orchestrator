/**
 * Test: Story 10.0 conversationId === sessionId enforcement
 * Bug Fix: Ensures conversation files and session files go to the same folder
 *
 * Issue: conversation.json was being written to one folder (based on conversationId)
 * while output.md was being written to another folder (based on sessionId)
 *
 * Fix: Pass conversationId to createChatSession() instead of generating new UUID
 */

import { createChatSession } from '@/lib/sessions/chatSessions';
import { getConversation } from '@/lib/utils/conversations';
import { randomUUID } from 'crypto';
import { rm, readFile } from 'fs/promises';
import { resolve } from 'path';

describe('Session Folder Fix - Story 10.0 conversationId === sessionId', () => {
  const conversationsFolder = resolve(process.cwd(), 'data/conversations');

  afterEach(async () => {
    // Clean up test conversations
    const testConversationIds = ['test-conversation-id-123'];
    for (const id of testConversationIds) {
      try {
        await rm(resolve(conversationsFolder, id), { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should create session folder using conversationId, not a separate sessionId', async () => {
    // Arrange: Create a conversation
    const testConversationId = 'test-conversation-id-123';
    const testAgentId = 'test-agent';
    const testBrowserId = randomUUID();

    const conversation = getConversation(testConversationId, testAgentId, testBrowserId);

    // Act: Create chat session (simulating first message in route.ts)
    const { sessionId, sessionFolder } = await createChatSession(
      conversation.id, // Pass conversationId (Story 10.0 fix)
      testAgentId,
      'Test Agent',
      'Hello, test message',
      'TestUser'
    );

    // Assert: sessionId should equal conversationId
    expect(sessionId).toBe(conversation.id);
    expect(sessionFolder).toContain(conversation.id);
    expect(sessionFolder).not.toContain('undefined');

    // Verify manifest exists in the conversation folder
    const manifestPath = resolve(sessionFolder, 'manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.session_id).toBe(conversation.id);
    expect(manifest.session_id).toBe(sessionId);
  });

  it('should ensure conversation.json and manifest.json are in the same folder', async () => {
    // This test verifies that the bug is fixed:
    // Before fix: conversation.json in folder A, manifest.json (and output.md) in folder B
    // After fix: conversation.json and manifest.json in the same folder

    const testConversationId = 'test-conversation-id-123';
    const testAgentId = 'test-agent';
    const testBrowserId = randomUUID();

    // Create conversation
    const conversation = getConversation(testConversationId, testAgentId, testBrowserId);

    // Create session
    const { sessionFolder } = await createChatSession(
      conversation.id,
      testAgentId,
      'Test Agent',
      'Test message',
      'TestUser'
    );

    // Both files should be in the same folder
    const expectedFolder = resolve(conversationsFolder, conversation.id);
    expect(sessionFolder).toBe(expectedFolder);

    // conversation.json will be created by the persistence layer
    // manifest.json is created by createChatSession
    const manifestPath = resolve(expectedFolder, 'manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    expect(manifestContent).toBeTruthy();
  });
});
