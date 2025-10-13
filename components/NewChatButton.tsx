'use client';

// components/NewChatButton.tsx
// Story 10.4: Conversation Sidebar UI - Global New Chat Button
// Task 4: Create NewChatButton and AgentPickerModal components (AC: 7)

import { PlusIcon } from '@heroicons/react/24/solid';

/**
 * Prominent "New Chat" button for conversation sidebar (Slack-style).
 *
 * Features:
 * - Positioned at top of sidebar (AC-10.4-7)
 * - Opens agent picker modal when clicked
 * - Slack-style design: "+ New Chat" with icon
 * - Full width with prominent blue-800 background (design system primary color)
 *
 * Design System:
 * - Background: bg-blue-800 (primary color from design system)
 * - Hover: bg-blue-700 with shadow
 * - Active: bg-blue-900 with scale effect
 * - Focus ring: ring-2 ring-cyan-500 (signature cyan accent)
 * - Font: font-semibold text-white
 * - Border radius: rounded-lg (8px geometric design system)
 * - Padding: px-4 py-3 (design system standard button padding)
 *
 * @param onClick - Callback to open agent picker modal
 */

interface NewChatButtonProps {
  onClick: () => void;
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        w-full px-3 py-2 mb-3 bg-blue-800 text-white text-sm rounded-md font-medium
        hover:bg-blue-700 hover:shadow-sm
        active:bg-blue-900 active:scale-[0.98]
        focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1
        transition-all duration-150
        flex items-center justify-center gap-1.5
      "
      aria-label="Start new chat"
    >
      <PlusIcon className="w-4 h-4" />
      <span>New Chat</span>
    </button>
  );
}
