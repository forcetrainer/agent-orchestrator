/**
 * AgentSelector Toggle Button Tests
 *
 * Story 6.1: Dynamic File Viewer Toggle
 * AC-1: Toggle button appears in top-right navigation bar
 * AC-2: Button shows "Files" icon when viewer closed, "Close" icon when open
 *
 * Tests:
 * - Toggle button renders in navigation
 * - Button shows correct icon based on state
 * - Clicking button calls toggle function
 * - Button has correct accessibility attributes
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AgentSelector } from '../AgentSelector';
import { FileViewerProvider, useFileViewer } from '@/components/file-viewer/FileViewerContext';

// Mock fetch for agent list
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        data: [
          {
            id: 'test-agent',
            name: 'Test Agent',
            title: 'Test',
            icon: '🤖',
            bundleName: 'test-bundle',
            bundlePath: '/path/to/bundle',
            filePath: 'agent.md',
          },
        ],
      }),
  } as Response)
);

describe('AgentSelector - File Viewer Toggle Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render toggle button in navigation', async () => {
    render(
      <FileViewerProvider>
        <AgentSelector selectedAgentId={undefined} onAgentSelect={() => {}} />
      </FileViewerProvider>
    );

    // Wait for agents to load
    await screen.findByText(/Test Agent/);

    // Check for toggle button (by aria-label)
    const toggleButton = screen.getByLabelText(/file viewer/i);
    expect(toggleButton).toBeInTheDocument();
  });

  it('should show "Close" text and X icon when viewer is open (default)', async () => {
    render(
      <FileViewerProvider>
        <AgentSelector selectedAgentId={undefined} onAgentSelect={() => {}} />
      </FileViewerProvider>
    );

    await screen.findByText(/Test Agent/);

    const toggleButton = screen.getByLabelText(/close file viewer/i);
    expect(toggleButton).toHaveTextContent('Close');
  });

  it('should show "Files" text when viewer is closed', async () => {
    const TestWrapper = () => {
      const { toggle } = useFileViewer();
      return (
        <>
          <button onClick={toggle} data-testid="external-toggle">
            External Toggle
          </button>
          <AgentSelector selectedAgentId={undefined} onAgentSelect={() => {}} />
        </>
      );
    };

    render(
      <FileViewerProvider>
        <TestWrapper />
      </FileViewerProvider>
    );

    await screen.findByText(/Test Agent/);

    // Close viewer using external toggle
    fireEvent.click(screen.getByTestId('external-toggle'));

    // Button should now show "Files"
    const toggleButton = screen.getByLabelText(/open file viewer/i);
    expect(toggleButton).toHaveTextContent('Files');
  });

  it('should call toggle function when clicked', async () => {
    const TestWrapper = () => {
      const { isOpen } = useFileViewer();
      return (
        <>
          <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>
          <AgentSelector selectedAgentId={undefined} onAgentSelect={() => {}} />
        </>
      );
    };

    render(
      <FileViewerProvider>
        <TestWrapper />
      </FileViewerProvider>
    );

    await screen.findByText(/Test Agent/);

    expect(screen.getByTestId('status')).toHaveTextContent('open');

    // Click toggle button
    const toggleButton = screen.getByLabelText(/close file viewer/i);
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('should have correct accessibility attributes', async () => {
    render(
      <FileViewerProvider>
        <AgentSelector selectedAgentId={undefined} onAgentSelect={() => {}} />
      </FileViewerProvider>
    );

    await screen.findByText(/Test Agent/);

    const toggleButton = screen.getByLabelText(/close file viewer/i);

    // Check aria-label
    expect(toggleButton).toHaveAttribute('aria-label', 'Close file viewer');

    // Check title (shows keyboard shortcut)
    expect(toggleButton).toHaveAttribute('title', 'Close file viewer (Ctrl/Cmd + B)');
  });

  it('should update icon when state changes', async () => {
    const TestWrapper = () => {
      const { isOpen, toggle } = useFileViewer();
      return (
        <>
          <button onClick={toggle} data-testid="external-toggle">
            Toggle
          </button>
          <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>
          <AgentSelector selectedAgentId={undefined} onAgentSelect={() => {}} />
        </>
      );
    };

    render(
      <FileViewerProvider>
        <TestWrapper />
      </FileViewerProvider>
    );

    await screen.findByText(/Test Agent/);

    // Initially open - should show "Close"
    expect(screen.getByLabelText(/close file viewer/i)).toBeInTheDocument();

    // Toggle to closed
    fireEvent.click(screen.getByTestId('external-toggle'));
    expect(screen.getByTestId('status')).toHaveTextContent('closed');

    // Should now show "Files"
    expect(screen.getByLabelText(/open file viewer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/open file viewer/i)).toHaveTextContent('Files');
  });
});
