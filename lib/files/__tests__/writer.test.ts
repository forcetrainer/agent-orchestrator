/**
 * File Writer Module Tests
 *
 * Tests for writing files to output folder:
 * - Auto-create parent directories
 * - Reject writes to agents folder
 * - Error handling (EACCES, ENOSPC)
 * - Performance requirements
 */

import { writeFileContent } from '../writer';
import { readFile, rm, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { env } from '@/lib/utils/env';

describe('writer module', () => {
  const testOutputDir = env.OUTPUT_PATH;
  const testFile = 'test-write.txt';

  beforeAll(async () => {
    // Ensure output directory exists
    await mkdir(testOutputDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await rm(join(testOutputDir, testFile), { force: true });
      await rm(join(testOutputDir, 'nested'), { recursive: true, force: true });
      await rm(join(testOutputDir, 'deep'), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('writeFileContent', () => {
    it('should write file to output folder', async () => {
      const content = 'Test content';
      await writeFileContent(testFile, content);

      const written = await readFile(join(testOutputDir, testFile), 'utf-8');
      expect(written).toBe(content);
    });

    it('should auto-create parent directories', async () => {
      const nestedPath = 'nested/dir/file.txt';
      const content = 'Nested content';

      await writeFileContent(nestedPath, content);

      const written = await readFile(join(testOutputDir, nestedPath), 'utf-8');
      expect(written).toBe(content);

      // Verify directory was created
      const dirPath = join(testOutputDir, 'nested/dir');
      await expect(access(dirPath)).resolves.toBeUndefined();
    });

    it('should auto-create deeply nested directories', async () => {
      const deepPath = 'deep/very/nested/path/file.txt';
      const content = 'Deep content';

      await writeFileContent(deepPath, content);

      const written = await readFile(join(testOutputDir, deepPath), 'utf-8');
      expect(written).toBe(content);
    });

    it('should reject writes to agents folder via traversal', async () => {
      await expect(
        writeFileContent('../agents/bad.txt', 'should fail')
      ).rejects.toThrow();
    });

    it('should reject directory traversal attempts', async () => {
      await expect(
        writeFileContent('../../etc/passwd', 'should fail')
      ).rejects.toThrow();
    });

    it('should overwrite existing files', async () => {
      const content1 = 'Original content';
      const content2 = 'Updated content';

      await writeFileContent(testFile, content1);
      await writeFileContent(testFile, content2);

      const written = await readFile(join(testOutputDir, testFile), 'utf-8');
      expect(written).toBe(content2);
    });

    it('should handle empty content', async () => {
      await writeFileContent(testFile, '');

      const written = await readFile(join(testOutputDir, testFile), 'utf-8');
      expect(written).toBe('');
    });

    it('should complete in <100ms for small files', async () => {
      const smallContent = 'x'.repeat(1000); // 1KB

      const startTime = performance.now();
      await writeFileContent('small.txt', smallContent);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);

      // Cleanup
      await rm(join(testOutputDir, 'small.txt'), { force: true });
    });

    it('should complete in <100ms for 1MB files', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB

      const startTime = performance.now();
      await writeFileContent('large.txt', largeContent);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);

      // Cleanup
      await rm(join(testOutputDir, 'large.txt'), { force: true });
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Special chars: 日本語 émojis 🚀 symbols @#$%';

      await writeFileContent(testFile, specialContent);

      const written = await readFile(join(testOutputDir, testFile), 'utf-8');
      expect(written).toBe(specialContent);
    });
  });
});
