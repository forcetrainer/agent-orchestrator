/**
 * Message interface for chat system
 * Story 3.2 - Task 1.1
 * Story 3.5 - Extended with id, timestamp (Date), and functionCalls
 * Story 3.8 - Extended with 'error' role
 * Story 3.10 - 'system' role used for agent initialization greetings
 * Epic 3 Optimization - Extended with 'tool' role and tool_call_id for function call persistence
 *
 * Defines the structure of messages in the conversation
 * id: string - Unique message identifier
 * role: 'user' | 'assistant' | 'system' | 'error' | 'tool' - Sender identification
 *   - user: Messages from the end user
 *   - assistant: Messages from the AI agent
 *   - system: System messages (agent greetings, initialization)
 *   - error: Error messages displayed to user
 *   - tool: Function call result messages (for OpenAI conversation persistence)
 * content: string - Message text content (plain text in Story 3.2, markdown in Story 3.3)
 * timestamp: Date (optional) - Message creation timestamp
 * functionCalls: any[] (optional) - Agent function call data (tool_calls from OpenAI)
 * toolCallId: string (optional) - Tool call ID for tool response messages
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error' | 'tool';
  content: string;
  timestamp?: Date;
  functionCalls?: any[];
  toolCallId?: string;
}
