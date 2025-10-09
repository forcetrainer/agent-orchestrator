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
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    it('should show loading indicator when isLoading is true', async () => {
      // Arrange & Act
      render(<FileContentDisplay content={null} isLoading={true} error={null} />);

      // Story 5.6: Loading spinner has 200ms delay
      // Assert - Should not show immediately
      expect(screen.queryByText('Loading file...')).not.toBeInTheDocument();

      // Wait for 200ms delay
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      // Assert - Should show after delay
      expect(screen.getByText('Loading file...')).toBeInTheDocument();
    });

    it('should show spinner animation during loading', async () => {
      // Arrange & Act
      const { container } = render(<FileContentDisplay content={null} isLoading={true} error={null} />);

      // Story 5.6: Loading spinner has 200ms delay
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
      });

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
      // Arrange - Use text/plain instead of markdown to test raw text rendering
      const mockContent: FileContentResponse = {
        success: true,
        path: 'test.txt',
        content: 'Plain text content',
        mimeType: 'text/plain',
        size: 18,
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
      render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert - Story 5.6: Empty files show special message instead of empty pre tag
      expect(screen.getByText('This file is empty')).toBeInTheDocument();
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

  /**
   * Story 5.4: Markdown Rendering in File Viewer
   * Test Coverage:
   * - AC-1: .md files render with markdown formatting by default
   * - AC-2: Toggle button switches between rendered and raw view
   * - AC-3: Headings, lists, tables all render correctly
   * - AC-4: Links are clickable with proper security
   * - AC-5: Code blocks display with monospace font and background
   * - AC-6: Markdown rendering matches chat interface styling
   * - AC-7: Default view is rendered (not raw text)
   */
  describe('Story 5.4: Markdown Rendering', () => {
    describe('AC-1, AC-7: Markdown file detection and default rendering', () => {
      it('should detect markdown files by mimeType', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'README.md',
          content: '# Heading',
          mimeType: 'text/markdown',
          size: 9,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert - Should render markdown (h1) not raw text
        const h1 = container.querySelector('h1');
        expect(h1).toBeInTheDocument();
        expect(h1?.textContent).toBe('Heading');
      });

      it('should render markdown by default (not raw text)', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'doc.md',
          content: '## Subheading',
          mimeType: 'text/markdown',
          size: 13,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert - Should render as h2, not in <pre> tag
        const h2 = container.querySelector('h2');
        expect(h2).toBeInTheDocument();
        expect(h2?.textContent).toBe('Subheading');
      });

      it('should not render markdown for non-markdown files', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'test.txt',
          content: '# Not a heading',
          mimeType: 'text/plain',
          size: 15,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert - Should render in <pre> tag, not as h1
        const preElement = container.querySelector('pre');
        expect(preElement).toBeInTheDocument();
        expect(preElement?.textContent).toBe('# Not a heading');
        const h1 = container.querySelector('h1');
        expect(h1).not.toBeInTheDocument();
      });
    });

    describe('AC-2: Toggle button functionality', () => {
      it('should show toggle button for markdown files', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'README.md',
          content: '# Heading',
          mimeType: 'text/markdown',
          size: 9,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const toggleButton = screen.getByRole('button', { name: /toggle between rendered and raw view/i });
        expect(toggleButton).toBeInTheDocument();
      });

      it('should not show toggle button for non-markdown files', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'test.txt',
          content: 'Plain text',
          mimeType: 'text/plain',
          size: 10,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const toggleButton = screen.queryByRole('button', { name: /toggle between rendered and raw view/i });
        expect(toggleButton).not.toBeInTheDocument();
      });

      it('should show "View Raw" button when in rendered mode', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'README.md',
          content: '# Heading',
          mimeType: 'text/markdown',
          size: 9,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const toggleButton = screen.getByRole('button', { name: /toggle between rendered and raw view/i });
        expect(toggleButton.textContent).toBe('View Raw');
      });

      it('should switch to raw view when toggle button is clicked', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'README.md',
          content: '# Heading',
          mimeType: 'text/markdown',
          size: 9,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);
        const toggleButton = screen.getByRole('button', { name: /toggle between rendered and raw view/i });

        // Initially in rendered mode - h1 exists
        expect(container.querySelector('h1')).toBeInTheDocument();

        // Click toggle
        act(() => {
          toggleButton.click();
        });

        // Assert - Should switch to raw view
        expect(toggleButton.textContent).toBe('View Rendered');
        const preElement = container.querySelector('pre');
        expect(preElement).toBeInTheDocument();
        expect(preElement?.textContent).toBe('# Heading');
        expect(container.querySelector('h1')).not.toBeInTheDocument();
      });

      it('should toggle back to rendered view when clicked again', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'README.md',
          content: '# Heading',
          mimeType: 'text/markdown',
          size: 9,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);
        const toggleButton = screen.getByRole('button', { name: /toggle between rendered and raw view/i });

        // Toggle to raw
        act(() => {
          toggleButton.click();
        });
        expect(toggleButton.textContent).toBe('View Rendered');

        // Toggle back to rendered
        act(() => {
          toggleButton.click();
        });

        // Assert
        expect(toggleButton.textContent).toBe('View Raw');
        expect(container.querySelector('h1')).toBeInTheDocument();
        expect(container.querySelector('h1')?.textContent).toBe('Heading');
      });

      it('should have proper aria-label on toggle button', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'README.md',
          content: '# Heading',
          mimeType: 'text/markdown',
          size: 9,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const toggleButton = screen.getByRole('button', { name: 'Toggle between rendered and raw view' });
        expect(toggleButton).toHaveAttribute('aria-label', 'Toggle between rendered and raw view');
      });
    });

    describe('AC-3: Headings, lists, and tables rendering', () => {
      it('should render all heading levels correctly', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'headings.md',
          content: '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6',
          mimeType: 'text/markdown',
          size: 40,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        expect(container.querySelector('h1')?.textContent).toBe('H1');
        expect(container.querySelector('h2')?.textContent).toBe('H2');
        expect(container.querySelector('h3')?.textContent).toBe('H3');
        expect(container.querySelector('h4')?.textContent).toBe('H4');
        expect(container.querySelector('h5')?.textContent).toBe('H5');
        expect(container.querySelector('h6')?.textContent).toBe('H6');
      });

      it('should render unordered lists correctly', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'list.md',
          content: '- Item 1\n- Item 2\n- Item 3',
          mimeType: 'text/markdown',
          size: 27,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const ul = container.querySelector('ul');
        expect(ul).toBeInTheDocument();
        expect(ul).toHaveClass('list-disc');
        const listItems = container.querySelectorAll('li');
        expect(listItems).toHaveLength(3);
      });

      it('should render ordered lists correctly', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'list.md',
          content: '1. First\n2. Second\n3. Third',
          mimeType: 'text/markdown',
          size: 28,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const ol = container.querySelector('ol');
        expect(ol).toBeInTheDocument();
        expect(ol).toHaveClass('list-decimal');
        const listItems = container.querySelectorAll('li');
        expect(listItems).toHaveLength(3);
      });

      it('should render tables with proper structure', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'table.md',
          content: '| Col1 | Col2 |\n|------|------|\n| A    | B    |',
          mimeType: 'text/markdown',
          size: 48,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const table = container.querySelector('table');
        expect(table).toBeInTheDocument();
        expect(table).toHaveClass('border');
        // Note: react-markdown + remark-gfm renders tables with thead/tbody
        // but the structure may vary. Just verify table exists with proper styling.
        const rows = container.querySelectorAll('tr');
        expect(rows.length).toBeGreaterThan(0);
      });
    });

    describe('AC-4: Links with proper security', () => {
      it('should render links as clickable', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'link.md',
          content: '[Click here](https://example.com)',
          mimeType: 'text/markdown',
          size: 35,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const link = container.querySelector('a');
        expect(link).toBeInTheDocument();
        expect(link?.textContent).toBe('Click here');
        expect(link).toHaveAttribute('href', 'https://example.com');
      });

      it('should open links in new tab with security attributes', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'link.md',
          content: '[External](https://external.com)',
          mimeType: 'text/markdown',
          size: 34,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const link = container.querySelector('a');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });

      it('should style links with blue color and underline', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'link.md',
          content: '[Link](https://example.com)',
          mimeType: 'text/markdown',
          size: 28,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const link = container.querySelector('a');
        expect(link).toHaveClass('text-blue-600');
        expect(link).toHaveClass('underline');
      });
    });

    describe('AC-5: Code blocks with monospace font and background', () => {
      it('should render code blocks with proper styling', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'code.md',
          content: '```javascript\nconst x = 1;\n```',
          mimeType: 'text/markdown',
          size: 31,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const pre = container.querySelector('pre');
        expect(pre).toBeInTheDocument();
        expect(pre).toHaveClass('bg-gray-100');
        expect(pre).toHaveClass('rounded');
        const code = container.querySelector('code');
        expect(code).toHaveClass('font-mono');
      });

      it('should render inline code with background', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'inline.md',
          content: 'Use `const` for constants',
          mimeType: 'text/markdown',
          size: 26,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert
        const code = container.querySelector('code');
        expect(code).toBeInTheDocument();
        expect(code).toHaveClass('bg-gray-100');
        expect(code).toHaveClass('font-mono');
        expect(code?.textContent).toBe('const');
      });
    });

    describe('AC-6: Styling consistency with chat interface', () => {
      it('should use same heading classes as MessageBubble', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'style.md',
          content: '# Heading 1\n## Heading 2',
          mimeType: 'text/markdown',
          size: 24,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert - Same classes as MessageBubble.tsx
        const h1 = container.querySelector('h1');
        expect(h1).toHaveClass('text-2xl', 'font-bold', 'mb-2');
        const h2 = container.querySelector('h2');
        expect(h2).toHaveClass('text-xl', 'font-bold', 'mb-2');
      });

      it('should use same list classes as MessageBubble', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'list.md',
          content: '- Item',
          mimeType: 'text/markdown',
          size: 6,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert - Same classes as MessageBubble.tsx
        const ul = container.querySelector('ul');
        expect(ul).toHaveClass('list-disc', 'list-inside', 'mb-2', 'space-y-1');
      });
    });

    describe('Edge cases and error handling', () => {
      it('should handle empty markdown files without error', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'empty.md',
          content: '',
          mimeType: 'text/markdown',
          size: 0,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act & Assert - Should not throw
        expect(() => {
          render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);
        }).not.toThrow();
      });

      it('should render malformed markdown best-effort without crashing', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'malformed.md',
          content: '# Unclosed heading\n**bold without close\n[link without url]',
          mimeType: 'text/markdown',
          size: 57,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act & Assert - Should not throw
        expect(() => {
          render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);
        }).not.toThrow();
      });

      it('should handle truncated markdown files correctly', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'large.md',
          content: '# Large Document\n\nContent truncated...',
          mimeType: 'text/markdown',
          size: 2 * 1024 * 1024, // 2MB
          modified: '2025-10-07T12:00:00Z',
          truncated: true,
        };

        // Act
        render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert - Should show truncation warning and render markdown
        expect(screen.getByText(/File truncated/i)).toBeInTheDocument();
        const h1 = screen.getByText('Large Document');
        expect(h1.tagName).toBe('H1');
      });

      it('should handle special characters in markdown', () => {
        // Arrange
        const mockContent: FileContentResponse = {
          success: true,
          path: 'special.md',
          content: '# Hello 世界 & <test>',
          mimeType: 'text/markdown',
          size: 22,
          modified: '2025-10-07T12:00:00Z',
        };

        // Act
        const { container } = render(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

        // Assert - Should render without XSS issues
        const h1 = container.querySelector('h1');
        expect(h1?.textContent).toContain('世界');
      });
    });
  });

  describe('Story 5.6: Loading Indicator with Delay', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should delay loading spinner by 200ms to prevent flicker', () => {
      // Arrange & Act - Start loading
      const { rerender } = render(<FileContentDisplay content={null} isLoading={true} error={null} />);

      // Assert - Spinner should NOT appear immediately
      expect(screen.queryByText('Loading file...')).not.toBeInTheDocument();

      // Act - Advance timers by 199ms (just before threshold)
      act(() => {
        jest.advanceTimersByTime(199);
      });

      // Assert - Still no spinner
      expect(screen.queryByText('Loading file...')).not.toBeInTheDocument();

      // Act - Advance to 200ms
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Assert - Spinner should now appear
      expect(screen.getByText('Loading file...')).toBeInTheDocument();
    });

    it('should not show spinner if loading completes before 200ms', () => {
      // Arrange & Act - Start loading
      const { rerender } = render(<FileContentDisplay content={null} isLoading={true} error={null} />);

      // Act - Complete loading before 200ms delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const mockContent: FileContentResponse = {
        success: true,
        path: 'fast.txt',
        content: 'Fast content',
        mimeType: 'text/plain',
        size: 12,
        modified: '2025-10-07T12:00:00Z',
      };

      rerender(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Act - Advance remaining time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Assert - Should show content, not spinner
      expect(screen.getByText('Fast content')).toBeInTheDocument();
      expect(screen.queryByText('Loading file...')).not.toBeInTheDocument();
    });

    it('should hide spinner immediately when loading completes', () => {
      // Arrange - Start loading and wait for spinner
      const { rerender } = render(<FileContentDisplay content={null} isLoading={true} error={null} />);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(screen.getByText('Loading file...')).toBeInTheDocument();

      // Act - Complete loading
      const mockContent: FileContentResponse = {
        success: true,
        path: 'file.txt',
        content: 'Content',
        mimeType: 'text/plain',
        size: 7,
        modified: '2025-10-07T12:00:00Z',
      };

      rerender(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      // Assert - Spinner should disappear immediately
      expect(screen.queryByText('Loading file...')).not.toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Story 5.6: Empty File State', () => {
    it('should show "This file is empty" for empty text files', () => {
      // Arrange
      const emptyFileContent: FileContentResponse = {
        success: true,
        path: 'empty.txt',
        content: '',
        mimeType: 'text/plain',
        size: 0,
        modified: '2025-10-07T12:00:00Z',
        isBinary: false,
      };

      // Act
      render(<FileContentDisplay content={emptyFileContent} isLoading={false} error={null} />);

      // Assert
      expect(screen.getByText('This file is empty')).toBeInTheDocument();
      expect(screen.getByText(/text\/plain.*0 B/i)).toBeInTheDocument();
    });

    it('should show different icon for empty files vs loading', () => {
      // Arrange - Empty file
      const emptyFileContent: FileContentResponse = {
        success: true,
        path: 'empty.txt',
        content: '',
        mimeType: 'text/plain',
        size: 0,
        modified: '2025-10-07T12:00:00Z',
        isBinary: false,
      };

      // Act
      const { container: emptyContainer } = render(
        <FileContentDisplay content={emptyFileContent} isLoading={false} error={null} />
      );

      // Assert - Empty state should have document icon (different from loading spinner)
      const emptyText = screen.getByText('This file is empty');
      const emptySvg = emptyText.parentElement?.querySelector('svg');
      expect(emptySvg).toBeInTheDocument();
      expect(emptySvg?.querySelector('path[d*="M9 12h6m-6 4h6"]')).toBeInTheDocument(); // Document icon
    });

    it('should not show empty state for binary files', () => {
      // Arrange - Binary file with 0 size
      const binaryContent: FileContentResponse = {
        success: true,
        path: 'image.png',
        content: '',
        mimeType: 'image/png',
        size: 0,
        modified: '2025-10-07T12:00:00Z',
        isBinary: true,
      };

      // Act
      render(<FileContentDisplay content={binaryContent} isLoading={false} error={null} />);

      // Assert - Should show binary preview message, not empty file message
      expect(screen.getByText('Cannot preview binary file')).toBeInTheDocument();
      expect(screen.queryByText('This file is empty')).not.toBeInTheDocument();
    });

    it('should distinguish empty markdown file from rendered empty markdown', () => {
      // Arrange - Empty markdown file
      const emptyMarkdown: FileContentResponse = {
        success: true,
        path: 'empty.md',
        content: '',
        mimeType: 'text/markdown',
        size: 0,
        modified: '2025-10-07T12:00:00Z',
        isBinary: false,
      };

      // Act
      render(<FileContentDisplay content={emptyMarkdown} isLoading={false} error={null} />);

      // Assert - Should show empty file message, not blank rendered view
      expect(screen.getByText('This file is empty')).toBeInTheDocument();
    });
  });

  describe('Story 5.6: Breadcrumb Integration', () => {
    it('should display breadcrumb when file is selected', () => {
      // Arrange
      const fileContent: FileContentResponse = {
        success: true,
        path: 'session-123/test.txt',
        content: 'Test content',
        mimeType: 'text/plain',
        size: 12,
        modified: '2025-10-07T12:00:00Z',
        isBinary: false,
        truncated: false,
      };

      const treeData = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: [
          {
            name: 'session-123',
            path: 'session-123',
            type: 'directory' as const,
            displayName: 'Alex - Intake Workflow',
            children: [
              {
                name: 'test.txt',
                path: 'session-123/test.txt',
                type: 'file' as const,
              },
            ],
          },
        ],
      };

      // Act
      render(
        <FileContentDisplay
          content={fileContent}
          isLoading={false}
          error={null}
          currentFilePath="session-123/test.txt"
          treeData={treeData}
        />
      );

      // Assert
      expect(screen.getByText('Alex - Intake Workflow')).toBeInTheDocument();
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    it('should call onBreadcrumbNavigate when segment is clicked', async () => {
      const user = userEvent.setup();
      const onNavigate = jest.fn();

      const fileContent: FileContentResponse = {
        success: true,
        path: 'session-123/folder/test.txt',
        content: 'Test content',
        mimeType: 'text/plain',
        size: 12,
        modified: '2025-10-07T12:00:00Z',
        isBinary: false,
        truncated: false,
      };

      const treeData = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: [
          {
            name: 'session-123',
            path: 'session-123',
            type: 'directory' as const,
            displayName: 'Session Name',
            children: [
              {
                name: 'folder',
                path: 'session-123/folder',
                type: 'directory' as const,
                children: [
                  {
                    name: 'test.txt',
                    path: 'session-123/folder/test.txt',
                    type: 'file' as const,
                  },
                ],
              },
            ],
          },
        ],
      };

      // Act
      render(
        <FileContentDisplay
          content={fileContent}
          isLoading={false}
          error={null}
          currentFilePath="session-123/folder/test.txt"
          treeData={treeData}
          onBreadcrumbNavigate={onNavigate}
        />
      );

      // Click the session segment
      const sessionSegment = screen.getByText('Session Name');
      await user.click(sessionSegment);

      // Assert
      expect(onNavigate).toHaveBeenCalledWith('session-123');
    });

    it('should not display breadcrumb when no file path provided', () => {
      // Arrange
      const fileContent: FileContentResponse = {
        success: true,
        path: 'test.txt',
        content: 'Test content',
        mimeType: 'text/plain',
        size: 12,
        modified: '2025-10-07T12:00:00Z',
        isBinary: false,
        truncated: false,
      };

      // Act
      render(
        <FileContentDisplay
          content={fileContent}
          isLoading={false}
          error={null}
        />
      );

      // Assert - breadcrumb navigation should not be present
      expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
    });
  });

  describe('Story 5.6: Scroll Position Reset', () => {
    it('should reset scroll to top when new file loaded', async () => {
      // Arrange - First file with content
      const firstFile: FileContentResponse = {
        success: true,
        path: 'first.txt',
        content: 'First file content\n'.repeat(100), // Long content
        mimeType: 'text/plain',
        size: 1900,
        modified: '2025-10-07T12:00:00Z',
      };

      const { rerender, container } = render(
        <FileContentDisplay content={firstFile} isLoading={false} error={null} />
      );

      const scrollContainer = container.querySelector('.overflow-auto');
      expect(scrollContainer).toBeInTheDocument();

      // Mock scrollTo
      const mockScrollTo = jest.fn();
      if (scrollContainer) {
        scrollContainer.scrollTo = mockScrollTo;
      }

      // Act - Load new file
      const secondFile: FileContentResponse = {
        success: true,
        path: 'second.txt',
        content: 'Second file content',
        mimeType: 'text/plain',
        size: 19,
        modified: '2025-10-07T12:00:00Z',
      };

      rerender(<FileContentDisplay content={secondFile} isLoading={false} error={null} />);

      // Assert - scrollTo should be called with top: 0 and smooth behavior
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });

    it('should use smooth scroll behavior for better UX', async () => {
      // Arrange
      const mockContent: FileContentResponse = {
        success: true,
        path: 'file.txt',
        content: 'Content',
        mimeType: 'text/plain',
        size: 7,
        modified: '2025-10-07T12:00:00Z',
      };

      const { container, rerender } = render(
        <FileContentDisplay content={null} isLoading={false} error={null} />
      );

      // Act - Load file
      rerender(<FileContentDisplay content={mockContent} isLoading={false} error={null} />);

      const scrollContainer = container.querySelector('.overflow-auto');
      const mockScrollTo = jest.fn();
      if (scrollContainer) {
        scrollContainer.scrollTo = mockScrollTo;
      }

      // Trigger re-render with new content
      const newContent: FileContentResponse = {
        ...mockContent,
        path: 'newfile.txt',
      };
      rerender(<FileContentDisplay content={newContent} isLoading={false} error={null} />);

      // Assert
      expect(mockScrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: 'smooth',
        })
      );
    });
  });
});
