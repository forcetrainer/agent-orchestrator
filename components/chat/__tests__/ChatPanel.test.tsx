/**
 * ChatPanel Component Tests
 * Story 3.1, Story 3.2, Story 3.5, Story 3.6 - Updated for loading indicator
 *
 * Tests layout, state management, and component integration
 * AC-1.1 through AC-1.4: Layout tests
 * AC-2.1 through AC-2.4: Message state management
 * AC-5.1 through AC-5.8: Message send functionality (Story 3.5)
 * AC-6.1 through AC-6.6: Loading indicator functionality (Story 3.6)
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from '../ChatPanel';

// Mock scrollTo for JSDOM environment
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn();
});

// Mock fetch for AgentSelector
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [{ id: 'test-agent', name: 'Test Agent', title: 'Test' }],
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
              data: [{ id: 'test-agent', name: 'Test Agent', title: 'Test' }],
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
              data: [{ id: 'test-agent', name: 'Test Agent', title: 'Test' }],
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
              data: [{ id: 'test-agent', name: 'Test Agent', title: 'Test' }],
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
              data: [{ id: 'test-agent', name: 'Test Agent', title: 'Test' }],
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
});
