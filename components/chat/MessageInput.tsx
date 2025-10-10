'use client';

import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { FileAttachment } from './FileAttachment';
import { announceToScreenReader } from '@/lib/accessibility/announcer';
import type { FileReference } from '@/types';

/**
 * MessageInput Component
 *
 * Text input field + send button in horizontal layout
 * Visual shell only for Story 3.1 - handlers added in Story 3.5
 *
 * Story 6.6: File Reference Attachment UI (Drag & Drop)
 * AC-2: Chat input area accepts dropped files (shows blue highlight when hovering with file)
 * AC-3: Dropped file appears as pill/chip in input area above text field
 * AC-5: User can attach multiple files (up to 10)
 * AC-6: Clicking × on pill removes attachment
 * AC-9: Screen reader announces "File attached: {filename}"
 *
 * @param centered - If true, renders with centered styling (for initial state)
 */
export function MessageInput({ centered = false }: { centered?: boolean }) {
  const [attachments, setAttachments] = useState<FileReference[]>([]);

  // Story 6.6 AC-2: Drop zone for file attachments
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'FILE_REFERENCE',
    drop: (item: FileReference) => {
      // AC-5: Prevent duplicate attachments (check filepath)
      if (attachments.some((a) => a.filepath === item.filepath)) {
        return;
      }

      // AC-5: Prevent exceeding max limit (10 files)
      if (attachments.length >= 10) {
        alert('Maximum 10 files allowed');
        return;
      }

      // Add attachment
      setAttachments((prev) => [...prev, item]);

      // AC-9: Screen reader announcement
      announceToScreenReader(`File attached: ${item.filename}`);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // AC-6: Remove attachment functionality
  const removeAttachment = (filepath: string) => {
    const removed = attachments.find((a) => a.filepath === filepath);
    setAttachments((prev) => prev.filter((a) => a.filepath !== filepath));
    if (removed) {
      announceToScreenReader(`File removed: ${removed.filename}`);
    }
  };
  // Centered variant (ChatGPT/Claude.ai initial state)
  if (centered) {
    return (
      <div>
        {/* AC-3: Attachment pills above text input box */}
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
          className={`bg-white rounded-2xl shadow-lg border px-4 py-4 transition-colors duration-200 ${
            isOver ? 'border-cyan-500 border-2 bg-cyan-50' : 'border-slate-200'
          }`}
        >
          <div className="flex gap-4">
            <textarea
              className="flex-1 resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-30 transition-all duration-200"
              placeholder="Send a message..."
              rows={1}
              aria-label="Message input"
              disabled
            />
            <button
              className="rounded-lg bg-blue-800 px-6 py-3 text-white font-semibold hover:bg-blue-700 hover:shadow-md active:bg-blue-900 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Send message"
              disabled
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard variant (after conversation starts)
  return (
    <div className="border-t border-slate-200 bg-white px-6 py-4">
      <div className="max-w-3xl mx-auto">
        {/* AC-3: Attachment pills above text input box */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
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
          className={`border rounded-lg p-4 transition-colors duration-200 ${
            isOver ? 'border-cyan-500 border-2 bg-cyan-50' : 'border-slate-300'
          }`}
        >
          <div className="flex gap-4">
            <textarea
              className="flex-1 resize-none border-0 focus:ring-0 focus:outline-none text-slate-900 placeholder-slate-400"
              placeholder="Type your message..."
              rows={1}
              aria-label="Message input"
              disabled
            />
            <button
              className="rounded-lg bg-blue-800 px-6 py-3 text-white font-semibold hover:bg-blue-700 hover:shadow-md active:bg-blue-900 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Send message"
              disabled
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
