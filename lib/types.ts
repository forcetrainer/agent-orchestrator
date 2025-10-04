/**
 * Message interface for chat system
 * Story 3.2 - Task 1.1
 *
 * Defines the structure of messages in the conversation
 * role: 'user' | 'assistant' | 'error' - Sender identification
 * content: string - Message text content (plain text in Story 3.2, markdown in Story 3.3)
 * timestamp: number (optional) - Unix timestamp for message creation (deferred for MVP)
 */
export interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp?: number;
}
