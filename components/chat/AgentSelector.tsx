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
import { Agent } from '@/types';

interface AgentSelectorProps {
  /** Currently selected agent ID */
  selectedAgentId?: string;
  /** Callback when agent selection changes */
  onAgentSelect: (agentId: string) => void;
}

export function AgentSelector({
  selectedAgentId,
  onAgentSelect,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      onAgentSelect(agentId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <label
            htmlFor="agent-selector"
            className="text-sm font-medium text-gray-700"
          >
            Select Agent:
          </label>
          <select
            id="agent-selector"
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-400 focus:outline-none cursor-wait"
            disabled
          >
            <option>Loading agents...</option>
          </select>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p className="text-sm font-medium">Failed to load agents</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state (AC-4.7)
  if (agents.length === 0) {
    return (
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600">
            <p className="text-sm font-medium">No agents available</p>
            <p className="text-xs mt-1">
              Add agent files to the agents folder and restart the server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal state with agents
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <label
          htmlFor="agent-selector"
          className="text-sm font-medium text-gray-700 whitespace-nowrap"
        >
          Select Agent:
        </label>
        <select
          id="agent-selector"
          value={selectedAgentId || ''}
          onChange={handleChange}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose an agent...</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.icon ? `${agent.icon} ` : ''}
              {agent.name} - {agent.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
