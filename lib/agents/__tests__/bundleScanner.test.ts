/**
 * Bundle Scanner Module Tests
 *
 * Tests for discovering agents from bundle.yaml manifests:
 * - Directory scanning and bundle.yaml discovery
 * - Multi-agent bundle parsing and entry_point filtering
 * - Standalone bundle parsing
 * - Manifest validation
 * - Error handling and graceful degradation
 * - Empty directory handling
 *
 * Story 4.4: Bundle Structure Discovery and Loading
 */

import { discoverBundles, validateBundleManifest, AgentMetadata } from '../bundleScanner';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import * as YAML from 'js-yaml';

describe('bundleScanner module', () => {
  const testBundlesDir = join(process.cwd(), 'test-bundles');

  beforeAll(async () => {
    // Ensure test bundles directory exists
    await mkdir(testBundlesDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test bundle directories
    try {
      await rm(testBundlesDir, { recursive: true, force: true });
      await mkdir(testBundlesDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await rm(testBundlesDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('validateBundleManifest', () => {
    it('should validate valid multi-agent bundle manifest', () => {
      const manifest = {
        type: 'bundle',
        name: 'test-bundle',
        version: '1.0.0',
        agents: [
          { id: 'agent-1', name: 'Agent 1', title: 'Title 1', file: 'agent1.md', entry_point: true }
        ]
      };

      expect(() => validateBundleManifest(manifest)).not.toThrow();
    });

    it('should validate valid standalone bundle manifest', () => {
      const manifest = {
        type: 'standalone',
        name: 'test-bundle',
        version: '1.0.0',
        agent: { id: 'agent-1', name: 'Agent 1', title: 'Title 1', file: 'agent.md' }
      };

      expect(() => validateBundleManifest(manifest)).not.toThrow();
    });

    it('should reject manifest missing type field', () => {
      const manifest = {
        name: 'test-bundle',
        version: '1.0.0'
      };

      expect(() => validateBundleManifest(manifest)).toThrow('missing required field: type');
    });

    it('should reject manifest missing name field', () => {
      const manifest = {
        type: 'bundle',
        version: '1.0.0'
      };

      expect(() => validateBundleManifest(manifest)).toThrow('missing required field: name');
    });

    it('should reject manifest missing version field', () => {
      const manifest = {
        type: 'bundle',
        name: 'test-bundle'
      };

      expect(() => validateBundleManifest(manifest)).toThrow('missing required field: version');
    });

    it('should reject invalid bundle type', () => {
      const manifest = {
        type: 'invalid',
        name: 'test-bundle',
        version: '1.0.0'
      };

      expect(() => validateBundleManifest(manifest)).toThrow('Invalid bundle type');
    });

    it('should reject multi-agent bundle missing agents array', () => {
      const manifest = {
        type: 'bundle',
        name: 'test-bundle',
        version: '1.0.0'
      };

      expect(() => validateBundleManifest(manifest)).toThrow('missing required field: agents');
    });

    it('should reject multi-agent bundle with no entry_point agents', () => {
      const manifest = {
        type: 'bundle',
        name: 'test-bundle',
        version: '1.0.0',
        agents: [
          { id: 'agent-1', name: 'Agent 1', title: 'Title 1', file: 'agent1.md', entry_point: false }
        ]
      };

      expect(() => validateBundleManifest(manifest)).toThrow('at least one agent with entry_point: true');
    });

    it('should reject standalone bundle missing agent object', () => {
      const manifest = {
        type: 'standalone',
        name: 'test-bundle',
        version: '1.0.0'
      };

      expect(() => validateBundleManifest(manifest)).toThrow('missing required field: agent');
    });
  });

  describe('discoverBundles - directory scanning', () => {
    it('should scan bundles directory and find bundle.yaml files', async () => {
      // Create test bundle with bundle.yaml
      const bundlePath = join(testBundlesDir, 'test-bundle-1');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'standalone',
        name: 'test-bundle-1',
        version: '1.0.0',
        agent: {
          id: 'test-agent',
          name: 'Test Agent',
          title: 'Test Title',
          file: 'agent.md'
        }
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('test-agent');
    });

    it('should skip non-directory entries', async () => {
      // Create a file in bundles root (should be skipped)
      await writeFile(join(testBundlesDir, 'not-a-bundle.txt'), 'ignore me');

      // Create valid bundle
      const bundlePath = join(testBundlesDir, 'valid-bundle');
      await mkdir(bundlePath, { recursive: true });
      const manifest = {
        type: 'standalone',
        name: 'valid-bundle',
        version: '1.0.0',
        agent: { id: 'agent-1', name: 'Agent 1', title: 'Title', file: 'agent.md' }
      };
      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('agent-1');
    });

    it('should skip directories without bundle.yaml', async () => {
      // Create directory without bundle.yaml
      const bundlePath = join(testBundlesDir, 'no-manifest');
      await mkdir(bundlePath, { recursive: true });
      await writeFile(join(bundlePath, 'readme.md'), 'no manifest here');

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toHaveLength(0);
    });

    it('should return empty array for non-existent bundles directory', async () => {
      const nonExistentPath = join(testBundlesDir, 'does-not-exist');

      const agents = await discoverBundles(nonExistentPath);

      expect(agents).toEqual([]);
    });
  });

  describe('discoverBundles - multi-agent bundles', () => {
    it('should parse multi-agent bundle and extract metadata', async () => {
      const bundlePath = join(testBundlesDir, 'multi-bundle');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'bundle',
        name: 'multi-bundle',
        version: '1.0.0',
        description: 'Test multi-agent bundle',
        agents: [
          {
            id: 'agent-1',
            name: 'Agent One',
            title: 'First Agent',
            description: 'Description 1',
            icon: '🎯',
            file: 'agents/agent-1.md',
            entry_point: true
          },
          {
            id: 'agent-2',
            name: 'Agent Two',
            title: 'Second Agent',
            description: 'Description 2',
            icon: '🚀',
            file: 'agents/agent-2.md',
            entry_point: true
          }
        ]
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toHaveLength(2);
      expect(agents[0]).toMatchObject({
        id: 'agent-1',
        name: 'Agent One',
        title: 'First Agent',
        description: 'Description 1',
        icon: '🎯',
        bundleName: 'multi-bundle'
      });
      expect(agents[1]).toMatchObject({
        id: 'agent-2',
        name: 'Agent Two',
        title: 'Second Agent',
        description: 'Description 2',
        icon: '🚀',
        bundleName: 'multi-bundle'
      });
    });

    it('should filter agents by entry_point: true', async () => {
      const bundlePath = join(testBundlesDir, 'filtered-bundle');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'bundle',
        name: 'filtered-bundle',
        version: '1.0.0',
        agents: [
          { id: 'agent-1', name: 'Agent 1', title: 'Title 1', file: 'agent1.md', entry_point: true },
          { id: 'agent-2', name: 'Agent 2', title: 'Title 2', file: 'agent2.md', entry_point: false },
          { id: 'agent-3', name: 'Agent 3', title: 'Title 3', file: 'agent3.md', entry_point: true }
        ]
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.id)).toEqual(['agent-1', 'agent-3']);
    });

    it('should construct correct file paths for multi-agent bundles', async () => {
      const bundlePath = join(testBundlesDir, 'path-test');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'bundle',
        name: 'path-test',
        version: '1.0.0',
        agents: [
          { id: 'agent-1', name: 'Agent 1', title: 'Title', file: 'agents/agent-1.md', entry_point: true }
        ]
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents[0].bundlePath).toBe(bundlePath);
      expect(agents[0].filePath).toBe(join(bundlePath, 'agents/agent-1.md'));
    });

    it('should include bundleName and bundlePath in results', async () => {
      const bundlePath = join(testBundlesDir, 'context-test');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'bundle',
        name: 'context-test',
        version: '1.0.0',
        agents: [
          { id: 'agent-1', name: 'Agent 1', title: 'Title', file: 'agent.md', entry_point: true }
        ]
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents[0]).toHaveProperty('bundleName', 'context-test');
      expect(agents[0]).toHaveProperty('bundlePath', bundlePath);
      expect(agents[0]).toHaveProperty('filePath');
    });
  });

  describe('discoverBundles - standalone bundles', () => {
    it('should parse standalone bundle and extract metadata', async () => {
      const bundlePath = join(testBundlesDir, 'standalone-bundle');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'standalone',
        name: 'standalone-bundle',
        version: '1.0.0',
        description: 'Test standalone bundle',
        agent: {
          id: 'solo-agent',
          name: 'Solo Agent',
          title: 'Standalone Agent',
          description: 'A standalone agent',
          icon: '⭐',
          file: 'agent.md'
        }
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toHaveLength(1);
      expect(agents[0]).toMatchObject({
        id: 'solo-agent',
        name: 'Solo Agent',
        title: 'Standalone Agent',
        description: 'A standalone agent',
        icon: '⭐',
        bundleName: 'standalone-bundle'
      });
    });

    it('should construct correct file path for standalone bundle', async () => {
      const bundlePath = join(testBundlesDir, 'standalone-path');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'standalone',
        name: 'standalone-path',
        version: '1.0.0',
        agent: { id: 'agent-1', name: 'Agent 1', title: 'Title', file: 'agent.md' }
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents[0].bundlePath).toBe(bundlePath);
      expect(agents[0].filePath).toBe(join(bundlePath, 'agent.md'));
    });

    it('should include bundleName and bundlePath for standalone bundles', async () => {
      const bundlePath = join(testBundlesDir, 'standalone-context');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'standalone',
        name: 'standalone-context',
        version: '1.0.0',
        agent: { id: 'agent-1', name: 'Agent 1', title: 'Title', file: 'agent.md' }
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents[0].bundleName).toBe('standalone-context');
      expect(agents[0].bundlePath).toBe(bundlePath);
    });
  });

  describe('discoverBundles - error handling', () => {
    it('should handle invalid YAML syntax gracefully', async () => {
      const bundlePath = join(testBundlesDir, 'invalid-yaml');
      await mkdir(bundlePath, { recursive: true });

      // Write invalid YAML
      await writeFile(join(bundlePath, 'bundle.yaml'), 'invalid: yaml: syntax: {{[');

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toEqual([]);
    });

    it('should handle validation errors gracefully', async () => {
      const bundlePath = join(testBundlesDir, 'invalid-manifest');
      await mkdir(bundlePath, { recursive: true });

      const manifest = {
        type: 'bundle',
        name: 'invalid-manifest',
        // Missing version field
      };

      await writeFile(join(bundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toEqual([]);
    });

    it('should continue scanning after bundle error', async () => {
      // Create invalid bundle
      const invalidBundlePath = join(testBundlesDir, 'invalid-bundle');
      await mkdir(invalidBundlePath, { recursive: true });
      await writeFile(join(invalidBundlePath, 'bundle.yaml'), 'invalid yaml');

      // Create valid bundle
      const validBundlePath = join(testBundlesDir, 'valid-bundle');
      await mkdir(validBundlePath, { recursive: true });
      const manifest = {
        type: 'standalone',
        name: 'valid-bundle',
        version: '1.0.0',
        agent: { id: 'agent-1', name: 'Agent 1', title: 'Title', file: 'agent.md' }
      };
      await writeFile(join(validBundlePath, 'bundle.yaml'), YAML.dump(manifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('agent-1');
    });

    it('should handle missing bundle.yaml gracefully', async () => {
      const bundlePath = join(testBundlesDir, 'no-manifest');
      await mkdir(bundlePath, { recursive: true });

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toEqual([]);
    });
  });

  describe('discoverBundles - mixed bundles', () => {
    it('should discover both multi-agent and standalone bundles', async () => {
      // Create multi-agent bundle
      const multiBundlePath = join(testBundlesDir, 'multi-bundle');
      await mkdir(multiBundlePath, { recursive: true });
      const multiManifest = {
        type: 'bundle',
        name: 'multi-bundle',
        version: '1.0.0',
        agents: [
          { id: 'multi-1', name: 'Multi 1', title: 'Title', file: 'agent1.md', entry_point: true },
          { id: 'multi-2', name: 'Multi 2', title: 'Title', file: 'agent2.md', entry_point: true }
        ]
      };
      await writeFile(join(multiBundlePath, 'bundle.yaml'), YAML.dump(multiManifest));

      // Create standalone bundle
      const standaloneBundlePath = join(testBundlesDir, 'standalone-bundle');
      await mkdir(standaloneBundlePath, { recursive: true });
      const standaloneManifest = {
        type: 'standalone',
        name: 'standalone-bundle',
        version: '1.0.0',
        agent: { id: 'standalone-1', name: 'Standalone 1', title: 'Title', file: 'agent.md' }
      };
      await writeFile(join(standaloneBundlePath, 'bundle.yaml'), YAML.dump(standaloneManifest));

      const agents = await discoverBundles(testBundlesDir);

      expect(agents).toHaveLength(3);
      expect(agents.map(a => a.id).sort()).toEqual(['multi-1', 'multi-2', 'standalone-1']);
    });
  });
});
