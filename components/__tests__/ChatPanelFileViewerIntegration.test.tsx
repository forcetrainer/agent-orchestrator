/**
 * ChatPanel + FileViewerPanel Integration Tests
 *
 * Story 5.1: File Viewer UI Component
 * AC-5: UI doesn't interfere with chat interface functionality
 */

import { render, screen } from '@testing-library/react';
import { ChatPanel } from '../chat/ChatPanel';
import { FileViewerProvider } from '../file-viewer/FileViewerContext';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ChatPanel + FileViewerPanel Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { agents: [] } }),
    });
  });

  describe('AC-5: Chat and file viewer coexistence', () => {
    it('renders both chat interface and file viewer panel', () => {
      render(<FileViewerProvider><ChatPanel /></FileViewerProvider>);

      // Verify chat interface elements are present
      expect(screen.getByText('Select Agent:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Type your message/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();

      // Verify file viewer panel is present
      expect(screen.getByText('Output Files')).toBeInTheDocument();
      expect(screen.getByText('No files yet')).toBeInTheDocument();
    });

    it('maintains chat input functionality with file viewer present', () => {
      render(<FileViewerProvider><ChatPanel /></FileViewerProvider>);

      // AC-5: UI doesn't interfere with chat interface functionality
      const input = screen.getByPlaceholderText(/Type your message/);
      expect(input).toBeEnabled();

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
    });

    // Story 6.1: Layout structure changed - MainLayout now manages file viewer, not ChatPanel
    // This test needs to be updated to test MainLayout + ChatPanel integration
    it.skip('displays both panels in split-pane layout (TODO: Update for Story 6.1 MainLayout)', () => {
      const { container } = render(<FileViewerProvider><ChatPanel /></FileViewerProvider>);

      // Verify split-pane structure (horizontal flex layout)
      const mainContainer = container.querySelector('.flex.h-screen');
      expect(mainContainer).toBeInTheDocument();

      // Chat panel should be flex-1 (left side)
      const chatPanel = container.querySelector('.flex-col.flex-1');
      expect(chatPanel).toBeInTheDocument();

      // File viewer wrapper should be fixed width (right side)
      // Find the wrapper div (sibling of chat panel, contains FileViewerPanel)
      const fileViewerWrapper = mainContainer?.children[1] as HTMLElement;
      expect(fileViewerWrapper).toHaveClass('w-96');
    });

    // Story 6.1: Layout structure changed - MainLayout now manages file viewer, not ChatPanel
    // This test needs to be updated to test MainLayout + ChatPanel integration
    it.skip('ensures no z-index overlap between chat and file viewer (TODO: Update for Story 6.1 MainLayout)', () => {
      const { container } = render(<FileViewerProvider><ChatPanel /></FileViewerProvider>);

      // Both panels should be siblings in the flex container (no absolute positioning)
      const mainContainer = container.querySelector('.flex.h-screen');
      const children = mainContainer?.children;

      expect(children).toHaveLength(2); // Chat panel and file viewer
    });
  });

  // Story 6.1: Layout structure changed - MainLayout now manages responsive constraints
  // These tests need to be updated to test MainLayout component
  describe.skip('Layout responsiveness (TODO: Update for Story 6.1 MainLayout)', () => {
    it('applies responsive width constraints to file viewer', () => {
      const { container } = render(<FileViewerProvider><ChatPanel /></FileViewerProvider>);

      // Find the wrapper div that contains FileViewerPanel
      const mainContainer = container.querySelector('.flex.h-screen');
      const fileViewerWrapper = mainContainer?.children[1] as HTMLElement;

      // AC-6: Responsive layout with min/max width
      expect(fileViewerWrapper).toHaveClass('min-w-[320px]');
      expect(fileViewerWrapper).toHaveClass('max-w-[480px]');
    });

    it('applies min-width to chat panel for usability', () => {
      const { container } = render(<FileViewerProvider><ChatPanel /></FileViewerProvider>);

      const chatPanel = container.querySelector('.flex-col.flex-1');

      // AC-6: Chat panel has minimum width
      expect(chatPanel).toHaveClass('min-w-0');
    });
  });
});
