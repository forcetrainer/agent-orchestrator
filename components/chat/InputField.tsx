'use client';

import { useState, KeyboardEvent, FormEvent } from 'react';

/**
 * InputField Component
 *
 * Message input component with textarea and send button for chat interface.
 * Supports multiline input with Shift+Enter, Enter to send.
 *
 * Story 3.5 Task 1: Create InputField component with message submission
 * AC-5.1: Clicking send button submits message
 * AC-5.2: Pressing Enter submits message
 * AC-5.3: Input field clears after message sent
 * AC-5.6: Empty messages are not sent
 * AC-5.7: Long messages accepted (multiline support)
 *
 * @param onSend - Callback function called when user submits a message
 * @param disabled - If true, disables input and send button (during API calls)
 */
interface InputFieldProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const MAX_MESSAGE_LENGTH = 10000; // Character limit per Dev Notes Story 3.5

export function InputField({ onSend, disabled = false }: InputFieldProps) {
  const [value, setValue] = useState('');
  const [showLengthWarning, setShowLengthWarning] = useState(false);

  // Subtask 1.6: Validate non-empty message before submission (trim whitespace)
  const handleSubmit = () => {
    const trimmedMessage = value.trim();

    // AC-5.6: Empty messages are not sent
    if (!trimmedMessage) {
      return;
    }

    // Message length validation: Do not send if over limit
    if (value.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    // Call onSend callback
    onSend(trimmedMessage);

    // Subtask 1.5: Clear input field after successful submission
    // AC-5.3: Input field clears after message is sent
    setValue('');
  };

  // Subtask 1.3: Handle Enter key submission (Enter sends, Shift+Enter adds newline)
  // AC-5.2: Pressing Enter in input field submits message
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift: Submit message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline insertion
      handleSubmit();
    }
    // Shift+Enter: Allow default newline behavior (AC-5.7)
  };

  // Subtask 1.4: Handle send button click submission
  // AC-5.1: Clicking send button submits message
  const handleButtonClick = (e: FormEvent) => {
    e.preventDefault(); // Prevent form submission if wrapped in form
    handleSubmit();
  };

  // Calculate remaining characters and check if over limit
  const remainingChars = MAX_MESSAGE_LENGTH - value.length;
  const isOverLimit = value.length > MAX_MESSAGE_LENGTH;
  const isNearLimit = remainingChars <= 500 && remainingChars > 0;

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2">
          {/* Subtask 1.1: Textarea component */}
          {/* Subtask 1.7: Accept multiline input with proper textarea styling */}
          {/* AC-5.7: Long messages are accepted (multi-line support) */}
          <textarea
            className={`flex-1 resize-none rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 ${
              isOverLimit
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="Type your message... (Shift+Enter for new line)"
            rows={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Message input"
            aria-busy={disabled}
            aria-invalid={isOverLimit}
            aria-describedby={isOverLimit || isNearLimit ? 'char-count' : undefined}
          />

          {/* Subtask 1.1: Send button */}
          {/* Subtask 1.8: Disable input and button when disabled prop is true */}
          {/* AC-5.5: Input is disabled while waiting for agent response */}
          <button
            onClick={handleButtonClick}
            disabled={disabled || !value.trim() || isOverLimit}
            className="rounded-lg bg-blue-500 px-6 py-3 text-white font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
            aria-label="Send message"
          >
            Send
          </button>
        </div>

        {/* Character count indicator */}
        {(isNearLimit || isOverLimit) && (
          <div
            id="char-count"
            className={`mt-2 text-sm ${
              isOverLimit ? 'text-red-600 font-medium' : 'text-amber-600'
            }`}
            role="status"
            aria-live="polite"
          >
            {isOverLimit ? (
              <span>
                ⚠️ Message too long by {Math.abs(remainingChars).toLocaleString()} characters. Maximum is{' '}
                {MAX_MESSAGE_LENGTH.toLocaleString()} characters.
              </span>
            ) : (
              <span>{remainingChars.toLocaleString()} characters remaining</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
