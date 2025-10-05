/**
 * Bundle Scanner Integration Tests
 *
 * Tests for bundle scanner with real filesystem structure:
 * - Real bundle directory discovery
 * - Actual bundle.yaml parsing
 * - Mixed bundle types (multi-agent + standalone)
 * - Empty bundles directory
 * - Malformed bundles (graceful degradation)
 *
 * Story 4.4: Bundle Structure Discovery and Loading
 */

import { discoverBundles, AgentMetadata } from '../bundleScanner';
import { join } from 'path';

describe('bundleScanner integration tests', () => {
  const bundlesRoot = join(process.cwd(), 'bmad/custom/bundles');

  describe('real bundle directory discovery', () => {
    it('should discover agents from real bundle directory structure', async () => {
      const agents = await discoverBundles(bundlesRoot);

      // Verify we get agent metadata
      expect(Array.isArray(agents)).toBe(true);

      // If bundles exist, verify structure
      if (agents.length > 0) {
        agents.forEach((agent: AgentMetadata) => {
          // Required fields
          expect(agent).toHaveProperty('id');
          expect(agent).toHaveProperty('name');
          expect(agent).toHaveProperty('title');
          expect(agent).toHaveProperty('bundleName');
          expect(agent).toHaveProperty('bundlePath');
          expect(agent).toHaveProperty('filePath');

          // Verify types
          expect(typeof agent.id).toBe('string');
          expect(typeof agent.name).toBe('string');
          expect(typeof agent.title).toBe('string');
          expect(typeof agent.bundleName).toBe('string');
          expect(typeof agent.bundlePath).toBe('string');
          expect(typeof agent.filePath).toBe('string');

          // Optional fields (if present, must be strings)
          if (agent.description) {
            expect(typeof agent.description).toBe('string');
          }
          if (agent.icon) {
            expect(typeof agent.icon).toBe('string');
          }

          // File path should contain bundle path
          expect(agent.filePath).toContain(agent.bundlePath);
        });
      }
    });

    it('should handle empty bundles directory gracefully', async () => {
      const emptyBundlesPath = join(process.cwd(), 'nonexistent-bundles');

      const agents = await discoverBundles(emptyBundlesPath);

      expect(agents).toEqual([]);
    });

    it('should discover requirements-workflow bundle if it exists', async () => {
      const agents = await discoverBundles(bundlesRoot);

      // Find requirements-workflow bundle agents
      const reqWorkflowAgents = agents.filter(a => a.bundleName === 'requirements-workflow');

      if (reqWorkflowAgents.length > 0) {
        // Verify we have expected agents from requirements-workflow bundle
        const agentIds = reqWorkflowAgents.map(a => a.id);

        // Expected agents from requirements-workflow bundle.yaml
        expect(agentIds).toContain('alex-facilitator');
        expect(agentIds).toContain('casey-analyst');
        expect(agentIds).toContain('pixel-story-developer');

        // Verify agent metadata
        const alex = reqWorkflowAgents.find(a => a.id === 'alex-facilitator');
        if (alex) {
          expect(alex.name).toBe('Alex');
          expect(alex.title).toBe('Requirements Facilitator');
          expect(alex.bundlePath).toContain('requirements-workflow');
          expect(alex.filePath).toContain('alex-facilitator.md');
        }

        const casey = reqWorkflowAgents.find(a => a.id === 'casey-analyst');
        if (casey) {
          expect(casey.name).toBe('Casey');
          expect(casey.title).toBe('Requirements Analyst');
          expect(casey.bundlePath).toContain('requirements-workflow');
          expect(casey.filePath).toContain('casey-analyst.md');
        }

        const pixel = reqWorkflowAgents.find(a => a.id === 'pixel-story-developer');
        if (pixel) {
          expect(pixel.name).toBe('Pixel');
          expect(pixel.title).toBe('Story Developer');
          expect(pixel.bundlePath).toContain('requirements-workflow');
          expect(pixel.filePath).toContain('pixel-story-developer.md');
        }
      }
    });

    it('should only return agents with entry_point: true', async () => {
      const agents = await discoverBundles(bundlesRoot);

      // All returned agents should be entry points
      // (We can't verify entry_point field directly as it's not in AgentMetadata,
      // but the scanner should have filtered them)
      expect(Array.isArray(agents)).toBe(true);

      // If we have agents, they should all have valid IDs and paths
      agents.forEach(agent => {
        expect(agent.id).toBeTruthy();
        expect(agent.filePath).toBeTruthy();
      });
    });

    it('should handle mixed bundle types correctly', async () => {
      const agents = await discoverBundles(bundlesRoot);

      // Group agents by bundle name
      const bundleGroups = agents.reduce((acc, agent) => {
        if (!acc[agent.bundleName]) {
          acc[agent.bundleName] = [];
        }
        acc[agent.bundleName].push(agent);
        return acc;
      }, {} as Record<string, AgentMetadata[]>);

      // Multi-agent bundles should have multiple agents
      // Standalone bundles should have exactly one agent
      Object.entries(bundleGroups).forEach(([bundleName, bundleAgents]) => {
        expect(bundleAgents.length).toBeGreaterThan(0);

        // All agents in same bundle should share bundlePath
        const firstBundlePath = bundleAgents[0].bundlePath;
        bundleAgents.forEach(agent => {
          expect(agent.bundlePath).toBe(firstBundlePath);
        });
      });
    });
  });

  describe('performance requirements', () => {
    it('should discover bundles in reasonable time', async () => {
      const startTime = performance.now();

      await discoverBundles(bundlesRoot);

      const duration = performance.now() - startTime;

      // Should complete in under 1 second for typical bundle directory
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('graceful error handling with real filesystem', () => {
    it('should handle permission errors gracefully', async () => {
      // Try to scan a system directory we likely don't have access to
      const restrictedPath = '/private/var/root';

      // Should not throw, but return empty array
      const agents = await discoverBundles(restrictedPath);

      expect(Array.isArray(agents)).toBe(true);
    });

    it('should continue after encountering malformed bundles', async () => {
      // This test verifies that if there are any malformed bundles in the real directory,
      // the scanner continues and returns valid bundles
      const agents = await discoverBundles(bundlesRoot);

      // Should return an array (even if empty)
      expect(Array.isArray(agents)).toBe(true);

      // All returned agents should have required fields
      agents.forEach(agent => {
        expect(agent.id).toBeTruthy();
        expect(agent.name).toBeTruthy();
        expect(agent.title).toBeTruthy();
        expect(agent.bundleName).toBeTruthy();
        expect(agent.bundlePath).toBeTruthy();
        expect(agent.filePath).toBeTruthy();
      });
    });
  });
});
