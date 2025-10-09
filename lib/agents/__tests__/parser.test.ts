/**
 * Agent Parser Module Tests
 *
 * Minimal high-value tests:
 * - Extract valid agent metadata (critical path)
 * - Return null for missing/invalid agent tag (error handling)
 * - Handle missing required attributes (edge case)
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
    await mkdir(testAgentPath, { recursive: true });
  });

  afterEach(async () => {
    try {
      const files = ['valid-agent.md', 'no-tag.md', 'missing-attrs.md'];
      for (const file of files) {
        await rm(join(testAgentPath, file), { force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    await rm(testAgentPath, { recursive: true, force: true });
  });

  it('should extract valid agent metadata from XML', async () => {
    const agentContent = `<agent id="test-agent" name="Test Agent" title="Test Role" icon="🧪">
  <persona>
    <role>Senior Developer + Technical Lead</role>
  </persona>
</agent>`;
    const filePath = join(testAgentPath, 'valid-agent.md');
    await writeFile(filePath, agentContent);

    const agent = await parseAgentFile(filePath);

    expect(agent).toMatchObject({
      id: 'test-agent',
      name: 'Test Agent',
      title: 'Test Role',
      icon: '🧪',
      description: 'Senior Developer + Technical Lead',
      path: testAgentPath,
      mainFile: filePath,
    });
  });

  it('should return null when agent tag is missing or invalid', async () => {
    const noTagContent = `# Old Style Agent\n\nNo XML tag present`;
    const filePath = join(testAgentPath, 'no-tag.md');
    await writeFile(filePath, noTagContent);

    const agent = await parseAgentFile(filePath);

    expect(agent).toBeNull();
  });

  it('should return null when required attributes are missing', async () => {
    const missingAttrsContent = `<agent id="missing-attrs" name="Test">
  <!-- Missing title attribute -->
</agent>`;
    const filePath = join(testAgentPath, 'missing-attrs.md');
    await writeFile(filePath, missingAttrsContent);

    const agent = await parseAgentFile(filePath);

    expect(agent).toBeNull();
  });
});
