/**
 * File Operation Tools for Agentic Execution
 *
 * Provides file operation tools that work within the agentic execution loop.
 * All tools resolve path variables before execution and return results
 * compatible with OpenAI tool calling format.
 *
 * Tools:
 * - read_file: Read files from bundle or core BMAD system
 * - save_output: Save generated content to file
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve, sep, basename } from 'path';
import { resolvePath, PathContext, validateWritePath } from '@/lib/pathResolver';
import { validateFilename } from '@/lib/files/filenameValidator';

/**
 * Standard result format for all file operation tools
 * Compatible with agentic loop context injection
 */
export interface ToolResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Resolved file path (for debugging and visibility) */
  path?: string;
  /** File content (for read operations) */
  content?: string;
  /** Content/file size in characters/bytes */
  size?: number;
  /** Error message (if success: false) */
  error?: string;
  /** Additional tool-specific data */
  [key: string]: any;
}

/**
 * Parameters for read_file tool
 */
export interface ReadFileParams {
  /** Path to file. Can use variables: {bundle-root}, {core-root}, {project-root}, {config_source}:var */
  file_path: string;
}

/**
 * Parameters for save_output tool
 */
export interface SaveOutputParams {
  /** Path to save file. Can use variables: {bundle-root}, {core-root}, {project-root}, {config_source}:var */
  file_path: string;
  /** Content to write to file */
  content: string;
}

/**
 * Read File Tool
 *
 * Reads a file from the bundle or core BMAD system. Resolves path variables
 * before reading. Returns file content and metadata.
 *
 * @param params - File path (can contain variables)
 * @param context - PathContext with bundleRoot, coreRoot, projectRoot, bundleConfig
 * @returns ToolResult with success, path, content, size, or error
 */
export async function executeReadFile(
  params: ReadFileParams,
  context: PathContext
): Promise<ToolResult> {
  let resolvedPath: string | undefined;

  try {
    // Resolve path variables (includes security validation)
    resolvedPath = resolvePath(params.file_path, context);

    // Read file content
    const content = await readFile(resolvedPath, 'utf-8');

    return {
      success: true,
      path: resolvedPath,
      content: content,
      size: content.length,
    };
  } catch (error: any) {
    // Distinguish between file not found and other errors
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: `File not found: ${params.file_path}`,
        path: resolvedPath || params.file_path,
      };
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      return {
        success: false,
        error: `Permission denied: ${params.file_path}`,
        path: resolvedPath || params.file_path,
      };
    } else if (error.message?.includes('Security violation')) {
      // Security violations from path resolution
      return {
        success: false,
        error: error.message,
        path: params.file_path,
      };
    } else {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`,
        path: resolvedPath || params.file_path,
      };
    }
  }
}

/**
 * Save Output Tool
 *
 * Saves generated content to a file. Resolves path variables before writing.
 * Automatically creates parent directories if they don't exist.
 *
 * @param params - File path and content
 * @param context - PathContext with bundleRoot, coreRoot, projectRoot, bundleConfig
 * @returns ToolResult with success, path, size, or error
 */
export async function executeSaveOutput(
  params: SaveOutputParams,
  context: PathContext
): Promise<ToolResult> {
  let resolvedPath: string | undefined;

  try {
    // Story 6.5: Validate filename before resolving path
    // Extract filename from path for validation
    const filename = basename(params.file_path);
    try {
      validateFilename(filename);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        path: params.file_path,
      };
    }

    // If session-folder is set and file_path is relative (doesn't start with { or /),
    // prepend session folder to ensure files save in session directory
    let filePathToResolve = params.file_path;
    const sessionFolder = context['session-folder'];
    console.log(`[save_output] DEBUG - session-folder: ${sessionFolder}, file_path: ${params.file_path}`);

    if (sessionFolder && !params.file_path.startsWith('{') && !params.file_path.startsWith('/')) {
      filePathToResolve = resolve(sessionFolder, params.file_path);
      console.log(`[save_output] Using session folder, filePathToResolve: ${filePathToResolve}`);
    }

    // Resolve path variables (includes security validation)
    // IMPORTANT: If sessionFolder was prepended, filePathToResolve is already an absolute path
    // resolvePath should handle it without modification since it has no variables
    console.log(`[save_output] Before resolvePath: ${filePathToResolve}`);
    resolvedPath = resolvePath(filePathToResolve, context);
    console.log(`[save_output] After resolvePath: ${resolvedPath}`);

    // Story 5.0: Validate write path is within /data/agent-outputs only
    try {
      validateWritePath(resolvedPath, context);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        path: resolvedPath,
      };
    }

    // Legacy check: if path is within core-root (read-only directory)
    const normalizedCoreRoot = resolve(context['core-root']);
    const normalizedPath = resolve(resolvedPath);
    const isInCore = normalizedPath.startsWith(normalizedCoreRoot + sep) || normalizedPath === normalizedCoreRoot;

    if (isInCore) {
      return {
        success: false,
        error: 'Write operation denied: Core files are read-only. Attempted to write to core-root directory.',
        path: resolvedPath,
      };
    }

    // Extract directory and create if doesn't exist
    const dir = dirname(resolvedPath);
    await mkdir(dir, { recursive: true });

    // Write file content
    await writeFile(resolvedPath, params.content, 'utf-8');

    return {
      success: true,
      path: resolvedPath,
      size: params.content.length,
    };
  } catch (error: any) {
    // Handle write errors
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return {
        success: false,
        error: `Permission denied: ${params.file_path}`,
        path: resolvedPath || params.file_path,
      };
    } else if (error.message?.includes('Security violation')) {
      // Security violations from path resolution
      return {
        success: false,
        error: error.message,
        path: params.file_path,
      };
    } else {
      return {
        success: false,
        error: `Failed to write file: ${error.message}`,
        path: resolvedPath || params.file_path,
      };
    }
  }
}

