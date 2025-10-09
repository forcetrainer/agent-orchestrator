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
 * Story 6.9: Claude-style send button with streaming support
 *
 * Story 3.5 Task 1: Create InputField component with message submission
 * AC-5.1: Clicking send button submits message
 * AC-5.2: Pressing Enter submits message
 * AC-5.3: Input field clears after message sent
 * AC-5.6: Empty messages are not sent
 * AC-5.7: Long messages accepted (multiline support)
 *
 * Story 6.9 Task 6, 7, 8:
 * AC-12: User can type during streaming, send button disabled during streaming
 * AC-13: Claude-style upward arrow button when idle
 * AC-14: Stop icon when streaming, clickable to interrupt
 * AC-15: Stream interruption preserves partial content
 *
 * @param onSend - Callback function called when user submits a message with attachments
 * @param disabled - If true, disables input and send button (during API calls)
 * @param isStreaming - True when response is streaming (shows stop button)
 * @param onCancelStream - Callback to cancel active streaming
 */
interface InputFieldProps {
  onSend: (message: string, attachments?: FileReference[]) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onCancelStream?: () => void;
}

const MAX_MESSAGE_LENGTH = 10000; // Character limit per Dev Notes Story 3.5

export const InputField = forwardRef<HTMLTextAreaElement, InputFieldProps>(
  function InputField({ onSend, disabled = false, isStreaming = false, onCancelStream }, ref) {
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
            ref={drop as any}
            className={`border rounded-lg p-3 transition-colors ${
              isOver ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <div className="flex gap-2 items-end">
              {/* Subtask 1.1: Textarea component */}
              {/* Subtask 1.7: Accept multiline input with proper textarea styling */}
              {/* AC-5.7: Long messages are accepted (multi-line support) */}
              {/* Story 6.9 AC-12: Textarea stays enabled during streaming, only send button disabled */}
              <textarea
                ref={ref}
                className={`flex-1 resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent ${
                  isOverLimit ? 'text-red-600' : ''
                } ${isStreaming ? 'border-blue-300' : ''}`}
                placeholder="Type your message... (Shift+Enter for new line)"
                rows={3}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled && !isStreaming} // AC-12: Allow typing during streaming
                aria-label="Message input"
                aria-busy={disabled}
                aria-invalid={isOverLimit}
                aria-describedby={isOverLimit || isNearLimit ? 'char-count' : undefined}
              />

              {/* Story 6.9 Task 6: Claude-style circular send button with arrow/stop icon */}
              {/* AC-13: Upward arrow when idle */}
              {/* AC-14: Stop icon when streaming */}
              {/* AC-15: Stop button interrupts stream */}
              <button
                onClick={isStreaming ? onCancelStream : handleButtonClick}
                disabled={(disabled || !value.trim() || isOverLimit) && !isStreaming}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isStreaming
                    ? 'bg-gray-700 hover:bg-gray-800 text-white' // Stop button (dark)
                    : disabled || !value.trim() || isOverLimit
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' // Disabled
                    : 'bg-blue-600 hover:bg-blue-700 text-white' // Send button (enabled)
                }`}
                aria-label={isStreaming ? 'Stop generating' : 'Send message'}
              >
                {isStreaming ? (
                  // Stop icon (filled square)
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  // Upward arrow icon
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                )}
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
