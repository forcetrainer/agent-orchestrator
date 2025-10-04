/**
 * Agent Loader Module
 *
 * Discovers and caches agents from the agents folder.
 * Scans *.md files at depth 1 and validates XML metadata.
 *
 * Performance: Targets under 500ms for 50 agents using async/await and fs/promises.
 * Caching: In-memory Map prevents redundant file system scans.
 */

import { readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { env } from '@/lib/utils/env';
import { Agent } from '@/types';
import { parseAgentFile } from './parser';

/**
 * In-memory cache for discovered agents.
 * Null = not yet loaded, Agent[] = loaded and cached.
 */
let agentCache: Agent[] | null = null;

/**
 * Subdirectories to exclude from agent discovery.
 * These contain workflow/template files, not agent definitions.
 */
const EXCLUDED_SUBDIRS = ['workflows', 'templates', 'files'];

/**
 * Loads all agents from the agents folder.
 *
 * Behavior:
 * - Scans *.md files at depth 1 only
 * - Excludes workflows/, templates/, files/ subdirectories
 * - Validates XML agent tag with required attributes (id, name, title)
 * - Detects and rejects duplicate agent IDs
 * - Returns cached agents unless forceReload=true
 * - Empty folder: Returns empty array
 *
 * @param forceReload - If true, bypass cache and re-scan file system
 * @returns Array of discovered agents
 */
export async function loadAgents(forceReload = false): Promise<Agent[]> {
  const startTime = performance.now();

  // Return cached agents if available and not forcing reload
  if (agentCache !== null && !forceReload) {
    console.log('[agent_loader] Returning cached agents');
    return agentCache;
  }

  const agents: Agent[] = [];
  const seenIds = new Set<string>();

  // Resolve to absolute path for consistent security validation
  const agentsPath = resolve(env.AGENTS_PATH);

  try {
    // Read all entries in agents directory
    const entries = await readdir(agentsPath, { withFileTypes: true });

    // Filter to directories only, excluding workflows/templates/files
    const agentDirs = entries.filter(
      (entry) => entry.isDirectory() && !EXCLUDED_SUBDIRS.includes(entry.name)
    );

    // Scan each directory for *.md files at depth 1
    for (const dir of agentDirs) {
      const dirPath = join(agentsPath, dir.name);

      try {
        const files = await readdir(dirPath, { withFileTypes: true });

        // Find all .md files in this directory (depth 1 only)
        const mdFiles = files.filter(
          (file) => file.isFile() && file.name.endsWith('.md')
        );

        // Parse each markdown file
        for (const file of mdFiles) {
          const filePath = join(dirPath, file.name);

          const agent = await parseAgentFile(filePath);

          // Skip files without valid <agent> tag (parser returns null)
          if (!agent) {
            continue;
          }

          // Check for duplicate agent IDs
          if (seenIds.has(agent.id)) {
            console.warn(
              `[agent_loader] Duplicate agent ID "${agent.id}" found in ${filePath}, skipping`
            );
            continue;
          }

          seenIds.add(agent.id);
          agents.push(agent);
        }
      } catch (dirError: any) {
        console.warn(`[agent_loader] Error scanning directory ${dir.name}: ${dirError.message}`);
        continue;
      }
    }

    // Cache results
    agentCache = agents;

    const duration = performance.now() - startTime;
    console.log(`[agent_loader] Loaded ${agents.length} agents in ${duration.toFixed(2)}ms`);

    return agents;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Agents folder doesn't exist - return empty array
      console.info('[agent_loader] Agents folder not found, returning empty array');
      agentCache = [];
      return [];
    }

    // Re-throw other errors
    const duration = performance.now() - startTime;
    console.error(`[agent_loader] Error loading agents: ${error.message} (${duration.toFixed(2)}ms)`);
    throw error;
  }
}

/**
 * Looks up agent by ID from cached agent list.
 *
 * @param agentId - Agent identifier to search for
 * @returns Agent object if found, null otherwise
 */
export async function getAgentById(agentId: string): Promise<Agent | null> {
  // Ensure agents are loaded
  const agents = await loadAgents();

  // Find agent by ID
  return agents.find((agent) => agent.id === agentId) || null;
}

/**
 * Clears the agent cache.
 * Next loadAgents() call will re-scan the file system.
 *
 * Primarily used for testing to ensure clean state.
 */
export function clearAgentCache(): void {
  agentCache = null;
  console.log('[agent_loader] Agent cache cleared');
}
