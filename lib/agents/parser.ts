/**
 * Agent Parser Module
 *
 * Extracts metadata from agent.md files using regex patterns.
 * Returns Agent objects with id, name, description, path, and mainFile.
 *
 * Security: Validates all file paths through security module before access.
 * Error Handling: Returns null for missing agent.md files with warning log.
 */

import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { validatePath } from '@/lib/files/security';
import { env } from '@/lib/utils/env';
import { Agent } from '@/types';

/**
 * Parses agent.md file and extracts metadata.
 *
 * Extraction patterns:
 * - Name: First markdown heading (# Agent Name)
 * - Description: First blockquote (> Description text)
 *
 * @param agentPath - Absolute path to agent directory
 * @param agentId - Agent identifier (directory name)
 * @returns Agent object with metadata, or null if agent.md missing
 */
export async function parseAgentFile(
  agentPath: string,
  agentId: string
): Promise<Agent | null> {
  try {
    // Resolve AGENTS_PATH to absolute path for consistent validation
    const agentsBase = resolve(env.AGENTS_PATH);

    // Validate agent directory path for security
    const validatedPath = validatePath(agentPath, agentsBase);

    // Construct and validate agent.md file path
    const mainFile = join(validatedPath, 'agent.md');
    const validatedFile = validatePath(mainFile, agentsBase);

    const content = await readFile(validatedFile, 'utf-8');

    // Extract name from first heading (e.g., "# Test Agent" -> "Test Agent")
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const name = nameMatch ? nameMatch[1].trim() : agentId;

    // Extract description from first blockquote (e.g., "> A test agent..." -> "A test agent...")
    const descMatch = content.match(/^>\s+(.+)$/m);
    const description = descMatch ? descMatch[1].trim() : 'No description available';

    return {
      id: agentId,
      name,
      description,
      path: validatedPath,
      mainFile: validatedFile,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`[agent_parser] Missing agent.md for agent: ${agentId}`);
      return null;
    }
    // Re-throw other errors (permissions, etc.)
    throw error;
  }
}
