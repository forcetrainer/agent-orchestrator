'use client';

// components/AgentConversationGroup.tsx
// Story 10.4: Conversation Sidebar UI - Agent Grouping with Expand/Collapse
// Task 2: Create AgentConversationGroup component (AC: 6)

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ConversationListItem } from './ConversationListItem';
import type { ConversationMetadata } from '@/types/api';

/**
 * Agent conversation group component with expand/collapse functionality.
 *
 * Features:
 * - Agent header with icon, name, and conversation count
 * - Expand/collapse toggle with chevron icon (AC-10.4-6)
 * - Renders list of ConversationListItem components when expanded
 * - Signature thick left border (4px blue-800) for agent conversations (design system)
 *
 * Design System:
 * - Agent header: font-semibold text-slate-900
 * - Conversation count: text-xs text-slate-500
 * - Thick left border: border-l-4 border-blue-800 (design system signature element)
 * - Expand/collapse animation: smooth transition (300ms)
 * - Hover state: bg-slate-100 for header button
 *
 * @param agentId - Unique agent identifier
 * @param agentName - Display name for agent (e.g., "Winston")
 * @param agentIcon - Optional emoji/icon (e.g., "🏗️")
 * @param conversations - Array of ConversationMetadata for this agent
 * @param activeConversationId - Currently active conversation ID for highlighting
 * @param onConversationClick - Callback when conversation is clicked
 * @param onDelete - Callback when conversation delete is requested
 */

interface AgentConversationGroupProps {
  agentId: string;
  agentName: string;
  agentIcon?: string;
  conversations: ConversationMetadata[];
  activeConversationId?: string;
  onConversationClick: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

export function AgentConversationGroup({
  agentId,
  agentName,
  agentIcon,
  conversations,
  activeConversationId,
  onConversationClick,
  onDelete,
}: AgentConversationGroupProps) {
  // Expand/collapse state management (AC-10.4-6)
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-1.5">
      {/* Agent Header with Expand/Collapse Toggle (AC-10.4-6) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="
          flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-md text-sm
          hover:bg-slate-100 transition-colors
          focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1
        "
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${agentName} conversations`}
      >
        {/* Chevron Icon (rotates based on expanded state) */}
        {expanded ? (
          <ChevronDownIcon className="w-3.5 h-3.5 text-slate-600" />
        ) : (
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-600" />
        )}

        {/* Agent Icon (optional) */}
        {agentIcon && <span className="text-base">{agentIcon}</span>}

        {/* Agent Name */}
        <span className="font-semibold text-slate-900 flex-1">{agentName}</span>

        {/* Conversation Count Badge */}
        <span className="text-xs text-slate-500">({conversations.length})</span>
      </button>

      {/* Conversation List (visible when expanded) */}
      {expanded && (
        <div
          className="
            space-y-0.5 ml-1.5 pl-1.5 border-l-4 border-blue-800
            motion-reduce:transition-none transition-all duration-300
          "
          role="group"
          aria-label={`${agentName} conversations`}
        >
          {conversations.map((conv) => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              active={conv.id === activeConversationId}
              onClick={() => onConversationClick(conv.id)}
              onDelete={() => onDelete(conv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
