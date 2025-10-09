/**
 * useStreamingChat Hook
 * Story 6.8: Streaming Responses - Frontend state management
 *
 * Manages Server-Sent Events (SSE) streaming connection, token accumulation,
 * batching, and status updates. Implements performance optimizations for
 * 60fps smooth scrolling during streaming.
 *
 * Key Features:
 * - Token batching: Accumulates tokens for 16ms (1 frame at 60fps) before React update
 * - useTransition: Marks streaming updates as non-urgent to prioritize user interactions
 * - AbortController: Allows cancellation of streaming mid-flight
 * - Status events: Processes tool execution status from backend
 *
 * Preserves all existing chat logic (message history managed by ChatPanel)
 *
 * AC-6.8.1: Token display (manages streamingContent state)
 * AC-6.8.2: Tokens render within 100ms of receipt from API
 * AC-6.8.6: Status indicators during streaming
 * AC-6.8.7: Conversation management preserved (ChatPanel manages messages)
 * AC-6.8.26: Stop/cancel button functions correctly
 *
 * Performance Optimizations (Task 6):
 * - Token batching reduces React re-renders by 60x (16ms window vs per-token)
 * - useTransition allows React to prioritize urgent updates (user input) over streaming
 * - Combined with React.memo on MessageBubble prevents re-render of old messages
 *
 * @example
 * const { isStreaming, streamingContent, status, sendMessage, cancelStream } = useStreamingChat();
 *
 * // Send message with streaming
 * const result = await sendMessage('Hello', 'agent-id', conversationId);
 * if (result.success) {
 *   console.log('Final content:', result.finalContent);
 *   console.log('ConversationId:', result.conversationId);
 * }
 *
 * // Cancel active stream
 * cancelStream();
 */

import { useState, useCallback, useRef, useEffect, useTransition } from 'react';

/**
 * Return type for useStreamingChat hook
 */
export interface UseStreamingChatResult {
  /** True when actively streaming tokens from the server */
  isStreaming: boolean;

  /** Accumulated streaming content (cleared after streaming completes) */
  streamingContent: string;

  /** Current status message (e.g., "Agent is thinking", "Reading workflow.md...") */
  status: string | undefined;

  /**
   * Send a message and receive streaming response
   *
   * @param messageContent - User message text
   * @param agentId - ID of the agent to chat with
   * @param conversationId - Existing conversation ID (undefined for new conversation)
   * @param attachments - Optional file attachments (filepath and filename)
   * @returns Promise resolving to result object with success, conversationId, finalContent, or error
   */
  sendMessage: (
    messageContent: string,
    agentId: string,
    conversationId: string | undefined,
    attachments?: Array<{ filepath: string; filename: string }>
  ) => Promise<{ success: boolean; conversationId?: string; error?: string; finalContent?: string }>;

  /**
   * Cancel active streaming connection
   * Aborts the fetch request and clears streaming state
   */
  cancelStream: () => void;
}

