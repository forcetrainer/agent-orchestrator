import { render, screen } from '@testing-library/react';
import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  it('renders centered MessageInput when no messages (initial state)', () => {
    render(<ChatPanel />);

    // Should show centered input
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeInTheDocument();

    // Should have centered container
    const { container } = render(<ChatPanel />);
    const chatPanel = container.firstChild as HTMLElement;
    expect(chatPanel).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('applies full-screen height to centered layout', () => {
    const { container } = render(<ChatPanel />);
    const chatPanel = container.firstChild as HTMLElement;
    expect(chatPanel).toHaveClass('h-screen');
  });

  it('shows input with shadow and rounded styling when centered', () => {
    render(<ChatPanel />);

    // Find the input container (should have rounded and shadow classes)
    const textarea = screen.getByPlaceholderText('Send a message...');
    const inputContainer = textarea.parentElement?.parentElement as HTMLElement;

    expect(inputContainer).toHaveClass('rounded-2xl', 'shadow-lg');
  });
});
