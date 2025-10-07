/**
 * Tests for Tree Builder Module
 * Story 5.2: Display Directory Tree Structure
 *
 * Test Coverage:
 * - Recursive directory traversal
 * - Empty directories handling
 * - File metadata (size, modified)
 * - Error handling for unreadable directories
 *
 * @jest-environment node
 */

import { buildDirectoryTree } from '../treeBuilder';
import { stat, readdir } from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises');

describe('buildDirectoryTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Directory tree building', () => {
    it('should build tree for directory with files', async () => {
      // Arrange
      const mockStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const mockFileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        mtime: new Date('2025-10-06T12:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(mockStat) // Root directory
        .mockResolvedValueOnce(mockFileStat); // file1.txt

      (readdir as jest.Mock).mockResolvedValueOnce(['file1.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.name).toBe('root');
      expect(result.path).toBe('');
      expect(result.type).toBe('directory');
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('file1.txt');
      expect(result.children![0].type).toBe('file');
      expect(result.children![0].size).toBe(1024);
    });

    it('should build nested directory structures recursively', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const fileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 512,
        mtime: new Date('2025-10-06T12:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockResolvedValueOnce(dirStat) // folder1
        .mockResolvedValueOnce(fileStat); // nested-file.txt

      (readdir as jest.Mock)
        .mockResolvedValueOnce(['folder1']) // Root contents
        .mockResolvedValueOnce(['nested-file.txt']); // folder1 contents

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('folder1');
      expect(result.children![0].type).toBe('directory');
      expect(result.children![0].children).toHaveLength(1);
      expect(result.children![0].children![0].name).toBe('nested-file.txt');
      expect(result.children![0].children![0].type).toBe('file');
    });

    it('should handle deeply nested structures (3+ levels)', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const fileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 100,
        mtime: new Date('2025-10-06T12:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockResolvedValueOnce(dirStat) // level1
        .mockResolvedValueOnce(dirStat) // level2
        .mockResolvedValueOnce(fileStat); // deep.txt

      (readdir as jest.Mock)
        .mockResolvedValueOnce(['level1'])
        .mockResolvedValueOnce(['level2'])
        .mockResolvedValueOnce(['deep.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children![0].children![0].children![0].name).toBe('deep.txt');
      expect(result.children![0].children![0].children![0].path).toBe('level1/level2/deep.txt');
    });
  });

  describe('Empty directories handling (AC-5)', () => {
    it('should return empty children array for empty directory', async () => {
      // Arrange
      const mockStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock).mockResolvedValueOnce(mockStat);
      (readdir as jest.Mock).mockResolvedValueOnce([]);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.type).toBe('directory');
      expect(result.children).toEqual([]);
    });

    it('should include empty subdirectories in tree', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockResolvedValueOnce(dirStat); // empty-folder

      (readdir as jest.Mock)
        .mockResolvedValueOnce(['empty-folder']) // Root contents
        .mockResolvedValueOnce([]); // empty-folder contents

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('empty-folder');
      expect(result.children![0].children).toEqual([]);
    });
  });

  describe('File metadata', () => {
    it('should include file size for files', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const fileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 2048,
        mtime: new Date('2025-10-06T12:34:56.789Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat)
        .mockResolvedValueOnce(fileStat);

      (readdir as jest.Mock).mockResolvedValueOnce(['test.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children![0].size).toBe(2048);
      expect(result.size).toBeUndefined(); // Directories don't have size
    });

    it('should include modified timestamp for all nodes', async () => {
      // Arrange
      const dirMtime = new Date('2025-10-06T10:00:00.000Z');
      const fileMtime = new Date('2025-10-06T12:00:00.000Z');

      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: dirMtime,
      };

      const fileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 512,
        mtime: fileMtime,
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat)
        .mockResolvedValueOnce(fileStat);

      (readdir as jest.Mock).mockResolvedValueOnce(['file.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.modified).toBe(dirMtime.toISOString());
      expect(result.children![0].modified).toBe(fileMtime.toISOString());
    });

    it('should handle files with zero size', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const fileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 0,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat)
        .mockResolvedValueOnce(fileStat);

      (readdir as jest.Mock).mockResolvedValueOnce(['empty.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children![0].size).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should skip unreadable entries and continue', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const fileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockRejectedValueOnce(new Error('Permission denied')) // unreadable.txt
        .mockResolvedValueOnce(fileStat); // readable.txt

      (readdir as jest.Mock).mockResolvedValueOnce(['unreadable.txt', 'readable.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children).toHaveLength(1); // Only readable.txt
      expect(result.children![0].name).toBe('readable.txt');
    });

    it('should return empty children array when directory is unreadable', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock).mockResolvedValueOnce(dirStat);
      (readdir as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.type).toBe('directory');
      expect(result.children).toEqual([]);
    });

    it('should propagate stat errors for root directory', async () => {
      // Arrange
      (stat as jest.Mock).mockRejectedValueOnce(new Error('Directory not found'));

      // Act & Assert
      await expect(buildDirectoryTree('/mock/base/path')).rejects.toThrow('Directory not found');
    });
  });

  describe('Path handling', () => {
    it('should build correct relative paths for nested items', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const fileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 512,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockResolvedValueOnce(dirStat) // folder
        .mockResolvedValueOnce(fileStat); // file.txt

      (readdir as jest.Mock)
        .mockResolvedValueOnce(['folder'])
        .mockResolvedValueOnce(['file.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.path).toBe('');
      expect(result.children![0].path).toBe('folder');
      expect(result.children![0].children![0].path).toBe('folder/file.txt');
    });

    it('should handle building from subdirectory with relative path', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const fileStat = {
        isDirectory: () => false,
        isFile: () => true,
        size: 512,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat)
        .mockResolvedValueOnce(fileStat);

      (readdir as jest.Mock).mockResolvedValueOnce(['file.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path', 'subdir');

      // Assert
      expect(result.name).toBe('subdir');
      expect(result.path).toBe('subdir');
      expect(result.children![0].path).toBe('subdir/file.txt');
    });
  });
});
