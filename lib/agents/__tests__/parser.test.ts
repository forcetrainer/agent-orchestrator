/**
 * Agent Parser Module Tests
 *
 * Tests for extracting metadata from agent markdown files with XML tags:
 * - ID, name, title extraction from <agent> tag attributes
 * - Optional icon extraction
 * - Description extraction from <persona><role> content
 * - Error handling for missing <agent> tag
 * - Filtering out files without valid XML metadata
 */

import { parseAgentFile } from '../parser';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { env } from '@/lib/utils/env';

describe('agent parser module - XML-based', () => {
  const testAgentsDir = resolve(env.AGENTS_PATH);
  const testAgentDir = 'test-parser-agent';
  const testAgentPath = join(testAgentsDir, testAgentDir);

  beforeAll(async () => {
    // Ensure test directory exists
    await mkdir(testAgentPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files after each test
    try {
      const files = ['test-agent.md', 'invalid-agent.md', 'no-tag.md'];
      for (const file of files) {
        await rm(join(testAgentPath, file), { force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Clean up test agent directory
    await rm(testAgentPath, { recursive: true, force: true });
  });

  describe('parseAgentFile', () => {
    it('should extract id, name, title from <agent> tag', async () => {
      const agentContent = `<agent id="test-id" name="Test Agent" title="Test Role">
  <persona>
    <role>Test role description</role>
  </persona>
</agent>`;
      const filePath = join(testAgentPath, 'test-agent.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).not.toBeNull();
      expect(agent?.id).toBe('test-id');
      expect(agent?.name).toBe('Test Agent');
      expect(agent?.title).toBe('Test Role');
    });

    it('should extract optional icon from <agent> tag', async () => {
      const agentContent = `<agent id="icon-test" name="Icon Agent" title="Icon Role" icon="🧪">
  <persona>
    <role>Agent with icon</role>
  </persona>
</agent>`;
      const filePath = join(testAgentPath, 'icon-agent.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).not.toBeNull();
      expect(agent?.icon).toBe('🧪');
    });

    it('should extract description from <persona><role> content', async () => {
      const agentContent = `<agent id="desc-test" name="Description Test" title="Test">
  <persona>
    <role>Senior Developer + Technical Lead</role>
  </persona>
</agent>`;
      const filePath = join(testAgentPath, 'desc-agent.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).not.toBeNull();
      expect(agent?.description).toBe('Senior Developer + Technical Lead');
    });

    it('should return null when <agent> tag is missing', async () => {
      const agentContent = `# Old Style Agent

> This uses old markdown format

No XML tag present
`;
      const filePath = join(testAgentPath, 'no-tag.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).toBeNull();
    });

    it('should return null when required attributes are missing', async () => {
      const agentContent = `<agent id="missing-attrs" name="Test">
  <!-- Missing title attribute -->
</agent>`;
      const filePath = join(testAgentPath, 'invalid-agent.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).toBeNull();
    });

    it('should handle agents without description gracefully', async () => {
      const agentContent = `<agent id="no-desc" name="No Description" title="Test Role">
  <persona>
    <!-- No role element -->
  </persona>
</agent>`;
      const filePath = join(testAgentPath, 'no-desc.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).not.toBeNull();
      expect(agent?.description).toBeUndefined();
    });

    it('should trim whitespace from extracted values', async () => {
      const agentContent = `<agent id="  whitespace-id  " name="  Whitespace Agent  " title="  Whitespace Title  " icon="  🧪  ">
  <persona>
    <role>  Whitespace description  </role>
  </persona>
</agent>`;
      const filePath = join(testAgentPath, 'whitespace.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).not.toBeNull();
      expect(agent?.id).toBe('whitespace-id');
      expect(agent?.name).toBe('Whitespace Agent');
      expect(agent?.title).toBe('Whitespace Title');
      expect(agent?.icon).toBe('🧪');
      expect(agent?.description).toBe('Whitespace description');
    });

    it('should extract correct path and mainFile fields', async () => {
      const agentContent = `<agent id="path-test" name="Path Test" title="Test">
  <persona>
    <role>Testing paths</role>
  </persona>
</agent>`;
      const filePath = join(testAgentPath, 'path-test.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).not.toBeNull();
      expect(agent?.path).toBe(testAgentPath);
      expect(agent?.mainFile).toBe(filePath);
    });

    it('should handle real BMAD agent format', async () => {
      const agentContent = `<!-- Powered by BMAD-CORE™ -->

# Test Agent

<agent id="bmad/test/agent" name="TestBot" title="Test Agent" icon="🧪">
  <persona>
    <role>Test Agent + System Validator</role>
    <identity>Experienced tester</identity>
  </persona>

  <critical-actions>
    <i>Test critical actions</i>
  </critical-actions>

  <cmds>
    <c cmd="*help">Show help</c>
  </cmds>
</agent>`;
      const filePath = join(testAgentPath, 'bmad-test.md');
      await writeFile(filePath, agentContent);

      const agent = await parseAgentFile(filePath);

      expect(agent).toMatchObject({
        id: 'bmad/test/agent',
        name: 'TestBot',
        title: 'Test Agent',
        icon: '🧪',
        description: 'Test Agent + System Validator',
        path: testAgentPath,
        mainFile: filePath,
      });
    });

    it('should return null for file that does not exist', async () => {
      const nonExistentPath = join(testAgentPath, 'does-not-exist.md');

      const agent = await parseAgentFile(nonExistentPath);

      expect(agent).toBeNull();
    });
  });
});
