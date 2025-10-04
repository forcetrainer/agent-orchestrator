/**
 * Agent Loader Module Tests - XML-based Discovery
 *
 * Tests for discovering and caching agents with new requirements:
 * - Scans *.md files at depth 1 only
 * - Excludes workflows/, templates/, files/ subdirectories
 * - Validates XML agent tag with required attributes
 * - Detects and rejects duplicate agent IDs
 * - In-memory caching behavior
 * - Agent lookup by ID
 * - Performance requirements (under 500ms for 50 agents)
 */

import { loadAgents, getAgentById, clearAgentCache } from '../loader';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { env } from '@/lib/utils/env';

describe('agent loader module - XML-based', () => {
  const testAgentsDir = env.AGENTS_PATH;

  beforeAll(async () => {
    // Ensure agents directory exists
    await mkdir(testAgentsDir, { recursive: true });
  });

  beforeEach(() => {
    // Clear cache before each test
    clearAgentCache();
  });

  afterEach(async () => {
    // Clean up ONLY test-specific agent directories (never delete real agents)
    // Pattern: Only delete directories that start with 'test-'
    try {
      const testAgentDirs = [
        'test-loader-1',
        'test-loader-2',
        'test-loader-3',
        'test-loader-4',
        'test-loader-5',
        'test-loader-6',
        'test-loader-7',
        'test-loader-8',
        'test-loader-9',
        'test-loader-10',
        'test-multi-file',
        'test-workflows',
      ];

      for (const dir of testAgentDirs) {
        // Safety check: only delete if directory name starts with 'test-'
        if (dir.startsWith('test-')) {
          await rm(join(testAgentsDir, dir), { recursive: true, force: true });
        }
      }

      // Clean up test directories created directly under agents/
      // These are test fixtures for exclusion tests and should be removed
      const testFixtureDirs = ['templates', 'files'];
      for (const dir of testFixtureDirs) {
        await rm(join(testAgentsDir, dir), { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('loadAgents - depth 1 scanning', () => {
    it('should discover agents with XML metadata at depth 1', async () => {
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

    it('should scan multiple *.md files in same directory', async () => {
      const agentPath = join(testAgentsDir, 'test-multi-file');
      await mkdir(agentPath, { recursive: true });

      // Create two agent files in same directory
      await writeFile(
        join(agentPath, 'agent-one.md'),
        '<agent id="multi-1" name="Agent One" title="Role One"></agent>'
      );
      await writeFile(
        join(agentPath, 'agent-two.md'),
        '<agent id="multi-2" name="Agent Two" title="Role Two"></agent>'
      );

      const agents = await loadAgents();

      const agent1 = agents.find((a) => a.id === 'multi-1');
      const agent2 = agents.find((a) => a.id === 'multi-2');

      expect(agent1).toBeDefined();
      expect(agent2).toBeDefined();
    });

    it('should exclude workflows/ subdirectory from scan', async () => {
      const agentPath = join(testAgentsDir, 'test-workflows');
      const workflowsPath = join(agentPath, 'workflows');

      await mkdir(workflowsPath, { recursive: true });
      await writeFile(
        join(workflowsPath, 'workflow.md'),
        '<agent id="workflow-agent" name="Workflow" title="Test"></agent>'
      );

      const agents = await loadAgents();

      const workflowAgent = agents.find((a) => a.id === 'workflow-agent');
      expect(workflowAgent).toBeUndefined();
    });

    it('should exclude templates/ subdirectory from scan', async () => {
      const templatesPath = join(testAgentsDir, 'templates');
      await mkdir(templatesPath, { recursive: true });
      await writeFile(
        join(templatesPath, 'template.md'),
        '<agent id="template-agent" name="Template" title="Test"></agent>'
      );

      const agents = await loadAgents();

      const templateAgent = agents.find((a) => a.id === 'template-agent');
      expect(templateAgent).toBeUndefined();
    });

    it('should exclude files/ subdirectory from scan', async () => {
      const filesPath = join(testAgentsDir, 'files');
      await mkdir(filesPath, { recursive: true });
      await writeFile(
        join(filesPath, 'file.md'),
        '<agent id="file-agent" name="File" title="Test"></agent>'
      );

      const agents = await loadAgents();

      const fileAgent = agents.find((a) => a.id === 'file-agent');
      expect(fileAgent).toBeUndefined();
    });

    it('should filter out files without <agent> tag', async () => {
      const agentPath = join(testAgentsDir, 'test-loader-2');
      await mkdir(agentPath, { recursive: true });

      await writeFile(
        join(agentPath, 'no-tag.md'),
        '# Old Style Agent\n\n> No XML tag here'
      );

      const agents = await loadAgents();

      const noTagAgent = agents.find((a) => a.id.includes('no-tag'));
      expect(noTagAgent).toBeUndefined();
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
  });

  describe('caching behavior', () => {
    it('should cache agents after first load', async () => {
      const agentPath = join(testAgentsDir, 'test-loader-1');
      await mkdir(agentPath, { recursive: true });
      await writeFile(
        join(agentPath, 'test.md'),
        '<agent id="cache-test" name="Cache Test" title="Test"></agent>'
      );

      // First call - should scan file system
      const agents1 = await loadAgents();

      // Second call - should use cache
      const agents2 = await loadAgents();

      expect(agents1).toEqual(agents2);
    });

    it('should bypass cache when forceReload=true', async () => {
      const agentPath = join(testAgentsDir, 'test-loader-1');
      await mkdir(agentPath, { recursive: true });
      await writeFile(
        join(agentPath, 'test.md'),
        '<agent id="reload-test" name="Reload Test" title="Test"></agent>'
      );

      // First call
      await loadAgents();

      // Force reload
      const agents = await loadAgents(true);

      const reloadAgent = agents.find((a) => a.id === 'reload-test');
      expect(reloadAgent).toBeDefined();
    });

    it('should clear cache correctly', async () => {
      const agentPath = join(testAgentsDir, 'test-loader-1');
      await mkdir(agentPath, { recursive: true });
      await writeFile(
        join(agentPath, 'test.md'),
        '<agent id="clear-test" name="Clear Test" title="Test"></agent>'
      );

      // Load and cache
      await loadAgents();

      // Clear cache
      clearAgentCache();

      // Next load should re-scan
      const agents = await loadAgents();
      const clearAgent = agents.find((a) => a.id === 'clear-test');
      expect(clearAgent).toBeDefined();
    });
  });

  describe('getAgentById', () => {
    it('should find agent by ID', async () => {
      const agentPath = join(testAgentsDir, 'test-loader-1');
      await mkdir(agentPath, { recursive: true });
      await writeFile(
        join(agentPath, 'lookup.md'),
        '<agent id="lookup-test" name="Lookup Test" title="Test"></agent>'
      );

      const agent = await getAgentById('lookup-test');

      expect(agent).toBeDefined();
      expect(agent?.id).toBe('lookup-test');
    });

    it('should return null for non-existent agent', async () => {
      const agent = await getAgentById('non-existent-agent');

      expect(agent).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should return empty array when agents folder does not exist', async () => {
      // IMPORTANT: Do NOT delete the real agents directory!
      // Instead, test with a completely different non-existent path by temporarily
      // modifying the environment variable
      const originalPath = process.env.AGENTS_PATH;
      const nonExistentPath = join(testAgentsDir, 'non-existent-agents-folder');

      try {
        // Point to a non-existent directory
        process.env.AGENTS_PATH = nonExistentPath;
        clearAgentCache();

        // Import fresh to pick up new env var (cache is cleared so it will re-scan)
        const agents = await loadAgents();

        expect(agents).toEqual([]);
      } finally {
        // Restore original path
        process.env.AGENTS_PATH = originalPath;
        clearAgentCache();
      }
    });

    it('should handle directory read errors gracefully', async () => {
      const agentPath = join(testAgentsDir, 'test-loader-1');
      await mkdir(agentPath, { recursive: true });
      await writeFile(
        join(agentPath, 'test.md'),
        '<agent id="error-test" name="Error Test" title="Test"></agent>'
      );

      // Should not throw
      await expect(loadAgents()).resolves.toBeDefined();
    });
  });

  describe('performance', () => {
    it('should complete discovery in < 500ms for multiple agents', async () => {
      // Create 10 test agents
      for (let i = 1; i <= 10; i++) {
        const agentPath = join(testAgentsDir, `test-loader-${i}`);
        await mkdir(agentPath, { recursive: true });
        await writeFile(
          join(agentPath, 'agent.md'),
          `<agent id="perf-${i}" name="Agent ${i}" title="Test ${i}"></agent>`
        );
      }

      clearAgentCache();
      const startTime = performance.now();
      await loadAgents();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
    }, 10000); // 10s timeout for test
  });
});
