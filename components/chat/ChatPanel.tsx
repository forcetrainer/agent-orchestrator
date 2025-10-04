'use client';

import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
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
 *
 * UX Enhancement: Centers input when no messages (like ChatGPT/Claude.ai),
 * expands to full layout when conversation starts
 */
export function ChatPanel() {
  // Agent selection state - Story 3.4 Task 4.2
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);

  // Message state management - Story 3.2 Task 1.2, 1.3
  const [messages] = useState<Message[]>([
    // Demo messages for testing UI rendering and scrolling (10+ messages for Task 7.2)
    { role: 'user', content: 'Hello! Can you help me understand how this orchestrator works?' },
    { role: 'assistant', content: 'Of course! I\'d be happy to help you understand the agent orchestrator. This system is designed to coordinate multiple AI agents to work together on complex tasks. What specific aspect would you like to learn about?' },
    { role: 'user', content: 'How do I select which agent to use?' },
    { role: 'assistant', content: 'Great question! Agent selection will be covered in the upcoming stories. For now, you can see how messages are displayed in the interface. Each message has a clear visual distinction based on who sent it - you or the assistant.' },
    { role: 'user', content: 'Can you show me more about the message display?' },
    { role: 'assistant', content: 'Sure! Notice how user messages appear on the right in blue, while assistant messages appear on the left in gray. This follows the familiar pattern from ChatGPT and Claude.ai.' },
    { role: 'user', content: 'What about scrolling behavior?' },
    { role: 'assistant', content: 'The message list automatically scrolls to the bottom when new messages arrive. This ensures you always see the latest message without having to manually scroll down.' },
    { role: 'user', content: 'How many messages can I have in a conversation?' },
    { role: 'assistant', content: 'For the MVP, the system is designed to handle up to 100 messages per conversation without pagination. The interface will remain smooth and responsive even with many messages.' },
    { role: 'user', content: 'What about performance?' },
    { role: 'assistant', content: 'The MessageBubble component uses React.memo to prevent unnecessary re-renders, ensuring message rendering completes in under 100ms. Auto-scroll animations complete within 300ms for a smooth user experience.' },
    { role: 'user', content: 'Is the interface accessible?' },
    { role: 'assistant', content: 'Yes! The message list includes aria-live="polite" for screen reader support, and all interactive elements follow accessibility best practices. We\'re committed to making this tool usable for everyone.' },
    { role: 'user', content: 'This is helpful, thanks!' },
    { role: 'assistant', content: 'You\'re welcome! Feel free to explore the interface. Message sending functionality will be added in the next story, so stay tuned!' },
  ]);

  // Handler for agent selection - Story 3.4 Task 4.3
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    // TODO Story 3.5: Reset conversation when agent changes (optional per AC-4.6)
    console.log('[ChatPanel] Agent selected:', agentId);
  };

  // Centered layout before first message (ChatGPT/Claude.ai style)
  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onAgentSelect={handleAgentSelect}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-3xl px-4">
            <MessageInput centered />
          </div>
        </div>
      </div>
    );
  }

  // Full layout after conversation starts - Story 3.2 Task 1.4
  return (
    <div className="flex flex-col h-screen">
      <AgentSelector
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
      />
      <MessageList messages={messages} />
      <MessageInput />
    </div>
  );
}
