import { render, screen } from '@testing-library/react';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  describe('standard mode (centered=false)', () => {
    it('renders textarea with placeholder text', () => {
      render(<MessageInput />);
      const textarea = screen.getByPlaceholderText('Type your message...');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders send button with label', () => {
      render(<MessageInput />);
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Send');
    });

    it('has disabled textarea (visual shell - AC-1.6)', () => {
      render(<MessageInput />);
      const textarea = screen.getByPlaceholderText('Type your message...');
      expect(textarea).toBeDisabled();
    });

    it('has disabled send button (visual shell - AC-1.6)', () => {
      render(<MessageInput />);
      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toBeDisabled();
    });

    it('applies correct styling classes', () => {
      render(<MessageInput />);
      const textarea = screen.getByPlaceholderText('Type your message...');
      const button = screen.getByRole('button', { name: /send message/i });

      expect(textarea).toHaveClass('rounded-lg', 'border', 'border-gray-300');
      expect(button).toHaveClass('bg-blue-500', 'text-white', 'rounded-lg');
    });
  });

  describe('centered mode (centered=true)', () => {
    it('renders with centered styling', () => {
      render(<MessageInput centered />);
      const textarea = screen.getByPlaceholderText('Send a message...');
      expect(textarea).toBeInTheDocument();
    });

    it('applies shadow and rounded styling to container', () => {
      const { container } = render(<MessageInput centered />);
      const outerContainer = container.firstChild as HTMLElement;

      expect(outerContainer).toHaveClass('rounded-2xl', 'shadow-lg');
    });

    it('has disabled inputs in centered mode', () => {
      render(<MessageInput centered />);
      const textarea = screen.getByPlaceholderText('Send a message...');
      const button = screen.getByRole('button', { name: /send message/i });

      expect(textarea).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });
});
