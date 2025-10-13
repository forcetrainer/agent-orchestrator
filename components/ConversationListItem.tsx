'use client';

// components/ConversationListItem.tsx
// Story 10.4: Conversation Sidebar UI - Individual Conversation Item
// Task 3: Create ConversationListItem component (AC: 2, 3, 4, 5, 8)

import { TrashIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import type { ConversationMetadata } from '@/types/api';

/**
 * Individual conversation list item with preview, timestamp, and delete button.
 *
 * Features:
 * - Last message preview (truncated to 40 chars) - AC-10.4-2
 * - Relative timestamp ("2 hours ago") - AC-10.4-3
 * - Active conversation highlighting (bg-blue-50, border-cyan-500) - AC-10.4-4
 * - Click to load full history - AC-10.4-5
 * - Delete button with confirmation - AC-10.4-8
 *
 * Design System:
 * - Active: bg-blue-50, border-l-4 border-cyan-500 (signature cyan accent)
 * - Hover: bg-slate-100, cursor-pointer
 * - Border radius: 8px (geometric design system standard)
 * - Text: text-sm font-medium for preview, text-xs text-slate-500 for metadata
 * - Delete button: visible on hover, red hover state
 *
 * @param conversation - ConversationMetadata from API
 * @param active - Whether this conversation is currently active
 * @param onClick - Callback to load conversation
 * @param onDelete - Callback to delete conversation (triggers confirmation modal)
 */

interface ConversationListItemProps {
  conversation: ConversationMetadata;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ConversationListItem({
  conversation,
  active,
  onClick,
  onDelete,
}: ConversationListItemProps) {
  // Truncate last message to 35 chars for compact view
  const truncatedMessage =
    conversation.lastMessage.length > 35
      ? conversation.lastMessage.substring(0, 35) + '...'
      : conversation.lastMessage;

  return (
    <div
      className={`
        group relative px-2 py-1.5 rounded-md cursor-pointer transition-all text-xs
        ${
          active
            ? 'bg-blue-50 border-l-3 border-cyan-500'
            : 'hover:bg-slate-100 border-l-3 border-transparent'
        }
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Conversation: ${truncatedMessage}`}
      aria-current={active ? 'true' : undefined}
    >
      {/* Last Message Preview (AC-10.4-2) */}
      <p className="text-xs text-slate-900 font-medium mb-0.5 line-clamp-1 pr-6">
        {truncatedMessage}
      </p>

      {/* Metadata Row: Relative Timestamp (AC-10.4-3) */}
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span title={new Date(conversation.updatedAt).toLocaleString()}>
          {formatRelativeTime(conversation.updatedAt)}
        </span>
      </div>

      {/* Delete Button (visible on hover or when active) - AC-10.4-8 */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent conversation click
          onDelete();
        }}
        className="
          absolute top-1 right-1 opacity-0 group-hover:opacity-100
          p-0.5 rounded hover:bg-red-50 hover:text-red-600 transition-all
          focus:opacity-100 focus:ring-1 focus:ring-cyan-500
        "
        aria-label={`Delete conversation: ${truncatedMessage}`}
        tabIndex={0}
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
