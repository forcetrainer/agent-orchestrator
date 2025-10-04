import { randomUUID } from 'crypto';
import { Conversation, Message } from '@/types';
import { log } from './logger';

// In-memory conversation storage
const conversations = new Map<string, Conversation>();

/**
 * Retrieves an existing conversation by ID or creates a new one.
 *
 * @param conversationId - Optional conversation ID to retrieve
 * @param agentId - Agent ID for the conversation
 * @returns Existing or newly created Conversation
 */
export function getConversation(
  conversationId: string | undefined,
  agentId: string
): Conversation {
  // If conversationId provided and exists, return it
  if (conversationId && conversations.has(conversationId)) {
    log('INFO', 'conversation:get', {
      conversationId,
      agentId,
      messageCount: conversations.get(conversationId)!.messages.length,
    });
    return conversations.get(conversationId)!;
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
 * Adds a message to a conversation and updates the conversation timestamp.
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
  log('INFO', 'conversation:clearAll', { clearedCount: count });
}
