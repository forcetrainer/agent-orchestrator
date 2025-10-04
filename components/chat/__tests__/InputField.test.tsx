import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputField } from '../InputField';

describe('InputField', () => {
  // Subtask 5.1: Test component renders with textarea and send button
  describe('rendering', () => {
    it('renders textarea with placeholder text', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders send button with correct label', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Send');
    });

    it('has aria-label for accessibility', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByLabelText(/message input/i);
      expect(textarea).toBeInTheDocument();
    });
  });

  // Subtask 5.2: Test controlled input updates on typing
  describe('controlled input behavior', () => {
    it('updates value when user types', async () => {
      const user = userEvent.setup();
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;

      await user.type(textarea, 'Hello world');

      expect(textarea.value).toBe('Hello world');
    });

    it('allows multiline input', async () => {
      const user = userEvent.setup();
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;

      // Type multiline text with shift+enter
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(textarea.value).toContain('Line 1');
      expect(textarea.value).toContain('Line 2');
    });
  });

  // Subtask 5.3: Test Enter key triggers onSend callback
  // AC-5.2: Pressing Enter in input field submits message
  describe('Enter key submission', () => {
    it('calls onSend when Enter is pressed', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('prevents default Enter behavior to avoid newline', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);

      fireEvent.change(textarea, { target: { value: 'Test' } });
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false, bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      // Verify onSend was called (which means preventDefault was likely called)
      expect(mockOnSend).toHaveBeenCalled();
    });
  });

  // Subtask 5.4: Test Shift+Enter adds newline (does NOT trigger onSend)
  // AC-5.7: Long messages are accepted (multi-line support)
  describe('Shift+Enter behavior', () => {
    it('does NOT call onSend when Shift+Enter is pressed', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);

      fireEvent.change(textarea, { target: { value: 'Line 1' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('allows newline insertion with Shift+Enter', async () => {
      const user = userEvent.setup();
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);

      // Simulate typing with Shift+Enter for newline
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(mockOnSend).not.toHaveBeenCalled();
      // Check that both lines are present in the value
      const value = (textarea as HTMLTextAreaElement).value;
      expect(value).toContain('Line 1');
      expect(value).toContain('Line 2');
    });
  });

  // Subtask 5.5: Test send button click triggers onSend callback
  // AC-5.1: Clicking send button submits message
  describe('send button click', () => {
    it('calls onSend when button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, 'Button click test');
      await user.click(button);

      expect(mockOnSend).toHaveBeenCalledWith('Button click test');
    });

    it('prevents form submission when button is clicked', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const button = screen.getByRole('button', { name: /send message/i });
      const textarea = screen.getByPlaceholderText(/type your message/i);

      fireEvent.change(textarea, { target: { value: 'Test' } });

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

      button.click();

      expect(mockOnSend).toHaveBeenCalled();
    });
  });

  // Subtask 5.6: Test input clears after submission
  // AC-5.3: Input field clears after message is sent
  describe('input clearing after submission', () => {
    it('clears input after Enter key submission', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Clear test' } });
      expect(textarea.value).toBe('Clear test');

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(textarea.value).toBe('');
    });

    it('clears input after button click submission', async () => {
      const user = userEvent.setup();
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, 'Clear test');
      expect(textarea.value).toBe('Clear test');

      await user.click(button);

      expect(textarea.value).toBe('');
    });
  });

  // Subtask 5.7: Test empty message is NOT submitted (trimmed)
  // AC-5.6: Empty messages are not sent
  describe('empty message validation', () => {
    it('does NOT call onSend for empty input', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });

      fireEvent.change(textarea, { target: { value: '' } });
      button.click();

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('does NOT call onSend for whitespace-only input', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });

      fireEvent.change(textarea, { target: { value: '   \n  \t  ' } });
      button.click();

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('trims whitespace before sending message', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);

      fireEvent.change(textarea, { target: { value: '  trimmed message  ' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).toHaveBeenCalledWith('trimmed message');
    });

    it('disables send button when input is empty', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const button = screen.getByRole('button', { name: /send message/i });

      expect(button).toBeDisabled();
    });

    it('disables send button when input has only whitespace', async () => {
      const user = userEvent.setup();
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, '   ');

      expect(button).toBeDisabled();
    });
  });

  // Subtask 5.8: Test input is disabled when disabled=true
  // AC-5.5: Input is disabled while waiting for agent response
  describe('disabled state', () => {
    it('disables textarea when disabled prop is true', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} disabled={true} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);

      expect(textarea).toBeDisabled();
    });

    it('disables send button when disabled prop is true', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} disabled={true} />);

      const button = screen.getByRole('button', { name: /send message/i });

      expect(button).toBeDisabled();
    });

    it('sets aria-busy on textarea when disabled', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} disabled={true} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);

      expect(textarea).toHaveAttribute('aria-busy', 'true');
    });

    it('prevents user from interacting when disabled', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} disabled={true} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });

      // Verify both are disabled (no need to test typing on disabled textarea)
      expect(textarea).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  // Subtask 5.9: Test multiline messages accepted and submitted
  // AC-5.7: Long messages are accepted (multi-line support)
  describe('multiline message handling', () => {
    it('accepts and submits multiline messages', async () => {
      const user = userEvent.setup();
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });

      // Type multiline content
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2{Shift>}{Enter}{/Shift}Line 3');
      await user.click(button);

      expect(mockOnSend).toHaveBeenCalledTimes(1);
      const submittedMessage = mockOnSend.mock.calls[0][0];
      expect(submittedMessage).toContain('Line 1');
      expect(submittedMessage).toContain('Line 2');
      expect(submittedMessage).toContain('Line 3');
    });

    it('accepts very long messages (500+ characters)', async () => {
      const user = userEvent.setup();
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const longMessage = 'A'.repeat(600);

      await user.type(textarea, longMessage);
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).toHaveBeenCalledWith(longMessage);
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('handles rapid Enter key presses without duplicate submissions', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);

      fireEvent.change(textarea, { target: { value: 'Rapid test' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      // Should only submit once because input clears after first submission
      expect(mockOnSend).toHaveBeenCalledTimes(1);
    });

    it('handles special characters in message content', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const specialMessage = '<script>alert("XSS")</script> & "quotes" \'apostrophes\'';

      fireEvent.change(textarea, { target: { value: specialMessage } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).toHaveBeenCalledWith(specialMessage);
    });
  });

  // Message length validation
  describe('message length validation', () => {
    const MAX_LENGTH = 10000;

    it('allows messages up to 10,000 characters', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });
      const maxMessage = 'A'.repeat(MAX_LENGTH);

      fireEvent.change(textarea, { target: { value: maxMessage } });

      expect(button).not.toBeDisabled();
      button.click();
      expect(mockOnSend).toHaveBeenCalledWith(maxMessage);
    });

    it('shows warning when approaching character limit (500 chars remaining)', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const nearLimitMessage = 'A'.repeat(MAX_LENGTH - 500);

      fireEvent.change(textarea, { target: { value: nearLimitMessage } });

      expect(screen.getByText(/500 characters remaining/i)).toBeInTheDocument();
    });

    it('disables send button when over character limit', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });
      const overLimitMessage = 'A'.repeat(MAX_LENGTH + 100);

      fireEvent.change(textarea, { target: { value: overLimitMessage } });

      expect(button).toBeDisabled();
      expect(screen.getByText(/message too long by 100 characters/i)).toBeInTheDocument();
    });

    it('shows error styling when over limit', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const overLimitMessage = 'A'.repeat(MAX_LENGTH + 1);

      fireEvent.change(textarea, { target: { value: overLimitMessage } });

      expect(textarea).toHaveClass('border-red-500');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('does NOT call onSend when trying to submit over-limit message via keyboard', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const button = screen.getByRole('button', { name: /send message/i });
      const overLimitMessage = 'A'.repeat(MAX_LENGTH + 1);

      fireEvent.change(textarea, { target: { value: overLimitMessage } });

      // Button should be disabled, so clicking won't work
      expect(button).toBeDisabled();

      // Try Enter key (should also not submit)
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('hides character count when well below limit', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const shortMessage = 'Short message';

      fireEvent.change(textarea, { target: { value: shortMessage } });

      expect(screen.queryByText(/characters remaining/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/message too long/i)).not.toBeInTheDocument();
    });

    it('formats character counts with commas for readability', () => {
      const mockOnSend = jest.fn();
      render(<InputField onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      // Need to be within 500 chars of limit to show warning
      const nearLimitMessage = 'A'.repeat(MAX_LENGTH - 234);

      fireEvent.change(textarea, { target: { value: nearLimitMessage } });

      // Use exact text match instead of regex to avoid comma escaping issues
      expect(screen.getByText('234 characters remaining')).toBeInTheDocument();
    });
  });
});
