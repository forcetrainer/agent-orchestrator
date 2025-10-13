import { randomUUID } from 'crypto';
import { Conversation, Message, PersistedConversation, SerializedMessage } from '@/types';
import { log } from './logger';
import { env } from './env';
import { promises as fs } from 'fs';
import * as path from 'path';

// In-memory conversation storage (read-through cache)
const conversations = new Map<string, Conversation>();

// Metadata index (lightweight, loaded on startup)
const conversationMetadata = new Map<string, Omit<PersistedConversation, 'messages'>>();

// Debounce timers for write operations (per conversation)
const debouncedWriteTimers = new Map<string, NodeJS.Timeout>();

// Debounce delay in milliseconds
const DEBOUNCE_DELAY_MS = 500;

/**
 * Serializes a Message to SerializedMessage (Date → ISO string).
 * AC-10.1-5: Dates serialized as ISO 8601 strings
 */
function serializeMessage(message: Message): SerializedMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp?.toISOString() || new Date().toISOString(),
    functionCalls: message.functionCalls,
    toolCallId: message.toolCallId,
  };
}

/**
 * Deserializes a SerializedMessage to Message (ISO string → Date).
 * AC-10.1-5: Dates deserialized from ISO 8601 strings
 */
function deserializeMessage(serialized: SerializedMessage): Message {
  return {
    id: serialized.id,
    role: serialized.role,
    content: serialized.content,
    timestamp: new Date(serialized.timestamp),
    functionCalls: serialized.functionCalls,
    toolCallId: serialized.toolCallId,
  };
}

/**
 * Converts Conversation to PersistedConversation for disk storage.
 * AC-10.1-5: All Date objects converted to ISO 8601 strings
 */
function toPersistedConversation(conversation: Conversation): PersistedConversation {
  const firstUserMessage = conversation.messages.find(m => m.role === 'user');
  const userSummary = firstUserMessage
    ? firstUserMessage.content.slice(0, 35)
    : 'New conversation';

  // Generate display timestamp (smart relative time)
  const displayTimestamp = formatSmartTimestamp(conversation.createdAt);

  return {
    id: conversation.id,
    browserId: null, // Story 10.2 will populate this
    agentId: conversation.agentId,
    agentTitle: '', // Can be populated from agent metadata if available
    agentBundle: '', // Can be populated from agent metadata if available
    messages: conversation.messages.map(serializeMessage),
    userSummary,
    messageCount: conversation.messages.length,
    displayName: `${displayTimestamp} - ${userSummary}`,
    displayTimestamp,
    folderPath: `conversations/${conversation.id}`,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    status: 'running',
    user: 'Bryan', // TODO: Get from config/session in future stories
  };
}

/**
 * Converts PersistedConversation to Conversation for runtime use.
 * AC-10.1-5: All ISO strings converted back to Date objects
 */
function fromPersistedConversation(persisted: PersistedConversation): Conversation {
  return {
    id: persisted.id,
    agentId: persisted.agentId,
    messages: persisted.messages.map(deserializeMessage),
    createdAt: new Date(persisted.createdAt),
    updatedAt: new Date(persisted.updatedAt),
  };
}

/**
 * Formats a timestamp as a smart relative time string.
 * Examples: "Just now", "5m ago", "2h ago", "Yesterday", "Dec 10"
 */
function formatSmartTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as "Mon DD" or "Mon DD YYYY" if different year
  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Persists a conversation to disk with atomic write operation.
 * AC-10.1-4: Atomic writes with temp files prevent corruption
 *
 * @param conversationId - Conversation ID to persist
 */
