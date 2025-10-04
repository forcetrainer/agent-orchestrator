/**
 * Message interface for chat system
 * Story 3.2 - Task 1.1
 * Story 3.5 - Extended with id, timestamp (Date), and functionCalls
 *
 * Defines the structure of messages in the conversation
 * id: string - Unique message identifier
 * role: 'user' | 'assistant' | 'system' - Sender identification (system for errors/info)
 * content: string - Message text content (plain text in Story 3.2, markdown in Story 3.3)
 * timestamp: Date (optional) - Message creation timestamp
 * functionCalls: any[] (optional) - Agent function call data
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  functionCalls?: any[];
}
