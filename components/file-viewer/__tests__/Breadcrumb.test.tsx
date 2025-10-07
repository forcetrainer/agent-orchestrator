/**
 * Tests for Breadcrumb Component
 * Story 5.6 AC-2: Breadcrumb trail shows current file path
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumb } from '../Breadcrumb';

describe('Breadcrumb', () => {
  describe('Path Parsing', () => {
    it('should split path into segments', () => {
      render(
        <Breadcrumb
          currentFilePath="session-uuid/requirements/prd.md"
        />
      );

      expect(screen.getByText('session-uuid')).toBeInTheDocument();
      expect(screen.getByText('requirements')).toBeInTheDocument();
      expect(screen.getByText('prd.md')).toBeInTheDocument();
    });

    it('should use displayName from tree metadata for first segment', () => {
      const treeData = {
        name: 'root',
        path: '',
        type: 'directory' as const,
        children: [
          {
            name: 'session-uuid',
            path: 'session-uuid',
            type: 'directory' as const,
            displayName: 'Alex - Intake Workflow',
            children: [],
          },
        ],
      };

      render(
        <Breadcrumb
          currentFilePath="session-uuid/requirements/prd.md"
          treeData={treeData}
        />
      );

      expect(screen.getByText('Alex - Intake Workflow')).toBeInTheDocument();
      expect(screen.queryByText('session-uuid')).not.toBeInTheDocument();
    });

    it('should render segments with separator', () => {
      render(
        <Breadcrumb
          currentFilePath="session/folder/file.md"
        />
      );

      const separators = screen.getAllByText('/');
      expect(separators).toHaveLength(2); // Two separators for three segments
    });
  });

  describe('Rendering', () => {
    it('should render with text-sm and text-gray-600 classes', () => {
      const { container } = render(
        <Breadcrumb currentFilePath="session/file.md" />
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should render last segment as non-clickable with font-medium', () => {
      render(<Breadcrumb currentFilePath="session/requirements/prd.md" />);

      const lastSegment = screen.getByText('prd.md');
      expect(lastSegment.tagName).toBe('SPAN');
      expect(lastSegment).toHaveClass('font-medium', 'text-gray-900');
    });

    it('should render non-last segments as clickable buttons', () => {
      render(<Breadcrumb currentFilePath="session/requirements/prd.md" />);

      const sessionSegment = screen.getByRole('button', { name: /navigate to session/i });
      expect(sessionSegment).toBeInTheDocument();
    });

    it('should return null when no currentFilePath provided', () => {
      const { container } = render(<Breadcrumb currentFilePath="" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should call onNavigate with correct path when segment clicked', async () => {
      const user = userEvent.setup();
      const onNavigate = jest.fn();

      render(
        <Breadcrumb
          currentFilePath="session/requirements/prd.md"
          onNavigate={onNavigate}
        />
      );

      const sessionButton = screen.getByRole('button', { name: /navigate to session/i });
      await user.click(sessionButton);

      expect(onNavigate).toHaveBeenCalledWith('session');
    });

    it('should build cumulative path for each segment', async () => {
      const user = userEvent.setup();
      const onNavigate = jest.fn();

      render(
        <Breadcrumb
          currentFilePath="session/requirements/prd.md"
          onNavigate={onNavigate}
        />
      );

      const requirementsButton = screen.getByRole('button', { name: /navigate to requirements/i });
      await user.click(requirementsButton);

      expect(onNavigate).toHaveBeenCalledWith('session/requirements');
    });
  });

  describe('Long Paths', () => {
    it('should truncate paths with more than 5 segments', () => {
      render(
        <Breadcrumb
          currentFilePath="session/folder1/folder2/folder3/folder4/file.md"
        />
      );

      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('session')).toBeInTheDocument();
      expect(screen.getByText('folder4')).toBeInTheDocument();
      expect(screen.getByText('file.md')).toBeInTheDocument();
    });

    it('should not truncate paths with 5 or fewer segments', () => {
      render(
        <Breadcrumb
          currentFilePath="session/folder1/folder2/file.md"
        />
      );

      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label breadcrumb on nav', () => {
      const { container } = render(
        <Breadcrumb currentFilePath="session/file.md" />
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('should have aria-current="page" on last segment', () => {
      render(<Breadcrumb currentFilePath="session/requirements/prd.md" />);

      const lastSegment = screen.getByText('prd.md');
      expect(lastSegment).toHaveAttribute('aria-current', 'page');
    });

    it('should have aria-label on clickable segments', () => {
      render(<Breadcrumb currentFilePath="session/requirements/prd.md" />);

      const sessionButton = screen.getByRole('button', { name: 'Navigate to session' });
      expect(sessionButton).toHaveAttribute('aria-label', 'Navigate to session');
    });
  });
});
