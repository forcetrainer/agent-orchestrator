export * from './api'

/**
 * File system node representation for list_files operations.
 * Represents files and directories with metadata.
 */
export interface FileNode {
  /** File or directory name (not full path) */
  name: string;
  /** Relative path from the search root */
  path: string;
  /** Type of node: file or directory */
  type: 'file' | 'directory';
  /** Size in bytes (only present for files) */
  size?: number;
  /** Child nodes (only present for directories when recursive=true) */
  children?: FileNode[];
}

/**
 * Agent metadata representation for discovered agents.
 * Contains essential information about an agent without loading full instructions.
 */
export interface Agent {
  /** Agent identifier extracted from <agent id="..."> XML attribute */
  id: string;
  /** Agent name extracted from <agent name="..."> XML attribute */
  name: string;
  /** Agent title/role extracted from <agent title="..."> XML attribute */
  title: string;
  /** Optional agent description extracted from <persona><role> content */
  description?: string;
  /** Optional emoji icon extracted from <agent icon="..."> XML attribute */
  icon?: string;
  /** Absolute path to agent directory */
  path: string;
  /** Full path to agent markdown file */
  mainFile: string;
  /** Full content of the agent markdown file for LLM system message */
  fullContent: string;
  /** Absolute path to bundle root directory (for bundle-based agents) */
  bundlePath?: string;
  /** Bundle name (for bundle-based agents) */
  bundleName?: string;
}

/**
 * Function call structure from OpenAI function calling.
 * Represents a tool call request from the LLM.
 */
export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}

/**
 * Message in a conversation.
 * Represents a single message from user, assistant, or system.
 */
export interface Message {
  /** Unique message identifier (UUID) */
  id: string;
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system' | 'error';
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: Date;
  /** Optional function calls made in this message */
  functionCalls?: FunctionCall[];
}

/**
 * Conversation containing multiple messages.
 * Tracks conversation state with timestamps.
 */
export interface Conversation {
  /** Unique conversation identifier (UUID) */
  id: string;
  /** Agent ID associated with this conversation */
  agentId: string;
  /** Array of messages in chronological order */
  messages: Message[];
  /** Conversation creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Story 6.3: Session ID for file-based session manifest (if created) */
  sessionId?: string;
}
