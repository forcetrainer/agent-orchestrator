'use client';

import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { InputField } from './InputField';
import { AgentSelector } from './AgentSelector';
import { Message } from '@/lib/types';

/**
 * ChatPanel Component
 *
 * Main chat container with agent selector, message history, and input
 * Full-screen flex layout following architecture Section 7.1
 *
 * AC-1.1, AC-1.2, AC-1.3, AC-1.4: Chat interface layout
 * AC-2.1, AC-2.2, AC-2.3, AC-2.4: Message display and state management
 * AC-4.5, AC-4.6: Agent selection integration
 * AC-5.4, AC-5.5, AC-5.8: Message send functionality (Story 3.5)
 *
 * UX Enhancement: Centers input when no messages (like ChatGPT/Claude.ai),
 * expands to full layout when conversation starts
 */
export function ChatPanel() {
  // Agent selection state - Story 3.4 Task 4.2
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);

  // Story 3.5 Task 2.1: Add messages state array
  // AC-5.4: User message immediately appears in chat history
  const [messages, setMessages] = useState<Message[]>([]);

  // Story 3.5 Task 2.2: Add isLoading state
  // AC-5.5: Input is disabled while waiting for agent response
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Conversation ID for maintaining conversation state across messages
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // Handler for agent selection - Story 3.4 Task 4.3
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    // TODO Story 3.5: Reset conversation when agent changes (optional per AC-4.6)
    console.log('[ChatPanel] Agent selected:', agentId);
  };

  // Story 3.5 Task 2.3-2.9: Create handleSendMessage function
  // AC-5.4: User message immediately appears
  // AC-5.8: Agent response appears when received
  const handleSendMessage = async (messageContent: string) => {
    // Validation: Require agent selection
    if (!selectedAgentId) {
      console.error('[ChatPanel] No agent selected');
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Please select an agent before sending a message.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    try {
      // Task 2.4: Add user message to messages array immediately (optimistic update)
      // AC-5.4: User message immediately appears in chat history
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Task 2.5: Set isLoading=true before API call
      // AC-5.5: Input is disabled while waiting for agent response
      setIsLoading(true);

      // Task 2.6: POST to /api/chat with {agentId, message, conversationId} payload
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          message: messageContent,
          conversationId,
        }),
      });

      // Task 4.3: Handle API errors (400, 404, 500 responses)
      if (!response.ok) {
        // Task 4.4: Parse error messages from API response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Task 2.7: Parse response and add assistant message to messages array
      const data = await response.json();

      // Store conversationId for subsequent messages
      if (data.data?.conversationId) {
        setConversationId(data.data.conversationId);
      }

      // AC-5.8: Agent response appears when received from backend
      if (data.success && data.data?.message) {
        const assistantMessage: Message = {
          id: data.data.message.id,
          role: 'assistant',
          content: data.data.message.content,
          timestamp: new Date(data.data.message.timestamp),
          functionCalls: data.data.message.functionCalls,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      // Task 2.9: Handle errors by adding error message to chat (role='error')
      // Task 4.2: Handle network errors (fetch rejection, offline)
      // Task 4.6: Log detailed errors to console for debugging
      console.error('[ChatPanel] Error sending message:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // Task 2.8: Set isLoading=false after response (success or error)
      // Task 4.7: Ensure user can send new messages after error (isLoading reset)
      setIsLoading(false);
    }
  };

  // Centered layout before first message (ChatGPT/Claude.ai style)
  // Story 3.5 Task 3.1-3.5: Integrate InputField component
  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onAgentSelect={handleAgentSelect}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-3xl px-4">
            {/* Task 3.1: Render InputField component */}
            {/* Task 3.2: Pass handleSendMessage as onSend callback */}
            {/* Task 3.3: Pass isLoading as disabled prop */}
            <InputField onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    );
  }

  // Full layout after conversation starts - Story 3.2 Task 1.4
  // AC-5.1: Clicking send button submits message
  // AC-5.5: Input is disabled while waiting for agent response
  return (
    <div className="flex flex-col h-screen">
      <AgentSelector
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
      />
      {/* Task 3.5: Verify messages state updates trigger MessageList re-render */}
      <MessageList messages={messages} />

      {/* Task 3.1: Import and render InputField component at bottom of ChatPanel */}
      {/* Task 3.2: Pass handleSendMessage as onSend callback prop */}
      {/* Task 3.3: Pass isLoading as disabled prop to InputField */}
      {/* Task 3.4: Ensure InputField appears at bottom of chat layout */}
      <InputField onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
