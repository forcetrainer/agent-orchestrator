/**
 * File Context Message Builder Tests
 * Story 6.7: File Attachment Backend Processing
 */

import { buildFileContextMessage } from '../fileContext';

describe('buildFileContextMessage', () => {
  it('should return null for empty attachments array', () => {
    const result = buildFileContextMessage([]);
    expect(result).toBeNull();
  });

  it('should format single file attachment correctly', () => {
    const attachments = [
      {
        filepath: '/path/to/file.md',
        filename: 'file.md',
        content: '# Test File\n\nThis is test content.'
      }
    ];

    const result = buildFileContextMessage(attachments);
    expect(result).not.toBeNull();
    expect(result?.role).toBe('system');
    expect(result?.content).toContain('Files attached by user:');
    expect(result?.content).toContain('File: file.md');
    expect(result?.content).toContain('---');
    expect(result?.content).toContain('# Test File');
    expect(result?.content).toContain('This is test content.');
  });

  it('should format multiple file attachments with separators', () => {
    const attachments = [
      {
        filepath: '/path/to/file1.md',
        filename: 'file1.md',
        content: 'Content of file 1'
      },
      {
        filepath: '/path/to/file2.txt',
        filename: 'file2.txt',
        content: 'Content of file 2'
      }
    ];

    const result = buildFileContextMessage(attachments);
    expect(result).not.toBeNull();
    expect(result?.role).toBe('system');
    expect(result?.content).toContain('File: file1.md');
    expect(result?.content).toContain('Content of file 1');
    expect(result?.content).toContain('File: file2.txt');
    expect(result?.content).toContain('Content of file 2');

    // Check that files are separated by double newlines
    expect(result?.content).toMatch(/---\n\n.*File:/);
  });

  it('should handle special characters in filenames', () => {
    const attachments = [
      {
        filepath: '/path/to/special-file_name.txt',
        filename: 'special-file_name.txt',
        content: 'Test content'
      }
    ];

    const result = buildFileContextMessage(attachments);
    expect(result?.content).toContain('File: special-file_name.txt');
  });

  it('should handle multiline file content', () => {
    const attachments = [
      {
        filepath: '/path/to/multiline.txt',
        filename: 'multiline.txt',
        content: 'Line 1\nLine 2\nLine 3\n\nLine 5 (after blank line)'
      }
    ];

    const result = buildFileContextMessage(attachments);
    expect(result?.content).toContain('Line 1');
    expect(result?.content).toContain('Line 2');
    expect(result?.content).toContain('Line 5 (after blank line)');
  });

  it('should handle empty file content', () => {
    const attachments = [
      {
        filepath: '/path/to/empty.txt',
        filename: 'empty.txt',
        content: ''
      }
    ];

    const result = buildFileContextMessage(attachments);
    expect(result?.content).toContain('File: empty.txt');
    expect(result?.content).toContain('---\n\n---'); // Empty content between delimiters
  });

  it('should match the exact format specified in AC-5', () => {
    const attachments = [
      {
        filepath: '/path/to/test.md',
        filename: 'test.md',
        content: 'Test content here'
      }
    ];

    const result = buildFileContextMessage(attachments);
    const expected = 'Files attached by user:\nFile: test.md\n---\nTest content here\n---';
    expect(result?.content).toBe(expected);
  });

  it('should return system role message', () => {
    const attachments = [
      {
        filepath: '/path/to/file.txt',
        filename: 'file.txt',
        content: 'content'
      }
    ];

    const result = buildFileContextMessage(attachments);
    expect(result?.role).toBe('system');
  });
});
