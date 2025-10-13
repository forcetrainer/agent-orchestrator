'use client';

// components/ConversationSidebar.tsx
// Story 10.4: Conversation Sidebar UI - Main Sidebar Container
// Task 1: Create ConversationSidebar component (AC: 1, 6)

import { useState, useEffect } from 'react';
import { NewChatButton } from './NewChatButton';
import { AgentPickerModal } from './AgentPickerModal';
import { AgentConversationGroup } from './AgentConversationGroup';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { ConversationListResponse } from '@/types/api';

/**
 * Conversation sidebar component for browsing and managing conversations.
 *
 * Features:
 * - Fetches conversations from GET /api/conversations on mount (AC-10.4-1)
 * - Agent-grouped conversation display (AC-10.4-1)
 * - Loading state with skeleton loaders
 * - Error state with error message
 * - Empty state when no conversations exist
 * - Global "New Chat" button at top (AC-10.4-7)
 * - Agent picker modal for new conversations (AC-10.4-7)
 * - Delete confirmation modal (AC-10.4-8)
 * - Responsive design (mobile-friendly sidebar)
 *
 * Design System:
 * - Sidebar background: bg-slate-50 (neutral background from design system)
 * - Border: border-r border-slate-200 (subtle divider)
 * - Width: w-80 (320px fixed width on desktop)
 * - Padding: p-4 (design system standard spacing)
 * - Overflow: overflow-y-auto (scrollable conversation list)
 * - Full height: h-full (matches parent container)
 *
 * Integration:
 * - Parent component (app/page.tsx) passes activeConversationId for highlighting
 * - onConversationClick callback switches active conversation in parent
 * - onNewConversation callback creates new conversation with selected agent
 *
 * @param activeConversationId - Currently active conversation ID
 * @param onConversationClick - Callback when conversation is clicked (receives conversationId)
 * @param onNewConversation - Callback when new conversation is created (receives agentId)
 */

interface ConversationSidebarProps {
  activeConversationId?: string;
  onConversationClick: (conversationId: string) => void;
  onNewConversation: (agentId: string) => void;
  refreshTrigger?: number;
}

export function ConversationSidebar({
  activeConversationId,
  onConversationClick,
  onNewConversation,
  refreshTrigger,
}: ConversationSidebarProps) {
  // State management
  const [conversations, setConversations] = useState<ConversationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Fetch conversations on mount (AC-10.4-1)
  useEffect(() => {
    fetchConversations();
  }, []);

  // Refresh conversations when refreshTrigger changes (when new conversation is created)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('[ConversationSidebar] Refresh triggered:', refreshTrigger);
      fetchConversations();
    }
  }, [refreshTrigger]);

  async function fetchConversations() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.statusText}`);
      }
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete confirmation (AC-10.4-8)
  function handleDeleteClick(conversationId: string, conversationTitle: string) {
    setConversationToDelete({ id: conversationId, title: conversationTitle });
    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!conversationToDelete) return;

    try {
      const response = await fetch(`/api/conversations/${conversationToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.statusText}`);
      }

      // Refresh conversation list
      await fetchConversations();

      // If deleted active conversation, parent will handle clearing selection
      // (Parent component should detect activeConversationId no longer exists)
    } catch (err) {
      console.error('Delete failed:', err);
      throw err; // Re-throw for modal to display error
    }
  }

  // Handle new conversation (AC-10.4-7)
  function handleAgentSelect(agentId: string) {
    onNewConversation(agentId);
  }

  // Loading state
  if (loading) {
    return (
      <aside className="w-64 h-full bg-slate-50 border-r border-slate-200 p-3">
        <div className="animate-pulse space-y-3">
          {/* New Chat Button Skeleton */}
          <div className="h-9 bg-slate-200 rounded-md mb-3" />
          {/* Conversation Skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-md" />
          ))}
        </div>
      </aside>
    );
  }

  // Error state
  if (error) {
    return (
      <aside className="w-64 h-full bg-slate-50 border-r border-slate-200 p-3">
        <div className="text-red-600 text-xs p-3 bg-red-50 rounded-md">
          {error}
        </div>
        <button
          onClick={fetchConversations}
          className="mt-3 w-full px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          Retry
        </button>
      </aside>
    );
  }

  // Empty state (no conversations)
  if (!conversations || conversations.conversations.length === 0) {
    return (
      <aside className="w-64 h-full bg-slate-50 border-r border-slate-200 p-3">
        <NewChatButton onClick={() => setAgentPickerOpen(true)} />
        <div className="text-slate-600 text-xs text-center mt-6">
          No conversations yet. Click &quot;New Chat&quot; to start chatting!
        </div>

        {/* Agent Picker Modal */}
        <AgentPickerModal
          isOpen={agentPickerOpen}
          onClose={() => setAgentPickerOpen(false)}
          onSelectAgent={handleAgentSelect}
        />
      </aside>
    );
  }

  // Main sidebar with conversations (AC-10.4-1)
  return (
    <aside className="w-64 h-full bg-slate-50 border-r border-slate-200 overflow-y-auto">
      <div className="p-3 space-y-3">
        {/* New Chat Button (AC-10.4-7) */}
        <NewChatButton onClick={() => setAgentPickerOpen(true)} />

        {/* Agent-grouped Conversations (AC-10.4-1, AC-10.4-6) */}
        {Object.entries(conversations.groupedByAgent).map(([agentId, convs]) => (
          <AgentConversationGroup
            key={agentId}
            agentId={agentId}
            agentName={convs[0].agentName}
            agentIcon={convs[0].agentIcon}
            conversations={convs}
            activeConversationId={activeConversationId}
            onConversationClick={onConversationClick}
            onDelete={(convId) => {
              const conv = convs.find((c) => c.id === convId);
              if (conv) {
                handleDeleteClick(convId, conv.lastMessage);
              }
            }}
          />
        ))}
      </div>

      {/* Agent Picker Modal (AC-10.4-7) */}
      <AgentPickerModal
        isOpen={agentPickerOpen}
        onClose={() => setAgentPickerOpen(false)}
        onSelectAgent={handleAgentSelect}
      />

      {/* Delete Confirmation Modal (AC-10.4-8) */}
      {conversationToDelete && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setConversationToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          conversationTitle={conversationToDelete.title}
        />
      )}
    </aside>
  );
}
