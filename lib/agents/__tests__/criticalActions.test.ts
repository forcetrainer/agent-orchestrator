/**
 * Unit Tests for Critical Actions Processor
 * Story 4.3: Implement Critical Actions Processor
 *
 * Tests cover:
 * - XML parsing (<critical-actions> section extraction)
 * - File load instruction pattern matching
 * - Config.yaml parsing and storage
 * - System message creation
 * - Variable resolution in instructions
 * - Error handling and initialization halting
 */

import { processCriticalActions } from '../criticalActions';
import type { Agent } from '@/types';
import { writeFile, mkdir, rm } from 'fs/promises';
import { resolve } from 'path';

describe('criticalActions', () => {
  const projectRoot = process.cwd();
  const testBundleRoot = resolve(projectRoot, 'test-bundles/critical-actions-test');

  // Setup test bundle directory
  beforeAll(async () => {
    await mkdir(testBundleRoot, { recursive: true });
  });

  // Cleanup test bundle directory
  afterAll(async () => {
    await rm(testBundleRoot, { recursive: true, force: true });
  });

  describe('AC-4.3.1: Parse <critical-actions> section from agent.md XML', () => {
    it('should extract critical actions from valid XML section', async () => {
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

      // Create config file
      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'user_name: Bryan\nproject_name: Test Project'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages).toHaveLength(2);
      expect(result.config).not.toBeNull();
    });

    it('should handle missing <critical-actions> section gracefully', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <persona>
    <role>Test Agent</role>
  </persona>
</agent>
        `,
      };

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages).toHaveLength(0);
      expect(result.config).toBeNull();
    });

    it('should handle empty <critical-actions> section', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
  </critical-actions>
</agent>
        `,
      };

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages).toHaveLength(0);
      expect(result.config).toBeNull();
    });
  });

  describe('AC-4.3.2: Extract file load instructions', () => {
    it('should match "Load into memory {path} and set variables: var1, var2" pattern', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load into memory {bundle-root}/config.yaml and set variables: user_name, project_name</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'user_name: Bryan\nproject_name: Test'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[0].content).toContain('Loaded file:');
      expect(result.messages[0].content).toContain('config.yaml');
    });

    it('should handle "Load {path}" without "and set variables" clause', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/data.txt</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(resolve(testBundleRoot, 'data.txt'), 'Test data content');

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[0].content).toContain('Loaded file:');
      expect(result.messages[0].content).toContain('Test data content');
    });
  });

  describe('AC-4.3.3: Execute file loads via read_file function', () => {
    it('should load file using resolved path', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/test-file.md</i>
  </critical-actions>
</agent>
        `,
      };

      const testContent = '# Test File\n\nThis is test content.';
      await writeFile(resolve(testBundleRoot, 'test-file.md'), testContent);

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[0].content).toContain(testContent);
    });

    it('should throw error if file not found', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/nonexistent.yaml</i>
  </critical-actions>
</agent>
        `,
      };

      await expect(processCriticalActions(agent, testBundleRoot)).rejects.toThrow(
        'Critical action failed'
      );
    });
  });

  describe('AC-4.3.4: Inject loaded file contents as system messages', () => {
    it('should create system message with [Critical Action] prefix', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/instructions.md</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'instructions.md'),
        '# Instructions\n\nFollow these steps.'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[0].role).toBe('system');
      expect(result.messages[0].content).toContain('[Critical Action] Loaded file:');
      expect(result.messages[0].content).toContain('Follow these steps');
    });
  });

  describe('AC-4.3.5: Parse config.yaml files and store variables', () => {
    it('should parse config.yaml and store in bundleConfig', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml and set variables: user_name, communication_language</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'user_name: Bryan\ncommunication_language: English\nproject_name: Agent Orchestrator'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.config).toEqual({
        user_name: 'Bryan',
        communication_language: 'English',
        project_name: 'Agent Orchestrator',
      });
    });

    it('should update PathContext.bundleConfig after loading config', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml</i>
    <i>Remember: {user_name}</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'user_name: TestUser'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      // Second message should have variable resolved
      expect(result.messages[1].content).toContain('Remember: TestUser');
    });
  });

  describe('AC-4.3.6: Execute non-file instructions as system messages', () => {
    it('should create system message for non-file instructions', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>ALWAYS communicate in English</i>
  </critical-actions>
</agent>
        `,
      };

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[0].role).toBe('system');
      expect(result.messages[0].content).toBe(
        '[Critical Instruction] ALWAYS communicate in English'
      );
    });

    it('should resolve {user_name} from bundleConfig in instructions', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml</i>
    <i>Remember the user's name is {user_name}</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(resolve(testBundleRoot, 'config.yaml'), 'user_name: Alice');

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[1].content).toContain("Remember the user's name is Alice");
    });

    it('should resolve {communication_language} from bundleConfig', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml</i>
    <i>ALWAYS communicate in {communication_language}</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'communication_language: Spanish'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[1].content).toContain('ALWAYS communicate in Spanish');
    });
  });

  describe('AC-4.3.7: All critical actions complete before agent accepts first user message', () => {
    it('should process all instructions in sequence', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/config.yaml</i>
    <i>Remember user: {user_name}</i>
    <i>Use language: {communication_language}</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(
        resolve(testBundleRoot, 'config.yaml'),
        'user_name: Bob\ncommunication_language: French'
      );

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].content).toContain('config.yaml');
      expect(result.messages[1].content).toContain('Remember user: Bob');
      expect(result.messages[2].content).toContain('Use language: French');
    });
  });

  describe('AC-4.3.8: Errors in critical actions halt initialization with clear message', () => {
    it('should throw error with instruction context on file load failure', async () => {
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

    it('should include error details in exception message', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>Load {bundle-root}/invalid.yaml</i>
  </critical-actions>
</agent>
        `,
      };

      await expect(processCriticalActions(agent, testBundleRoot)).rejects.toThrow(
        'Critical action failed'
      );
    });
  });

  describe('Message order preservation', () => {
    it('should preserve order of critical action messages', async () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        path: testBundleRoot,
        mainFile: `${testBundleRoot}/agent.md`,
        fullContent: `
<agent id="test" name="Test" title="Test Agent">
  <critical-actions>
    <i>First instruction</i>
    <i>Load {bundle-root}/config.yaml</i>
    <i>Third instruction with {user_name}</i>
  </critical-actions>
</agent>
        `,
      };

      await writeFile(resolve(testBundleRoot, 'config.yaml'), 'user_name: Test');

      const result = await processCriticalActions(agent, testBundleRoot);

      expect(result.messages[0].content).toContain('First instruction');
      expect(result.messages[1].content).toContain('config.yaml');
      expect(result.messages[2].content).toContain('Third instruction with Test');
    });
  });
});
