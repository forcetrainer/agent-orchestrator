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
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  path: string;
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
