/**
 * FileViewerPanel Component Tests
 *
 * Story 5.1: File Viewer UI Component
 * Tests for AC-1, AC-2, AC-3, AC-4
 *
 * Story 5.2: Display Directory Tree Structure
 * Tests for integration with DirectoryTree component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { FileViewerPanel } from '../FileViewerPanel';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('FileViewerPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: return empty tree
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        root: {
          name: 'root',
          path: '',
          type: 'directory',
          children: [],
        },
      }),
    });
  });

  describe('AC-1, AC-2: Panel rendering and label', () => {
    it('renders the file viewer panel with "Output Files" label', async () => {
      render(<FileViewerPanel />);

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // AC-2: Panel clearly labeled "Output Files"
      expect(screen.getByText('Output Files')).toBeInTheDocument();
    });

    it('renders with split-pane layout structure', () => {
      const { container } = render(<FileViewerPanel />);

      // AC-1: File viewer panel appears in UI (split-pane layout)
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('flex', 'flex-col', 'h-full');
      expect(panel).toHaveClass('border-l', 'border-gray-200', 'bg-white');
    });
  });

  describe('AC-3: Panel visibility', () => {
    it('renders by default (always visible for MVP)', () => {
      const { container } = render(<FileViewerPanel />);

      // AC-3: Panel always visible by default
      expect(container.firstChild).toBeInTheDocument();
    });

    it('hides when isVisible prop is false', () => {
      const { container } = render(<FileViewerPanel isVisible={false} />);

      // AC-3: Panel toggleable via prop (for future extensibility)
      expect(container.firstChild).toBeNull();
    });

    it('shows when isVisible prop is true', () => {
      const { container } = render(<FileViewerPanel isVisible={true} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('AC-4: Empty state display', () => {
    it('shows "No files yet" message when no files are present', () => {
      render(<FileViewerPanel />);

      // AC-4: Empty state shows "No files yet" message
      expect(screen.getByText('No files yet')).toBeInTheDocument();
      expect(screen.getByText('Files created by the agent will appear here')).toBeInTheDocument();
    });

    it('displays empty state icon', () => {
      const { container } = render(<FileViewerPanel />);

      // Story 5.2 note: Multiple SVGs now exist (refresh button + empty state icon)
      // Find the empty state icon specifically (inside the empty state div)
      const emptyStateDiv = screen.getByText('No files yet').closest('div')?.parentElement;
      const svg = emptyStateDiv?.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('mx-auto', 'h-12', 'w-12', 'text-gray-400');
    });
  });

  describe('Panel header', () => {
    it('renders header with correct styling', () => {
      render(<FileViewerPanel />);

      const header = screen.getByText('Output Files').closest('div');
      expect(header).toHaveClass('flex', 'items-center', 'justify-between');
      expect(header).toHaveClass('px-4', 'py-3');
      expect(header).toHaveClass('border-b', 'border-gray-200', 'bg-gray-50');
    });
  });

  describe('Styling consistency', () => {
    it('uses Tailwind CSS classes for consistent styling', () => {
      const { container } = render(<FileViewerPanel />);

      const panel = container.firstChild as HTMLElement;
      // Verify Tailwind classes are applied (Epic 3 styling consistency)
      expect(panel.className).toContain('border-gray-200');
      expect(panel.className).toContain('bg-white');
    });
  });

  describe('Story 5.2: Directory tree integration', () => {
    it('fetches directory tree on mount', async () => {
      render(<FileViewerPanel />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/files/tree');
      });
    });

    it('renders refresh button in header', async () => {
      render(<FileViewerPanel />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const refreshButton = screen.getByTitle('Refresh directory tree');
      expect(refreshButton).toBeInTheDocument();
    });

    it('shows loading state during fetch', async () => {
      // Mock slow API response
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<FileViewerPanel />);

      // Should show loading immediately
      expect(screen.getByText('Loading files...')).toBeInTheDocument();
    });

    it('displays error message when API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: false,
          error: 'Failed to load directory tree',
          root: { name: 'root', path: '', type: 'directory', children: [] },
        }),
      });

      render(<FileViewerPanel />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load directory tree')).toBeInTheDocument();
      });
    });

    it('displays error message on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<FileViewerPanel />);

      await waitFor(() => {
        expect(screen.getByText('Network error loading directory tree')).toBeInTheDocument();
      });
    });
  });
});
