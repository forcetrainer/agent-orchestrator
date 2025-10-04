/**
 * ChatPanel Component Tests
 * Story 3.1, Story 3.2, Story 3.5 - Updated for message send functionality
 *
 * Tests layout, state management, and component integration
 * AC-1.1 through AC-1.4: Layout tests
 * AC-2.1 through AC-2.4: Message state management
 * AC-5.1 through AC-5.8: Message send functionality (Story 3.5)
 */

import { render, screen } from '@testing-library/react';
import { ChatPanel } from '../ChatPanel';

// Mock scrollTo for JSDOM environment
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn();
});

// Mock fetch for AgentSelector
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [{ id: 'test-agent', name: 'Test Agent', title: 'Test' }],
    }),
  })
) as jest.Mock;

describe('ChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Story 3.5: Starts with empty messages array
  it('renders centered layout when no messages exist', () => {
    const { container } = render(<ChatPanel />);
    const chatPanel = container.firstChild as HTMLElement;

    // Should show centered layout (bg-gray-50 indicates centered mode)
    expect(chatPanel).toHaveClass('flex', 'flex-col', 'h-screen', 'bg-gray-50');
  });

  // Story 3.1: Layout test
  it('applies full-screen height to layout', () => {
    const { container } = render(<ChatPanel />);
    const chatPanel = container.firstChild as HTMLElement;
    expect(chatPanel).toHaveClass('h-screen');
  });

  // Story 3.5: InputField component rendered
  it('renders InputField component', () => {
    render(<ChatPanel />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea).toBeInTheDocument();
  });

  // Story 3.4: Agent selector rendered
  it('renders AgentSelector component', () => {
    render(<ChatPanel />);

    // AgentSelector should be present (look for the container)
    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  // Story 3.5: Initializes with empty messages
  it('initializes with empty messages array', () => {
    render(<ChatPanel />);

    // No MessageList should be rendered when messages are empty (centered layout instead)
    const messageHistory = screen.queryByRole('log', { name: /message history/i });
    expect(messageHistory).not.toBeInTheDocument();
  });
});
