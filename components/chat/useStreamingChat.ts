/**
 * useStreamingChat Hook
 * Story 6.8: Streaming Responses - Frontend state management
 * Story 8.1: Enhanced streaming UX with character-by-character display
 *
 * Manages Server-Sent Events (SSE) streaming connection, token accumulation,
 * and character-by-character display. Implements Claude.ai-style smooth streaming
 * with natural, readable text flow.
 *
 * Key Features:
 * - Character-by-character display: Buffers API tokens, displays individual characters with delay
 * - Artificial throttling: ~15ms between characters (adjustable 10-20ms) for smooth animation
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
 * Performance & UX Optimizations:
 * - Character-by-character display creates smooth, natural streaming effect (like Claude.ai)
 * - Artificial delay (15ms default) provides polished cadence without feeling too fast or slow
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

  // Character-by-character streaming for smooth, readable display (Claude.ai-style)
  // Buffers incoming tokens, then displays at a pleasant reading pace
  // Buffer can grow large - that's OK! We display at human-readable speed, not API speed
  const characterBufferRef = useRef<string>('');
  const displayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDisplayingRef = useRef<boolean>(false);
  const CHAR_DISPLAY_DELAY_MS = 20; // Milliseconds between chunks (slower, more readable)
  const CHARS_PER_CHUNK = 2; // Display 2 characters at once = ~100 chars/sec

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
   * Display character chunks from buffer with artificial delay
   * Creates smooth, Claude.ai-style streaming effect
   * Displays multiple characters per update to keep up with fast API token rate
   */
  const displayNextCharacter = useCallback(() => {
    if (characterBufferRef.current.length === 0) {
      isDisplayingRef.current = false;
      displayTimerRef.current = null;
      return;
    }

    // Take chunk of characters from buffer (3 chars at once for better throughput)
    const chunkSize = Math.min(CHARS_PER_CHUNK, characterBufferRef.current.length);
    const nextChunk = characterBufferRef.current.slice(0, chunkSize);
    characterBufferRef.current = characterBufferRef.current.slice(chunkSize);

    // Display chunk immediately (no startTransition - we want synchronous updates)
    setStreamingContent(prev => prev + nextChunk);

    // Schedule next chunk
    displayTimerRef.current = setTimeout(displayNextCharacter, CHAR_DISPLAY_DELAY_MS);
  }, []);

  /**
   * Add new tokens to character buffer and start display loop if not running
   * Tokens are broken into individual characters for smooth streaming
   */
  const bufferTokens = useCallback((newTokens: string) => {
    // Add tokens to buffer
    characterBufferRef.current += newTokens;

    // Start character display loop if not already running
    if (!isDisplayingRef.current && characterBufferRef.current.length > 0) {
      isDisplayingRef.current = true;
      displayTimerRef.current = setTimeout(displayNextCharacter, CHAR_DISPLAY_DELAY_MS);
    }
  }, [displayNextCharacter]);

  /**
   * Flush all buffered content immediately
   * Used when streaming completes or cancels
   */
  const flushAllContent = useCallback(() => {
    // Clear all timers
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    if (displayTimerRef.current) {
      clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
    }

    // Stop display loop
    isDisplayingRef.current = false;

    // Flush character buffer immediately
    let finalContent = '';

    if (characterBufferRef.current) {
      finalContent += characterBufferRef.current;
      characterBufferRef.current = '';
    }

    // Flush pending raw tokens (if any were batched)
    if (pendingTokensRef.current) {
      finalContent += pendingTokensRef.current;
      pendingTokensRef.current = '';
    }

    // Update display immediately (no transition)
    if (finalContent) {
      setStreamingContent(prev => prev + finalContent);
    }
  }, []);

  /**
   * Flush pending tokens immediately to UI (legacy - now calls flushAllContent)
   * Used when streaming completes or cancels
   */
  const flushPendingTokens = useCallback(() => {
    flushAllContent();
  }, [flushAllContent]);

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

              // AC-6.8.1: Process token events with character-by-character display
              // Buffers tokens then displays character-by-character for smooth streaming
              if (event.type === 'token') {
                accumulatedContent += event.content;

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

                // Buffer tokens for character-by-character display
                bufferTokens(event.content);
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
