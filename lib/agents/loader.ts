/**
 * Agent Loader Module
 *
 * Discovers and caches agents from the agents folder.
 * Implements lazy-loading pattern: only loads metadata, not full instructions.
 *
 * Performance: Targets < 500ms for 10 agents using async/await and fs/promises.
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
 * Loads all agents from the agents folder.
 *
 * Behavior:
 * - First call: Scans file system and caches results
 * - Subsequent calls: Returns cached agents unless forceReload=true
 * - Empty folder: Returns empty array
 * - Missing agent.md: Skips agent with warning, continues scanning
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
  // Resolve to absolute path for consistent security validation
  const agentsPath = resolve(env.AGENTS_PATH);

  try {
    // Read all entries in agents directory
    const entries = await readdir(agentsPath, { withFileTypes: true });

    // Filter to directories only (each directory = potential agent)
    const agentDirs = entries.filter((entry) => entry.isDirectory());

    // Parse each agent directory
    for (const dir of agentDirs) {
      const agentId = dir.name;
      const agentPath = join(agentsPath, agentId);

      const agent = await parseAgentFile(agentPath, agentId);

      // Skip agents with missing agent.md (parser returns null)
      if (agent) {
        agents.push(agent);
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
