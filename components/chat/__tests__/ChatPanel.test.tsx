/**
 * ChatPanel Component Tests
 * Story 3.1, Story 3.2 - Task 6.5
 *
 * Tests layout, state management, and component integration
 * AC-1.1 through AC-1.4: Layout tests
 * AC-2.1 through AC-2.4: Message state management
 */

import { render, screen } from '@testing-library/react';
import { ChatPanel } from '../ChatPanel';

// Mock scrollTo for JSDOM environment
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn();
});

describe('ChatPanel', () => {
  // Story 3.2 - Task 6.5: State management test
  it('renders full layout with MessageList when messages exist', () => {
    render(<ChatPanel />);

    // Should show MessageList with demo messages
    expect(screen.getByText(/Hello! Can you help me understand/i)).toBeInTheDocument();
    expect(screen.getByText(/Of course! I'd be happy to help/i)).toBeInTheDocument();

    // Should show full layout (not centered)
    const { container } = render(<ChatPanel />);
    const chatPanel = container.firstChild as HTMLElement;
    expect(chatPanel).toHaveClass('flex', 'flex-col', 'h-screen');
  });

  // Story 3.2 - Task 6.5: Verify messages array structure
  it('initializes with demo messages for testing', () => {
    render(<ChatPanel />);

    // Verify user and assistant messages alternate
    expect(screen.getByText(/How do I select which agent to use/i)).toBeInTheDocument();
    expect(screen.getByText(/Great question! Agent selection/i)).toBeInTheDocument();
  });

  // Story 3.1 - Original tests (would work if messages array was empty)
  it('applies full-screen height to layout', () => {
    const { container } = render(<ChatPanel />);
    const chatPanel = container.firstChild as HTMLElement;
    expect(chatPanel).toHaveClass('h-screen');
  });

  it('renders MessageInput component', () => {
    render(<ChatPanel />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea).toBeInTheDocument();
  });

  // Story 3.2 - Task 6.5: Verify MessageList receives messages prop
  it('passes messages array to MessageList component', () => {
    render(<ChatPanel />);

    // MessageList should render the demo messages
    const messageHistory = screen.getByRole('log', { name: /message history/i });
    expect(messageHistory).toBeInTheDocument();

    // Verify messages are displayed (proves messages prop was passed)
    expect(screen.getByText(/Hello! Can you help me/i)).toBeInTheDocument();
  });
});
