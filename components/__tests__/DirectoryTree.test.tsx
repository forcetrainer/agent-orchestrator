/**
 * DirectoryTree Component Tests
 *
 * Story 5.2: Display Directory Tree Structure
 * Tests for AC-1, AC-2, AC-3, AC-4, AC-5, AC-7
 *
 * Story 5.5: Refresh File List
 * Tests for AC-3: New file visual indicators
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DirectoryTree, FileTreeNode } from '../DirectoryTree';

describe('DirectoryTree', () => {
  // Test fixture: Sample tree structure
  const mockTree: FileTreeNode = {
    name: 'root',
    path: '',
    type: 'directory',
    children: [
      {
        name: 'folder1',
        path: 'folder1',
        type: 'directory',
        children: [
          {
            name: 'file1.txt',
            path: 'folder1/file1.txt',
            type: 'file',
            size: 1024,
          },
          {
            name: 'nested',
            path: 'folder1/nested',
            type: 'directory',
            children: [
              {
                name: 'deep.md',
                path: 'folder1/nested/deep.md',
                type: 'file',
                size: 512,
              },
            ],
          },
        ],
      },
      {
        name: 'file2.txt',
        path: 'file2.txt',
        type: 'file',
        size: 2048,
      },
      {
        name: 'empty-folder',
        path: 'empty-folder',
        type: 'directory',
        children: [],
      },
    ],
  };

  describe('AC-1: Directory tree displays output folder structure', () => {
    it('renders tree structure correctly', () => {
      render(<DirectoryTree root={mockTree} />);

      // Top-level items should be visible
      expect(screen.getByText('folder1')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
      expect(screen.getByText('empty-folder')).toBeInTheDocument();
    });

    it('does not render nested items until folder is expanded', () => {
      render(<DirectoryTree root={mockTree} />);

      // Nested items should not be visible initially
      expect(screen.queryByText('file1.txt')).not.toBeInTheDocument();
      expect(screen.queryByText('nested')).not.toBeInTheDocument();
      expect(screen.queryByText('deep.md')).not.toBeInTheDocument();
    });

    it('shows "No files available" when root is null', () => {
      render(<DirectoryTree root={null} />);

      expect(screen.getByText('No files available')).toBeInTheDocument();
    });

    it('shows "No files yet" when root has no children', () => {
      const emptyRoot: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [],
      };

      render(<DirectoryTree root={emptyRoot} />);

      expect(screen.getByText('No files yet')).toBeInTheDocument();
    });
  });

  describe('AC-2: Folders can be expanded/collapsed via click interaction', () => {
    it('expands folder when clicked', () => {
      render(<DirectoryTree root={mockTree} />);

      const folder1 = screen.getByText('folder1');

      // Initially collapsed - children not visible
      expect(screen.queryByText('file1.txt')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(folder1);

      // Children now visible
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('nested')).toBeInTheDocument();
    });

    it('collapses folder when clicked again', () => {
      render(<DirectoryTree root={mockTree} />);

      const folder1 = screen.getByText('folder1');

      // Expand first
      fireEvent.click(folder1);
      expect(screen.getByText('file1.txt')).toBeInTheDocument();

      // Collapse
      fireEvent.click(folder1);
      expect(screen.queryByText('file1.txt')).not.toBeInTheDocument();
    });

    it('supports nested folder expand/collapse', () => {
      render(<DirectoryTree root={mockTree} />);

      // Expand folder1
      fireEvent.click(screen.getByText('folder1'));
      expect(screen.getByText('nested')).toBeInTheDocument();

      // Expand nested
      fireEvent.click(screen.getByText('nested'));
      expect(screen.getByText('deep.md')).toBeInTheDocument();

      // Collapse nested
      fireEvent.click(screen.getByText('nested'));
      expect(screen.queryByText('deep.md')).not.toBeInTheDocument();
    });
  });

  describe('AC-3: Files are distinguishable from folders', () => {
    it('renders folder icons for directories', () => {
      const { container } = render(<DirectoryTree root={mockTree} />);

      // Folders should have blue folder icon
      const folder1Element = screen.getByText('folder1').parentElement;
      const folderIcon = folder1Element?.querySelector('svg');

      expect(folderIcon).toBeInTheDocument();
      expect(folderIcon).toHaveClass('text-blue-500');
    });

    it('renders file icons for files', () => {
      const { container } = render(<DirectoryTree root={mockTree} />);

      // Files should have gray file icon
      const file2Element = screen.getByText('file2.txt').parentElement;
      const fileIcon = file2Element?.querySelector('svg');

      expect(fileIcon).toBeInTheDocument();
      expect(fileIcon).toHaveClass('text-gray-400');
    });

    it('shows file size for files', () => {
      render(<DirectoryTree root={mockTree} />);

      // File size should be displayed (2048 bytes = 2 KB)
      expect(screen.getByText('2 KB')).toBeInTheDocument();
    });

    it('formats file sizes correctly', () => {
      const treeWithSizes: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'small.txt',
            path: 'small.txt',
            type: 'file',
            size: 512, // 512 B
          },
          {
            name: 'medium.txt',
            path: 'medium.txt',
            type: 'file',
            size: 1024 * 50, // 50 KB
          },
          {
            name: 'large.txt',
            path: 'large.txt',
            type: 'file',
            size: 1024 * 1024 * 2, // 2 MB
          },
        ],
      };

      render(<DirectoryTree root={treeWithSizes} />);

      expect(screen.getByText('512 B')).toBeInTheDocument();
      expect(screen.getByText('50 KB')).toBeInTheDocument();
      expect(screen.getByText('2 MB')).toBeInTheDocument();
    });
  });

  describe('AC-4: Nested directories display with proper indentation', () => {
    it('applies correct indentation for nested items', () => {
      render(<DirectoryTree root={mockTree} />);

      // Expand folder1
      fireEvent.click(screen.getByText('folder1'));

      // Top-level: 8px padding (depth 0)
      const folder1Element = screen.getByText('folder1').parentElement;
      expect(folder1Element).toHaveStyle({ paddingLeft: '8px' });

      // First nesting: 24px padding (depth 1: 16px + 8px)
      const file1Element = screen.getByText('file1.txt').parentElement;
      expect(file1Element).toHaveStyle({ paddingLeft: '24px' });

      // Expand nested folder
      fireEvent.click(screen.getByText('nested'));

      // Second nesting: 40px padding (depth 2: 32px + 8px)
      const deepElement = screen.getByText('deep.md').parentElement;
      expect(deepElement).toHaveStyle({ paddingLeft: '40px' });
    });
  });

  describe('AC-5: Empty folders show as empty (not hidden from tree)', () => {
    it('displays empty folder in tree', () => {
      render(<DirectoryTree root={mockTree} />);

      // Empty folder should be visible
      expect(screen.getByText('empty-folder')).toBeInTheDocument();
    });

    it('shows "Empty folder" message when expanded', () => {
      render(<DirectoryTree root={mockTree} />);

      // Expand empty folder
      fireEvent.click(screen.getByText('empty-folder'));

      // Should show empty state
      expect(screen.getByText('Empty folder')).toBeInTheDocument();
    });

    it('does not show "Empty folder" for folders with children', () => {
      render(<DirectoryTree root={mockTree} />);

      // Expand folder1 (has children)
      fireEvent.click(screen.getByText('folder1'));

      // Should NOT show empty state
      expect(screen.queryByText('Empty folder')).not.toBeInTheDocument();
    });
  });

  describe('AC-7: Clicking file selects it for viewing', () => {
    it('calls onFileSelect callback when file is clicked', () => {
      const mockOnFileSelect = jest.fn();
      render(<DirectoryTree root={mockTree} onFileSelect={mockOnFileSelect} />);

      // Click file
      fireEvent.click(screen.getByText('file2.txt'));

      // Callback should be invoked with file path
      expect(mockOnFileSelect).toHaveBeenCalledWith('file2.txt');
      expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
    });

    it('does not call onFileSelect when folder is clicked', () => {
      const mockOnFileSelect = jest.fn();
      render(<DirectoryTree root={mockTree} onFileSelect={mockOnFileSelect} />);

      // Click folder
      fireEvent.click(screen.getByText('folder1'));

      // Callback should NOT be invoked (folders toggle expand/collapse)
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('highlights selected file', () => {
      render(<DirectoryTree root={mockTree} selectedFile="file2.txt" />);

      const file2Element = screen.getByText('file2.txt').parentElement;

      // Selected file should have blue background
      expect(file2Element).toHaveClass('bg-blue-50', 'text-blue-700');
    });

    it('does not highlight non-selected files', () => {
      render(<DirectoryTree root={mockTree} selectedFile="file2.txt" />);

      // Expand folder1
      fireEvent.click(screen.getByText('folder1'));

      const file1Element = screen.getByText('file1.txt').parentElement;

      // Non-selected file should not have blue background
      expect(file1Element).not.toHaveClass('bg-blue-50', 'text-blue-700');
    });
  });

  describe('Performance: React.memo optimization', () => {
    it('renders large tree without performance issues', () => {
      // Create tree with 100 files
      const largeTree: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: Array.from({ length: 100 }, (_, i) => ({
          name: `file-${i}.txt`,
          path: `file-${i}.txt`,
          type: 'file' as const,
          size: 1024,
        })),
      };

      const startTime = performance.now();
      render(<DirectoryTree root={largeTree} />);
      const endTime = performance.now();

      // Should render within 1 second (NFR-1)
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify first and last files are rendered
      expect(screen.getByText('file-0.txt')).toBeInTheDocument();
      expect(screen.getByText('file-99.txt')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles deeply nested structures', () => {
      const deepTree: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'level1',
            path: 'level1',
            type: 'directory',
            children: [
              {
                name: 'level2',
                path: 'level1/level2',
                type: 'directory',
                children: [
                  {
                    name: 'level3',
                    path: 'level1/level2/level3',
                    type: 'directory',
                    children: [
                      {
                        name: 'deep-file.txt',
                        path: 'level1/level2/level3/deep-file.txt',
                        type: 'file',
                        size: 100,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      render(<DirectoryTree root={deepTree} />);

      // Expand all levels
      fireEvent.click(screen.getByText('level1'));
      fireEvent.click(screen.getByText('level2'));
      fireEvent.click(screen.getByText('level3'));

      // Deep file should be accessible
      expect(screen.getByText('deep-file.txt')).toBeInTheDocument();
    });

    it('handles files with zero size', () => {
      const treeWithZeroSize: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'empty.txt',
            path: 'empty.txt',
            type: 'file',
            size: 0,
          },
        ],
      };

      render(<DirectoryTree root={treeWithZeroSize} />);

      expect(screen.getByText('0 B')).toBeInTheDocument();
    });

    it('handles missing size metadata gracefully', () => {
      const treeNoSize: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'no-size.txt',
            path: 'no-size.txt',
            type: 'file',
            // size omitted
          },
        ],
      };

      render(<DirectoryTree root={treeNoSize} />);

      // Should render without errors (size not displayed)
      expect(screen.getByText('no-size.txt')).toBeInTheDocument();
    });
  });

  describe('Story 5.2.1: Session Metadata Display', () => {
    it('should render displayName when present (AC-1)', () => {
      // Arrange
      const treeWithDisplayName: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'a1b2c3d4-5678-4abc-9def-0123456789ab',
            path: 'a1b2c3d4-5678-4abc-9def-0123456789ab',
            type: 'directory',
            displayName: 'Alex the Facilitator - Intake ITSM (Oct 6, 2025, 5:09 PM)',
            children: [],
          },
        ],
      };

      // Act
      render(<DirectoryTree root={treeWithDisplayName} />);

      // Assert
      expect(screen.getByText('Alex the Facilitator - Intake ITSM (Oct 6, 2025, 5:09 PM)')).toBeInTheDocument();
      expect(screen.queryByText('a1b2c3d4-5678-4abc-9def-0123456789ab')).not.toBeInTheDocument();
    });

    it('should fallback to name when displayName is not present (AC-7)', () => {
      // Arrange
      const treeWithoutDisplayName: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'b2c3d4e5-6789-4bcd-aef0-123456789abc',
            path: 'b2c3d4e5-6789-4bcd-aef0-123456789abc',
            type: 'directory',
            children: [],
          },
        ],
      };

      // Act
      render(<DirectoryTree root={treeWithoutDisplayName} />);

      // Assert
      expect(screen.getByText('b2c3d4e5-6789-4bcd-aef0-123456789abc')).toBeInTheDocument();
    });

    it('should filter out nodes with isInternal=true (AC-2)', () => {
      // Arrange
      const treeWithInternal: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'session-folder',
            path: 'session-folder',
            type: 'directory',
            children: [
              {
                name: 'manifest.json',
                path: 'session-folder/manifest.json',
                type: 'file',
                isInternal: true,
                size: 512,
              },
              {
                name: 'output.md',
                path: 'session-folder/output.md',
                type: 'file',
                size: 1024,
              },
            ],
          },
        ],
      };

      // Act
      render(<DirectoryTree root={treeWithInternal} />);

      // Expand session folder
      const sessionFolder = screen.getByText('session-folder');
      fireEvent.click(sessionFolder);

      // Assert
      expect(screen.queryByText('manifest.json')).not.toBeInTheDocument();
      expect(screen.getByText('output.md')).toBeInTheDocument();
    });

    it('should show UUID in title attribute when displayName is present', () => {
      // Arrange
      const treeWithDisplayName: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'c3d4e5f6-789a-4cde-bf01-23456789abcd',
            path: 'c3d4e5f6-789a-4cde-bf01-23456789abcd',
            type: 'directory',
            displayName: 'Pixel - Build Stories (In Progress)',
            children: [],
          },
        ],
      };

      // Act
      const { container } = render(<DirectoryTree root={treeWithDisplayName} />);
      const sessionNode = screen.getByText('Pixel - Build Stories (In Progress)');
      const nodeElement = sessionNode.closest('[title]');

      // Assert
      expect(nodeElement).toHaveAttribute('title', 'c3d4e5f6-789a-4cde-bf01-23456789abcd');
    });

    it('should handle mixed tree with both regular and session folders', () => {
      // Arrange
      const mixedTree: FileTreeNode = {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'regular-folder',
            path: 'regular-folder',
            type: 'directory',
            children: [],
          },
          {
            name: 'd4e5f6g7-890b-4def-c012-3456789abcde',
            path: 'd4e5f6g7-890b-4def-c012-3456789abcde',
            type: 'directory',
            displayName: 'Casey - Deep Dive (Oct 5, 2025, 2:30 PM)',
            children: [],
          },
          {
            name: 'regular-file.txt',
            path: 'regular-file.txt',
            type: 'file',
            size: 256,
          },
        ],
      };

      // Act
      render(<DirectoryTree root={mixedTree} />);

      // Assert
      expect(screen.getByText('regular-folder')).toBeInTheDocument();
      expect(screen.getByText('Casey - Deep Dive (Oct 5, 2025, 2:30 PM)')).toBeInTheDocument();
      expect(screen.getByText('regular-file.txt')).toBeInTheDocument();
    });
  });

  describe('Story 5.5: New File Visual Indicators (AC-3)', () => {
    it('displays NEW badge for files in newFiles array', () => {
      const newFiles = ['file2.txt'];

      render(<DirectoryTree root={mockTree} newFiles={newFiles} />);

      // NEW badge should appear next to file2.txt
      expect(screen.getByText('NEW')).toBeInTheDocument();

      // Verify badge styling
      const badge = screen.getByText('NEW');
      expect(badge).toHaveClass('text-green-700', 'bg-green-100');
    });

    it('does not display NEW badge for files not in newFiles array', () => {
      const newFiles = ['file2.txt'];

      render(<DirectoryTree root={mockTree} newFiles={newFiles} />);

      // Expand folder to show file1.txt
      fireEvent.click(screen.getByText('folder1'));

      // Only one NEW badge should exist (for file2.txt)
      const badges = screen.getAllByText('NEW');
      expect(badges).toHaveLength(1);
    });

    it('displays NEW badge for multiple new files', () => {
      // Expand folder to show nested files
      const newFiles = ['file2.txt', 'folder1/file1.txt'];

      render(<DirectoryTree root={mockTree} newFiles={newFiles} />);

      // Expand folder1 to reveal file1.txt
      fireEvent.click(screen.getByText('folder1'));

      // Both files should have NEW badges
      const badges = screen.getAllByText('NEW');
      expect(badges).toHaveLength(2);
    });

    it('does not display NEW badge for directories', () => {
      const newFiles = ['folder1']; // Directory path

      render(<DirectoryTree root={mockTree} newFiles={newFiles} />);

      // NEW badge should NOT appear for directories
      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    });

    it('handles nested new files correctly', () => {
      const newFiles = ['folder1/nested/deep.md'];

      render(<DirectoryTree root={mockTree} newFiles={newFiles} />);

      // Expand to reveal nested file
      fireEvent.click(screen.getByText('folder1'));
      fireEvent.click(screen.getByText('nested'));

      // NEW badge should appear for deep.md
      expect(screen.getByText('NEW')).toBeInTheDocument();
    });

    it('renders correctly with empty newFiles array', () => {
      render(<DirectoryTree root={mockTree} newFiles={[]} />);

      // No NEW badges should appear
      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    });

    it('renders correctly with undefined newFiles prop', () => {
      render(<DirectoryTree root={mockTree} />);

      // No NEW badges should appear
      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    });

    it('NEW badge appears before file size', () => {
      const newFiles = ['file2.txt'];

      const { container } = render(<DirectoryTree root={mockTree} newFiles={newFiles} />);

      const file2Element = screen.getByText('file2.txt').parentElement;
      const badge = screen.getByText('NEW');
      const fileSize = screen.getByText('2 KB');

      // Verify both elements exist within the same parent
      expect(file2Element).toContainElement(badge);
      expect(file2Element).toContainElement(fileSize);
    });

    it('NEW badge does not interfere with file selection', () => {
      const mockOnFileSelect = jest.fn();
      const newFiles = ['file2.txt'];

      render(
        <DirectoryTree
          root={mockTree}
          onFileSelect={mockOnFileSelect}
          newFiles={newFiles}
          selectedFile="file2.txt"
        />
      );

      // File should be selectable and highlighted
      const file2Element = screen.getByText('file2.txt').parentElement;
      expect(file2Element).toHaveClass('bg-blue-50', 'text-blue-700');

      // NEW badge should still appear
      expect(screen.getByText('NEW')).toBeInTheDocument();
    });
  });
});
