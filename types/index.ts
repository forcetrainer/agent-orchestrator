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
