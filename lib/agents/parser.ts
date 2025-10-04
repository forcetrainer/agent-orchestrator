/**
 * Agent Parser Module
 *
 * Extracts metadata from agent markdown files using XML tag parsing.
 * Returns Agent objects with id, name, title, icon, description, path, and mainFile.
 *
 * Security: Validates all file paths through security module before access.
 * Error Handling: Returns null for files without valid <agent> tag.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { validatePath } from '@/lib/files/security';
import { env } from '@/lib/utils/env';
import { Agent } from '@/types';

/**
 * Parses agent markdown file and extracts metadata from XML <agent> tag.
 *
 * Extraction pattern:
 * - <agent id="..." name="..." title="..." icon="..."> (icon optional)
 * - Description from <persona><role> content if present
 *
 * @param filePath - Absolute path to agent markdown file
 * @returns Agent object with metadata, or null if no valid <agent> tag
 */
export async function parseAgentFile(
  filePath: string
): Promise<Agent | null> {
  try {
    // Resolve AGENTS_PATH to absolute path for consistent validation
    const agentsBase = resolve(env.AGENTS_PATH);

    // Validate file path for security
    const validatedFile = validatePath(filePath, agentsBase);

    const content = await readFile(validatedFile, 'utf-8');

    // Extract metadata from <agent> tag
    const agentTagMatch = content.match(
      /<agent\s+id="([^"]+)"\s+name="([^"]+)"\s+title="([^"]+)"(?:\s+icon="([^"]+)")?/
    );

    if (!agentTagMatch) {
      // No valid <agent> tag found - filter out this file
      return null;
    }

    const [, id, name, title, icon] = agentTagMatch;

    // Validate required fields
    if (!id || !name || !title) {
      console.warn(`[agent_parser] Missing required fields in agent file: ${filePath}`);
      return null;
    }

    // Extract description from <persona><role> content if present
    const roleMatch = content.match(/<role>([^<]+)<\/role>/);
    const description = roleMatch ? roleMatch[1].trim() : undefined;

    // Extract directory path from file path
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));

    return {
      id: id.trim(),
      name: name.trim(),
      title: title.trim(),
      description,
      icon: icon?.trim(),
      path: dirPath,
      mainFile: validatedFile,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`[agent_parser] File not found: ${filePath}`);
      return null;
    }
    // Re-throw other errors (permissions, etc.)
    throw error;
  }
}
