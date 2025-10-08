/**
 * Tests for AgentSelector Component
 * Story 4.6: Refactor Agent Discovery for Bundle Structure
 *
 * Test Coverage:
 * - AC-4.6.2: Displays agent name and title from bundle.yaml
 * - AC-4.6.3: Displays bundle name as subtitle
 * - AC-4.6.4: Passes bundlePath when agent selected
 * - AC-4.6.6: Shows "No agents available" for empty state
 * - AC-4.6.7: Handles fetch errors gracefully
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AgentSelector } from '../AgentSelector';
import { AgentSummary } from '@/types/api';
import { FileViewerProvider } from '@/components/file-viewer/FileViewerContext';

// Mock fetch
global.fetch = jest.fn();

describe('AgentSelector', () => {
  const mockAgents: AgentSummary[] = [
    {
      id: 'alex-facilitator',
      name: 'Alex',
      title: 'Requirements Facilitator',
      description: 'Gathers requirements',
      icon: '📝',
      bundleName: 'requirements-workflow',
      bundlePath: 'bmad/custom/bundles/requirements-workflow',
      filePath: 'bmad/custom/bundles/requirements-workflow/agents/alex-facilitator.md',
    },
    {
      id: 'casey-analyst',
      name: 'Casey',
      title: 'Technical Analyst',
      icon: '🔍',
      bundleName: 'requirements-workflow',
      bundlePath: 'bmad/custom/bundles/requirements-workflow',
      filePath: 'bmad/custom/bundles/requirements-workflow/agents/casey-analyst.md',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    // Arrange
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId={undefined} onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Assert
    expect(screen.getByText('Loading agents...')).toBeInTheDocument();
  });

  it('should fetch and display agents with name, title, and bundle name (AC-4.6.2, AC-4.6.3)', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAgents }),
    });

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId={undefined} onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Alex - Requirements Facilitator \(requirements-workflow\)/)).toBeInTheDocument();
      expect(screen.getByText(/Casey - Technical Analyst \(requirements-workflow\)/)).toBeInTheDocument();
    });
  });

  it('should call onAgentSelect with full agent object including bundlePath (AC-4.6.4)', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAgents }),
    });

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId={undefined} onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Wait for agents to load and select to be enabled
    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select).not.toBeDisabled();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'alex-facilitator' } });

    // Assert
    expect(mockOnSelect).toHaveBeenCalledWith(mockAgents[0]);
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alex-facilitator',
        bundlePath: 'bmad/custom/bundles/requirements-workflow',
        filePath: 'bmad/custom/bundles/requirements-workflow/agents/alex-facilitator.md',
      })
    );
  });

  it('should display "No agents available" when agents array is empty (AC-4.6.6)', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId={undefined} onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('No agents available')).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails (AC-4.6.7)', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Failed to load bundles' }),
    });

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId={undefined} onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Failed to load agents')).toBeInTheDocument();
      expect(screen.getByText('Failed to load bundles')).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully (AC-4.6.7)', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId={undefined} onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Failed to load agents')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should display agent icons when present', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAgents }),
    });

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId={undefined} onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/📝 Alex/)).toBeInTheDocument();
      expect(screen.getByText(/🔍 Casey/)).toBeInTheDocument();
    });
  });

  it('should pre-select agent when selectedAgentId prop is provided', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAgents }),
    });

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId="alex-facilitator" onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Assert
    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('alex-facilitator');
    });
  });

  it('should call fetch with correct API endpoint', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAgents }),
    });

    const mockOnSelect = jest.fn();

    // Act
    render(<FileViewerProvider><AgentSelector selectedAgentId={undefined} onAgentSelect={mockOnSelect} /></FileViewerProvider>);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/agents');
    });
  });

  it('should render New Conversation button when callback provided', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAgents }),
    });

    const mockOnSelect = jest.fn();
    const mockOnNewConversation = jest.fn();

    // Act
    render(
      <FileViewerProvider>
        <AgentSelector
          selectedAgentId={undefined}
          onAgentSelect={mockOnSelect}
          onNewConversation={mockOnNewConversation}
        />
      </FileViewerProvider>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText('New Conversation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Conversation'));
    expect(mockOnNewConversation).toHaveBeenCalled();
  });
});
