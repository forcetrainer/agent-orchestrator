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
 */
export interface ChatRequest {
  agentId: string;
  message: string;
  conversationId?: string;
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
