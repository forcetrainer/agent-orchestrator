/**
 * Filename Validator Tests
 *
 * Story 6.5: Context-Aware File Naming Validation
 *
 * Tests cover:
 * - Generic pattern rejection (output.md, result.txt, file.txt, untitled.md)
 * - Descriptive name acceptance (procurement-request.md, budget-analysis-q3.csv)
 * - Path traversal prevention (../, /, \)
 * - Special character blocking (<>:"|?*)
 * - Edge cases (empty strings, unicode, long names)
 */

import { validateFilename, isValidFilename, getValidationError } from '../filenameValidator';

describe('filenameValidator', () => {
  describe('validateFilename - Generic Pattern Rejection (AC #2)', () => {
    it('should reject output.md', () => {
      expect(() => validateFilename('output.md')).toThrow('Generic filename "output.md" not allowed');
    });

    it('should reject output-1.md', () => {
      expect(() => validateFilename('output-1.md')).toThrow('Generic filename "output-1.md" not allowed');
    });

    it('should reject output-2.md', () => {
      expect(() => validateFilename('output-2.md')).toThrow('Generic filename "output-2.md" not allowed');
    });

    it('should reject result.txt', () => {
      expect(() => validateFilename('result.txt')).toThrow('Generic filename "result.txt" not allowed');
    });

    it('should reject result-1.txt', () => {
      expect(() => validateFilename('result-1.txt')).toThrow('Generic filename "result-1.txt" not allowed');
    });

    it('should reject file.txt', () => {
      expect(() => validateFilename('file.txt')).toThrow('Generic filename "file.txt" not allowed');
    });

    it('should reject file1.md', () => {
      expect(() => validateFilename('file1.md')).toThrow('Generic filename "file1.md" not allowed');
    });

    it('should reject file2.csv', () => {
      expect(() => validateFilename('file2.csv')).toThrow('Generic filename "file2.csv" not allowed');
    });

    it('should reject untitled.md', () => {
      expect(() => validateFilename('untitled.md')).toThrow('Generic filename "untitled.md" not allowed');
    });

    it('should reject untitled-document.txt', () => {
      expect(() => validateFilename('untitled-document.txt')).toThrow('Generic filename "untitled-document.txt" not allowed');
    });

    it('should reject document.md', () => {
      expect(() => validateFilename('document.md')).toThrow('Generic filename "document.md" not allowed');
    });

    it('should reject document1.txt', () => {
      expect(() => validateFilename('document1.txt')).toThrow('Generic filename "document1.txt" not allowed');
    });

    it('should reject generic patterns case-insensitively', () => {
      expect(() => validateFilename('OUTPUT.md')).toThrow('Generic filename');
      expect(() => validateFilename('Result.txt')).toThrow('Generic filename');
      expect(() => validateFilename('UNTITLED.md')).toThrow('Generic filename');
    });

    it('should include examples in error message (AC #3)', () => {
      try {
        validateFilename('output.md');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('procurement-request.md');
        expect(error.message).toContain('budget-analysis-q3.csv');
        expect(error.message).toContain('approval-checklist.md');
        expect(error.message).toContain('✅');
        expect(error.message).toContain('❌');
      }
    });
  });

  describe('validateFilename - Descriptive Name Acceptance (AC #5)', () => {
    it('should accept procurement-request.md', () => {
      expect(() => validateFilename('procurement-request.md')).not.toThrow();
    });

    it('should accept budget-analysis-q3.csv', () => {
      expect(() => validateFilename('budget-analysis-q3.csv')).not.toThrow();
    });

    it('should accept approval-checklist.md', () => {
      expect(() => validateFilename('approval-checklist.md')).not.toThrow();
    });

    it('should accept software-license-quote.md', () => {
      expect(() => validateFilename('software-license-quote.md')).not.toThrow();
    });

    it('should accept agent-instructions.md', () => {
      expect(() => validateFilename('agent-instructions.md')).not.toThrow();
    });

    it('should accept workflow-config.yaml', () => {
      expect(() => validateFilename('workflow-config.yaml')).not.toThrow();
    });

    it('should accept bundle-manifest.json', () => {
      expect(() => validateFilename('bundle-manifest.json')).not.toThrow();
    });

    it('should accept various descriptive names with context', () => {
      expect(() => validateFilename('project-epic-6-analysis.md')).not.toThrow();
      expect(() => validateFilename('user-feedback-report-2025.txt')).not.toThrow();
      expect(() => validateFilename('deployment-checklist-production.md')).not.toThrow();
    });
  });

  describe('validateFilename - Path Traversal Prevention (AC #6)', () => {
    it('should reject filename with ../', () => {
      expect(() => validateFilename('../etc/passwd')).toThrow('path separators or ".."');
    });

    it('should reject filename with .. in middle', () => {
      expect(() => validateFilename('file../traversal.md')).toThrow('path separators or ".."');
    });

    it('should reject filename with /', () => {
      expect(() => validateFilename('path/to/file.md')).toThrow('path separators or ".."');
    });

    it('should reject filename with \\', () => {
      expect(() => validateFilename('path\\to\\file.md')).toThrow('path separators or ".."');
    });

    it('should reject Windows path traversal attempts', () => {
      expect(() => validateFilename('..\\windows\\system32')).toThrow('path separators or ".."');
    });

    it('should reject absolute Unix paths', () => {
      expect(() => validateFilename('/etc/passwd')).toThrow('path separators or ".."');
    });

    it('should reject absolute Windows paths', () => {
      expect(() => validateFilename('C:\\Windows\\System32')).toThrow('path separators or ".."');
    });
  });

  describe('validateFilename - Special Character Blocking (AC #6)', () => {
    it('should reject filename with <', () => {
      expect(() => validateFilename('file<name.md')).toThrow('invalid characters');
    });

    it('should reject filename with >', () => {
      expect(() => validateFilename('file>name.md')).toThrow('invalid characters');
    });

    it('should reject filename with :', () => {
      expect(() => validateFilename('file:name.md')).toThrow('invalid characters');
    });

    it('should reject filename with "', () => {
      expect(() => validateFilename('file"name.md')).toThrow('invalid characters');
    });

    it('should reject filename with |', () => {
      expect(() => validateFilename('file|name.md')).toThrow('invalid characters');
    });

    it('should reject filename with ?', () => {
      expect(() => validateFilename('file?name.md')).toThrow('invalid characters');
    });

    it('should reject filename with *', () => {
      expect(() => validateFilename('file*name.md')).toThrow('invalid characters');
    });

    it('should reject filename with multiple special characters', () => {
      expect(() => validateFilename('file<>:|.md')).toThrow('invalid characters');
    });

    it('should list invalid characters in error message', () => {
      try {
        validateFilename('file<name.md');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('< > : " | ? *');
      }
    });
  });

  describe('validateFilename - Edge Cases', () => {
    it('should reject empty string', () => {
      expect(() => validateFilename('')).toThrow('Filename cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      expect(() => validateFilename('   ')).toThrow('Filename cannot be empty');
    });

    it('should trim whitespace before validation', () => {
      expect(() => validateFilename('  procurement-request.md  ')).not.toThrow();
    });

    it('should accept long but valid descriptive names', () => {
      const longName = 'this-is-a-very-long-but-still-descriptive-filename-for-project-documentation.md';
      expect(() => validateFilename(longName)).not.toThrow();
    });

    it('should accept filenames with numbers when descriptive', () => {
      expect(() => validateFilename('project-2025-q3-report.md')).not.toThrow();
      expect(() => validateFilename('agent-v2-instructions.md')).not.toThrow();
    });

    it('should accept filenames with dots in middle', () => {
      expect(() => validateFilename('project.config.yaml')).not.toThrow();
    });

    it('should accept various file extensions', () => {
      expect(() => validateFilename('data-export.csv')).not.toThrow();
      expect(() => validateFilename('config-settings.json')).not.toThrow();
      expect(() => validateFilename('deployment-notes.txt')).not.toThrow();
      expect(() => validateFilename('workflow-diagram.png')).not.toThrow();
    });

    it('should accept kebab-case names (AC #7)', () => {
      expect(() => validateFilename('multi-word-filename.md')).not.toThrow();
    });

    it('should accept camelCase names (AC #7 - not enforced)', () => {
      expect(() => validateFilename('multiWordFilename.md')).not.toThrow();
    });

    it('should accept snake_case names (AC #7 - not enforced)', () => {
      expect(() => validateFilename('multi_word_filename.md')).not.toThrow();
    });

    it('should accept PascalCase names (AC #7 - not enforced)', () => {
      expect(() => validateFilename('MultiWordFilename.md')).not.toThrow();
    });
  });

  describe('isValidFilename - Non-throwing Validation', () => {
    it('should return true for valid filenames', () => {
      expect(isValidFilename('procurement-request.md')).toBe(true);
      expect(isValidFilename('budget-analysis.csv')).toBe(true);
    });

    it('should return false for invalid filenames', () => {
      expect(isValidFilename('output.md')).toBe(false);
      expect(isValidFilename('../etc/passwd')).toBe(false);
      expect(isValidFilename('file<name.md')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidFilename('')).toBe(false);
    });
  });

  describe('getValidationError - Error Message Retrieval', () => {
    it('should return null for valid filenames', () => {
      expect(getValidationError('procurement-request.md')).toBeNull();
      expect(getValidationError('budget-analysis.csv')).toBeNull();
    });

    it('should return error message for invalid filenames', () => {
      const error = getValidationError('output.md');
      expect(error).toBeTruthy();
      expect(error).toContain('Generic filename');
    });

    it('should return error message for path traversal', () => {
      const error = getValidationError('../etc/passwd');
      expect(error).toBeTruthy();
      expect(error).toContain('path separators');
    });

    it('should return error message for special characters', () => {
      const error = getValidationError('file<name.md');
      expect(error).toBeTruthy();
      expect(error).toContain('invalid characters');
    });
  });
});
