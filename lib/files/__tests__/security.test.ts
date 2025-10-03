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
        'resolves outside base directory'
      );
    });

    it('should reject null bytes in paths', () => {
      expect(() => validatePath('file\0.txt', env.AGENTS_PATH)).toThrow(
        'null bytes are not allowed'
      );
    });

    it('should reject absolute paths outside allowed directories', () => {
      expect(() => validatePath('/etc/passwd', env.AGENTS_PATH)).toThrow(
        'must be within allowed directories'
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
        'null bytes are not allowed'
      );
    });

    it('should accept nested paths in OUTPUT_PATH', () => {
      const result = validateWritePath('deep/nested/path/file.txt');
      expect(result).toContain('output');
      expect(result).toContain('deep/nested/path/file.txt');
    });
  });
});
