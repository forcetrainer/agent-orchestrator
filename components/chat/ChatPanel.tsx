'use client';

// components/chat/ChatPanel.tsx
// Story 10.4: Refactored for conversation sidebar navigation
// Removed AgentSelector - agent selection now handled by ConversationSidebar

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputField } from './InputField';
import { Message } from '@/lib/types';
import { AgentSummary } from '@/types/api';
import { useStreamingChat } from './useStreamingChat';

/**
 * ChatPanel Component
 *
 * Main chat container with message history and input.
 * Displays active conversation or prompts user to start a new chat.
 *
 * Story 10.4: Refactored for conversation sidebar UI
 * - Removed top AgentSelector (agent selection now in sidebar via "New Chat")
 * - Accepts activeConversationId prop for conversation switching
 * - Accepts selectedAgentId prop from parent
 * - Calls onConversationStart when new conversation begins
 *
 * Props:
 * - activeConversationId: Current active conversation (from sidebar click)
 * - selectedAgentId: Selected agent ID (from sidebar "New Chat" or conversation load)
 * - onConversationStart: Callback when new conversation is created (returns conversationId)
 */

interface ChatPanelProps {
  activeConversationId?: string;
  selectedAgentId?: string;
  onConversationStart?: (conversationId: string) => void;
}

export function ChatPanel({
  activeConversationId,
  selectedAgentId,
  onConversationStart,
}: ChatPanelProps) {
  // Message state
  const [messages, setMessages] = useState<Message[]>([]);

  // Streaming chat hook
  const {
    isStreaming,
    streamingContent,
    status: streamingStatus,
    sendMessage: sendStreamingMessage,
    cancelStream,
  } = useStreamingChat();

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

  // Conversation ID for maintaining conversation state across messages
  const [conversationId, setConversationId] = useState<string | undefined>();

  // Input field ref for auto-focus
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track which agent is currently loaded
  const [loadedAgentId, setLoadedAgentId] = useState<string | undefined>();

  /**
   * Effect: Load conversation when activeConversationId changes
   * AC-10.4-5: Click conversation → load full history
   */
  useEffect(() => {
    if (activeConversationId && activeConversationId !== conversationId) {
      loadConversation(activeConversationId);
    }
    // When activeConversationId is cleared (user clicked "New Chat"), reset the conversation state
    else if (!activeConversationId && conversationId) {
      console.log('[ChatPanel] Clearing conversation state for new chat');
      setConversationId(undefined);
      setLoadedAgentId(undefined);
      setMessages([]);
    }
  }, [activeConversationId, conversationId]);

  /**
   * Effect: Initialize agent when selectedAgentId changes
   * This happens when user clicks "New Chat" and selects an agent
   */
  useEffect(() => {
    console.log('[ChatPanel] useEffect triggered - selectedAgentId:', selectedAgentId, 'loadedAgentId:', loadedAgentId, 'activeConversationId:', activeConversationId);
    // Initialize agent when:
    // 1. We have a selectedAgentId
    // 2. No active conversation (new chat scenario)
    // 3. Either no loaded agent yet OR different agent selected
    if (selectedAgentId && !activeConversationId) {
      if (!loadedAgentId || selectedAgentId !== loadedAgentId) {
        console.log('[ChatPanel] Calling initializeAgent with:', selectedAgentId);
        initializeAgent(selectedAgentId);
      }
    }
  }, [selectedAgentId, loadedAgentId, activeConversationId]);

  /**
   * Load full conversation history from API
   * AC-10.4-5: Click conversation → load full history
   */
  async function loadConversation(convId: string) {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading conversation...');

      const response = await fetch(`/api/conversations/${convId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to load conversation: ${response.statusText}`);
      }

      const conversation = await response.json();

      // Convert API messages to Message type
      // Filter out messages with empty content (status messages, function calls without content)
      const loadedMessages: Message[] = conversation.messages
        .filter((msg: any) => msg.content && msg.content.trim().length > 0)
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          functionCalls: msg.functionCalls,
          toolCallId: msg.toolCallId,
        }));

      setMessages(loadedMessages);
      setConversationId(convId);
      setLoadedAgentId(conversation.agentId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: 'Failed to load conversation. Please try again.',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingMessage(undefined);
    }
  }

  /**
   * Initialize agent when starting new conversation
   * Fetches agent greeting/welcome message
   */
  async function initializeAgent(agentId: string) {
    setIsLoading(true);
    setLoadingMessage('Agent is loading');
    setMessages([]); // Clear messages for new conversation
    setConversationId(undefined); // Reset conversation ID

    try {
      // Fetch agent details to get bundlePath and filePath
      const agentsResponse = await fetch('/api/agents');
      if (!agentsResponse.ok) {
        throw new Error('Failed to fetch agent list');
      }

      const agentsData = await agentsResponse.json();
      // API returns { success: true, data: AgentMetadata[] }
      const agent = agentsData.data?.find((a: AgentSummary) => a.id === agentId);

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Call initialization API
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'error',
          content:
            errorData.error ||
            'Failed to initialize agent. Please try selecting the agent again.',
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
        return;
      }

      const data = await response.json();

      // Display agent greeting if provided (ephemeral - not persisted until user sends first message)
      if (data.success && data.data?.greeting) {
        const greetingMessage: Message = {
          id: `system-${Date.now()}`,
          role: 'system',
          content: data.data.greeting,
          timestamp: new Date(),
        };
        setMessages([greetingMessage]);
      }

      setLoadedAgentId(agentId);
    } catch (error) {
      console.error('Error initializing agent:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content:
          'Connection failed while initializing agent. Please try selecting the agent again.',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingMessage(undefined);
    }
  }

  /**
   * Handle sending message
   * AC-10.4-5: Send message in active conversation
   */
  async function handleSendMessage(
    messageContent: string,
    attachments?: Array<{ filepath: string; filename: string }>
  ) {
    // Validation: Require agent selection
    if (!loadedAgentId) {
      console.error('[ChatPanel] No agent selected');
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: 'Please select an agent before sending a message.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Add user message to messages array immediately (optimistic update)
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Call streaming hook
    const result = await sendStreamingMessage(
      messageContent,
      loadedAgentId,
      conversationId,
      attachments
    );

    if (result.success) {
      // Add assistant message to history after streaming completes
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

        // Notify parent if this is a new conversation
        if (!conversationId && onConversationStart) {
          onConversationStart(result.conversationId);
        }
      }
    } else {
      // Display error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: result.error || 'An error occurred while sending the message.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }

  // Empty state: No agent selected and no active conversation loading
  if (!selectedAgentId && !activeConversationId && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-600">
            <svg
              className="mx-auto h-16 w-16 text-slate-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">No conversation selected</p>
            <p className="text-sm">
              Click <span className="font-semibold">&quot;New Chat&quot;</span> in the sidebar to start a new conversation
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state: Agent initialization in progress
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {/* Animated loading spinner with BMAD branding colors */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <p className="text-lg font-semibold text-slate-900 mb-2">
              {loadingMessage || 'Initializing agent...'}
            </p>
            <p className="text-sm text-slate-600">
              Please wait while we prepare your conversation
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Centered layout before first message (ChatGPT/Claude.ai style)
  if (messages.length === 0 && !isLoading && !isStreaming) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-3xl px-6">
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

  // Full layout after conversation starts
  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages}
        isLoading={isLoading}
        loadingMessage={streamingStatus || loadingMessage}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
      />

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
