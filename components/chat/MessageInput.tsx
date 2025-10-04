'use client';

/**
 * MessageInput Component
 *
 * Text input field + send button in horizontal layout
 * Visual shell only for Story 3.1 - handlers added in Story 3.5
 *
 * AC-1.1: Chat interface displays with text input at bottom
 * AC-1.3: Send button appears next to input field
 *
 * @param centered - If true, renders with centered styling (for initial state)
 */
export function MessageInput({ centered = false }: { centered?: boolean }) {
  // Centered variant (ChatGPT/Claude.ai initial state)
  if (centered) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-4 py-4">
        <div className="flex gap-2">
          <textarea
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Send a message..."
            rows={1}
            aria-label="Message input"
            disabled
          />
          <button
            className="rounded-lg bg-blue-500 px-6 py-3 text-white font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
            disabled
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  // Standard variant (after conversation starts)
  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="max-w-3xl mx-auto flex gap-2">
        <textarea
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Type your message..."
          rows={1}
          aria-label="Message input"
          disabled
        />
        <button
          className="rounded-lg bg-blue-500 px-6 py-3 text-white font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
          disabled
        >
          Send
        </button>
      </div>
    </div>
  );
}