/**
 * SSE Event types from backend (Story 6.8)
 *
 * Event Format: `data: ${JSON.stringify(event)}\n\n`
 *
 * Event Types:
 * - token: Text content chunk from LLM (streamed progressively)
 * - status: Status update during tool execution (e.g., "Reading workflow.md...")
 * - conversationId: Conversation ID sent before [DONE] for multi-turn context
 * - error: Error message from server (streaming halts)
 *
 * Completion Event: `data: [DONE]\n\n` (signals end of stream)
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

  // useTransition for non-urgent streaming updates (AC-6.8: 60fps smooth scrolling)
  // Allows React to prioritize more critical UI updates over token rendering
  const [, startTransition] = useTransition();

  // AbortController for canceling streams
  const abortControllerRef = useRef<AbortController | null>(null);

  // Token batching for performance (AC-6.8: 60fps smooth scrolling)
  // Accumulate tokens for 16ms (1 frame) before React update
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTokensRef = useRef<string>('');

  // Story 6.9: Minimum status display duration (1500ms / 1.5 seconds)
  // Ensures users perceive status messages even if tool execution is very fast
  const statusTimestampRef = useRef<number | null>(null);
  const statusClearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const MIN_STATUS_DISPLAY_MS = 1500;

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
   * Flush pending tokens immediately to UI
   * Used when streaming completes or cancels
   */
  const flushPendingTokens = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    if (pendingTokensRef.current) {
      // Don't use startTransition for final flush - we want immediate rendering
      setStreamingContent(prev => prev + pendingTokensRef.current);
      pendingTokensRef.current = '';
    }
  }, []);

  /**
   * Cancel active streaming connection
   * AC-6.8.26: Stop button functions correctly
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      flushPendingTokens(); // Flush any pending tokens before clearing
      setIsStreaming(false);
      setStreamingContent('');
      setStatus(undefined);

      // Clear any pending status timers
      if (statusClearTimerRef.current) {
        clearTimeout(statusClearTimerRef.current);
        statusClearTimerRef.current = null;
      }
      statusTimestampRef.current = null;
    }
  }, [flushPendingTokens]);

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

      // Story 6.9: Show file reading status if attachments present
      if (attachments && attachments.length > 0) {
        // Show "Reading {filename}..." for user-attached files
        const readingMessage = attachments.length === 1
          ? `Reading ${attachments[0].filename}...`
          : `Reading ${attachments.length} files...`;
        setStatus(readingMessage);
        statusTimestampRef.current = Date.now();

        // After 400ms, transition to "Agent is thinking" if no other status has appeared
        statusClearTimerRef.current = setTimeout(() => {
          setStatus('Agent is thinking');
          statusTimestampRef.current = Date.now();
          statusClearTimerRef.current = null;
        }, MIN_STATUS_DISPLAY_MS);
      } else {
        setStatus('Agent is thinking');
        statusTimestampRef.current = Date.now();
      }

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
              // Flush any pending batched tokens before completing
              flushPendingTokens();

              // Streaming complete - return accumulated content to ChatPanel
              // DO NOT clear streamingContent here - ChatPanel needs it to add to messages
              setIsStreaming(false);
              setStatus(undefined);
              abortControllerRef.current = null;
              return { success: true, conversationId: receivedConversationId, finalContent: accumulatedContent };
            }

            try {
              const event: StreamEvent = JSON.parse(dataStr);

              // AC-6.8.1: Process token events with batching
              // Batch tokens for 16ms (1 frame at 60fps) to reduce re-renders
              if (event.type === 'token') {
                accumulatedContent += event.content;
                pendingTokensRef.current += event.content;

                // Story 6.9: On first token, clear status (respecting minimum display time)
                if (accumulatedContent === event.content) {
                  // First token received - clear status to show streaming content
                  const elapsed = statusTimestampRef.current
                    ? Date.now() - statusTimestampRef.current
                    : MIN_STATUS_DISPLAY_MS;

                  const remainingTime = Math.max(0, MIN_STATUS_DISPLAY_MS - elapsed);

                  // Cancel any pending automatic transition (e.g., "Reading..." → "Agent is thinking")
                  if (statusClearTimerRef.current) {
                    clearTimeout(statusClearTimerRef.current);
                    statusClearTimerRef.current = null;
                  }

                  if (remainingTime > 0) {
                    // Delay clearing status to ensure minimum visibility
                    statusClearTimerRef.current = setTimeout(() => {
                      setStatus(undefined); // Clear status when content starts streaming
                      statusTimestampRef.current = null;
                      statusClearTimerRef.current = null;
                    }, remainingTime);
                  } else {
                    // Already shown long enough - clear immediately
                    setStatus(undefined);
                    statusTimestampRef.current = null;
                  }
                }

                // Schedule batch flush if not already scheduled
                if (!batchTimerRef.current) {
                  batchTimerRef.current = setTimeout(() => {
                    if (pendingTokensRef.current) {
                      // Use startTransition for non-urgent token rendering
                      // Allows React to prioritize user interactions over streaming updates
                      startTransition(() => {
                        setStreamingContent(prev => prev + pendingTokensRef.current);
                        pendingTokensRef.current = '';
                      });
                    }
                    batchTimerRef.current = null;
                  }, 16); // 16ms = 1 frame at 60fps
                }
              }

              // AC-6.8.6: Process status events
              // Story 6.9: Minimum display duration to ensure users perceive status
              else if (event.type === 'status') {
                if (event.message) {
                  // New status from backend (e.g., tool execution like "Executing workflow...")
                  const elapsed = statusTimestampRef.current
                    ? Date.now() - statusTimestampRef.current
                    : MIN_STATUS_DISPLAY_MS;

                  const remainingTime = Math.max(0, MIN_STATUS_DISPLAY_MS - elapsed);

                  // Cancel any pending automatic transition
                  if (statusClearTimerRef.current) {
                    clearTimeout(statusClearTimerRef.current);
                    statusClearTimerRef.current = null;
                  }

                  if (remainingTime > 0) {
                    // Delay showing new status to ensure previous status gets minimum visibility
                    statusClearTimerRef.current = setTimeout(() => {
                      setStatus(event.message);
                      statusTimestampRef.current = Date.now();
                      statusClearTimerRef.current = null;
                    }, remainingTime);
                  } else {
                    // Previous status shown long enough - update immediately
                    setStatus(event.message);
                    statusTimestampRef.current = Date.now();
                  }
                } else {
                  // Backend clearing status (after tool execution completes)
                  const elapsed = statusTimestampRef.current
                    ? Date.now() - statusTimestampRef.current
                    : MIN_STATUS_DISPLAY_MS;

                  const remainingTime = Math.max(0, MIN_STATUS_DISPLAY_MS - elapsed);

                  // Cancel any pending timer
                  if (statusClearTimerRef.current) {
                    clearTimeout(statusClearTimerRef.current);
                    statusClearTimerRef.current = null;
                  }

                  if (remainingTime > 0) {
                    // Delay clearing to ensure minimum visibility
                    statusClearTimerRef.current = setTimeout(() => {
                      setStatus(undefined);
                      statusTimestampRef.current = null;
                      statusClearTimerRef.current = null;
                    }, remainingTime);
                  } else {
                    // Already shown long enough - clear immediately
                    setStatus(undefined);
                    statusTimestampRef.current = null;
                  }
                }
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

        // Stream ended without [DONE] - flush pending tokens and return success
        flushPendingTokens();
        setIsStreaming(false);
        setStatus(undefined);
        abortControllerRef.current = null;
        return { success: true, conversationId: receivedConversationId, finalContent: accumulatedContent };

      } catch (error: any) {
        // AC-6.8.33: Handle connection drops and errors
        console.error('[useStreamingChat] Streaming error:', error);

        flushPendingTokens(); // Flush any pending tokens before error cleanup
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
