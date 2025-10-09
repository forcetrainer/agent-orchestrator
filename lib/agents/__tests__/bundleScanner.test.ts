/**
 * Bundle Scanner Module Tests
 *
 * Minimal high-value tests:
 * - Discover valid bundles (critical path)
 * - Handle invalid YAML gracefully (error handling)
 */

import { discoverBundles } from '../bundleScanner';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import * as YAML from 'js-yaml';

describe('bundleScanner module', () => {
  const testBundlesDir = join(process.cwd(), 'test-bundles');

  beforeAll(async () => {
    await mkdir(testBundlesDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testBundlesDir, { recursive: true, force: true });
      await mkdir(testBundlesDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    try {
      await rm(testBundlesDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should discover agents from valid bundle.yaml manifests', async () => {
    // Create multi-agent bundle
    const multiBundlePath = join(testBundlesDir, 'multi-bundle');
    await mkdir(multiBundlePath, { recursive: true });
    const multiManifest = {
      type: 'bundle',
      name: 'multi-bundle',
      version: '1.0.0',
      agents: [
        {
          id: 'agent-1',
          name: 'Agent One',
          title: 'First Agent',
          description: 'Description 1',
          icon: '🎯',
          file: 'agents/agent-1.md',
          entry_point: true,
        },
        {
          id: 'agent-2',
          name: 'Agent Two',
          title: 'Second Agent',
          file: 'agents/agent-2.md',
          entry_point: false, // Should be filtered out
        },
      ],
    };
    await writeFile(join(multiBundlePath, 'bundle.yaml'), YAML.dump(multiManifest));

    // Create standalone bundle
    const standaloneBundlePath = join(testBundlesDir, 'standalone-bundle');
    await mkdir(standaloneBundlePath, { recursive: true });
    const standaloneManifest = {
      type: 'standalone',
      name: 'standalone-bundle',
      version: '1.0.0',
      agent: { id: 'standalone-1', name: 'Standalone 1', title: 'Title', file: 'agent.md' },
    };
    await writeFile(join(standaloneBundlePath, 'bundle.yaml'), YAML.dump(standaloneManifest));

    const agents = await discoverBundles(testBundlesDir);

    // Should find: 1 from multi-bundle (entry_point=true) + 1 from standalone = 2 total
    expect(agents).toHaveLength(2);
    expect(agents.find((a) => a.id === 'agent-1')).toBeDefined();
    expect(agents.find((a) => a.id === 'standalone-1')).toBeDefined();
    expect(agents.find((a) => a.id === 'agent-2')).toBeUndefined(); // Filtered out
  });

  it('should handle invalid YAML and continue scanning other bundles', async () => {
    // Create invalid bundle
    const invalidBundlePath = join(testBundlesDir, 'invalid-bundle');
    await mkdir(invalidBundlePath, { recursive: true });
    await writeFile(join(invalidBundlePath, 'bundle.yaml'), 'invalid: yaml: syntax: {{[');

    // Create valid bundle
    const validBundlePath = join(testBundlesDir, 'valid-bundle');
    await mkdir(validBundlePath, { recursive: true });
    const manifest = {
      type: 'standalone',
      name: 'valid-bundle',
      version: '1.0.0',
      agent: { id: 'agent-1', name: 'Agent 1', title: 'Title', file: 'agent.md' },
    };
    await writeFile(join(validBundlePath, 'bundle.yaml'), YAML.dump(manifest));

    const agents = await discoverBundles(testBundlesDir);

    // Should gracefully skip invalid bundle and find valid one
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe('agent-1');
  });
});
