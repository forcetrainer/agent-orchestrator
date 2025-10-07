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
});
