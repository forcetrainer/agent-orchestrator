/**
 * Security Module Tests
 *
 * Comprehensive security validation tests including:
 * - Directory traversal prevention
 * - Absolute path handling
 * - Null byte detection
 * - Write path restrictions
 */

import { validatePath, validateWritePath } from '../security';
import { env } from '@/lib/utils/env';

describe('security module', () => {
  describe('validatePath', () => {
    it('should accept valid relative paths', () => {
      const result = validatePath('templates/agent.md', env.AGENTS_PATH);
      expect(result).toContain('templates/agent.md');
    });

    it('should reject directory traversal attempts with ../', () => {
      expect(() => validatePath('../../etc/passwd', env.AGENTS_PATH)).toThrow(
        'Access denied'
      );
    });

    it('should reject null bytes in paths', () => {
      expect(() => validatePath('file\0.txt', env.AGENTS_PATH)).toThrow(
        'Access denied'
      );
    });

    it('should reject absolute paths outside allowed directories', () => {
      expect(() => validatePath('/etc/passwd', env.AGENTS_PATH)).toThrow(
        'Access denied'
      );
    });

    it('should accept absolute paths within AGENTS_PATH', () => {
      const { resolve } = require('path');
      const agentsPath = resolve(env.AGENTS_PATH);
      const absolutePath = `${agentsPath}/templates/agent.md`;
      const result = validatePath(absolutePath, env.AGENTS_PATH);
      expect(result).toBe(absolutePath);
    });

    it('should accept absolute paths within OUTPUT_PATH', () => {
      const { resolve } = require('path');
      const outputPath = resolve(env.OUTPUT_PATH);
      const absolutePath = `${outputPath}/results/output.json`;
      const result = validatePath(absolutePath, env.OUTPUT_PATH);
      expect(result).toBe(absolutePath);
    });

    it('should normalize paths with multiple slashes', () => {
      const result = validatePath('templates//agent.md', env.AGENTS_PATH);
      expect(result).toContain('templates/agent.md');
    });

    it('should handle empty relative path (base directory)', () => {
      const result = validatePath('', env.AGENTS_PATH);
      expect(result).toContain('agents');
    });

    it('should handle dot notation in safe paths', () => {
      const result = validatePath('./templates/agent.md', env.AGENTS_PATH);
      expect(result).toContain('templates/agent.md');
    });

    it('should reject Windows-style directory traversal', () => {
      // On Unix/Mac, backslashes are literal filename chars, not path separators
      // This test only applies on Windows where backslash is a path separator
      const { sep } = require('path');
      if (sep === '\\') {
        expect(() => validatePath('..\\..\\..\\Windows\\System32', env.AGENTS_PATH)).toThrow(
          'resolves outside base directory'
        );
      }
    });

    it('should reject Windows absolute paths outside allowed directories', () => {
      // Only test on Windows or if path.isAbsolute recognizes it
      const { isAbsolute } = require('path');
      if (isAbsolute('C:\\Windows\\System32')) {
        expect(() => validatePath('C:\\Windows\\System32', env.AGENTS_PATH)).toThrow(
          'must be within allowed directories'
        );
      }
    });

    it('should handle mixed path separators', () => {
      const result = validatePath('templates/subfolder\\file.md', env.AGENTS_PATH);
      expect(result).toBeDefined();
    });
  });

  describe('validateWritePath', () => {
    it('should accept valid write paths in OUTPUT_PATH', () => {
      const result = validateWritePath('results/output.json');
      expect(result).toContain('output');
      expect(result).toContain('results/output.json');
    });

    it('should reject writes to AGENTS_PATH', () => {
      // This assumes agents folder is distinct from output folder
      // The error might be either "outside base directory" or "cannot write to agents folder"
      expect(() => validateWritePath('../agents/template.md')).toThrow();
    });

    it('should reject directory traversal in write paths', () => {
      expect(() => validateWritePath('../../etc/passwd')).toThrow();
    });

    it('should reject null bytes in write paths', () => {
      expect(() => validateWritePath('output\0.txt')).toThrow(
        'Access denied'
      );
    });

    it('should accept nested paths in OUTPUT_PATH', () => {
      const result = validateWritePath('deep/nested/path/file.txt');
      expect(result).toContain('output');
      expect(result).toContain('deep/nested/path/file.txt');
    });
  });

  describe('security attack simulation', () => {
    // Platform-independent attack vectors that work on all systems
    const attackVectors = [
      { path: '../../etc/passwd', desc: 'Unix directory traversal' },
      { path: '../../../etc/passwd', desc: 'Deep Unix directory traversal' },
      { path: '/etc/passwd', desc: 'Unix absolute path' },
      { path: '/root/.ssh/id_rsa', desc: 'SSH key access attempt' },
      { path: 'file\0.txt', desc: 'Null byte injection' },
    ];

    it.each(attackVectors)('should block attack: $desc', ({ path }) => {
      expect(() => validatePath(path, env.AGENTS_PATH)).toThrow();
    });

    it('should block all write attacks to agents folder', () => {
      const writeAttacks = [
        '../agents/template.md',
        '../../agents/important.md',
      ];

      writeAttacks.forEach(attack => {
        expect(() => validateWritePath(attack)).toThrow();
      });
    });

    it('should allow valid write to output folder', () => {
      expect(() => validateWritePath('valid/output.json')).not.toThrow();
    });
  });

  describe('security logging', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log null byte security violations', () => {
      expect(() => validatePath('file\0.txt', env.AGENTS_PATH)).toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Security] Path validation failed:',
        expect.objectContaining({
          relativePath: 'file\0.txt',
          reason: 'null byte detected'
        })
      );
    });

    it('should log directory traversal attempts', () => {
      expect(() => validatePath('../../etc/passwd', env.AGENTS_PATH)).toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Security] Path validation failed:',
        expect.objectContaining({
          relativePath: '../../etc/passwd',
          reason: 'directory traversal attempt'
        })
      );
    });

    it('should log absolute path violations', () => {
      expect(() => validatePath('/etc/passwd', env.AGENTS_PATH)).toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Security] Path validation failed:',
        expect.objectContaining({
          relativePath: '/etc/passwd',
          reason: 'absolute path outside allowed directories'
        })
      );
    });

    it('should log write to agents folder attempts', () => {
      expect(() => validateWritePath('../agents/file.md')).toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Security]'),
        expect.any(Object)
      );
    });
  });
});
