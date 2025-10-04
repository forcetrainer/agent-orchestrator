import { render, screen } from '@testing-library/react';
import { MessageList } from '../MessageList';

describe('MessageList', () => {
  it('renders with placeholder text', () => {
    render(<MessageList />);
    const placeholder = screen.getByText(/no messages yet/i);
    expect(placeholder).toBeInTheDocument();
  });

  it('renders with scrollable container', () => {
    render(<MessageList />);
    const container = screen.getByRole('log', { name: /message history/i });
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('overflow-y-auto');
  });

  it('applies correct layout classes for flex-1 expansion', () => {
    render(<MessageList />);
    const container = screen.getByRole('log');
    expect(container).toHaveClass('flex-1');
  });

  it('applies background color styling', () => {
    render(<MessageList />);
    const container = screen.getByRole('log');
    expect(container).toHaveClass('bg-gray-50');
  });
});
