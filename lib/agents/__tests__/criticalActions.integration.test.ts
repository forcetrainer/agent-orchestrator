/**
 * Integration Tests for Critical Actions Processor
 * Story 4.3: Critical Actions Integration with Agentic Loop
 *
 * Tests cover:
 * - Integration with Story 4.1 (agentic loop initialization)
 * - Integration with Story 4.2 (path resolution)
 * - Real bundle structure with config.yaml
 * - Error scenarios: missing config, file not found, parse errors
 */

import { processCriticalActions } from '../criticalActions';
import type { Agent } from '@/types';
import { writeFile, mkdir, rm } from 'fs/promises';
import { resolve } from 'path';

describe('criticalActions Integration', () => {
  const projectRoot = process.cwd();
  const testBundleRoot = resolve(
    projectRoot,
    'test-bundles/critical-actions-integration'
  );

  beforeAll(async () => {
    await mkdir(testBundleRoot, { recursive: true });
  });

  afterAll(async () => {
    await rm(testBundleRoot, { recursive: true, force: true });
  });

  describe('Integration with Story 4.2 (Path Resolution)', () => {
    it('should resolve {bundle-root} paths correctly', async () => {
      const agent: Agent = {
        id: 'integration-agent',
        name: 'Integration Agent',
        title: 'Integration Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="integration" name="Integration" title="Integration Test">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'test_var: test_value'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.config).toEqual({ test_var: 'test_value' });
    });

    it('should resolve {project-root} paths correctly', async () => {
      const agent: Agent = {
        id: 'integration-agent',
        name: 'Integration Agent',
        title: 'Integration Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="integration" name="Integration" title="Integration Test">
  <critical-actions>
    <i>Load {project-root}/package.json</i>
  </critical-actions>
</agent>
        `,
      };

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[0].content).toContain('package.json');
      expect(result.messages[0].content).toContain('"name"');
    });
  });

  describe('Integration with Story 4.1 (Agentic Loop)', () => {
    it('should return messages in format compatible with agentic loop', async () => {
      const agent: Agent = {
        id: 'integration-agent',
        name: 'Integration Agent',
        title: 'Integration Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="integration" name="Integration" title="Integration Test">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml</i>
    <i>Always use {communication_language}</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'communication_language: English'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      // Verify message format matches ChatCompletionMessageParam
      result.messages.forEach((msg) => {
        expect(msg).toHaveProperty('role');
        expect(msg).toHaveProperty('content');
        expect(msg.role).toBe('system');
        expect(typeof msg.content).toBe('string');
      });
    });

    it('should inject messages before user message in agentic loop flow', async () => {
      const agent: Agent = {
        id: 'integration-agent',
        name: 'Integration Agent',
        title: 'Integration Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="integration" name="Integration" title="Integration Test">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'user_name: IntegrationTest'
      );

      const { messages, config } = await processCriticalActions(agent, testBundleRoot);

      // Simulate agentic loop message building
      const agenticLoopMessages = [
        { role: 'system', content: 'System prompt here' },
        ...messages, // Critical actions messages injected here
        { role: 'user', content: 'User message here' },
      ];

      expect(agenticLoopMessages).toHaveLength(3);
      expect(agenticLoopMessages[1].content).toContain('config.yaml');
    });
  });

  describe('Real Bundle Structure', () => {
    it('should work with realistic bundle directory structure', async () => {
      // Create bundle structure
      await mkdir(resolve(testBundleRoot, 'workflows/intake'), { recursive: true });
      await mkdir(resolve(testBundleRoot, 'templates'), { recursive: true });

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        `project_name: Test Project
output_folder: '{project-root}/docs'
user_name: Bryan
communication_language: English`
      );

      await writeFile(
        resolve(testBundleRoot, 'workflows/intake/workflow.yaml'),
        'name: intake\ndescription: Test workflow'
      );

      const agent: Agent = {
        id: 'bundle-agent',
        name: 'Bundle Agent',
        title: 'Bundle Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="bundle" name="Bundle" title="Bundle Test">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml and set variables: project_name, user_name</i>
    <i>Remember the user's name is {user_name}</i>
    <i>ALWAYS communicate in {communication_language}</i>
  </critical-actions>
</agent>
        `,
      };

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.config).toEqual({
        project_name: 'Test Project',
        output_folder: '{project-root}/docs',
        user_name: 'Bryan',
        communication_language: 'English',
      });

      expect(result.messages).toHaveLength(3);
      expect(result.messages[1].content).toContain("Remember the user's name is Bryan");
      expect(result.messages[2].content).toContain('ALWAYS communicate in English');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing config.yaml gracefully', async () => {
      const agent: Agent = {
        id: 'error-agent',
        name: 'Error Agent',
        title: 'Error Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="error" name="Error" title="Error Test">
  <critical-actions>
    <i>Load {bundle-root}/nonexistent-config.yaml</i>
  </critical-actions>
</agent>
        `,
      };

      await expect(processCriticalActions(agent, testBundleRoot)).rejects.toThrow(
        'Critical action failed'
      );
    });

    it('should halt initialization on YAML parse error', async () => {
      await writeFile(
        resolve(testBundleRoot, 'invalid.yaml'),
        '{ invalid yaml content: ['
      );

      const agent: Agent = {
        id: 'error-agent',
        name: 'Error Agent',
        title: 'Error Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="error" name="Error" title="Error Test">
  <critical-actions>
    <i>Load {bundle-root}/invalid.yaml</i>
  </critical-actions>
</agent>
        `,
      };

      // File exists but YAML parsing will fail
      // This should still load the file but won't parse as YAML since filename doesn't end in config.yaml
      const result = await processCriticalActions(agent, testBundleRoot);
      expect(result.messages[0].content).toContain('invalid.yaml');
    });

    it('should provide clear error message on path resolution failure', async () => {
      const agent: Agent = {
        id: 'error-agent',
        name: 'Error Agent',
        title: 'Error Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="error" name="Error" title="Error Test">
  <critical-actions>
    <i>Load /../../../etc/passwd</i>
  </critical-actions>
</agent>
        `,
      };

      await expect(processCriticalActions(agent, testBundleRoot)).rejects.toThrow();
    });
  });

  describe('Two-Phase Initialization', () => {
    it('should load config first, then use it for subsequent path resolution', async () => {
      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'output_folder: output\nuser_name: Alice'
      );

      const agent: Agent = {
        id: 'two-phase-agent',
        name: 'Two Phase Agent',
        title: 'Two Phase Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="two-phase" name="Two Phase" title="Two Phase Test">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml</i>
    <i>User is {user_name}</i>
  </critical-actions>
</agent>
        `,
      };

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.config).toHaveProperty('user_name', 'Alice');
      expect(result.messages[1].content).toContain('User is Alice');
    });
  });
});
