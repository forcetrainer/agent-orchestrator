// API Type Definitions for Agent Orchestrator
// Story 1.2: Create API Route Structure

/**
 * Standard API response wrapper for all endpoints
 * Provides consistent structure for success/error handling
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

/**
 * Chat request payload for POST /api/chat
 * Story 6.7: Added attachments field for file reference attachments
 */
export interface ChatRequest {
  agentId: string;
  message: string;
  conversationId?: string;
  attachments?: Array<{ filepath: string; filename: string }>;
}

/**
 * Chat response data for POST /api/chat
 */
export interface ChatResponse {
  conversationId: string;
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    functionCalls?: Array<{
      name: string;
      arguments: Record<string, any>;
      result?: any;
      error?: string;
    }>;
  };
}

/**
 * Agent model for GET /api/agents
 * Updated for Story 4.6: Bundle-based agent discovery
 * Includes bundle context (bundleName, bundlePath) for proper initialization
 */
export interface AgentSummary {
  id: string;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  bundleName: string;
  bundlePath: string;
  filePath: string;
}

/**
 * File tree node for GET /api/files
 * Supports recursive directory structures
 */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

/**
 * Function call structure from OpenAI function calling
 * Represents a tool call request from the LLM
 */
export interface FunctionCall {
  name: string;
  arguments: string; // JSON string of arguments
}

/**
 * Result of executing a function call
 */
export interface FunctionCallResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * File content response for GET /api/files/content
 * Story 5.3: Display File Contents
 */
export interface FileContentResponse {
  success: boolean;
  path: string;           // Echoed request path
  content: string;        // File contents (empty if binary)
  mimeType: string;       // Detected mime type
  size: number;           // File size in bytes
  modified: string;       // ISO 8601 timestamp
  isBinary?: boolean;     // True if cannot display as text
  truncated?: boolean;    // True if file was truncated
  error?: string;
}

/**
 * Lightweight conversation metadata for list view
 * Story 10.3: Conversation List API
 * Excludes full message content for performance
 */
export interface ConversationMetadata {
  id: string;
  agentId: string;
  agentName: string;               // Display name for UI
  agentTitle: string;              // Full title (e.g., "System Architect")
  agentIcon?: string;              // Optional emoji/icon
  lastMessage: string;             // Truncated preview
  messageCount: number;
  createdAt: string;               // ISO 8601 format
  updatedAt: string;               // ISO 8601 format
}

/**
 * Response for GET /api/conversations
 * Story 10.3: Conversation List API
 * Includes both flat list and grouped structure for frontend convenience
 */
export interface ConversationListResponse {
  conversations: ConversationMetadata[];
  groupedByAgent: Record<string, ConversationMetadata[]>;
}

/**
 * File metadata for conversation folder files
 * Story 10.3: Conversation List API
 */
export interface FileMetadata {
  name: string;                    // Filename (e.g., "output-001.md")
  path: string;                    // Relative path from project root
  size: number;                    // File size in bytes
  mimeType: string;                // MIME type (e.g., "text/markdown")
}

/**
 * Response for GET /api/conversations/:id/messages
 * Story 10.3: Conversation List API
 * Includes full conversation with messages and files
 */
export interface ConversationDetailResponse {
  // Identity
  id: string;
  browserId: string | null;

  // Agent context
  agentId: string;
  agentTitle: string;
  agentBundle: string;

  // Messages (serialized with ISO date strings)
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system' | 'error' | 'tool';
    content: string;
    timestamp: string;
    functionCalls?: Array<{
      name: string;
      arguments: Record<string, any>;
      result?: any;
      error?: string;
    }>;
    toolCallId?: string;
  }>;

  // Metadata
  userSummary: string;
  messageCount: number;
  displayName: string;
  displayTimestamp: string;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  user: string;

  // Files in conversation folder
  files: FileMetadata[];
}
