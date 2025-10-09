/**
 * Agent Loader Module Tests
 *
 * Minimal high-value tests:
 * - Discover agents from bundle.yaml (critical path)
 * - Reject duplicate agent IDs (business logic)
 * - Handle missing/invalid manifests gracefully (error handling)
 */

import { loadAgents, clearAgentCache } from '../loader';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { env } from '@/lib/utils/env';
import * as YAML from 'js-yaml';

describe('agent loader module - XML-based', () => {
  const testAgentsDir = env.AGENTS_PATH;

  beforeEach(() => {
    clearAgentCache();
  });

  afterEach(async () => {
    try {
      const testAgentDirs = ['test-loader-1', 'test-loader-2', 'invalid-bundle'];
      for (const dir of testAgentDirs) {
        if (dir.startsWith('test-')) {
          await rm(join(testAgentsDir, dir), { recursive: true, force: true });
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should discover agents with XML metadata from bundle.yaml', async () => {
    const agentPath = join(testAgentsDir, 'test-loader-1');
    await mkdir(agentPath, { recursive: true });

    await writeFile(
      join(agentPath, 'test-agent.md'),
      '<agent id="test-1" name="Test Agent 1" title="Test Role">\n' +
      '  <persona><role>Test description</role></persona>\n' +
      '</agent>'
    );

    const agents = await loadAgents();

    const testAgent = agents.find((a) => a.id === 'test-1');
    expect(testAgent).toBeDefined();
    expect(testAgent?.name).toBe('Test Agent 1');
    expect(testAgent?.title).toBe('Test Role');
    expect(testAgent?.description).toBe('Test description');
  });

  it('should detect and reject duplicate agent IDs', async () => {
    const agent1Path = join(testAgentsDir, 'test-loader-1');
    const agent2Path = join(testAgentsDir, 'test-loader-2');

    await mkdir(agent1Path, { recursive: true });
    await mkdir(agent2Path, { recursive: true });

    // Both files have same ID
    await writeFile(
      join(agent1Path, 'agent1.md'),
      '<agent id="duplicate-id" name="Agent 1" title="Test"></agent>'
    );
    await writeFile(
      join(agent2Path, 'agent2.md'),
      '<agent id="duplicate-id" name="Agent 2" title="Test"></agent>'
    );

    const agents = await loadAgents();

    // Only one should be loaded, the other rejected
    const duplicates = agents.filter((a) => a.id === 'duplicate-id');
    expect(duplicates.length).toBe(1);
  });

  it('should handle invalid manifests and continue scanning', async () => {
    // Create invalid bundle
    const invalidBundlePath = join(testAgentsDir, 'invalid-bundle');
    await mkdir(invalidBundlePath, { recursive: true });
    await writeFile(join(invalidBundlePath, 'agent.md'), 'invalid content without agent tag');

    // Create valid bundle
    const validBundlePath = join(testAgentsDir, 'test-loader-1');
    await mkdir(validBundlePath, { recursive: true });
    await writeFile(
      join(validBundlePath, 'valid.md'),
      '<agent id="valid-agent" name="Valid" title="Test"></agent>'
    );

    const agents = await loadAgents();

    // Should find the valid agent despite invalid bundle
    const validAgent = agents.find((a) => a.id === 'valid-agent');
    expect(validAgent).toBeDefined();
  });
});
