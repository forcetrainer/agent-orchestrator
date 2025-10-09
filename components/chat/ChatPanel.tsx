'use client';

import { useState, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { InputField } from './InputField';
import { AgentSelector } from './AgentSelector';
import { Message } from '@/lib/types';
import { mapErrorToUserMessage } from '@/lib/errorMapping';
import { AgentSummary } from '@/types/api';
import { useStreamingChat } from './useStreamingChat';

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
 * Story 6.8: Streaming response display (AC-6.8.1, AC-6.8.6, AC-6.8.26)
 *
 * UX Enhancement: Centers input when no messages (like ChatGPT/Claude.ai),
 * expands to full layout when conversation starts
 */
export function ChatPanel() {
  // Agent selection state - Story 3.4 Task 4.2
  // Story 4.6: Now stores full agent object with bundlePath
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<AgentSummary | undefined>(undefined);

  // Story 3.5 Task 2.1: Add messages state array
  // AC-5.4: User message immediately appears in chat history
  const [messages, setMessages] = useState<Message[]>([]);

  // Story 6.8: Use streaming chat hook
  const {
    isStreaming,
    streamingContent,
    status: streamingStatus,
    sendMessage: sendStreamingMessage,
    cancelStream,
  } = useStreamingChat();

  // Story 3.5 Task 2.2: Add isLoading state (for initialization, separate from streaming)
  // AC-5.5: Input is disabled while waiting for agent response
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Story 4.7: Loading message state for different loading contexts
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

  // Conversation ID for maintaining conversation state across messages
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // Story 3.7 Task 3.1: Ref for input field auto-focus after reset
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handler for agent selection - Story 3.4 Task 4.3
  // Story 3.10 Task 2: Integrate Initialization into Chat Flow
  // Story 4.6 Task 2.6: Now receives full agent object with bundlePath
  // AC-10.4: Agent greeting/welcome message displays automatically before user input
  // AC-10.6: Initialization completes before user can send first message
  // AC-10.7: Loading indicator shows during initialization process
  const handleAgentSelect = async (agent: AgentSummary) => {
    setSelectedAgentId(agent.id);
    setSelectedAgent(agent);

    // Task 2.5: Clear any previous conversation when new agent selected
    setMessages([]);
    setConversationId(undefined);

    // Task 2.2: Show loading state during initialization (AC-10.7)
    setIsLoading(true);
    setLoadingMessage("Agent is loading");

    console.log('[ChatPanel] Agent selected, initializing:', agent.id, 'isLoading:', true, 'messages:', messages.length);

    try {
      // Task 2.1: Call initialization API
      // Story 4.6 Task 2.6: Pass bundlePath and filePath for bundle-based loading
      const response = await fetch('/api/agent/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          bundlePath: agent.bundlePath,
          filePath: agent.filePath,
        }),
      });

      if (!response.ok) {
        // Task 4 (Error Handling): Display initialization errors gracefully
        console.error('[ChatPanel] Agent initialization failed:', response.status);

        const errorData = await response.json().catch(() => ({}));
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'error',
          content: errorData.error || 'Failed to initialize agent. Please try selecting the agent again.',
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Task 2.3: Display LLM's initialization response as first message (system role)
      // AC-10.4: Agent greeting/welcome message displays automatically
      // AC-10.5: Agent command list displays if defined in agent instructions
      if (data.success && data.data?.greeting) {
        const greetingMessage: Message = {
          id: `system-${Date.now()}`,
          role: 'system',
          content: data.data.greeting,
          timestamp: new Date(),
        };
        setMessages([greetingMessage]);
      }
    } catch (error) {
      // Task 4 (Error Handling): Handle network errors during initialization
      console.error('[ChatPanel] Error initializing agent:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: 'Connection failed while initializing agent. Please try selecting the agent again.',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      // Task 2.4: Block user input until initialization completes (AC-10.6)
      // Release loading state after initialization completes or fails
      setIsLoading(false);
      setLoadingMessage(undefined);
    }
  };

  // Story 3.7 Task 2.1: Create handleNewConversation function
  // AC-7.2: Clicking button clears chat history
  // AC-7.3: Agent context resets (doesn't remember previous messages)
  // AC-7.4: Input field remains focused and ready for new message
  const handleNewConversation = () => {
    // Task 2.2: Clear messages array
    setMessages([]);

    // Task 2.3: Reset conversationId to undefined (fresh conversation)
    setConversationId(undefined);

    // Task 2.4: Clear any error states (handled by clearing messages array)

    // Task 2.5: Reset isLoading to false if active
    setIsLoading(false);

    // Task 3.2: Focus input field after reset
    // AC-7.4: Input field remains focused and ready for new message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    console.log('[ChatPanel] New conversation started');
  };

  // Story 3.5 Task 2.3-2.9: Create handleSendMessage function
  // Story 3.8 Task 2: Implement error handling in ChatPanel API calls
  // Story 6.7: Now accepts attachments parameter for file reference attachments
  // Story 6.8: Use streaming for responses
  // AC-5.4: User message immediately appears
  // AC-5.8: Agent response appears when received
  // AC-6.8.1: Response streams token-by-token
  // AC-8.1: API errors display as error messages in chat
  // AC-8.6: User can still send new messages after error
  // AC-8.7: Errors don't crash the interface
  const handleSendMessage = async (messageContent: string, attachments?: Array<{ filepath: string; filename: string }>) => {
    // Validation: Require agent selection
    if (!selectedAgentId) {
      console.error('[ChatPanel] No agent selected');
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: 'Please select an agent before sending a message.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Task 2.4: Add user message to messages array immediately (optimistic update)
    // AC-5.4: User message immediately appears in chat history
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Story 6.8: Call streaming hook
    const result = await sendStreamingMessage(messageContent, selectedAgentId, conversationId, attachments);

    if (result.success) {
      // AC-6.8.29: Add assistant message to history after streaming completes
      // Use finalContent from result (accumulated during streaming)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.finalContent || '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Store conversationId for subsequent messages
      if (result.conversationId) {
        setConversationId(result.conversationId);
      }
    } else {
      // AC-8.1: API errors display as error messages in chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: result.error || 'An error occurred while sending the message.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Centered layout before first message (ChatGPT/Claude.ai style)
  // Story 3.5 Task 3.1-3.5: Integrate InputField component
  // Story 4.7: Show full layout during initialization to display loading indicator (AC-4.7.6)
  // Story 6.1: File viewer now handled by MainLayout wrapper
  // Story 6.8: Disable input during streaming
  if (messages.length === 0 && !isLoading && !isStreaming) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onAgentSelect={handleAgentSelect}
          onNewConversation={handleNewConversation}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-3xl px-4">
            {/* Task 3.1: Render InputField component */}
            {/* Task 3.2: Pass handleSendMessage as onSend callback */}
            {/* Task 3.3: Pass isLoading as disabled prop */}
            {/* Story 6.8: Also disable during streaming */}
            {/* Story 6.9: Pass isStreaming and cancelStream for send button UI */}
            <InputField
              onSend={handleSendMessage}
              disabled={isLoading}
              isStreaming={isStreaming}
              onCancelStream={cancelStream}
              ref={inputRef}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full layout after conversation starts - Story 3.2 Task 1.4
  // AC-5.1: Clicking send button submits message
  // AC-5.5: Input is disabled while waiting for agent response
  // Story 6.1: File viewer now handled by MainLayout wrapper
  // Story 6.8: Pass streaming state to MessageList
  return (
    <div className="flex flex-col h-screen">
      <AgentSelector
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
        onNewConversation={handleNewConversation}
      />
      {/* Task 3.5: Verify messages state updates trigger MessageList re-render */}
      {/* Story 3.6 Task 2.2: Pass isLoading prop to MessageList */}
      {/* Story 4.7: Pass loadingMessage to show context-specific loading text */}
      {/* Story 6.8: Pass streaming state for progressive display */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        loadingMessage={streamingStatus || loadingMessage}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
      />

      {/* Task 3.1: Import and render InputField component at bottom of ChatPanel */}
      {/* Task 3.2: Pass handleSendMessage as onSend callback prop */}
      {/* Task 3.3: Pass isLoading as disabled prop to InputField */}
      {/* Task 3.4: Ensure InputField appears at bottom of chat layout */}
      {/* Story 6.8 AC-6.8.26: Disable input during streaming */}
      {/* Story 6.9: Pass isStreaming and cancelStream for send button UI */}
      <InputField
        onSend={handleSendMessage}
        disabled={isLoading}
        isStreaming={isStreaming}
        onCancelStream={cancelStream}
        ref={inputRef}
      />
    </div>
  );
}
