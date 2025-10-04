/**
 * MessageBubble Component Tests
 * Story 3.2 - Task 5
 *
 * Tests role-based styling and content rendering
 * AC-2.1: User messages right-aligned with blue styling
 * AC-2.2: Assistant messages left-aligned with gray styling
 * AC-2.3: Clear visual distinction between roles
 */

import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import { Message } from '@/lib/types';

describe('MessageBubble', () => {
  // Task 5.2: Test user message styling
  it('renders user message with right-aligned blue styling', () => {
    const userMessage: Message = {
      role: 'user',
      content: 'Hello, assistant!',
    };

    const { container } = render(<MessageBubble message={userMessage} />);
    const bubble = container.firstChild as HTMLElement;

    // AC-2.1: Right-aligned (ml-auto), blue background
    expect(bubble).toHaveClass('ml-auto');
    expect(bubble).toHaveClass('bg-blue-500');
    expect(bubble).toHaveClass('text-white');
  });

  // Task 5.3: Test assistant message styling
  it('renders assistant message with left-aligned gray styling', () => {
    const assistantMessage: Message = {
      role: 'assistant',
      content: 'Hello, user!',
    };

    const { container } = render(<MessageBubble message={assistantMessage} />);
    const bubble = container.firstChild as HTMLElement;

    // AC-2.2: Left-aligned (mr-auto), gray background
    expect(bubble).toHaveClass('mr-auto');
    expect(bubble).toHaveClass('bg-gray-200');
    expect(bubble).toHaveClass('text-gray-900');
  });

  // Task 5.4: Test content rendering
  it('displays message content correctly', () => {
    const message: Message = {
      role: 'user',
      content: 'This is my message content',
    };

    render(<MessageBubble message={message} />);
    expect(screen.getByText('This is my message content')).toBeInTheDocument();
  });

  // Task 5.5: Test error role styling
  it('renders error message with red styling', () => {
    const errorMessage: Message = {
      role: 'error',
      content: 'Something went wrong',
    };

    const { container } = render(<MessageBubble message={errorMessage} />);
    const bubble = container.firstChild as HTMLElement;

    // Error messages left-aligned with red background
    expect(bubble).toHaveClass('mr-auto');
    expect(bubble).toHaveClass('bg-red-500');
    expect(bubble).toHaveClass('text-white');
  });

  // AC-2.3: Visual distinction test
  it('applies different styling classes for different roles', () => {
    const userMessage: Message = { role: 'user', content: 'User message' };
    const assistantMessage: Message = { role: 'assistant', content: 'Assistant message' };

    const { container: userContainer } = render(<MessageBubble message={userMessage} />);
    const { container: assistantContainer } = render(<MessageBubble message={assistantMessage} />);

    const userBubble = userContainer.firstChild as HTMLElement;
    const assistantBubble = assistantContainer.firstChild as HTMLElement;

    // User has ml-auto (right), assistant has mr-auto (left)
    expect(userBubble.className).not.toBe(assistantBubble.className);
    expect(userBubble).toHaveClass('ml-auto');
    expect(assistantBubble).toHaveClass('mr-auto');
  });

  // Design system compliance
  it('applies design system styling (rounded, padding, max-width)', () => {
    const message: Message = { role: 'user', content: 'Test' };
    const { container } = render(<MessageBubble message={message} />);
    const bubble = container.firstChild as HTMLElement;

    expect(bubble).toHaveClass('rounded-lg');
    expect(bubble).toHaveClass('px-4');
    expect(bubble).toHaveClass('py-3');
    expect(bubble).toHaveClass('max-w-[75%]');
  });
});
