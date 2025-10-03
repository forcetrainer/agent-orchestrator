/**
 * File Reader Module Tests
 *
 * Tests for reading files from agents and output folders:
 * - Dual-folder search pattern
 * - Error handling (ENOENT, EACCES)
 * - Performance requirements
 */

import { readFileContent } from '../reader';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { env } from '@/lib/utils/env';

describe('reader module', () => {
  const testAgentsDir = env.AGENTS_PATH;
  const testOutputDir = env.OUTPUT_PATH;
  const testFile = 'test-read.txt';
  const testContent = 'Hello from test file';

  beforeAll(async () => {
    // Ensure test directories exist
    await mkdir(testAgentsDir, { recursive: true });
    await mkdir(testOutputDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await rm(join(testAgentsDir, testFile), { force: true });
      await rm(join(testOutputDir, testFile), { force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('readFileContent', () => {
    it('should read file from agents folder', async () => {
      // Create test file in agents folder
      await writeFile(join(testAgentsDir, testFile), testContent);

      const content = await readFileContent(testFile);
      expect(content).toBe(testContent);
    });

    it('should read file from output folder when not in agents', async () => {
      // Create test file in output folder only
      await writeFile(join(testOutputDir, testFile), testContent);

      const content = await readFileContent(testFile);
      expect(content).toBe(testContent);
    });

    it('should prioritize agents folder over output folder', async () => {
      const agentsContent = 'From agents folder';
      const outputContent = 'From output folder';

      // Create files in both locations
      await writeFile(join(testAgentsDir, testFile), agentsContent);
      await writeFile(join(testOutputDir, testFile), outputContent);

      const content = await readFileContent(testFile);
      expect(content).toBe(agentsContent); // Should read from agents first
    });

    it('should throw error when file not found in either location', async () => {
      await expect(readFileContent('nonexistent.txt')).rejects.toThrow(
        'File not found: nonexistent.txt'
      );
    });

    it('should handle files in subdirectories', async () => {
      const subPath = 'templates/test.md';
      const fullPath = join(testAgentsDir, subPath);

      await mkdir(join(testAgentsDir, 'templates'), { recursive: true });
      await writeFile(fullPath, testContent);

      const content = await readFileContent(subPath);
      expect(content).toBe(testContent);

      // Cleanup
      await rm(join(testAgentsDir, 'templates'), { recursive: true, force: true });
    });

    it('should reject directory traversal attempts', async () => {
      await expect(readFileContent('../../etc/passwd')).rejects.toThrow();
    });

    it('should complete in <100ms for small files', async () => {
      const smallFile = 'small.txt';
      const smallContent = 'x'.repeat(1000); // 1KB
      await writeFile(join(testAgentsDir, smallFile), smallContent);

      const startTime = performance.now();
      await readFileContent(smallFile);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);

      // Cleanup
      await rm(join(testAgentsDir, smallFile), { force: true });
    });

    it('should complete in <100ms for 1MB files', async () => {
      const largeFile = 'large.txt';
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      await writeFile(join(testAgentsDir, largeFile), largeContent);

      const startTime = performance.now();
      await readFileContent(largeFile);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);

      // Cleanup
      await rm(join(testAgentsDir, largeFile), { force: true });
    });
  });
});
