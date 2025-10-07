/**
 * Tests for GET /api/files/tree endpoint
 * Story 5.2: Display Directory Tree Structure
 *
 * Test Coverage:
 * - AC-1: Directory tree displays output folder structure
 * - AC-5: Empty folders show as empty (not hidden from tree)
 * - Security: Path traversal attempts blocked
 * - Error handling for unreadable directories
 *
 * @jest-environment node
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as treeBuilder from '@/lib/files/treeBuilder';
import * as security from '@/lib/files/security';

// Mock dependencies
jest.mock('@/lib/files/treeBuilder');
jest.mock('@/lib/files/security');

describe('GET /api/files/tree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC-1: Returns directory tree structure', () => {
    it('should return successful tree response with root node', async () => {
      // Arrange
      const mockTree = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: [
          {
            name: 'folder1',
            path: 'folder1',
            type: 'directory' as const,
            children: [
              {
                name: 'file1.txt',
                path: 'folder1/file1.txt',
                type: 'file' as const,
                size: 1024,
                modified: '2025-10-06T00:00:00.000Z',
              },
            ],
          },
          {
            name: 'file2.txt',
            path: 'file2.txt',
            type: 'file' as const,
            size: 2048,
            modified: '2025-10-06T00:00:00.000Z',
          },
        ],
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');
      (treeBuilder.buildDirectoryTree as jest.Mock).mockResolvedValue(mockTree);

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.root).toEqual(mockTree);
      expect(data.root.children).toHaveLength(2);
      expect(data.error).toBeUndefined();
    });

    it('should include nested directory structures', async () => {
      // Arrange
      const mockTree = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: [
          {
            name: 'level1',
            path: 'level1',
            type: 'directory' as const,
            children: [
              {
                name: 'level2',
                path: 'level1/level2',
                type: 'directory' as const,
                children: [
                  {
                    name: 'deep.txt',
                    path: 'level1/level2/deep.txt',
                    type: 'file' as const,
                    size: 512,
                    modified: '2025-10-06T00:00:00.000Z',
                  },
                ],
              },
            ],
          },
        ],
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');
      (treeBuilder.buildDirectoryTree as jest.Mock).mockResolvedValue(mockTree);

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.root.children[0].children[0].children).toHaveLength(1);
      expect(data.root.children[0].children[0].children[0].name).toBe('deep.txt');
    });

    it('should include file metadata (size, modified)', async () => {
      // Arrange
      const mockTree = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: [
          {
            name: 'test.txt',
            path: 'test.txt',
            type: 'file' as const,
            size: 1024,
            modified: '2025-10-06T12:34:56.789Z',
          },
        ],
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');
      (treeBuilder.buildDirectoryTree as jest.Mock).mockResolvedValue(mockTree);

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.root.children[0].size).toBe(1024);
      expect(data.root.children[0].modified).toBe('2025-10-06T12:34:56.789Z');
    });
  });

  describe('AC-5: Empty directories handled correctly', () => {
    it('should return empty tree when output directory is empty', async () => {
      // Arrange
      const mockTree = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: [],
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');
      (treeBuilder.buildDirectoryTree as jest.Mock).mockResolvedValue(mockTree);

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.root.children).toEqual([]);
    });

    it('should include empty folders in tree structure', async () => {
      // Arrange
      const mockTree = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: [
          {
            name: 'empty-folder',
            path: 'empty-folder',
            type: 'directory' as const,
            children: [],
          },
          {
            name: 'non-empty',
            path: 'non-empty',
            type: 'directory' as const,
            children: [
              {
                name: 'file.txt',
                path: 'non-empty/file.txt',
                type: 'file' as const,
                size: 100,
              },
            ],
          },
        ],
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');
      (treeBuilder.buildDirectoryTree as jest.Mock).mockResolvedValue(mockTree);

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.root.children).toHaveLength(2);
      expect(data.root.children[0].children).toEqual([]);
      expect(data.root.children[1].children).toHaveLength(1);
    });
  });

  describe('Security: Path validation', () => {
    it('should validate path against OUTPUT_PATH', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');
      (treeBuilder.buildDirectoryTree as jest.Mock).mockResolvedValue({
        name: 'root',
        path: '',
        type: 'directory',
        children: [],
      });

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      await GET(request);

      // Assert
      expect(security.validatePath).toHaveBeenCalledWith('', expect.any(String));
    });

    it('should return 403 Forbidden when path validation fails', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockImplementation(() => {
        throw new Error('Access denied');
      });

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Access denied');
      expect(data.root.children).toEqual([]);
    });

    it('should reject path traversal attempts', async () => {
      // Arrange - Simulate security module rejecting traversal
      (security.validatePath as jest.Mock).mockImplementation(() => {
        throw new Error('Access denied');
      });

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should return 404 when output directory does not exist', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');

      const error: any = new Error('Directory not found');
      error.code = 'ENOENT';
      (treeBuilder.buildDirectoryTree as jest.Mock).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Output directory not found');
      expect(data.root.children).toEqual([]);
    });

    it('should handle unreadable directories gracefully', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');

      const error: any = new Error('Permission denied');
      error.code = 'EACCES';
      (treeBuilder.buildDirectoryTree as jest.Mock).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });

    it('should handle generic errors with proper error response', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');
      (treeBuilder.buildDirectoryTree as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });
  });

  describe('Performance: Large directory trees', () => {
    it('should handle tree with 100+ files', async () => {
      // Arrange - Create tree with 100 files
      const mockTree = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: Array.from({ length: 100 }, (_, i) => ({
          name: `file-${i}.txt`,
          path: `file-${i}.txt`,
          type: 'file' as const,
          size: 1024,
          modified: '2025-10-06T00:00:00.000Z',
        })),
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path');
      (treeBuilder.buildDirectoryTree as jest.Mock).mockResolvedValue(mockTree);

      const request = new NextRequest('http://localhost:3000/api/files/tree', {
        method: 'GET',
      });

      // Act
      const startTime = performance.now();
      const response = await GET(request);
      const endTime = performance.now();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.root.children).toHaveLength(100);
      // NFR-1: Should complete within reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
