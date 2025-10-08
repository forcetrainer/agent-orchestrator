/**
 * Tests for /api/files/content endpoint
 * Story 5.3: Display File Contents
 * Story 5.7: Security - Read-Only File Access
 *
 * Test Coverage:
 * - AC-1: Clicking file in tree loads its contents via API
 * - AC-2,AC-3: Text files display with proper formatting (preserved whitespace)
 * - AC-4: Large files (>1MB) load without crashing browser (truncation)
 * - AC-5: Binary files show "Cannot preview" message
 * - Security: Path traversal attempts blocked
 * - Story 5.7 AC-2: POST/PUT/DELETE methods return 405 Method Not Allowed
 * - Error handling for missing files, permission denied
 *
 * @jest-environment node
 */

import { GET, POST, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { readFile, stat } from 'fs/promises';
import * as security from '@/lib/files/security';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('@/lib/files/security');

describe('GET /api/files/content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC-1: Returns file content via API', () => {
    it('should return file content with metadata for text file', async () => {
      // Arrange
      const mockContent = '# Test Document\n\nThis is a test file.';
      const mockStats = {
        size: mockContent.length,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/test.md');
      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue(mockContent);

      const request = new NextRequest('http://localhost:3000/api/files/content?path=test.md', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.content).toBe(mockContent);
      expect(data.path).toBe('test.md');
      expect(data.mimeType).toBe('text/markdown');
      expect(data.size).toBe(mockContent.length);
      expect(data.modified).toBe('2025-10-06T12:00:00.000Z');
      expect(data.isBinary).toBeUndefined();
      expect(data.truncated).toBeUndefined();
    });

    it('should return 400 when path parameter is missing', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/files/content', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Path parameter is required');
    });

    it('should detect correct mime types for various file extensions', async () => {
      // Arrange
      const testCases = [
        { path: 'test.txt', expected: 'text/plain' },
        { path: 'test.json', expected: 'application/json' },
        { path: 'test.yaml', expected: 'text/yaml' },
        { path: 'test.xml', expected: 'application/xml' },
        { path: 'test.ts', expected: 'application/typescript' },
        { path: 'test.js', expected: 'application/javascript' },
      ];

      const mockStats = {
        size: 100,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue('test content');

      // Act & Assert
      for (const testCase of testCases) {
        (security.validatePath as jest.Mock).mockReturnValue(`/mock/output/path/${testCase.path}`);

        const request = new NextRequest(`http://localhost:3000/api/files/content?path=${testCase.path}`, {
          method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(data.mimeType).toBe(testCase.expected);
      }
    });
  });

  describe('AC-2, AC-3: Text formatting preserved', () => {
    it('should preserve line breaks in file content', async () => {
      // Arrange
      const mockContent = 'Line 1\nLine 2\n\nLine 4 (after blank line)';
      const mockStats = {
        size: mockContent.length,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/test.txt');
      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue(mockContent);

      const request = new NextRequest('http://localhost:3000/api/files/content?path=test.txt', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.content).toContain('\n');
      expect(data.content.split('\n')).toHaveLength(4);
      expect(data.content).toBe(mockContent);
    });

    it('should preserve multiple spaces and indentation', async () => {
      // Arrange
      const mockContent = '  Indented line\n    More indented\n  Back to 2 spaces';
      const mockStats = {
        size: mockContent.length,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/test.txt');
      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue(mockContent);

      const request = new NextRequest('http://localhost:3000/api/files/content?path=test.txt', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.content).toBe(mockContent);
      expect(data.content.startsWith('  ')).toBe(true);
    });
  });

  describe('AC-4: Large file handling with truncation', () => {
    it('should truncate files larger than 1MB to first 5000 lines', async () => {
      // Arrange - Create content >1MB with 6000 lines
      const lineContent = 'This is a line of text that takes up some space\n';
      const totalLines = 6000;
      const mockContent = lineContent.repeat(totalLines);
      const mockSize = 2 * 1024 * 1024; // 2MB

      const mockStats = {
        size: mockSize,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/large.txt');
      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue(mockContent);

      const request = new NextRequest('http://localhost:3000/api/files/content?path=large.txt', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.truncated).toBe(true);
      expect(data.size).toBe(mockSize);

      // Content should be truncated to 5000 lines
      const returnedLines = data.content.split('\n');
      expect(returnedLines.length).toBeLessThanOrEqual(5000);
    });

    it('should not truncate files smaller than 1MB', async () => {
      // Arrange - Create content <1MB with 100 lines
      const lineContent = 'This is a line of text\n';
      const totalLines = 100;
      const mockContent = lineContent.repeat(totalLines).trimEnd(); // Remove trailing newline
      const mockSize = mockContent.length; // < 1MB

      const mockStats = {
        size: mockSize,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/small.txt');
      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue(mockContent);

      const request = new NextRequest('http://localhost:3000/api/files/content?path=small.txt', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.truncated).toBeUndefined();
      expect(data.content).toBe(mockContent);
      expect(data.content.split('\n')).toHaveLength(totalLines);
    });
  });

  describe('AC-5: Binary file detection and handling', () => {
    it('should return isBinary flag for PNG image files', async () => {
      // Arrange
      const mockStats = {
        size: 45120,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/image.png');
      (stat as jest.Mock).mockResolvedValue(mockStats);

      const request = new NextRequest('http://localhost:3000/api/files/content?path=image.png', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isBinary).toBe(true);
      expect(data.content).toBe('');
      expect(data.mimeType).toBe('image/png');
      expect(data.size).toBe(45120);
    });

    it('should detect binary mime types correctly', async () => {
      // Arrange
      const binaryExtensions = [
        { ext: 'png', mime: 'image/png' },
        { ext: 'jpg', mime: 'image/jpeg' },
        { ext: 'pdf', mime: 'application/pdf' },
        { ext: 'zip', mime: 'application/zip' },
        { ext: 'tar', mime: 'application/x-tar' },
        { ext: 'gz', mime: 'application/gzip' },
      ];

      const mockStats = {
        size: 1000,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (stat as jest.Mock).mockResolvedValue(mockStats);

      // Act & Assert
      for (const { ext, mime } of binaryExtensions) {
        (security.validatePath as jest.Mock).mockReturnValue(`/mock/output/path/file.${ext}`);

        const request = new NextRequest(`http://localhost:3000/api/files/content?path=file.${ext}`, {
          method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(data.isBinary).toBe(true);
        expect(data.content).toBe('');
        expect(data.mimeType).toBe(mime);
      }
    });
  });

  describe('Security: Path validation and traversal prevention', () => {
    it('should validate path using security.validatePath', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/test.txt');
      (stat as jest.Mock).mockResolvedValue({
        size: 100,
        mtime: new Date(),
        isFile: () => true,
      });
      (readFile as jest.Mock).mockResolvedValue('content');

      const request = new NextRequest('http://localhost:3000/api/files/content?path=test.txt', {
        method: 'GET',
      });

      // Act
      await GET(request);

      // Assert
      expect(security.validatePath).toHaveBeenCalledWith('test.txt', expect.any(String));
    });

    it('should return 403 Forbidden for path traversal attempts', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockImplementation(() => {
        throw new Error('Access denied');
      });

      const request = new NextRequest('http://localhost:3000/api/files/content?path=../../etc/passwd', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Access denied');
    });

    it('should reject absolute paths outside OUTPUT_PATH', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockImplementation(() => {
        throw new Error('Access denied');
      });

      const request = new NextRequest('http://localhost:3000/api/files/content?path=/etc/passwd', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Access denied');
    });

    it('should reject access to bundle directory', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockImplementation(() => {
        throw new Error('Access denied');
      });

      const request = new NextRequest('http://localhost:3000/api/files/content?path=../bmad/bundles/agent.md', {
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
    it('should return 404 when file does not exist', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/missing.txt');

      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      (stat as jest.Mock).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/files/content?path=missing.txt', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('File not found');
    });

    it('should return 400 when path is a directory', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/folder');
      (stat as jest.Mock).mockResolvedValue({
        size: 0,
        mtime: new Date(),
        isFile: () => false,
      });

      const request = new NextRequest('http://localhost:3000/api/files/content?path=folder', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Path is not a file');
    });

    it('should return 403 when file read permission denied', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/protected.txt');
      (stat as jest.Mock).mockResolvedValue({
        size: 100,
        mtime: new Date(),
        isFile: () => true,
      });

      const error: any = new Error('Permission denied');
      error.code = 'EACCES';
      (readFile as jest.Mock).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/files/content?path=protected.txt', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Permission denied');
    });

    it('should handle generic errors with 500 status', async () => {
      // Arrange
      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/test.txt');
      (stat as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/files/content?path=test.txt', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty files (0 bytes)', async () => {
      // Arrange
      const mockStats = {
        size: 0,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/empty.txt');
      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue('');

      const request = new NextRequest('http://localhost:3000/api/files/content?path=empty.txt', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.content).toBe('');
      expect(data.size).toBe(0);
    });

    it('should handle special characters in filenames', async () => {
      // Arrange
      const mockStats = {
        size: 100,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/file with spaces.txt');
      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue('content');

      const encodedPath = encodeURIComponent('file with spaces.txt');
      const request = new NextRequest(`http://localhost:3000/api/files/content?path=${encodedPath}`, {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.path).toBe('file with spaces.txt');
    });

    it('should handle unknown file extensions with default mime type', async () => {
      // Arrange
      const mockStats = {
        size: 100,
        mtime: new Date('2025-10-06T12:00:00Z'),
        isFile: () => true,
      };

      (security.validatePath as jest.Mock).mockReturnValue('/mock/output/path/file.unknown');
      (stat as jest.Mock).mockResolvedValue(mockStats);
      (readFile as jest.Mock).mockResolvedValue('content');

      const request = new NextRequest('http://localhost:3000/api/files/content?path=file.unknown', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.mimeType).toBe('application/octet-stream');
      expect(data.isBinary).toBe(true); // Octet-stream treated as binary
    });
  });
});

describe('Story 5.7: HTTP Method Security', () => {
  describe('POST /api/files/content', () => {
    it('should return 405 Method Not Allowed for POST requests', async () => {
      // Act
      const response = await POST();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed - file viewer is read-only');
      expect(response.headers.get('Allow')).toBe('GET');
    });
  });

  describe('PUT /api/files/content', () => {
    it('should return 405 Method Not Allowed for PUT requests', async () => {
      // Act
      const response = await PUT();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed - file viewer is read-only');
      expect(response.headers.get('Allow')).toBe('GET');
    });
  });

  describe('DELETE /api/files/content', () => {
    it('should return 405 Method Not Allowed for DELETE requests', async () => {
      // Act
      const response = await DELETE();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed - file viewer is read-only');
      expect(response.headers.get('Allow')).toBe('GET');
    });
  });
});
