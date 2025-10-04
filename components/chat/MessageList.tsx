'use client';

/**
 * MessageList Component (Visual Shell)
 *
 * Scrollable message history container - placeholder for Story 3.1
 * Will receive messages array prop in Story 3.2
 *
 * AC-1.2: Message history area shows above input field
 */
export function MessageList() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50"
      role="log"
      aria-label="Message history"
    >
      {/* Placeholder - messages will be rendered here in Story 3.2 */}
      <div className="max-w-3xl mx-auto text-gray-400 text-center py-8">
        <p className="text-sm">No messages yet. Start a conversation below.</p>
      </div>
    </div>
  );
}
