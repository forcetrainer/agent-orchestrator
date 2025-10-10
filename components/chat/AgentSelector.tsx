'use client';

/**
 * AgentSelector Component
 *
 * Dropdown selector for choosing an agent from discovered agents.
 * Fetches agent list from GET /api/agents and displays in native select element.
 *
 * Story 3.4: Agent Discovery and Selection Dropdown
 * AC-4.3: Dropdown/selector displays list of agents in UI
 * AC-4.5: Dropdown appears prominently in UI (top of page or sidebar)
 * AC-4.6: Selecting an agent loads it for conversation
 * AC-4.7: System handles empty agents folder gracefully (shows message)
 */

import { useEffect, useState } from 'react';
import { AgentSummary } from '@/types/api';
import { useFileViewer } from '@/components/file-viewer/FileViewerContext';
import { FlintLogo } from '@/components/branding/FlintLogo';

interface AgentSelectorProps {
  /** Currently selected agent ID */
  selectedAgentId?: string;
  /** Callback when agent selection changes - Story 4.6: Now passes full agent data with bundlePath */
  onAgentSelect: (agent: AgentSummary) => void;
  /** Callback when new conversation button is clicked - Story 3.7 */
  onNewConversation?: () => void;
}

export function AgentSelector({
  selectedAgentId,
  onAgentSelect,
  onNewConversation,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, toggle } = useFileViewer();

  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/agents');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load agents');
        }

        if (data.success && Array.isArray(data.data)) {
          setAgents(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('[AgentSelector] Failed to fetch agents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const agentId = event.target.value;
    if (agentId) {
      // Story 4.6 Task 2.5: Find and pass full agent object with bundlePath
      const selectedAgent = agents.find((agent) => agent.id === agentId);
      if (selectedAgent) {
        onAgentSelect(selectedAgent);
      }
    }
  };

  // Loading state - Story 8.1: Slate colors
  if (loading) {
    return (
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {/* Flint Branding */}
          <FlintLogo size="sm" className="flex-shrink-0" />

          <div className="w-px h-8 bg-slate-200" />

          <label
            htmlFor="agent-selector"
            className="text-sm font-medium text-slate-700"
          >
            Select Agent:
          </label>
          <select
            id="agent-selector"
            className="flex-1 rounded-lg border-2 border-slate-300 bg-slate-50 px-4 py-2 text-slate-400 focus:outline-none cursor-wait"
            disabled
          >
            <option>Loading agents...</option>
          </select>
          {onNewConversation && (
            <button
              onClick={onNewConversation}
              className="flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent-hover hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-200 whitespace-nowrap"
              aria-label="Start a new conversation"
              title="Start a new conversation"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Conversation
            </button>
          )}
          {/* Story 6.1: File Viewer Toggle Button (AC-1, AC-2) - Only show when viewer is closed */}
          {!isOpen && (
            <button
              onClick={toggle}
              className="flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent-hover hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-200 whitespace-nowrap"
              aria-label="Open file viewer"
              title="Open file viewer (Ctrl/Cmd + B)"
            >
              {/* Files icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              Files
            </button>
          )}
        </div>
      </div>
    );
  }

  // Error state - Story 8.1: Red semantic colors
  if (error) {
    return (
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {/* Flint Branding */}
          <FlintLogo size="sm" className="flex-shrink-0" />

          <div className="w-px h-8 bg-slate-200" />

          <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-red-700 flex-1">
            <p className="text-sm font-medium">Failed to load agents</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state (AC-4.7) - Story 8.1: Slate colors
  if (agents.length === 0) {
    return (
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {/* Flint Branding */}
          <FlintLogo size="sm" className="flex-shrink-0" />

          <div className="w-px h-8 bg-slate-200" />

          <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 flex-1">
            <p className="text-sm font-medium">No agents available</p>
            <p className="text-xs mt-1">
              Add agent files to the agents folder and restart the server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal state with agents - Story 8.1: Slate colors, cyan focus states
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-4">
        {/* Flint Branding */}
        <FlintLogo size="sm" className="flex-shrink-0" />

        <div className="w-px h-8 bg-slate-200" />

        <label
          htmlFor="agent-selector"
          className="text-sm font-medium text-slate-700 whitespace-nowrap"
        >
          Select Agent:
        </label>
        <select
          id="agent-selector"
          value={selectedAgentId || ''}
          onChange={handleChange}
          className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-30 transition-colors duration-200"
        >
          <option value="">Choose an agent...</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.icon ? `${agent.icon} ` : ''}
              {agent.name} - {agent.title} ({agent.bundleName})
            </option>
          ))}
        </select>
        {/* Story 3.7 Task 1.1-1.6: New Conversation button */}
        {/* AC-7.1: "New Conversation" button visible in UI */}
        {/* AC-7.6: Button is clearly labeled and easy to find */}
        {/* Story 8.1: Secondary button style (white bg, slate border, cyan hover) */}
        {onNewConversation && (
          <button
            onClick={onNewConversation}
            className="flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent-hover hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-200 whitespace-nowrap"
            aria-label="Start a new conversation"
            title="Start a new conversation"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Conversation
          </button>
        )}
        {/* Story 6.1: File Viewer Toggle Button (AC-1, AC-2) - Only show when viewer is closed */}
        {/* Story 8.1: Secondary button style with cyan hover */}
        {!isOpen && (
          <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent-hover hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-200 whitespace-nowrap"
            aria-label="Open file viewer"
            title="Open file viewer (Ctrl/Cmd + B)"
          >
            {/* Files icon */}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Files
          </button>
        )}
      </div>
    </div>
  );
}
