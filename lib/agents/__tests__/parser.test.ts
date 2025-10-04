/**
 * Agent Parser Module Tests
 *
 * Tests for extracting metadata from agent.md files:
 * - Name extraction from markdown headings
 * - Description extraction from blockquotes
 * - Error handling for missing agent.md files
 * - Fallback values for invalid metadata
 */

import { parseAgentFile } from '../parser';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { env } from '@/lib/utils/env';

describe('agent parser module', () => {
  const testAgentsDir = resolve(env.AGENTS_PATH);
  const testAgentId = 'test-parser-agent';
  const testAgentPath = join(testAgentsDir, testAgentId);

  beforeAll(async () => {
    // Ensure test directory exists
    await mkdir(testAgentPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up agent.md after each test
    try {
      await rm(join(testAgentPath, 'agent.md'), { force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Clean up test agent directory
    await rm(testAgentPath, { recursive: true, force: true });
  });

  describe('parseAgentFile', () => {
    it('should extract name from first markdown heading', async () => {
      const agentContent = `# My Test Agent

> A description

Some other content
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).not.toBeNull();
      expect(agent?.name).toBe('My Test Agent');
    });

    it('should extract description from first blockquote', async () => {
      const agentContent = `# Test Agent

> This is a test agent for validation

More content here
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).not.toBeNull();
      expect(agent?.description).toBe('This is a test agent for validation');
    });

    it('should extract both name and description correctly', async () => {
      const agentContent = `# Complete Agent

> A fully featured test agent with all metadata

## Additional sections
More content
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).toMatchObject({
        id: testAgentId,
        name: 'Complete Agent',
        description: 'A fully featured test agent with all metadata',
        path: testAgentPath,
        mainFile: join(testAgentPath, 'agent.md'),
      });
    });

    it('should use fallback name when heading missing', async () => {
      const agentContent = `> Description only

No heading present
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).not.toBeNull();
      expect(agent?.name).toBe(testAgentId); // Falls back to agent ID
    });

    it('should use fallback description when blockquote missing', async () => {
      const agentContent = `# Agent Name

No blockquote present
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).not.toBeNull();
      expect(agent?.description).toBe('No description available');
    });

    it('should return null when agent.md is missing', async () => {
      // Don't create agent.md file
      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).toBeNull();
    });

    it('should handle multiline descriptions (first line only)', async () => {
      const agentContent = `# Test Agent

> First line of description
> Second line should be ignored

Content
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).not.toBeNull();
      expect(agent?.description).toBe('First line of description');
    });

    it('should handle headings with extra whitespace', async () => {
      const agentContent = `#   Whitespace Agent

>   Whitespace description

Content
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).not.toBeNull();
      expect(agent?.name).toBe('Whitespace Agent');
      expect(agent?.description).toBe('Whitespace description');
    });

    it('should handle headings with markdown formatting', async () => {
      const agentContent = `# **Bold Agent** with _italic_

> Description with **bold** text

Content
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).not.toBeNull();
      expect(agent?.name).toBe('**Bold Agent** with _italic_'); // Preserves markdown
    });

    it('should set correct path and mainFile fields', async () => {
      const agentContent = `# Path Test

> Testing path fields

Content
`;
      await writeFile(join(testAgentPath, 'agent.md'), agentContent);

      const agent = await parseAgentFile(testAgentPath, testAgentId);

      expect(agent).not.toBeNull();
      expect(agent?.path).toBe(testAgentPath);
      expect(agent?.mainFile).toBe(join(testAgentPath, 'agent.md'));
    });
  });
});
