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
  /** Agent identifier (directory name) */
  id: string;
  /** Agent name extracted from agent.md heading */
  name: string;
  /** Agent description extracted from agent.md blockquote */
  description: string;
  /** Absolute path to agent directory */
  path: string;
  /** Full path to agent.md file */
  mainFile: string;
}
