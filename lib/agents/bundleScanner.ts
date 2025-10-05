/**
 * Bundle Scanner Module
 *
 * Discovers agents from bundle manifests (bundle.yaml files).
 * Implements manifest-driven discovery as per BUNDLE-SPEC.md.
 *
 * Story 4.4: Bundle Structure Discovery and Loading
 * - Scans bmad/custom/bundles/* for bundle.yaml manifests
 * - Parses multi-agent and standalone bundle types
 * - Filters agents by entry_point: true
 * - Returns agent metadata with bundle context
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import * as YAML from 'js-yaml';

/**
 * Agent metadata returned by bundle scanner.
 * Includes bundle context for path resolution (Story 4.2) and critical actions (Story 4.3).
 */
export interface AgentMetadata {
  id: string;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  bundleName: string;
  bundlePath: string;
  filePath: string;
}

/**
 * Agent definition within bundle manifest.
 */
interface AgentDef {
  id: string;
  name: string;
  title: string;
  file: string;
  entry_point?: boolean;
  description?: string;
  icon?: string;
}

/**
 * Bundle manifest structure (bundle.yaml).
 * Discriminated union on 'type' field.
 */
export interface BundleManifest {
  type: 'bundle' | 'standalone';
  name: string;
  version: string;
  description?: string;
  author?: string;
  agents?: AgentDef[];  // Multi-agent bundles
  agent?: AgentDef;      // Standalone bundles
}

/**
 * Validates bundle manifest structure.
 * Throws descriptive errors for invalid manifests.
 *
 * Validation rules:
 * - Required fields: type, name, version
 * - Multi-agent bundles: must have agents array with at least one entry_point: true
 * - Standalone bundles: must have agent object
 *
 * @param manifest - Parsed bundle.yaml content
 * @throws Error with descriptive message if validation fails
 */
export function validateBundleManifest(manifest: any): void {
  // Check required fields
  if (!manifest.type) {
    throw new Error('Bundle manifest missing required field: type');
  }

  if (!manifest.name) {
    throw new Error('Bundle manifest missing required field: name');
  }

  if (!manifest.version) {
    throw new Error('Bundle manifest missing required field: version');
  }

  // Validate type field
  if (manifest.type !== 'bundle' && manifest.type !== 'standalone') {
    throw new Error(`Invalid bundle type: ${manifest.type}. Must be 'bundle' or 'standalone'`);
  }

  // Type-specific validation
  if (manifest.type === 'bundle') {
    // Multi-agent bundle requires agents array
    if (!manifest.agents || !Array.isArray(manifest.agents)) {
      throw new Error('Multi-agent bundle manifest missing required field: agents (must be array)');
    }

    // Ensure at least one entry point agent
    const hasEntryPoint = manifest.agents.some((agent: any) => agent.entry_point === true);
    if (!hasEntryPoint) {
      throw new Error('Multi-agent bundle must have at least one agent with entry_point: true');
    }
  } else if (manifest.type === 'standalone') {
    // Standalone bundle requires agent object
    if (!manifest.agent) {
      throw new Error('Standalone bundle manifest missing required field: agent');
    }
  }
}

/**
 * Discovers agents from bundle manifests.
 *
 * Scans bundlesRoot directory at depth 1 for bundle.yaml files.
 * Parses manifests, validates structure, and extracts agent metadata.
 * Only returns agents with entry_point: true (for multi-agent bundles).
 *
 * Graceful error handling:
 * - Logs errors for individual bundle failures
 * - Continues scanning remaining bundles
 * - Returns empty array if no bundles found
 *
 * @param bundlesRoot - Root directory containing bundle subdirectories
 * @returns Array of discoverable agent metadata
 */
export async function discoverBundles(bundlesRoot: string): Promise<AgentMetadata[]> {
  const agents: AgentMetadata[] = [];

  try {
    // Read bundle directory entries
    const bundleDirs = await readdir(bundlesRoot, { withFileTypes: true });

    // Process each directory
    for (const bundleDir of bundleDirs) {
      // Skip non-directories
      if (!bundleDir.isDirectory()) {
        continue;
      }

      const bundlePath = join(bundlesRoot, bundleDir.name);
      const manifestPath = join(bundlePath, 'bundle.yaml');

      try {
        // Read and parse bundle.yaml
        const manifestContent = await readFile(manifestPath, 'utf-8');
        const manifest = YAML.load(manifestContent) as BundleManifest;

        // Validate manifest structure
        validateBundleManifest(manifest);

        // Extract agents based on bundle type
        if (manifest.type === 'bundle') {
          // Multi-agent bundle
          for (const agent of manifest.agents!) {
            // Only include entry point agents
            if (agent.entry_point === true) {
              agents.push({
                id: agent.id,
                name: agent.name,
                title: agent.title,
                description: agent.description,
                icon: agent.icon,
                bundleName: manifest.name,
                bundlePath: bundlePath,
                filePath: join(bundlePath, agent.file)
              });
            }
          }
        } else if (manifest.type === 'standalone') {
          // Standalone bundle
          const agent = manifest.agent!;
          agents.push({
            id: agent.id,
            name: agent.name,
            title: agent.title,
            description: agent.description,
            icon: agent.icon,
            bundleName: manifest.name,
            bundlePath: bundlePath,
            filePath: join(bundlePath, agent.file)
          });
        }
      } catch (error: any) {
        // Log error but continue to next bundle (graceful degradation)
        console.error(`[bundleScanner] Failed to load bundle: ${bundleDir.name}`, error.message);
        continue;
      }
    }

    console.log(`[bundleScanner] Discovered ${agents.length} agents from ${bundlesRoot}`);
    return agents;

  } catch (error: any) {
    // Handle bundles directory not found
    if (error.code === 'ENOENT') {
      console.info(`[bundleScanner] Bundles directory not found: ${bundlesRoot}, returning empty array`);
      return [];
    }

    // Re-throw other errors
    console.error(`[bundleScanner] Error discovering bundles: ${error.message}`);
    throw error;
  }
}
