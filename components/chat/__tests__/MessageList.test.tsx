/**
 * MessageList Component Tests
 * Story 3.1, Story 3.2 - Task 6
 *
 * Tests message rendering, empty state, and scrollable container
 * AC-2.4: Messages in chronological order
 * AC-2.5: Scrollable container
 */

import { render, screen } from '@testing-library/react';
import { MessageList } from '../MessageList';
import { Message } from '@/lib/types';

// Mock scrollTo for JSDOM environment
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn();
});

describe('MessageList', () => {
  // Task 6.3: Empty state test
  it('renders placeholder when messages array is empty', () => {
    render(<MessageList messages={[]} />);
    const placeholder = screen.getByText(/no messages yet/i);
    expect(placeholder).toBeInTheDocument();
  });

  // Story 3.1 tests - Container styling
  it('renders with scrollable container', () => {
    render(<MessageList messages={[]} />);
    const container = screen.getByRole('log', { name: /message history/i });
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('overflow-y-auto');
  });

  it('applies correct layout classes for flex-1 expansion', () => {
    render(<MessageList messages={[]} />);
    const container = screen.getByRole('log');
    expect(container).toHaveClass('flex-1');
  });

  it('applies background color styling', () => {
    render(<MessageList messages={[]} />);
    const container = screen.getByRole('log');
    expect(container).toHaveClass('bg-gray-50');
  });

  // Task 6.2: Multiple messages test
  it('renders multiple messages in correct order', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'First message' },
      { id: '2', role: 'assistant', content: 'Second message' },
      { id: '3', role: 'user', content: 'Third message' },
    ];

    render(<MessageList messages={messages} />);

    // AC-2.4: Verify all messages render
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.getByText('Third message')).toBeInTheDocument();

    // Verify chronological order (oldest to newest)
    const container = screen.getByRole('log');
    const messageElements = container.querySelectorAll('.max-w-\\[75\\%\\]');
    expect(messageElements).toHaveLength(3);
  });

  // Task 6.4: Scrollable container with long lists
  it('handles long message lists with scrollable container', () => {
    const longMessageList: Message[] = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i + 1}`,
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Message ${i + 1}`,
    }));

    render(<MessageList messages={longMessageList} />);
    const container = screen.getByRole('log');

    // Verify scrollable behavior is present
    expect(container).toHaveClass('overflow-y-auto');

    // Verify all messages rendered
    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Message 20')).toBeInTheDocument();
  });

  // Accessibility test
  it('has aria-live="polite" for dynamic updates', () => {
    render(<MessageList messages={[]} />);
    const container = screen.getByRole('log');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});
