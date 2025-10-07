/**
 * Tests for Tree Builder Module
 * Story 5.2: Display Directory Tree Structure
 * Story 5.2.1: Session Metadata Display Enhancement
 *
 * Test Coverage:
 * - Recursive directory traversal
 * - Empty directories handling
 * - File metadata (size, modified)
 * - Error handling for unreadable directories
 * - Session folder detection (UUID pattern)
 * - Manifest loading and displayName generation
 * - Internal file filtering (manifest.json)
 *
 * @jest-environment node
 */

import { buildDirectoryTree } from '../treeBuilder';
import { stat, readdir } from 'fs/promises';
import { parseManifest, generateDisplayName } from '../manifestReader';

// Mock fs/promises
jest.mock('fs/promises');
// Mock manifestReader
jest.mock('../manifestReader');

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

  describe('Session folder detection (Story 5.2.1)', () => {
    it('should detect UUID v4 session folders and load manifest (AC-1)', async () => {
      // Arrange
      const sessionId = 'a1b2c3d4-5678-4abc-9def-0123456789ab';
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const mockMetadata = {
        version: '1.0.0',
        session_id: sessionId,
        agent: {
          name: 'alex',
          title: 'Alex the Facilitator',
          bundle: 'bmad/bmm/agents/alex',
        },
        workflow: {
          name: 'Intake ITSM',
          description: 'ITSM intake',
        },
        execution: {
          started_at: '2025-10-06T17:09:15.123Z',
          completed_at: '2025-10-06T17:25:30.456Z',
          status: 'completed' as const,
          user: 'Bryan',
        },
        outputs: [],
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockResolvedValueOnce(dirStat); // Session folder

      (readdir as jest.Mock)
        .mockResolvedValueOnce([sessionId])
        .mockResolvedValueOnce([]);

      (parseManifest as jest.Mock).mockResolvedValueOnce(mockMetadata);
      (generateDisplayName as jest.Mock).mockReturnValueOnce('Alex the Facilitator - Intake ITSM (Oct 6, 2025, 5:25 PM)');

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe(sessionId);
      expect(result.children![0].displayName).toBe('Alex the Facilitator - Intake ITSM (Oct 6, 2025, 5:25 PM)');
      expect(result.children![0].metadata).toEqual(mockMetadata);
      expect(parseManifest).toHaveBeenCalledWith(`/mock/base/path/${sessionId}`);
    });

    it('should fallback to UUID if manifest.json is missing (AC-7)', async () => {
      // Arrange
      const sessionId = 'b2c3d4e5-6789-4bcd-aef0-123456789abc';
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockResolvedValueOnce(dirStat); // Session folder

      (readdir as jest.Mock)
        .mockResolvedValueOnce([sessionId])
        .mockResolvedValueOnce([]);

      (parseManifest as jest.Mock).mockResolvedValueOnce(null); // No manifest

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe(sessionId);
      expect(result.children![0].displayName).toBeUndefined(); // Falls back to UUID
      expect(result.children![0].metadata).toBeUndefined();
    });

    it('should handle running sessions with "In Progress" display (AC-5)', async () => {
      // Arrange
      const sessionId = 'c3d4e5f6-789a-4cde-bf01-23456789abcd';
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      const mockMetadata = {
        version: '1.0.0',
        session_id: sessionId,
        agent: {
          name: 'pixel',
          title: 'Pixel',
          bundle: 'bmad/bmm/agents/pixel',
        },
        workflow: {
          name: 'Build Stories',
          description: 'Build stories',
        },
        execution: {
          started_at: '2025-10-06T09:15:00.000Z',
          status: 'running' as const,
          user: 'Bryan',
        },
        outputs: [],
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockResolvedValueOnce(dirStat); // Session folder

      (readdir as jest.Mock)
        .mockResolvedValueOnce([sessionId])
        .mockResolvedValueOnce([]);

      (parseManifest as jest.Mock).mockResolvedValueOnce(mockMetadata);
      (generateDisplayName as jest.Mock).mockReturnValueOnce('Pixel - Build Stories (In Progress)');

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children![0].displayName).toBe('Pixel - Build Stories (In Progress)');
      expect(result.children![0].metadata?.execution.status).toBe('running');
    });

    it('should not treat non-UUID folders as session folders', async () => {
      // Arrange
      const dirStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2025-10-06T00:00:00.000Z'),
      };

      (stat as jest.Mock)
        .mockResolvedValueOnce(dirStat) // Root
        .mockResolvedValueOnce(dirStat); // Regular folder

      (readdir as jest.Mock)
        .mockResolvedValueOnce(['regular-folder'])
        .mockResolvedValueOnce([]);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('regular-folder');
      expect(result.children![0].displayName).toBeUndefined();
      expect(result.children![0].metadata).toBeUndefined();
      expect(parseManifest).not.toHaveBeenCalled();
    });
  });

  describe('Internal file filtering (Story 5.2.1 AC-2)', () => {
    it('should mark manifest.json files as isInternal', async () => {
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
        .mockResolvedValueOnce(fileStat); // manifest.json

      (readdir as jest.Mock).mockResolvedValueOnce(['manifest.json']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('manifest.json');
      expect(result.children![0].isInternal).toBe(true);
    });

    it('should not mark regular files as isInternal', async () => {
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
        .mockResolvedValueOnce(fileStat); // regular.txt

      (readdir as jest.Mock).mockResolvedValueOnce(['regular.txt']);

      // Act
      const result = await buildDirectoryTree('/mock/base/path');

      // Assert
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('regular.txt');
      expect(result.children![0].isInternal).toBeUndefined();
    });
  });
});
