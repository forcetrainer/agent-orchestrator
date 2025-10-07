/**
 * FileViewerPanel Component Tests
 *
 * Story 5.1: File Viewer UI Component
 * Tests for AC-1, AC-2, AC-3, AC-4
 */

import { render, screen } from '@testing-library/react';
import { FileViewerPanel } from '../FileViewerPanel';

describe('FileViewerPanel', () => {
  describe('AC-1, AC-2: Panel rendering and label', () => {
    it('renders the file viewer panel with "Output Files" label', () => {
      render(<FileViewerPanel />);

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

      // Verify SVG icon is present (aria-hidden, so query by element)
      const svg = container.querySelector('svg');
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
});