async function persistConversationToDisk(conversationId: string): Promise<void> {
  try {
    const conversation = conversations.get(conversationId);
    if (!conversation) {
      log('ERROR', 'conversation:persist', {
        conversationId,
        error: 'Conversation not found in cache',
      });
      return;
    }

    const persisted = toPersistedConversation(conversation);
    const conversationDir = path.join(env.OUTPUT_PATH, conversationId);
    const filePath = path.join(conversationDir, 'conversation.json');
    const tempPath = `${filePath}.tmp`;

    // Ensure directory exists
    await fs.mkdir(conversationDir, { recursive: true });

    // Write to temp file first
    await fs.writeFile(tempPath, JSON.stringify(persisted, null, 2), 'utf-8');

    // Atomic rename (replaces old file)
    await fs.rename(tempPath, filePath);

    // Update metadata cache
    const { messages, ...metadata } = persisted;
    conversationMetadata.set(conversationId, metadata);

    log('INFO', 'conversation:persist', {
      conversationId,
      messageCount: conversation.messages.length,
      filePath,
    });
  } catch (error) {
    log('ERROR', 'conversation:persist', {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Clean up temp file on error
    const conversationDir = path.join(env.OUTPUT_PATH, conversationId);
    const filePath = path.join(conversationDir, 'conversation.json');
    const tempPath = `${filePath}.tmp`;
    await fs.unlink(tempPath).catch(() => {}); // Ignore cleanup errors
  }
}

/**
 * Schedules a debounced write for a conversation.
 * AC-10.1-6: Debounced writes (500ms) reduce disk I/O
 *
 * @param conversationId - Conversation ID to schedule write for
 */
function scheduleDebouncedWrite(conversationId: string): void {
  // Clear existing timer for this conversation
  const existingTimer = debouncedWriteTimers.get(conversationId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Schedule new write after debounce delay
  const timer = setTimeout(() => {
    persistConversationToDisk(conversationId);
    debouncedWriteTimers.delete(conversationId);
  }, DEBOUNCE_DELAY_MS);

  debouncedWriteTimers.set(conversationId, timer);
}

/**
 * Immediately flushes pending writes for a conversation.
 * Useful for critical operations that require immediate persistence.
 *
 * @param conversationId - Conversation ID to flush
 */
export async function flushConversation(conversationId: string): Promise<void> {
  const timer = debouncedWriteTimers.get(conversationId);
  if (timer) {
    clearTimeout(timer);
    debouncedWriteTimers.delete(conversationId);
  }
  await persistConversationToDisk(conversationId);
}

/**
 * Loads a conversation from disk.
 * AC-10.1-2: Lazy load full conversations on access
 *
 * @param conversationId - Conversation ID to load
 * @returns Loaded conversation, or null if not found
 */
async function loadConversationFromDisk(conversationId: string): Promise<Conversation | null> {
  try {
    const filePath = path.join(env.OUTPUT_PATH, conversationId, 'conversation.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const persisted: PersistedConversation = JSON.parse(data);
    const conversation = fromPersistedConversation(persisted);

    log('INFO', 'conversation:load', {
      conversationId,
      messageCount: conversation.messages.length,
      filePath,
    });

    return conversation;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist - not an error
      return null;
    }

    log('ERROR', 'conversation:load', {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Builds conversation metadata index on server startup.
 * AC-10.1-2: Conversation metadata indexed on server startup (lazy load full conversations)
 *
 * Loads only metadata (no message arrays) for fast startup.
 */
export async function buildConversationIndex(): Promise<void> {
  try {
    const startTime = Date.now();

    // Ensure output directory exists
    await fs.mkdir(env.OUTPUT_PATH, { recursive: true });

    const entries = await fs.readdir(env.OUTPUT_PATH, { withFileTypes: true });
    const conversationDirs = entries.filter(e => e.isDirectory());

    let loadedCount = 0;
    for (const dir of conversationDirs) {
      const conversationId = dir.name;
      const filePath = path.join(env.OUTPUT_PATH, conversationId, 'conversation.json');

      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const persisted: PersistedConversation = JSON.parse(data);

        // Store metadata only (exclude messages array)
        const { messages, ...metadata } = persisted;
        conversationMetadata.set(conversationId, metadata);
        loadedCount++;
      } catch (error) {
        // Skip invalid conversation directories
        continue;
      }
    }

    const elapsedMs = Date.now() - startTime;
    log('INFO', 'conversation:indexBuild', {
      count: loadedCount,
      elapsedMs,
    });
  } catch (error) {
    log('ERROR', 'conversation:indexBuild', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Retrieves an existing conversation by ID or creates a new one.
 * AC-10.1-3: Read-through cache (in-memory Map) implemented for performance
 *
 * @param conversationId - Optional conversation ID to retrieve
 * @param agentId - Agent ID for the conversation
 * @returns Existing or newly created Conversation
 */
export function getConversation(
  conversationId: string | undefined,
  agentId: string
): Conversation {
  // If conversationId provided and exists in cache, return it
  if (conversationId && conversations.has(conversationId)) {
    log('INFO', 'conversation:get:cache', {
      conversationId,
      agentId,
      messageCount: conversations.get(conversationId)!.messages.length,
    });
    return conversations.get(conversationId)!;
  }

  // AC-10.1-3: Read-through cache - check disk if not in memory
  if (conversationId) {
    // For sync compatibility, return new conversation if not in cache
    // Use getConversationAsync for proper lazy-loading
    log('INFO', 'conversation:get:miss', { conversationId, agentId });
  }

  // Create new conversation
  const newConversation: Conversation = {
    id: randomUUID(),
    agentId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  conversations.set(newConversation.id, newConversation);

  log('INFO', 'conversation:create', {
    conversationId: newConversation.id,
    agentId,
  });

  return newConversation;
}

/**
 * Async version of getConversation with full read-through cache support.
 * AC-10.1-3: Read-through cache implementation
 *
 * @param conversationId - Conversation ID to retrieve
 * @param agentId - Agent ID for the conversation
 * @returns Existing conversation from cache/disk, or newly created one
 */
export async function getConversationAsync(
  conversationId: string | undefined,
  agentId: string
): Promise<Conversation> {
  // Check in-memory cache first
  if (conversationId && conversations.has(conversationId)) {
    log('INFO', 'conversation:get:cache', {
      conversationId,
      agentId,
      messageCount: conversations.get(conversationId)!.messages.length,
    });
    return conversations.get(conversationId)!;
  }

  // AC-10.1-3: Lazy load from disk on cache miss
  if (conversationId) {
    const loaded = await loadConversationFromDisk(conversationId);
    if (loaded) {
      // Populate cache
      conversations.set(conversationId, loaded);
      log('INFO', 'conversation:get:disk', {
        conversationId,
        agentId,
        messageCount: loaded.messages.length,
      });
      return loaded;
    }
  }

  // Create new conversation if not found
  const newConversation: Conversation = {
    id: conversationId || randomUUID(),
    agentId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  conversations.set(newConversation.id, newConversation);

  log('INFO', 'conversation:create', {
    conversationId: newConversation.id,
    agentId,
  });

  return newConversation;
}

/**
 * Adds a message to a conversation and updates the conversation timestamp.
 * AC-10.1-1: Conversations saved on every message (debounced)
 *
 * @param conversationId - Conversation ID to add message to
 * @param message - Message data without id and timestamp
 * @returns The created Message with id and timestamp
 * @throws Error if conversation not found
 */
export function addMessage(
  conversationId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Message {
  const conversation = conversations.get(conversationId);

  if (!conversation) {
    const error = `Conversation not found: ${conversationId}`;
    log('ERROR', 'conversation:addMessage', { conversationId, error });
    throw new Error(error);
  }

  const newMessage: Message = {
    ...message,
    id: randomUUID(),
    timestamp: new Date(),
  };

  conversation.messages.push(newMessage);
  conversation.updatedAt = new Date();

  log('INFO', 'conversation:addMessage', {
    conversationId,
    messageId: newMessage.id,
    role: newMessage.role,
    messageCount: conversation.messages.length,
  });

  // AC-10.1-6: Schedule debounced write to reduce disk I/O
  scheduleDebouncedWrite(conversationId);

  return newMessage;
}

/**
 * Retrieves the message history for a conversation.
 *
 * @param conversationId - Conversation ID
 * @returns Array of messages, or empty array if conversation not found
 */
export function getConversationHistory(conversationId: string): Message[] {
  const conversation = conversations.get(conversationId);
  return conversation ? conversation.messages : [];
}

/**
 * Clears all conversations from memory.
 * Utility for testing and cache management.
 */
export function clearAllConversations(): void {
  const count = conversations.size;
  conversations.clear();
  conversationMetadata.clear();
  log('INFO', 'conversation:clearAll', { clearedCount: count });
}

/**
 * Retrieves metadata for a single conversation.
 *
 * @param conversationId - Conversation ID
 * @returns Conversation metadata without messages, or undefined if not found
 */
export function getConversationMetadata(
  conversationId: string
): Omit<PersistedConversation, 'messages'> | undefined {
  return conversationMetadata.get(conversationId);
}

/**
 * Retrieves metadata for all conversations.
 *
 * @returns Array of conversation metadata (without messages)
 */
export function getAllConversationMetadata(): Omit<PersistedConversation, 'messages'>[] {
  return Array.from(conversationMetadata.values());
}

/**
 * Deletes a conversation from disk and cache.
 *
 * @param conversationId - Conversation ID to delete
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    // Clear debounce timer if pending
    const timer = debouncedWriteTimers.get(conversationId);
    if (timer) {
      clearTimeout(timer);
      debouncedWriteTimers.delete(conversationId);
    }

    // Remove from caches
    conversations.delete(conversationId);
    conversationMetadata.delete(conversationId);

    // Delete from disk
    const conversationDir = path.join(env.OUTPUT_PATH, conversationId);
    await fs.rm(conversationDir, { recursive: true, force: true });

    log('INFO', 'conversation:delete', { conversationId });
  } catch (error) {
    log('ERROR', 'conversation:delete', {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Cleans up orphaned temporary files on server startup.
 * AC-10.1-4: Clean up temp files from incomplete writes
 */
async function cleanupTempFiles(): Promise<void> {
  try {
    const entries = await fs.readdir(env.OUTPUT_PATH, { withFileTypes: true });
    const conversationDirs = entries.filter(e => e.isDirectory());

    let cleanedCount = 0;
    for (const dir of conversationDirs) {
      const conversationId = dir.name;
      const conversationDir = path.join(env.OUTPUT_PATH, conversationId);
      const tempPath = path.join(conversationDir, 'conversation.json.tmp');

      try {
        await fs.access(tempPath);
        // Temp file exists - delete it
        await fs.unlink(tempPath);
        cleanedCount++;
        log('INFO', 'conversation:cleanupTemp', {
          conversationId,
          tempPath,
        });
      } catch {
        // No temp file - continue
      }
    }

    if (cleanedCount > 0) {
      log('INFO', 'conversation:cleanupComplete', { cleanedCount });
    }
  } catch (error) {
    log('ERROR', 'conversation:cleanupTemp', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Initializes the conversation persistence system on server startup.
 * AC-10.1-2: Build metadata index
 * AC-10.1-4: Clean up orphaned temp files
 *
 * Should be called once during server initialization.
 */
export async function initializeConversationPersistence(): Promise<void> {
  log('INFO', 'conversation:init', { status: 'starting' });

  await cleanupTempFiles();
  await buildConversationIndex();

  log('INFO', 'conversation:init', {
    status: 'complete',
    metadataCount: conversationMetadata.size,
  });
}
