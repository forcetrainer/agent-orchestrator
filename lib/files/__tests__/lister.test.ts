/**
 * File Lister Module Tests
 *
 * Tests for listing files and directories:
 * - Dual-folder search pattern
 * - Recursive vs non-recursive listing
 * - FileNode structure validation
 * - Error handling
 * - Performance requirements
 */

import { listFiles } from '../lister';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { env } from '@/lib/utils/env';

describe('lister module', () => {
  const testAgentsDir = env.AGENTS_PATH;
  const testOutputDir = env.OUTPUT_PATH;

  beforeAll(async () => {
    // Ensure test directories exist
    await mkdir(testAgentsDir, { recursive: true });
    await mkdir(testOutputDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directories
    try {
      await rm(join(testAgentsDir, 'test-list'), { recursive: true, force: true });
      await rm(join(testOutputDir, 'test-list'), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('listFiles', () => {
    it('should list files in agents folder', async () => {
      const testDir = join(testAgentsDir, 'test-list');
      await mkdir(testDir, { recursive: true });
      await writeFile(join(testDir, 'file1.txt'), 'content');
      await writeFile(join(testDir, 'file2.txt'), 'content');

      const files = await listFiles('test-list');

      expect(files).toHaveLength(2);
      expect(files.map(f => f.name).sort()).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should list files in output folder when not in agents', async () => {
      const testDir = join(testOutputDir, 'test-list');
      await mkdir(testDir, { recursive: true });
      await writeFile(join(testDir, 'output1.txt'), 'content');

      const files = await listFiles('test-list');

      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('output1.txt');
    });

    it('should prioritize agents folder over output folder', async () => {
      const agentsTestDir = join(testAgentsDir, 'test-list');
      const outputTestDir = join(testOutputDir, 'test-list');

      await mkdir(agentsTestDir, { recursive: true });
      await mkdir(outputTestDir, { recursive: true });
      await writeFile(join(agentsTestDir, 'agents.txt'), 'content');
      await writeFile(join(outputTestDir, 'output.txt'), 'content');

      const files = await listFiles('test-list');

      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('agents.txt'); // Should list from agents first
    });

    it('should return FileNode objects with correct structure', async () => {
      const testDir = join(testAgentsDir, 'test-list');
      await mkdir(testDir, { recursive: true });
      await writeFile(join(testDir, 'test.txt'), 'content');

      const files = await listFiles('test-list');

      expect(files[0]).toMatchObject({
        name: 'test.txt',
        path: 'test-list/test.txt',
        type: 'file',
        size: expect.any(Number),
      });
    });

    it('should distinguish files from directories', async () => {
      const testDir = join(testAgentsDir, 'test-list');
      await mkdir(join(testDir, 'subdir'), { recursive: true });
      await writeFile(join(testDir, 'file.txt'), 'content');

      const files = await listFiles('test-list');

      const file = files.find(f => f.name === 'file.txt');
      const dir = files.find(f => f.name === 'subdir');

      expect(file?.type).toBe('file');
      expect(file?.size).toBeDefined();
      expect(dir?.type).toBe('directory');
      expect(dir?.size).toBeUndefined();
    });

    it('should support non-recursive listing (no children)', async () => {
      const testDir = join(testAgentsDir, 'test-list');
      await mkdir(join(testDir, 'subdir'), { recursive: true });
      await writeFile(join(testDir, 'subdir', 'nested.txt'), 'content');

      const files = await listFiles('test-list', false);

      const dir = files.find(f => f.name === 'subdir');
      expect(dir?.children).toBeUndefined();
    });

    it('should support recursive listing with children', async () => {
      const testDir = join(testAgentsDir, 'test-list');
      await mkdir(join(testDir, 'subdir'), { recursive: true });
      await writeFile(join(testDir, 'subdir', 'nested.txt'), 'content');

      const files = await listFiles('test-list', true);

      const dir = files.find(f => f.name === 'subdir');
      expect(dir?.children).toHaveLength(1);
      expect(dir?.children?.[0].name).toBe('nested.txt');
    });

    it('should handle empty directories', async () => {
      const testDir = join(testAgentsDir, 'test-list');
      await mkdir(testDir, { recursive: true });

      const files = await listFiles('test-list');

      expect(files).toHaveLength(0);
    });

    it('should throw error when directory not found', async () => {
      await expect(listFiles('nonexistent-dir')).rejects.toThrow(
        'Directory not found: nonexistent-dir'
      );
    });

    it('should reject directory traversal attempts', async () => {
      await expect(listFiles('../../etc')).rejects.toThrow();
    });

    it('should handle root directory listing (empty path)', async () => {
      // List root of agents folder
      const files = await listFiles('');

      expect(Array.isArray(files)).toBe(true);
      // Should have at least some files/dirs in agents root
    });

    it('should complete in <100ms for small directories', async () => {
      const testDir = join(testAgentsDir, 'test-list');
      await mkdir(testDir, { recursive: true });
      for (let i = 0; i < 10; i++) {
        await writeFile(join(testDir, `file${i}.txt`), 'content');
      }

      const startTime = performance.now();
      await listFiles('test-list');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle deeply nested recursive listings', async () => {
      const testDir = join(testAgentsDir, 'test-list');
      await mkdir(join(testDir, 'a', 'b', 'c'), { recursive: true });
      await writeFile(join(testDir, 'a', 'b', 'c', 'deep.txt'), 'content');

      const files = await listFiles('test-list', true);

      const dirA = files.find(f => f.name === 'a');
      const dirB = dirA?.children?.find(f => f.name === 'b');
      const dirC = dirB?.children?.find(f => f.name === 'c');
      const deepFile = dirC?.children?.find(f => f.name === 'deep.txt');

      expect(deepFile?.name).toBe('deep.txt');
      expect(deepFile?.type).toBe('file');
    });
  });
});
