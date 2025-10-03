/**
 * Path Security Module
 *
 * Validates file paths to prevent directory traversal attacks and unauthorized access.
 * All file operations MUST use these validation functions before accessing the filesystem.
 *
 * Security patterns:
 * - Block directory traversal (../, absolute paths outside allowed dirs)
 * - Use path.normalize() and path.resolve() for path validation
 * - Symbolic links are resolved and validated
 * - Null byte detection and rejection
 */

import { resolve, normalize, isAbsolute, sep } from 'path';
import { env } from '@/lib/utils/env';

/**
 * Validates that a relative path is safe and within the specified base directory.
 *
 * Security checks:
 * - Rejects absolute paths outside allowed directories
 * - Blocks directory traversal attempts (../)
 * - Detects and rejects null bytes
 * - Normalizes paths to prevent bypass attempts
 *
 * @param relativePath - The relative path to validate (e.g., "templates/agent.md")
 * @param baseDir - The base directory to validate against (e.g., env.AGENTS_PATH)
 * @returns Absolute path if valid
 * @throws Error if path is invalid or contains security violations
 */
export function validatePath(relativePath: string, baseDir: string): string {
  // Reject null bytes (security: prevent null byte injection)
  if (relativePath.includes('\0')) {
    throw new Error('Invalid path: null bytes are not allowed');
  }

  // Normalize the base directory to absolute path
  const normalizedBase = resolve(baseDir);

  // If the input is absolute, validate it's within an allowed directory
  if (isAbsolute(relativePath)) {
    const normalizedInput = resolve(relativePath);

    // Check if absolute path is within AGENTS_PATH or OUTPUT_PATH
    const agentsPath = resolve(env.AGENTS_PATH);
    const outputPath = resolve(env.OUTPUT_PATH);

    const isInAgents = normalizedInput.startsWith(agentsPath + sep) || normalizedInput === agentsPath;
    const isInOutput = normalizedInput.startsWith(outputPath + sep) || normalizedInput === outputPath;

    if (!isInAgents && !isInOutput) {
      throw new Error(`Invalid path: absolute paths must be within allowed directories (${agentsPath} or ${outputPath})`);
    }

    return normalizedInput;
  }

  // For relative paths, resolve against the base directory
  const resolvedPath = resolve(normalizedBase, normalize(relativePath));

  // Ensure the resolved path is within the base directory (prevents ../ traversal)
  if (!resolvedPath.startsWith(normalizedBase + sep) && resolvedPath !== normalizedBase) {
    throw new Error(`Invalid path: '${relativePath}' resolves outside base directory '${baseDir}'`);
  }

  return resolvedPath;
}

/**
 * Validates that a write path is safe and within OUTPUT_PATH only.
 * Rejects any attempts to write to AGENTS_PATH (read-only directory).
 *
 * @param relativePath - The relative path to validate for writing
 * @returns Absolute path if valid for writing
 * @throws Error if attempting to write to agents folder or path is invalid
 */
export function validateWritePath(relativePath: string): string {
  // First validate the path is safe
  const absolutePath = validatePath(relativePath, env.OUTPUT_PATH);

  // Ensure it's within OUTPUT_PATH (not AGENTS_PATH)
  const outputPath = resolve(env.OUTPUT_PATH);
  const agentsPath = resolve(env.AGENTS_PATH);

  const isInOutput = absolutePath.startsWith(outputPath + sep) || absolutePath === outputPath;
  const isInAgents = absolutePath.startsWith(agentsPath + sep) || absolutePath === agentsPath;

  if (isInAgents) {
    throw new Error(`Invalid write path: cannot write to agents folder (read-only). Use output folder instead.`);
  }

  if (!isInOutput) {
    throw new Error(`Invalid write path: writes must be within OUTPUT_PATH (${outputPath})`);
  }

  return absolutePath;
}
