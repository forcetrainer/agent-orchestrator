'use client';

// app/page.tsx
// Story 10.4: Conversation Sidebar UI - Main layout integration
// Updated for conversation management with sidebar navigation

import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { TopBar } from '@/components/TopBar';
import type { Message } from '@/lib/types';

/**
 * Home Page - Main Chat Interface with Conversation Sidebar
 *
 * Story 10.4: Conversation Sidebar UI
 * - Sidebar with agent-grouped conversations (left 320px)
 * - Chat panel for active conversation (remaining width)
 * - New Chat button with agent picker modal
 * - Conversation switching and deletion
 *
 * Layout Structure:
 * - Sidebar: Fixed 320px width (w-80), bg-slate-50, conversati list
 * - Chat Panel: Flex-1 remaining width, active conversation display
 *
 * Previous Stories:
 * - Story 3.1: Basic Chat UI Layout
 * - Story 10.0-10.3: Conversation persistence and APIs
 */
export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Handle conversation click from sidebar (AC-10.4-5)
   * Loads full conversation history and switches chat panel to that conversation
   */
  async function handleConversationClick(conversationId: string) {
    try {
      // Fetch full conversation with messages
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to load conversation: ${response.statusText}`);
      }

      const conversation = await response.json();

      // Update active conversation
      setActiveConversationId(conversationId);
      setSelectedAgentId(conversation.agentId);

      // ChatPanel will handle loading messages through its own state
      // We're just signaling which conversation should be active
    } catch (error) {
      console.error('Failed to load conversation:', error);
      // TODO: Show error toast/notification
    }
  }

  /**
   * Handle new conversation creation (AC-10.4-7)
   * User clicked "New Chat" button and selected an agent from modal
   */
  function handleNewConversation(agentId: string) {
    console.log('[page.tsx] handleNewConversation called with agentId:', agentId);
    // Clear active conversation to start fresh
    setActiveConversationId(undefined);
    setSelectedAgentId(agentId);
    console.log('[page.tsx] State updated - activeConversationId: undefined, selectedAgentId:', agentId);

    // ChatPanel will handle initializing the new conversation
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation Bar with Flint Branding */}
      <TopBar />

      {/* Main Content Area: Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation Sidebar (AC-10.4-1) */}
        <ConversationSidebar
          activeConversationId={activeConversationId}
          onConversationClick={handleConversationClick}
          onNewConversation={handleNewConversation}
          refreshTrigger={refreshTrigger}
        />

        {/* Chat Panel */}
        <div className="flex-1 min-w-0">
          <ChatPanel
            activeConversationId={activeConversationId}
            selectedAgentId={selectedAgentId}
            onConversationStart={(conversationId) => {
              console.log('[page.tsx] New conversation started:', conversationId);
              setActiveConversationId(conversationId);
              setRefreshTrigger((prev) => prev + 1); // Trigger sidebar refresh
            }}
          />
        </div>
      </div>
    </div>
  );
}
