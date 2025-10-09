/**
 * useStreamingChat Hook
 * Story 6.8: Streaming Responses - Frontend state management
 *
 * Manages SSE streaming connection, token accumulation, and status updates
 * Preserves all existing chat logic (message history managed by ChatPanel)
 *
 * AC-6.8.1: Token display (manages streamingContent state)
 * AC-6.8.6: Status indicators during streaming
 * AC-6.8.7: Conversation management preserved (ChatPanel manages messages)
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseStreamingChatResult {
  isStreaming: boolean;
  streamingContent: string;
  status: string | undefined;
  sendMessage: (
    messageContent: string,
    agentId: string,
    conversationId: string | undefined,
    attachments?: Array<{ filepath: string; filename: string }>
  ) => Promise<{ success: boolean; conversationId?: string; error?: string; finalContent?: string }>;
  cancelStream: () => void;
}

/**
 * SSE Event types from backend
 */
type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'status'; message: string }
  | { type: 'error'; message: string }
  | { type: 'conversationId'; conversationId: string };

export function useStreamingChat(): UseStreamingChatResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);

  // AbortController for canceling streams
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear streaming content after streaming completes
  // Use a small delay to allow ChatPanel to capture finalContent first
  useEffect(() => {
    if (!isStreaming && streamingContent) {
      const timer = setTimeout(() => {
        setStreamingContent('');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, streamingContent]);

  /**
   * Cancel active streaming connection
   * AC-6.8.26: Stop button functions correctly
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setStreamingContent('');
      setStatus(undefined);
    }
  }, []);

  /**
   * Send message and handle streaming response
   * AC-6.8.1: Manage streaming state
   * AC-6.8.6: Process status events
   * AC-6.8.7: ChatPanel manages message history (not this hook)
   */
  const sendMessage = useCallback(
    async (
      messageContent: string,
      agentId: string,
      conversationId: string | undefined,
      attachments?: Array<{ filepath: string; filename: string }>
    ): Promise<{ success: boolean; conversationId?: string; error?: string; finalContent?: string }> => {
      // Initialize streaming state
      setIsStreaming(true);
      setStreamingContent('');
      setStatus('Agent is thinking');

      // Create AbortController for cancellation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // POST to /api/chat with streaming
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            message: messageContent,
            conversationId,
            attachments,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          // Handle HTTP errors
          const errorData = await response.json().catch(() => ({}));
          setIsStreaming(false);
          setStreamingContent('');
          setStatus(undefined);
          abortControllerRef.current = null;
          return { success: false, error: errorData.error || `HTTP ${response.status}` };
        }

        if (!response.body) {
          setIsStreaming(false);
          setStreamingContent('');
          setStatus(undefined);
          abortControllerRef.current = null;
          return { success: false, error: 'No response body for streaming' };
        }

        // AC-6.8.2: Read SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';
        let receivedConversationId = conversationId; // Default to input conversationId

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode chunk
          buffer += decoder.decode(value, { stream: true });

          // Split by newlines to get individual SSE events
          const lines = buffer.split('\n');

          // Keep last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const dataStr = line.substring(6); // Remove "data: " prefix

            // AC-6.8.7: Handle [DONE] completion event
            if (dataStr === '[DONE]') {
              // Streaming complete - return accumulated content to ChatPanel
              // DO NOT clear streamingContent here - ChatPanel needs it to add to messages
              setIsStreaming(false);
              setStatus(undefined);
              abortControllerRef.current = null;
              return { success: true, conversationId: receivedConversationId, finalContent: accumulatedContent };
            }

            try {
              const event: StreamEvent = JSON.parse(dataStr);

              // AC-6.8.1: Process token events
              if (event.type === 'token') {
                accumulatedContent += event.content;
                setStreamingContent(accumulatedContent);
              }

              // AC-6.8.6: Process status events
              else if (event.type === 'status') {
                setStatus(event.message);
              }

              // Process conversationId events
              else if (event.type === 'conversationId') {
                receivedConversationId = event.conversationId;
              }

              // AC-6.8.8: Process error events
              else if (event.type === 'error') {
                console.error('[useStreamingChat] Server error:', event.message);
                setIsStreaming(false);
                setStreamingContent('');
                setStatus(undefined);
                abortControllerRef.current = null;
                return { success: false, error: event.message };
              }
            } catch (parseError) {
              console.error('[useStreamingChat] Failed to parse SSE event:', dataStr, parseError);
            }
          }
        }

        // Stream ended without [DONE] - return success anyway with accumulated content
        setIsStreaming(false);
        setStatus(undefined);
        abortControllerRef.current = null;
        return { success: true, conversationId: receivedConversationId, finalContent: accumulatedContent };

      } catch (error: any) {
        // AC-6.8.33: Handle connection drops and errors
        console.error('[useStreamingChat] Streaming error:', error);

        setIsStreaming(false);
        setStreamingContent('');
        setStatus(undefined);
        abortControllerRef.current = null;

        // Don't return error if aborted by user
        if (error.name === 'AbortError') {
          console.log('[useStreamingChat] Stream canceled by user');
          return { success: false, error: 'Canceled' };
        }

        return { success: false, error: error.message || 'Connection failed' };
      }
    },
    []
  );

  return {
    isStreaming,
    streamingContent,
    status,
    sendMessage,
    cancelStream,
  };
}
