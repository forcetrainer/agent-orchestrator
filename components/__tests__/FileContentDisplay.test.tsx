/**
 * Tests for FileContentDisplay component
 * Story 5.3: Display File Contents
 *
 * Test Coverage:
 * - AC-2: Text files display with proper formatting (preserved whitespace)
 * - AC-3: Line breaks and formatting preserved in display
 * - AC-4: Large files show truncation warning
 * - AC-5: Binary files show "Cannot preview" message
 * - Loading and error states
 * - Empty state when no file selected
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileContentDisplay } from '../FileContentDisplay';
import type { FileContentResponse } from '@/types/api';

describe('FileContentDisplay', () => {
  describe('Empty state', () => {
    it('should show "No file selected" message when content is null', () => {
      // Arrange & Act
      render(<FileContentDisplay content={null} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText('No file selected')).toBeInTheDocument();
      expect(screen.getByText('Click a file in the tree to view its contents')).toBeInTheDocument();
    });

    it('should display empty state icon', () => {
      // Arrange & Act
      const { container } = render(<FileContentDisplay content={null} isLoading={false} error={null} />);

      // Assert
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      // Arrange & Act
      render(<FileContentDisplay content={null} isLoading={true} error={null} />);

      // Assert
      expect(screen.getByText('Loading file...')).toBeInTheDocument();
    });

    it('should show spinner animation during loading', () => {
      // Arrange & Act
      const { container } = render(<FileContentDisplay content={null} isLoading={true} error={null} />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when error is provided', () => {
      // Arrange
      const errorMessage = 'Failed to load file';

      // Act
      render(<FileContentDisplay content={null} isLoading={false} error={errorMessage} />);

      // Assert
      expect(screen.getByText('Error loading file')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show error icon in error state', () => {
      // Arrange & Act
      const { container } = render(<FileContentDisplay content={null} isLoading={false} error="Error" />);

      // Assert
      const errorContainer = container.querySelector('.bg-red-50');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('AC-2, AC-3: Text file display with formatting preservation', () => {
    it('should render text content in <pre> tag', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'test.txt',
        content: 'Test content',
        mimeType: 'text/plain',
        size: 12,
        modified: '2025-10-06T12:00:00Z',
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const preElement = container.querySelector('pre');
      expect(preElement).toBeInTheDocument();
      expect(preElement).toHaveTextContent('Test content');
    });

    it('should preserve line breaks in content', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'test.txt',
        content: 'Line 1\nLine 2\nLine 3',
        mimeType: 'text/plain',
        size: 21,
        modified: '2025-10-06T12:00:00Z',
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const preElement = container.querySelector('pre');
      expect(preElement?.textContent).toContain('\n');
      expect(preElement?.textContent).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should preserve whitespace and indentation', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'test.txt',
        content: '  Indented\n    More indented\n  Back',
        mimeType: 'text/plain',
        size: 36,
        modified: '2025-10-06T12:00:00Z',
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const preElement = container.querySelector('pre');
      expect(preElement).toHaveClass('whitespace-pre-wrap');
      expect(preElement?.textContent).toMatch(/^\s{2}Indented/);
    });

    it('should apply correct CSS classes for text preservation', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'test.md',
        content: '# Heading',
        mimeType: 'text/markdown',
        size: 9,
        modified: '2025-10-06T12:00:00Z',
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const preElement = container.querySelector('pre');
      expect(preElement).toHaveClass('whitespace-pre-wrap');
      expect(preElement).toHaveClass('break-words');
      expect(preElement).toHaveClass('font-mono');
    });

    it('should handle empty text files', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'empty.txt',
        content: '',
        mimeType: 'text/plain',
        size: 0,
        modified: '2025-10-06T12:00:00Z',
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const preElement = container.querySelector('pre');
      expect(preElement).toBeInTheDocument();
      expect(preElement?.textContent).toBe('');
    });
  });

  describe('AC-4: Large file truncation warning', () => {
    it('should show truncation warning when file is truncated', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'large.txt',
        content: 'Truncated content...',
        mimeType: 'text/plain',
        size: 2 * 1024 * 1024, // 2MB
        modified: '2025-10-06T12:00:00Z',
        truncated: true,
      };

      // Act
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText(/File truncated/i)).toBeInTheDocument();
      expect(screen.getByText(/Showing first 5000 lines/i)).toBeInTheDocument();
    });

    it('should display file size in truncation warning', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'large.txt',
        content: 'Content',
        mimeType: 'text/plain',
        size: 2 * 1024 * 1024, // 2MB
        modified: '2025-10-06T12:00:00Z',
        truncated: true,
      };

      // Act
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText(/2\.0 MB/i)).toBeInTheDocument();
    });

    it('should not show truncation warning for non-truncated files', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'small.txt',
        content: 'Small content',
        mimeType: 'text/plain',
        size: 100,
        modified: '2025-10-06T12:00:00Z',
      };

      // Act
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.queryByText(/File truncated/i)).not.toBeInTheDocument();
    });

    it('should highlight truncation warning with yellow background', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'large.txt',
        content: 'Content',
        mimeType: 'text/plain',
        size: 2 * 1024 * 1024,
        modified: '2025-10-06T12:00:00Z',
        truncated: true,
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const warning = container.querySelector('.bg-yellow-50');
      expect(warning).toBeInTheDocument();
      expect(warning?.textContent).toContain('File truncated');
    });
  });

  describe('AC-5: Binary file handling', () => {
    it('should show "Cannot preview binary file" message for binary files', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'image.png',
        content: '',
        mimeType: 'image/png',
        size: 45120,
        modified: '2025-10-06T12:00:00Z',
        isBinary: true,
      };

      // Act
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText('Cannot preview binary file')).toBeInTheDocument();
    });

    it('should display mime type and file size for binary files', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'document.pdf',
        content: '',
        mimeType: 'application/pdf',
        size: 1024 * 500, // 500 KB
        modified: '2025-10-06T12:00:00Z',
        isBinary: true,
      };

      // Act
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText(/application\/pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/500\.0 KB/i)).toBeInTheDocument();
    });

    it('should not render content in <pre> tag for binary files', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'archive.zip',
        content: '',
        mimeType: 'application/zip',
        size: 1024,
        modified: '2025-10-06T12:00:00Z',
        isBinary: true,
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const preElement = container.querySelector('pre');
      expect(preElement).not.toBeInTheDocument();
    });

    it('should show image icon for binary files', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'photo.jpg',
        content: '',
        mimeType: 'image/jpeg',
        size: 2048,
        modified: '2025-10-06T12:00:00Z',
        isBinary: true,
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('File size formatting', () => {
    it('should format bytes correctly', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'tiny.txt',
        content: '',
        mimeType: 'text/plain',
        size: 512,
        modified: '2025-10-06T12:00:00Z',
        isBinary: true,
      };

      // Act
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText(/512 B/i)).toBeInTheDocument();
    });

    it('should format kilobytes correctly', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'small.txt',
        content: '',
        mimeType: 'text/plain',
        size: 5 * 1024, // 5 KB
        modified: '2025-10-06T12:00:00Z',
        isBinary: true,
      };

      // Act
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText(/5\.0 KB/i)).toBeInTheDocument();
    });

    it('should format megabytes correctly', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'medium.txt',
        content: '',
        mimeType: 'text/plain',
        size: 3.5 * 1024 * 1024, // 3.5 MB
        modified: '2025-10-06T12:00:00Z',
        isBinary: true,
      };

      // Act
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText(/3\.5 MB/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles for icons', () => {
      // Arrange & Act
      const { container } = render(<FileContentDisplay content={null} isLoading={false} error={null} />);

      // Assert
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should render content as readable text', () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'test.txt',
        content: 'Readable content',
        mimeType: 'text/plain',
        size: 16,
        modified: '2025-10-06T12:00:00Z',
      };

      // Act
      const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert
      const preElement = container.querySelector('pre');
      expect(preElement?.textContent).toBe('Readable content');
    });
  });
});
