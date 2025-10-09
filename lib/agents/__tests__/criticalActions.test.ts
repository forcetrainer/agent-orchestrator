/**
 * Critical Actions Processor Tests
 *
 * Minimal high-value tests:
 * - Load file and resolve variables (critical path)
 * - Error halts initialization (error handling)
 * - Security: path traversal blocked (edge case)
 */

import { processCriticalActions } from '../criticalActions';
import type { Agent } from '@/types';
import { writeFile, mkdir, rm } from 'fs/promises';
import { resolve } from 'path';

describe('criticalActions', () => {
  const projectRoot = process.cwd();
  const testBundleRoot = resolve(projectRoot, 'test-bundles/critical-actions-test');

  beforeAll(async () => {
    await mkdir(testBundleRoot, { recursive: true });
  });

  afterAll(async () => {
    await rm(testBundleRoot, { recursive: true, force: true });
  });

  it('should load file and resolve variables from config', async () => {
    const agent: Agent = {
      id: 'test-agent',
      name: 'Test Agent',
      title: 'Test',
      path: testBundleRoot,
      mainFile: `${testBundleRoot}/agent.md`,
      fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load into memory {bundle-root}/config.yaml and set variables: user_name</i>
    <i>Remember the user's name is {user_name}</i>
  </critical-actions>
</agent>
      `,
    };

    await writeFile(
      resolve(testBundleRoot, 'config.yaml'),
      'user_name: Bryan\nproject_name: Test Project'
    );

    const result = await processCriticalActions(agent, testBundleRoot);

    expect(result.messages).toHaveLength(2);
    expect(result.config).toEqual({
      user_name: 'Bryan',
      project_name: 'Test Project',
    });
    expect(result.messages[1].content).toContain("Remember the user's name is Bryan");
  });

  it('should throw error and halt initialization on file load failure', async () => {
    const agent: Agent = {
      id: 'test-agent',
      name: 'Test Agent',
      title: 'Test',
      path: testBundleRoot,
      mainFile: `${testBundleRoot}/agent.md`,
      fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/missing-file.yaml</i>
  </critical-actions>
</agent>
      `,
    };

    await expect(processCriticalActions(agent, testBundleRoot)).rejects.toThrow(
      /Critical action failed.*Load.*missing-file\.yaml/
    );
  });

  it('should block path traversal attempts in critical actions', async () => {
    const agent: Agent = {
      id: 'test-agent',
      name: 'Test Agent',
      title: 'Test',
      path: testBundleRoot,
      mainFile: `${testBundleRoot}/agent.md`,
      fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/../../etc/passwd</i>
  </critical-actions>
</agent>
      `,
    };

    await expect(processCriticalActions(agent, testBundleRoot)).rejects.toThrow(
      'Critical action failed'
    );
  });
});
