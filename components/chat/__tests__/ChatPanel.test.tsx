/**
 * ChatPanel Component Tests
 * Story 3.1, Story 3.2, Story 3.5, Story 3.6, Story 3.7
 *
 * Tests layout, state management, and component integration
 * AC-1.1 through AC-1.4: Layout tests
 * AC-2.1 through AC-2.4: Message state management
 * AC-5.1 through AC-5.8: Message send functionality (Story 3.5)
 * AC-6.1 through AC-6.6: Loading indicator functionality (Story 3.6)
 * AC-7.1 through AC-7.6: New Conversation / Reset functionality (Story 3.7)
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from '../ChatPanel';

// Mock scrollTo for JSDOM environment
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn();
});

// Mock fetch for AgentSelector
// Story 4.6: Updated to include bundle metadata fields
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [{
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test',
        bundleName: 'test-bundle',
        bundlePath: 'bundles/test-bundle',
        filePath: 'bundles/test-bundle/agents/test-agent.md',
      }],
    }),
  })
) as jest.Mock;

describe('ChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Story 3.5: Starts with empty messages array
  it('renders centered layout when no messages exist', () => {
    const { container } = render(<ChatPanel />);
    const chatPanel = container.firstChild as HTMLElement;

    // Should show centered layout (bg-gray-50 indicates centered mode)
    expect(chatPanel).toHaveClass('flex', 'flex-col', 'h-screen', 'bg-gray-50');
  });

  // Story 3.1: Layout test
  it('applies full-screen height to layout', () => {
    const { container } = render(<ChatPanel />);
    const chatPanel = container.firstChild as HTMLElement;
    expect(chatPanel).toHaveClass('h-screen');
  });

  // Story 3.5: InputField component rendered
  it('renders InputField component', () => {
    render(<ChatPanel />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea).toBeInTheDocument();
  });

  // Story 3.4: Agent selector rendered
  it('renders AgentSelector component', () => {
    render(<ChatPanel />);

    // AgentSelector should be present (look for the container)
    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  // Story 3.5: Initializes with empty messages
  it('initializes with empty messages array', () => {
    render(<ChatPanel />);

    // No MessageList should be rendered when messages are empty (centered layout instead)
    const messageHistory = screen.queryByRole('log', { name: /message history/i });
    expect(messageHistory).not.toBeInTheDocument();
  });

  /**
   * Story 3.6 - Task 6: Integration tests for loading state
   * AC-6.1 through AC-6.6: Loading indicator behavior
   */
  describe('Loading indicator integration', () => {
    // Subtask 6.1, 6.2: Test loading indicator appears after send with delayed response
    it('shows loading indicator after sending message', async () => {
      const user = userEvent.setup();

      // Mock slow API response (2 second delay)
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  data: {
                    message: {
                      id: 'msg-1',
                      content: 'Test response',
                      timestamp: new Date().toISOString(),
                    },
                    conversationId: 'conv-1',
                  },
                }),
              });
            }, 2000);
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Wait for agents to load
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });

      // Select agent
      await user.selectOptions(agentSelect, 'test-agent');

      // Wait for agent selection to complete
      await waitFor(() => {
        expect(agentSelect).toHaveValue('test-agent');
      });

      // Type and send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Subtask 6.2: Loading indicator should appear
      await waitFor(() => {
        expect(screen.getByText(/Agent is thinking/i)).toBeInTheDocument();
      });
    }, 10000);

    // Subtask 6.3: Test loading indicator visible during delay
    it('loading indicator stays visible during API delay', async () => {
      const user = userEvent.setup();

      // Mock API with 2s delay
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  data: {
                    message: {
                      id: 'msg-1',
                      content: 'Response',
                      timestamp: new Date().toISOString(),
                    },
                  },
                }),
              });
            }, 2000);
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Wait for agents to load
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });

      // Select agent
      await user.selectOptions(agentSelect, 'test-agent');
      await waitFor(() => {
        expect(agentSelect).toHaveValue('test-agent');
      });

      // Send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Test');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Verify loading indicator is present after 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(screen.getByText(/Agent is thinking/i)).toBeInTheDocument();
    }, 10000);

    // Subtask 6.4: Test loading indicator disappears when response arrives
    it('loading indicator disappears when agent response arrives', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                message: {
                  id: 'msg-1',
                  content: 'Response',
                  timestamp: new Date().toISOString(),
                },
              },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Wait for agents to load
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });

      // Select agent
      await user.selectOptions(agentSelect, 'test-agent');
      await waitFor(() => {
        expect(agentSelect).toHaveValue('test-agent');
      });

      // Send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Test');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for response and verify loading indicator is gone
      await waitFor(() => {
        expect(screen.queryByText(/Agent is thinking/i)).not.toBeInTheDocument();
      });
    });

    // Subtask 6.5: Test loading indicator disappears on API error
    it('loading indicator disappears on API error', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Server error' }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Wait for agents to load
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });

      // Select agent
      await user.selectOptions(agentSelect, 'test-agent');
      await waitFor(() => {
        expect(agentSelect).toHaveValue('test-agent');
      });

      // Send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Test');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait and verify loading indicator is removed after error
      await waitFor(() => {
        expect(screen.queryByText(/Agent is thinking/i)).not.toBeInTheDocument();
      });
    });

    // Subtask 6.6: Test no loading indicator when not loading
    it('does not show loading indicator when not loading', () => {
      render(<ChatPanel />);

      // Loading indicator should not be present
      expect(screen.queryByText(/Agent is thinking/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Story 3.7 - Task 5: Unit tests for reset functionality
   * AC-7.1 through AC-7.6: New Conversation / Reset functionality
   */
  describe('New Conversation / Reset functionality', () => {
    // Subtask 5.1: Test handleNewConversation clears messages array
    // AC-7.2: Clicking button clears chat history
    it('clears messages when New Conversation button is clicked', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                message: {
                  id: 'msg-1',
                  content: 'Response',
                  timestamp: new Date().toISOString(),
                },
                conversationId: 'conv-1',
              },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Wait for agents and select one
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send a message to create conversation history
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for response to appear
      await waitFor(() => {
        expect(screen.getByText('Response')).toBeInTheDocument();
      });

      // Click New Conversation button
      const newConvButton = screen.getByRole('button', { name: /start a new conversation/i });
      await user.click(newConvButton);

      // Messages should be cleared (back to centered layout)
      await waitFor(() => {
        expect(screen.queryByText('Response')).not.toBeInTheDocument();
        expect(screen.queryByText('Hello')).not.toBeInTheDocument();
      });
    });

    // AC-7.1, AC-7.6: Button is visible and clearly labeled
    it('renders New Conversation button with clear label', async () => {
      render(<ChatPanel />);

      // Wait for agents to load
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });

      // Button should be visible
      const button = screen.getByRole('button', { name: /start a new conversation/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(/new conversation/i);
    });

    // Subtask 5.4: Test isLoading is reset to false
    it('resets loading state when New Conversation is clicked during loading', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          // Simulate slow response (never resolves for this test)
          return new Promise(() => {});
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Wait for agents and select one
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send message to trigger loading state
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Test');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Verify loading indicator appears
      await waitFor(() => {
        expect(screen.getByText(/Agent is thinking/i)).toBeInTheDocument();
      });

      // Click New Conversation to reset
      const newConvButton = screen.getByRole('button', { name: /start a new conversation/i });
      await user.click(newConvButton);

      // Loading indicator should disappear
      await waitFor(() => {
        expect(screen.queryByText(/Agent is thinking/i)).not.toBeInTheDocument();
      });
    });

    // Subtask 5.5: Test input focus is triggered
    // AC-7.4: Input field remains focused and ready for new message
    it('focuses input field after reset', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                message: {
                  id: 'msg-1',
                  content: 'Response',
                  timestamp: new Date().toISOString(),
                },
              },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Wait for agents and select one
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send a message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Response')).toBeInTheDocument();
      });

      // Click New Conversation
      const newConvButton = screen.getByRole('button', { name: /start a new conversation/i });
      await user.click(newConvButton);

      // Input should be focused (check active element)
      await waitFor(() => {
        const textareaAfterReset = screen.getByPlaceholderText(/type your message/i);
        expect(document.activeElement).toBe(textareaAfterReset);
      });
    });

    // AC-7.6: Button is easy to find (accessibility)
    it('New Conversation button is keyboard accessible', async () => {
      const user = userEvent.setup();

      render(<ChatPanel />);

      // Wait for agents to load
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });

      // Button should be accessible via keyboard (focusable)
      const button = screen.getByRole('button', { name: /start a new conversation/i });
      button.focus();
      expect(document.activeElement).toBe(button);

      // Can be activated with keyboard
      await user.keyboard('{Enter}');
      // Should execute (no errors thrown)
    });
  });

  /**
   * Story 3.8 - Task 7: Integration tests for error scenarios
   * AC-8.1 through AC-8.7: Error handling behavior
   */
  describe('Error handling integration', () => {
    // Task 7.1: Simulate network failure → verify "Connection failed" message
    // AC-8.4: Network errors show "Connection failed - please try again"
    it('displays connection failed message on network error', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/agent/initialize') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { greeting: 'Hello!' },
            }),
          });
        }
        if (url === '/api/chat') {
          // Simulate network failure (fetch TypeError)
          return Promise.reject(new TypeError('Failed to fetch'));
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Select agent
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // AC-8.1: Error message appears in chat
      // AC-8.4: Network errors show "Connection failed - please try again"
      await waitFor(() => {
        expect(screen.getByText('Connection failed - please try again')).toBeInTheDocument();
      });

      // AC-8.2: Error message has warning styling
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });

    // Task 7.2: Mock 500 server error → verify server error message
    it('displays server error message on 500 response', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          // Simulate 500 server error
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'OpenAI API error: rate limit exceeded' }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Select agent
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // AC-8.1, AC-8.3, AC-8.5: Error message appears with plain language
      // Rate limit errors take precedence over generic OpenAI errors
      await waitFor(() => {
        expect(screen.getByText('Service is experiencing high demand. Please try again in a moment.')).toBeInTheDocument();
      });
    });

    // Task 7.3: Mock agent not found (404) → verify agent selection error message
    it('displays agent not found message on 404 response', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          // Simulate 404 agent not found (no specific error message)
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: () => Promise.resolve({}),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Select agent
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // AC-8.1, AC-8.3: Error message appears for 404
      await waitFor(() => {
        expect(screen.getByText('Selected agent could not be found. Please try selecting a different agent.')).toBeInTheDocument();
      });
    });

    // Task 7.4: Mock OpenAI rate limit error → verify rate limit message
    // AC-8.5: Agent errors show agent-specific error information
    it('displays rate limit message on OpenAI rate limit error', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          // Simulate OpenAI rate limit error
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'OpenAI rate limit exceeded' }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Select agent
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // AC-8.5: Error message shows service-specific error (rate limit)
      await waitFor(() => {
        expect(screen.getByText('Service is experiencing high demand. Please try again in a moment.')).toBeInTheDocument();
      });
    });

    // Task 7.5: Test recovery - send message → error → send new message → success
    // AC-8.6: User can still send new messages after error
    // AC-8.7: Errors don't crash the interface
    it('allows sending new message after error (error recovery)', async () => {
      const user = userEvent.setup();

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/agent/initialize') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { greeting: 'Hello!' },
            }),
          });
        }
        if (url === '/api/chat') {
          callCount++;
          if (callCount === 1) {
            // First call fails
            return Promise.reject(new TypeError('Failed to fetch'));
          } else {
            // Second call succeeds
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  message: {
                    id: 'msg-1',
                    role: 'assistant',
                    content: 'Success!',
                    timestamp: new Date().toISOString(),
                  },
                  conversationId: 'conv-1',
                },
              }),
            });
          }
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Select agent
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.queryByText('Hello!')).toBeInTheDocument();
      });

      // Send first message (will fail)
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'First message');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Error message appears
      await waitFor(() => {
        expect(screen.getByText('Connection failed - please try again')).toBeInTheDocument();
      });

      // AC-8.6, AC-8.7: User can still send new messages after error
      // Wait for input to be enabled before trying to use it
      await waitFor(() => {
        expect(textarea).not.toBeDisabled();
        expect(sendButton).not.toBeDisabled();
      });
      // Manually clear textarea for test
      fireEvent.change(textarea, { target: { value: '' } });
      await new Promise(resolve => setTimeout(resolve, 10));

      // Input should not be disabled - can send new message
      await user.type(textarea, 'Second message');
      await user.click(sendButton);

      // Second message succeeds
      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });

      // Both user messages and error should be in history
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Connection failed - please try again')).toBeInTheDocument();
    });

    // Task 7.6: Test multiple consecutive errors don't break UI
    // AC-8.7: Errors don't crash the interface
    it('handles multiple consecutive errors without crashing', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/agent/initialize') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { greeting: 'Hello!' },
            }),
          });
        }
        if (url === '/api/chat') {
          // Always fail
          return Promise.reject(new TypeError('Failed to fetch'));
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Select agent
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send multiple messages that all fail
      const textarea = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // First error
      await user.type(textarea, 'Message 1');
      await user.click(sendButton);
      await waitFor(() => {
        expect(screen.getAllByText('Connection failed - please try again').length).toBeGreaterThan(0);
      });
      await waitFor(() => expect(textarea).not.toBeDisabled());

      // Manually clear textarea for test (InputField auto-clears via setValue but tests need explicit clear)
      fireEvent.change(textarea, { target: { value: '' } });
      // Small delay to let React process the change event
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second error
      await user.type(textarea, 'Message 2');
      await user.click(sendButton);
      await waitFor(() => {
        expect(screen.getAllByText('Connection failed - please try again').length).toBe(2);
      });
      await waitFor(() => expect(textarea).not.toBeDisabled());

      // Manually clear textarea for test
      fireEvent.change(textarea, { target: { value: '' } });
      await new Promise(resolve => setTimeout(resolve, 10));

      // Third error
      await user.type(textarea, 'Message 3');
      await user.click(sendButton);
      await waitFor(() => {
        expect(screen.getAllByText('Connection failed - please try again').length).toBe(3);
      });
      await waitFor(() => expect(textarea).not.toBeDisabled());

      // AC-8.7: UI should not crash - all messages and errors visible
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
      expect(screen.getByText('Message 3')).toBeInTheDocument();
    });

    // Task 6.4: Test isLoading resets to false on error
    it('resets loading state on error', async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/agent/initialize') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { greeting: 'Hello!' },
            }),
          });
        }
        if (url === '/api/chat') {
          return Promise.reject(new TypeError('Failed to fetch'));
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Select agent
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.queryByText('Hello!')).toBeInTheDocument();
      });

      // Send message
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Error message appears
      await waitFor(() => {
        expect(screen.getByText('Connection failed - please try again')).toBeInTheDocument();
      });

      // Loading indicator should NOT be visible (isLoading reset to false)
      expect(screen.queryByText(/Agent is thinking/i)).not.toBeInTheDocument();

      // Input should be enabled (not disabled)
      expect(textarea).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();
    });

    // Task 6.6: Test error doesn't corrupt messages array or crash component
    it('preserves message history when error occurs', async () => {
      const user = userEvent.setup();

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/agents') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [{
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test',
                bundleName: 'test-bundle',
                bundlePath: 'bundles/test-bundle',
                filePath: 'bundles/test-bundle/agents/test-agent.md',
              }],
            }),
          });
        }
        if (url === '/api/chat') {
          callCount++;
          if (callCount === 1) {
            // First call succeeds
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  message: {
                    id: 'msg-1',
                    role: 'assistant',
                    content: 'First response',
                    timestamp: new Date().toISOString(),
                  },
                  conversationId: 'conv-1',
                },
              }),
            });
          } else {
            // Second call fails
            return Promise.reject(new TypeError('Failed to fetch'));
          }
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as jest.Mock;

      render(<ChatPanel />);

      // Select agent
      const agentSelect = screen.getByRole('combobox');
      await waitFor(() => {
        const option = screen.queryByRole('option', { name: /test agent/i });
        expect(option).toBeInTheDocument();
      });
      await user.selectOptions(agentSelect, 'test-agent');

      // Send first message (succeeds)
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, 'First message');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('First response')).toBeInTheDocument();
      });
      await waitFor(() => expect(textarea).not.toBeDisabled());

      // Manually clear textarea for test
      fireEvent.change(textarea, { target: { value: '' } });
      await new Promise(resolve => setTimeout(resolve, 10));

      // Send second message (fails)
      await user.type(textarea, 'Second message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Connection failed - please try again')).toBeInTheDocument();
      });

      // Previous messages should still be visible (messages array not corrupted)
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('First response')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });
  });
});
