/**
 * Test suite for conversation persistence (Story 10.1 + Story 10.2)
 *
 * Story 10.1 - AC-10.1-1 through AC-10.1-6:
 * - Persistence to disk on every message
 * - Metadata indexing on startup
 * - Read-through cache implementation
 * - Atomic writes with temp files
 * - ISO 8601 date serialization
 * - Debounced writes
 *
 * Story 10.2 - AC-10.2-4:
 * - Browser ID association with conversations
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  getConversation,
  getConversationAsync,
  addMessage,
  clearAllConversations,
  initializeConversationPersistence,
  buildConversationIndex,
  getConversationMetadata,
  getAllConversationMetadata,
  deleteConversation,
  flushConversation,
} from '../utils/conversations';
import { Conversation, Message, PersistedConversation } from '@/types';
import { env } from '../utils/env';

const TEST_OUTPUT_PATH = path.join(process.cwd(), 'data', 'conversations-test');

// Helper to wait for debounced writes
const waitForDebounce = () => new Promise(resolve => setTimeout(resolve, 600));

describe('Conversation Persistence (Story 10.1)', () => {
  beforeAll(() => {
    // Override OUTPUT_PATH for testing
    Object.defineProperty(env, 'OUTPUT_PATH', {
      get: () => TEST_OUTPUT_PATH,
      configurable: true,
    });
  });

  beforeEach(async () => {
    // Clear test directory
    await fs.rm(TEST_OUTPUT_PATH, { recursive: true, force: true });
    await fs.mkdir(TEST_OUTPUT_PATH, { recursive: true });

    // Clear in-memory state
    clearAllConversations();
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(TEST_OUTPUT_PATH, { recursive: true, force: true });
  });

  describe('AC-10.1-1: Conversations saved to disk on every message', () => {
    it('should persist conversation to disk after adding a message', async () => {
      // Create conversation and add message
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, {
        role: 'user',
        content: 'Hello, world!',
      });

      // Wait for debounced write to complete
      await waitForDebounce();

      // Verify file exists
      const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).toBe(true);

      // Verify file contains message
      const data = await fs.readFile(filePath, 'utf-8');
      const persisted: PersistedConversation = JSON.parse(data);

      expect(persisted.id).toBe(conversation.id);
      expect(persisted.messages).toHaveLength(1);
      expect(persisted.messages[0].content).toBe('Hello, world!');
      expect(persisted.messages[0].role).toBe('user');
    });

    it('should persist multiple messages correctly', async () => {
      const conversation = getConversation(undefined, 'test-agent');

      addMessage(conversation.id, { role: 'user', content: 'Message 1' });
      addMessage(conversation.id, { role: 'assistant', content: 'Message 2' });
      addMessage(conversation.id, { role: 'user', content: 'Message 3' });

      // Advance timers to trigger write
      await waitForDebounce();

      const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
      const data = await fs.readFile(filePath, 'utf-8');
      const persisted: PersistedConversation = JSON.parse(data);

      expect(persisted.messages).toHaveLength(3);
      expect(persisted.messages.map(m => m.content)).toEqual([
        'Message 1',
        'Message 2',
        'Message 3',
      ]);
    });
  });

  describe('AC-10.1-2: Metadata indexing on server startup', () => {
    it('should build metadata index without loading full message arrays', async () => {
      // Create multiple conversations on disk
      const conv1 = getConversation(undefined, 'agent-1');
      const conv2 = getConversation(undefined, 'agent-2');

      addMessage(conv1.id, { role: 'user', content: 'Conv 1 message' });
      addMessage(conv2.id, { role: 'user', content: 'Conv 2 message' });

      await waitForDebounce();

      // Clear in-memory cache
      clearAllConversations();

      // Build index
      const startTime = Date.now();
      await buildConversationIndex();
      const elapsedMs = Date.now() - startTime;

      // Verify index built quickly (should be <100ms even for many conversations)
      expect(elapsedMs).toBeLessThan(100);

      // Verify metadata available
      const metadata = getAllConversationMetadata();
      expect(metadata).toHaveLength(2);

      const meta1 = getConversationMetadata(conv1.id);
      expect(meta1).toBeDefined();
      expect(meta1?.id).toBe(conv1.id);
      expect(meta1?.agentId).toBe('agent-1');
      expect(meta1?.messageCount).toBe(1);
      // Verify messages NOT in metadata
      expect((meta1 as any).messages).toBeUndefined();
    });

    it('should skip invalid conversation directories', async () => {
      // Create valid conversation
      const conv = getConversation(undefined, 'test-agent');
      addMessage(conv.id, { role: 'user', content: 'Valid message' });
      await waitForDebounce();

      // Create invalid directory (no conversation.json)
      await fs.mkdir(path.join(TEST_OUTPUT_PATH, 'invalid-dir'), { recursive: true });

      // Build index should not fail
      await expect(buildConversationIndex()).resolves.not.toThrow();

      // Should only index valid conversation
      const metadata = getAllConversationMetadata();
      expect(metadata).toHaveLength(1);
      expect(metadata[0].id).toBe(conv.id);
    });
  });

  describe('AC-10.1-3: Read-through cache implementation', () => {
    it('should load conversation from disk on cache miss', async () => {
      // Create and persist conversation
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, { role: 'user', content: 'Cached message' });
      await waitForDebounce();

      // Clear in-memory cache
      clearAllConversations();

      // Load conversation (should trigger disk read)
      const loaded = await getConversationAsync(conversation.id, 'test-agent');

      expect(loaded.id).toBe(conversation.id);
      expect(loaded.messages).toHaveLength(1);
      expect(loaded.messages[0].content).toBe('Cached message');
    });

    it('should use cache on subsequent access', async () => {
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, { role: 'user', content: 'Cached message' });
      await waitForDebounce();

      clearAllConversations();

      // First access - loads from disk
      const loaded1 = await getConversationAsync(conversation.id, 'test-agent');

      // Second access - should use cache (verify by checking reference equality)
      const loaded2 = await getConversationAsync(conversation.id, 'test-agent');

      expect(loaded1).toBe(loaded2); // Same object reference
    });

    it('should create new conversation if not found on disk', async () => {
      const nonExistentId = 'non-existent-id';
      const loaded = await getConversationAsync(nonExistentId, 'test-agent');

      expect(loaded.id).toBe(nonExistentId);
      expect(loaded.messages).toHaveLength(0);
      expect(loaded.agentId).toBe('test-agent');
    });
  });

  describe('AC-10.1-4: Atomic writes with temp files', () => {
    it('should write to temp file first, then rename', async () => {
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, { role: 'user', content: 'Test message' });

      // Manually flush to observe atomic write
      await flushConversation(conversation.id);

      const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
      const tempPath = `${filePath}.tmp`;

      // After successful write, temp file should be gone
      const tempExists = await fs
        .access(tempPath)
        .then(() => true)
        .catch(() => false);
      expect(tempExists).toBe(false);

      // Main file should exist
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should clean up temp files on startup', async () => {
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, { role: 'user', content: 'Test' });
      await flushConversation(conversation.id);

      // Manually create an orphaned temp file
      const tempPath = path.join(
        TEST_OUTPUT_PATH,
        conversation.id,
        'conversation.json.tmp'
      );
      await fs.writeFile(tempPath, '{"orphaned": true}', 'utf-8');

      // Initialize persistence (should clean temp files)
      await initializeConversationPersistence();

      // Temp file should be removed
      const tempExists = await fs
        .access(tempPath)
        .then(() => true)
        .catch(() => false);
      expect(tempExists).toBe(false);
    });
  });

  describe('AC-10.1-5: ISO 8601 date serialization', () => {
    it('should serialize all timestamps as ISO 8601 strings', async () => {
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, { role: 'user', content: 'Test message' });

      await flushConversation(conversation.id);

      // Read raw JSON
      const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
      const data = await fs.readFile(filePath, 'utf-8');
      const persisted: PersistedConversation = JSON.parse(data);

      // Verify ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      expect(persisted.createdAt).toMatch(isoRegex);
      expect(persisted.updatedAt).toMatch(isoRegex);
      expect(persisted.messages[0].timestamp).toMatch(isoRegex);

      // Verify dates are valid
      expect(new Date(persisted.createdAt).getTime()).toBeGreaterThan(0);
      expect(new Date(persisted.messages[0].timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should deserialize ISO strings back to Date objects', async () => {
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, { role: 'user', content: 'Test' });
      await flushConversation(conversation.id);

      clearAllConversations();

      // Load conversation
      const loaded = await getConversationAsync(conversation.id, 'test-agent');

      // Verify Date objects
      expect(loaded.createdAt).toBeInstanceOf(Date);
      expect(loaded.updatedAt).toBeInstanceOf(Date);
      expect(loaded.messages[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('AC-10.1-6: Debounced writes reduce disk I/O', () => {
    it('should debounce multiple rapid writes to single write', async () => {
      const conversation = getConversation(undefined, 'test-agent');

      // Add 3 rapid messages
      addMessage(conversation.id, { role: 'user', content: 'Message 1' });
      addMessage(conversation.id, { role: 'assistant', content: 'Message 2' });
      addMessage(conversation.id, { role: 'user', content: 'Message 3' });

      // Wait less than debounce delay
      await new Promise(resolve => setTimeout(resolve, 400));

      // File should not exist yet
      const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
      let fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(false);

      // Wait for remaining debounce time (200ms more for 600ms total)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Now file should exist
      fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Verify all messages persisted
      const data = await fs.readFile(filePath, 'utf-8');
      const persisted: PersistedConversation = JSON.parse(data);
      expect(persisted.messages).toHaveLength(3);
    });

    it('should reset debounce timer on each new message', async () => {
      const conversation = getConversation(undefined, 'test-agent');

      addMessage(conversation.id, { role: 'user', content: 'Message 1' });
      await new Promise(resolve => setTimeout(resolve, 300));

      addMessage(conversation.id, { role: 'user', content: 'Message 2' });
      await new Promise(resolve => setTimeout(resolve, 300));

      // Still no write (timer reset)
      const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
      let fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(false);

      // Wait 300ms more (600ms since last message)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Now should be written
      fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should allow immediate flush for critical operations', async () => {
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, { role: 'user', content: 'Critical message' });

      // Immediately flush without waiting for debounce
      await flushConversation(conversation.id);

      // File should exist immediately
      const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('Integration: Server restart recovery', () => {
    it('should restore conversations after server restart', async () => {
      // Simulate active session
      const conv1 = getConversation(undefined, 'agent-1');
      const conv2 = getConversation(undefined, 'agent-2');

      addMessage(conv1.id, { role: 'user', content: 'Conv 1 - Msg 1' });
      addMessage(conv1.id, { role: 'assistant', content: 'Conv 1 - Msg 2' });
      addMessage(conv2.id, { role: 'user', content: 'Conv 2 - Msg 1' });

      await waitForDebounce();

      // Simulate server restart (clear memory)
      clearAllConversations();

      // Initialize persistence (like server startup)
      await initializeConversationPersistence();

      // Verify metadata indexed
      const metadata = getAllConversationMetadata();
      expect(metadata).toHaveLength(2);

      // Lazy load conversations
      const loaded1 = await getConversationAsync(conv1.id, 'agent-1');
      const loaded2 = await getConversationAsync(conv2.id, 'agent-2');

      // Verify full message history restored
      expect(loaded1.messages).toHaveLength(2);
      expect(loaded1.messages[0].content).toBe('Conv 1 - Msg 1');
      expect(loaded1.messages[1].content).toBe('Conv 1 - Msg 2');

      expect(loaded2.messages).toHaveLength(1);
      expect(loaded2.messages[0].content).toBe('Conv 2 - Msg 1');
    });
  });

  describe('Additional functionality', () => {
    it('should delete conversation from disk and cache', async () => {
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, { role: 'user', content: 'Test' });
      await flushConversation(conversation.id);

      // Delete conversation
      await deleteConversation(conversation.id);

      // Verify removed from cache
      const metadata = getConversationMetadata(conversation.id);
      expect(metadata).toBeUndefined();

      // Verify removed from disk
      const conversationDir = path.join(TEST_OUTPUT_PATH, conversation.id);
      const dirExists = await fs
        .access(conversationDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(false);
    });

    it('should populate userSummary from first user message', async () => {
      const conversation = getConversation(undefined, 'test-agent');
      addMessage(conversation.id, {
        role: 'user',
        content: 'This is a very long user message that should be truncated to 35 characters',
      });
      await flushConversation(conversation.id);

      const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
      const data = await fs.readFile(filePath, 'utf-8');
      const persisted: PersistedConversation = JSON.parse(data);

      expect(persisted.userSummary).toHaveLength(35);
      expect(persisted.userSummary).toBe('This is a very long user message th');
    });
  });

  describe('Story 10.2: Browser ID Integration', () => {
    describe('AC-10.2-4: Conversations associated with browser ID', () => {
      it('should set browserId when creating new conversation', () => {
        const testBrowserId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
        const conversation = getConversation(undefined, 'test-agent', testBrowserId);

        expect(conversation.browserId).toBe(testBrowserId);
      });

      it('should persist browserId to conversation.json', async () => {
        const testBrowserId = 'test-browser-id-123';
        const conversation = getConversation(undefined, 'test-agent', testBrowserId);

        addMessage(conversation.id, { role: 'user', content: 'Test message' });
        await flushConversation(conversation.id);

        // Read from disk
        const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const persisted: PersistedConversation = JSON.parse(data);

        expect(persisted.browserId).toBe(testBrowserId);
      });

      it('should restore browserId when loading from disk', async () => {
        const testBrowserId = 'restored-browser-id';
        const conversation = getConversation(undefined, 'test-agent', testBrowserId);

        addMessage(conversation.id, { role: 'user', content: 'Test' });
        await flushConversation(conversation.id);

        // Clear cache
        clearAllConversations();

        // Load from disk
        const loaded = await getConversationAsync(conversation.id, 'test-agent');

        expect(loaded.browserId).toBe(testBrowserId);
      });

      it('should handle null browserId for legacy conversations', async () => {
        const conversation = getConversation(undefined, 'test-agent');

        addMessage(conversation.id, { role: 'user', content: 'Legacy conversation' });
        await flushConversation(conversation.id);

        // Read persisted data
        const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const persisted: PersistedConversation = JSON.parse(data);

        // Should be null if no browserId provided
        expect(persisted.browserId).toBeNull();
      });

      it('should support async conversation creation with browserId', async () => {
        const testBrowserId = 'async-browser-id';
        const conversation = await getConversationAsync(undefined, 'test-agent', testBrowserId);

        expect(conversation.browserId).toBe(testBrowserId);
      });

      it('should maintain browserId across multiple messages', async () => {
        const testBrowserId = 'persistent-browser-id';
        const conversation = getConversation(undefined, 'test-agent', testBrowserId);

        addMessage(conversation.id, { role: 'user', content: 'Message 1' });
        addMessage(conversation.id, { role: 'assistant', content: 'Message 2' });
        addMessage(conversation.id, { role: 'user', content: 'Message 3' });

        await flushConversation(conversation.id);

        // Read from disk
        const filePath = path.join(TEST_OUTPUT_PATH, conversation.id, 'conversation.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const persisted: PersistedConversation = JSON.parse(data);

        expect(persisted.browserId).toBe(testBrowserId);
        expect(persisted.messages).toHaveLength(3);
      });

      it('should index browserId in metadata', async () => {
        const testBrowserId = 'indexed-browser-id';
        const conversation = getConversation(undefined, 'test-agent', testBrowserId);

        addMessage(conversation.id, { role: 'user', content: 'Test' });
        await flushConversation(conversation.id);

        // Clear cache and rebuild index
        clearAllConversations();
        await buildConversationIndex();

        // Check metadata
        const metadata = getConversationMetadata(conversation.id);
        expect(metadata?.browserId).toBe(testBrowserId);
      });

      it('should allow filtering conversations by browserId (future use case)', async () => {
        const browserId1 = 'browser-1';
        const browserId2 = 'browser-2';

        const conv1 = getConversation(undefined, 'agent-1', browserId1);
        const conv2 = getConversation(undefined, 'agent-2', browserId1);
        const conv3 = getConversation(undefined, 'agent-1', browserId2);

        addMessage(conv1.id, { role: 'user', content: 'Conv 1' });
        addMessage(conv2.id, { role: 'user', content: 'Conv 2' });
        addMessage(conv3.id, { role: 'user', content: 'Conv 3' });

        await waitForDebounce();

        // Clear and rebuild index
        clearAllConversations();
        await buildConversationIndex();

        const allMetadata = getAllConversationMetadata();

        // Filter by browserId
        const browser1Convs = allMetadata.filter(m => m.browserId === browserId1);
        const browser2Convs = allMetadata.filter(m => m.browserId === browserId2);

        expect(browser1Convs).toHaveLength(2);
        expect(browser2Convs).toHaveLength(1);
        expect(browser1Convs.map(m => m.id)).toEqual(
          expect.arrayContaining([conv1.id, conv2.id])
        );
      });
    });
  });
});
