'use client';

import { useState, KeyboardEvent, FormEvent, forwardRef } from 'react';
import { useDrop } from 'react-dnd';
import { FileAttachment } from './FileAttachment';
import { announceToScreenReader } from '@/lib/accessibility/announcer';
import type { FileReference } from '@/types';

/**
 * InputField Component
 *
 * Message input component with textarea and send button for chat interface.
 * Supports multiline input with Shift+Enter, Enter to send.
 * Story 6.7: Now supports file attachments via drag-drop from file viewer
 *
 * Story 3.5 Task 1: Create InputField component with message submission
 * AC-5.1: Clicking send button submits message
 * AC-5.2: Pressing Enter submits message
 * AC-5.3: Input field clears after message sent
 * AC-5.6: Empty messages are not sent
 * AC-5.7: Long messages accepted (multiline support)
 *
 * @param onSend - Callback function called when user submits a message with attachments
 * @param disabled - If true, disables input and send button (during API calls)
 */
interface InputFieldProps {
  onSend: (message: string, attachments?: FileReference[]) => void;
  disabled?: boolean;
}

const MAX_MESSAGE_LENGTH = 10000; // Character limit per Dev Notes Story 3.5

export const InputField = forwardRef<HTMLTextAreaElement, InputFieldProps>(
  function InputField({ onSend, disabled = false }, ref) {
    const [value, setValue] = useState('');
    const [showLengthWarning, setShowLengthWarning] = useState(false);
    const [attachments, setAttachments] = useState<FileReference[]>([]);

    // Story 6.6: Drop zone for file attachments
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: 'FILE_REFERENCE',
      drop: (item: FileReference) => {
        // Prevent duplicate attachments
        if (attachments.some((a) => a.filepath === item.filepath)) {
          return;
        }

        // Prevent exceeding max limit (10 files)
        if (attachments.length >= 10) {
          alert('Maximum 10 files allowed');
          return;
        }

        // Add attachment
        setAttachments((prev) => [...prev, item]);

        // Screen reader announcement
        announceToScreenReader(`File attached: ${item.filename}`);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    });

    // Remove attachment functionality
    const removeAttachment = (filepath: string) => {
      const removed = attachments.find((a) => a.filepath === filepath);
      setAttachments((prev) => prev.filter((a) => a.filepath !== filepath));
      if (removed) {
        announceToScreenReader(`File removed: ${removed.filename}`);
      }
    };

    // Subtask 1.6: Validate non-empty message before submission (trim whitespace)
    // Story 6.7: Now includes attachments in the send callback
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

      // Call onSend callback with message and attachments
      // Story 6.7: Pass attachments array (empty if no attachments)
      onSend(trimmedMessage, attachments.length > 0 ? attachments : undefined);

      // Subtask 1.5: Clear input field after successful submission
      // AC-5.3: Input field clears after message is sent
      setValue('');

      // Story 6.7: Clear attachments after successful send
      setAttachments([]);
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
          {/* File attachment pills above text input box */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file) => (
                <FileAttachment
                  key={file.filepath}
                  filename={file.filename}
                  filepath={file.filepath}
                  onRemove={() => removeAttachment(file.filepath)}
                />
              ))}
            </div>
          )}

          <div
            ref={drop}
            className={`border rounded-lg p-3 transition-colors ${
              isOver ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <div className="flex gap-2">
              {/* Subtask 1.1: Textarea component */}
              {/* Subtask 1.7: Accept multiline input with proper textarea styling */}
              {/* AC-5.7: Long messages are accepted (multi-line support) */}
              <textarea
                ref={ref}
                className={`flex-1 resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent ${
                  isOverLimit ? 'text-red-600' : ''
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
          </div>
        </div>

        {/* Character count indicator */}
        <div className="max-w-3xl mx-auto">
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
);
