/**
 * Integration Tests for File Operation Tools
 *
 * Story 6.5: Context-Aware File Naming Validation
 *
 * Tests save_output tool with filename validation:
 * - Generic filenames rejected with helpful error messages
 * - Descriptive filenames accepted and files written successfully
 * - Error messages guide agents to better naming
 */

import { mkdir, rm, access } from 'fs/promises';
import { resolve } from 'path';
import {
  executeSaveOutput,
} from '../fileOperations';
import { PathContext } from '@/lib/pathResolver';

describe('File Operations - Filename Validation (Story 6.5)', () => {
  let testDir: string;
  let outputDir: string;
  let context: PathContext;

  beforeEach(async () => {
    // Create temporary test directory structure
    testDir = resolve(
      process.cwd(),
      '__test_temp__',
      `test-${Date.now()}`
    );
    outputDir = resolve(testDir, 'data/agent-outputs/test-session');

    await mkdir(outputDir, { recursive: true });

    // Create test context
    context = {
      bundleRoot: resolve(testDir, 'bundles/test-bundle'),
      coreRoot: resolve(testDir, 'core'),
      projectRoot: testDir,
      bundleConfig: {},
    };
  });

  afterEach(async () => {
    // Clean up test directory
    if (testDir && testDir.includes('__test_temp__')) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Generic Filename Rejection (AC #1, #2)', () => {
    it('should reject output.md with helpful error message', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/output.md`,
          content: 'Test content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generic filename "output.md" not allowed');
      expect(result.error).toContain('procurement-request.md');
      expect(result.error).toContain('budget-analysis-q3.csv');
    });

    it('should reject output-2.md', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/output-2.md`,
          content: 'Test content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generic filename');
    });

    it('should reject result.txt', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/result.txt`,
          content: 'Test content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generic filename');
    });

    it('should reject file.txt', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/file.txt`,
          content: 'Test content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generic filename');
    });

    it('should reject untitled.md', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/untitled.md`,
          content: 'Test content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generic filename');
    });
  });

  describe('Error Message Quality (AC #3)', () => {
    it('should include examples in error message', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/output.md`,
          content: 'Test content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('✅');
      expect(result.error).toContain('❌');
      expect(result.error).toContain('procurement-request.md');
      expect(result.error).toContain('budget-analysis-q3.csv');
      expect(result.error).toContain('approval-checklist.md');
    });

    it('should provide clear guidance on what to do', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/file.txt`,
          content: 'Test content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Use descriptive names based on content or purpose');
    });
  });

  describe('Descriptive Filename Acceptance (AC #5)', () => {
    it('should accept procurement-request.md', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/procurement-request.md`,
          content: '# Procurement Request\n\nDetails here...',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.path).toContain('procurement-request.md');

      // Verify file was actually written
      await expect(access(result.path!)).resolves.not.toThrow();
    });

    it('should accept budget-analysis-q3.csv', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/budget-analysis-q3.csv`,
          content: 'Department,Budget,Spent\nIT,100000,75000',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.path).toContain('budget-analysis-q3.csv');
      await expect(access(result.path!)).resolves.not.toThrow();
    });

    it('should accept approval-checklist.md', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/approval-checklist.md`,
          content: '# Approval Checklist\n\n- [ ] Budget approved\n- [ ] Director signed',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.path).toContain('approval-checklist.md');
      await expect(access(result.path!)).resolves.not.toThrow();
    });

    it('should accept various descriptive names', async () => {
      const descriptiveNames = [
        'software-license-quote.md',
        'project-epic-6-analysis.txt',
        'deployment-checklist-production.md',
        'user-feedback-report-2025.csv',
      ];

      for (const filename of descriptiveNames) {
        const result = await executeSaveOutput(
          {
            file_path: `${outputDir}/${filename}`,
            content: 'Test content for descriptive filename',
          },
          context
        );

        expect(result.success).toBe(true);
        expect(result.path).toContain(filename);
      }
    });
  });

  describe('Path Traversal Prevention (AC #6)', () => {
    it('should reject filename with ../ (handled by path resolver)', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/../etc/passwd`,
          content: 'Malicious content',
        },
        context
      );

      expect(result.success).toBe(false);
      // Path traversal is caught by resolvePath before filename validation
      expect(result.error).toContain('Security violation');
    });

    it('should reject bare filename with path separators', async () => {
      // Test filename validation directly (not path resolution)
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/sub/dir/file.md`,
          content: 'Content',
        },
        context
      );

      // Note: This gets caught by basename extraction + validation
      // basename('sub/dir/file.md') => 'file.md', which is generic
      expect(result.success).toBe(false);
      expect(result.error).toContain('Generic filename');
    });
  });

  describe('Special Character Blocking (AC #6)', () => {
    it('should reject filename with <', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/file<name.md`,
          content: 'Content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject filename with multiple special characters', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/file<>:|.md`,
          content: 'Content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
      expect(result.error).toContain('< > : " | ? *');
    });
  });

  describe('Filename Sanitization Permissiveness (AC #7)', () => {
    it('should accept kebab-case (recommended)', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/multi-word-filename.md`,
          content: 'Content',
        },
        context
      );

      expect(result.success).toBe(true);
    });

    it('should accept camelCase (not enforced)', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/multiWordFilename.md`,
          content: 'Content',
        },
        context
      );

      expect(result.success).toBe(true);
    });

    it('should accept snake_case (not enforced)', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/multi_word_filename.md`,
          content: 'Content',
        },
        context
      );

      expect(result.success).toBe(true);
    });

    it('should accept PascalCase (not enforced)', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/MultiWordFilename.md`,
          content: 'Content',
        },
        context
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Error Return Format', () => {
    it('should return ToolResult format with success: false', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/output.md`,
          content: 'Content',
        },
        context
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('path');
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('should return ToolResult format with success: true for valid names', async () => {
      const result = await executeSaveOutput(
        {
          file_path: `${outputDir}/valid-filename.md`,
          content: 'Content',
        },
        context
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('size');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
