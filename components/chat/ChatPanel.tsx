'use client';

import { useState, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { InputField } from './InputField';
import { AgentSelector } from './AgentSelector';
import { FileViewerPanel } from '../FileViewerPanel';
import { Message } from '@/lib/types';
import { mapErrorToUserMessage } from '@/lib/errorMapping';
import { AgentSummary } from '@/types/api';

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
  // Story 4.6: Now stores full agent object with bundlePath
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<AgentSummary | undefined>(undefined);

  // Story 3.5 Task 2.1: Add messages state array
  // AC-5.4: User message immediately appears in chat history
  const [messages, setMessages] = useState<Message[]>([]);

  // Story 3.5 Task 2.2: Add isLoading state
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
    setLoadingMessage("Agent is loading...");

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
  // AC-5.4: User message immediately appears
  // AC-5.8: Agent response appears when received
  // AC-8.1: API errors display as error messages in chat
  // AC-8.6: User can still send new messages after error
  // AC-8.7: Errors don't crash the interface
  const handleSendMessage = async (messageContent: string) => {
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

    // Story 3.8 Task 5: Detailed logging context
    const requestContext = {
      agentId: selectedAgentId,
      messageLength: messageContent.length,
      conversationId,
      messageCount: messages.length,
      timestamp: new Date().toISOString(),
    };

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
      // Story 3.8 Task 2.1: Wrap fetch call in try/catch
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          message: messageContent,
          conversationId,
        }),
      });

      // Story 3.8 Task 2: Handle HTTP errors
      // Task 4.3: Handle API errors (400, 404, 500 responses)
      if (!response.ok) {
        // Task 5.2: Log API response details for debugging
        console.error('[ChatPanel] API error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers?.entries ? Object.fromEntries(response.headers.entries()) : {},
          context: requestContext,
        });

        // Task 4.4: Parse error messages from API response
        const errorData = await response.json().catch(() => ({}));

        // Story 3.8 Task 3, 4: Map technical errors to user-friendly messages
        // Create error object with both the error message and HTTP status
        const errorToMap = errorData.error
          ? { error: errorData.error, status: response.status }
          : { status: response.status };
        const userFriendlyMessage = mapErrorToUserMessage(errorToMap);

        // Task 5.3: Log user-friendly error message that was displayed
        console.error('[ChatPanel] Displaying error to user:', {
          userMessage: userFriendlyMessage,
          technicalError: errorData.error || `HTTP ${response.status}`,
          context: requestContext,
        });

        // Task 2.2, 2.3: Create error message object and add to messages array
        // AC-8.1: API errors display as error messages in chat
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'error',
          content: userFriendlyMessage,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);

        // Task 2.4: Reset isLoading to false on error to unblock UI
        // AC-8.6: User can still send new messages after error
        setIsLoading(false);
        return;
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
      // Story 3.8 Task 2.1: Handle network errors (fetch rejection, offline)
      // Task 5.1: Log full error object with stack trace
      console.error('[ChatPanel] Error sending message:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        context: requestContext,
      });

      // Story 3.8 Task 3: Map technical errors to user-friendly messages
      // AC-8.3: Errors explain what went wrong in plain language
      // AC-8.4: Network errors show "Connection failed - please try again"
      const userFriendlyMessage = mapErrorToUserMessage(error);

      // Task 5.3: Log user-friendly error message that was displayed
      console.error('[ChatPanel] Displaying error to user:', {
        userMessage: userFriendlyMessage,
        technicalError: error instanceof Error ? error.message : String(error),
        context: requestContext,
      });

      // Task 2.2, 2.3: Create error message object with role='error' and add to messages array
      // AC-8.1: API errors display as error messages in chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: userFriendlyMessage,
        timestamp: new Date(),
      };

      // Task 2.3: Add error message to messages array (appears in chat history)
      // Task 2.5: Preserve messages array and state even when error occurs
      // AC-8.7: Errors don't crash the interface
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // Task 2.8: Set isLoading=false after response (success or error)
      // Task 2.4: Reset isLoading to false on error to unblock UI
      // Task 2.6: Allow user to continue sending messages after error (don't disable input)
      // AC-8.6: User can still send new messages after error
      setIsLoading(false);
    }
  };

  // Centered layout before first message (ChatGPT/Claude.ai style)
  // Story 3.5 Task 3.1-3.5: Integrate InputField component
  // Story 4.7: Show full layout during initialization to display loading indicator (AC-4.7.6)
  // Story 5.1: Split-pane layout with FileViewerPanel (AC-1, AC-5)
  // AC-6: Responsive layout for desktop browsers
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex h-screen">
        {/* Chat panel - left side with minimum width for usability */}
        <div className="flex flex-col flex-1 min-w-0 bg-gray-50">
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
              <InputField onSend={handleSendMessage} disabled={isLoading} ref={inputRef} />
            </div>
          </div>
        </div>
        {/* File viewer panel - right side (AC-1: split-pane, AC-6: responsive width) */}
        <div className="w-96 min-w-[320px] max-w-[480px]">
          <FileViewerPanel />
        </div>
      </div>
    );
  }

  // Full layout after conversation starts - Story 3.2 Task 1.4
  // AC-5.1: Clicking send button submits message
  // AC-5.5: Input is disabled while waiting for agent response
  // Story 5.1: Split-pane layout with FileViewerPanel (AC-1, AC-5)
  // AC-6: Responsive layout for desktop browsers
  return (
    <div className="flex h-screen">
      {/* Chat panel - left side with minimum width for usability */}
      <div className="flex flex-col flex-1 min-w-0">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onAgentSelect={handleAgentSelect}
          onNewConversation={handleNewConversation}
        />
        {/* Task 3.5: Verify messages state updates trigger MessageList re-render */}
        {/* Story 3.6 Task 2.2: Pass isLoading prop to MessageList */}
        {/* Story 4.7: Pass loadingMessage to show context-specific loading text */}
        <MessageList messages={messages} isLoading={isLoading} loadingMessage={loadingMessage} />

        {/* Task 3.1: Import and render InputField component at bottom of ChatPanel */}
        {/* Task 3.2: Pass handleSendMessage as onSend callback prop */}
        {/* Task 3.3: Pass isLoading as disabled prop to InputField */}
        {/* Task 3.4: Ensure InputField appears at bottom of chat layout */}
        <InputField onSend={handleSendMessage} disabled={isLoading} ref={inputRef} />
      </div>
      {/* File viewer panel - right side (AC-1: split-pane, AC-6: responsive width) */}
      <div className="w-96 min-w-[320px] max-w-[480px]">
        <FileViewerPanel />
      </div>
    </div>
  );
}
