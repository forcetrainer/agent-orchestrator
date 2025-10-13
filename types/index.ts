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
 * Represents a single message from user, assistant, system, or tool.
 * Story 9.4: Extended with 'tool' role for function call persistence
 */
export interface Message {
  /** Unique message identifier (UUID) */
  id: string;
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system' | 'error' | 'tool';
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: Date | undefined;
  /** Optional function calls made in this message */
  functionCalls?: FunctionCall[];
  /** Tool call ID for tool response messages (Story 9.4) */
  toolCallId?: string;
}

/**
 * Cached context for conversation performance optimization.
 * Stores system prompt and critical actions to avoid rebuilding on every message.
 */
export interface CachedContext {
  /** Pre-built system prompt content */
  systemPrompt: string;
  /** Critical context messages (from critical actions processor) */
  criticalMessages: Array<any>; // ChatCompletionMessageParam[]
  /** Bundle configuration from critical actions */
  bundleConfig: Record<string, any> | null;
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
  /** Session folder path for workflow outputs (persisted across requests) */
  sessionFolder?: string;
  /** Performance Optimization: Cached context to avoid rebuilding on every message */
  cachedContext?: CachedContext;
}

/**
 * Serialized message for persistence (Story 10.0)
 * Uses ISO 8601 date strings instead of Date objects for JSON serialization
 */
export interface SerializedMessage {
  /** Unique message identifier (UUID) */
  id: string;
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system' | 'error' | 'tool';
  /** Message content */
  content: string;
  /** Message timestamp in ISO 8601 format */
  timestamp: string;
  /** Optional function calls made in this message */
  functionCalls?: FunctionCall[];
  /** Tool call ID for tool response messages */
  toolCallId?: string;
}

/**
 * Unified conversation type for Epic 10 persistence (Story 10.0)
 * Merges Conversation (messages) + SessionManifest (metadata)
 *
 * Key principle: conversationId === sessionId (1:1 relationship)
 * All conversation artifacts stored in data/conversations/{id}/
 */
export interface PersistedConversation {
  // Identity (conversationId === sessionId)
  /** Unique conversation/session identifier (UUID) */
  id: string;
  /** Browser identifier for Epic 10 browser tracking (Story 10.2) */
  browserId: string | null;

  // Agent context
  /** Agent ID associated with this conversation */
  agentId: string;
  /** Agent title/role */
  agentTitle: string;
  /** Agent bundle name (e.g., 'chat', 'workflow') */
  agentBundle: string;

  // Message history (Epic 10 persistence)
  /** Array of serialized messages with ISO date strings */
  messages: SerializedMessage[];

  // Metadata (from SessionManifest)
  /** First user message preview (truncated to 35 chars) */
  userSummary: string;
  /** Total number of messages in the conversation */
  messageCount: number;
  /** Cached UI display name: "{smartTimestamp} - {summary}" */
  displayName: string;
  /** Cached smart timestamp for UI sorting/grouping */
  displayTimestamp: string;

  // Folder reference
  /** Relative folder path: "conversations/{id}" */
  folderPath: string;

  // Timestamps (ISO 8601 strings for safe serialization)
  /** Conversation creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;

  // Execution metadata
  /** Execution status */
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  /** User who initiated conversation */
  user: string;
}

/**
 * File reference attachment for drag-drop functionality.
 * Story 6.6: Represents a file that has been attached to a message.
 */
export interface FileReference {
  /** Absolute file path */
  filepath: string;
  /** Display name of the file */
  filename: string;
}
