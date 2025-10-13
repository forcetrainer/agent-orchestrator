'use client';

// components/AgentPickerModal.tsx
// Story 10.4: Conversation Sidebar UI - Agent Picker Modal
// Task 4: Create NewChatButton and AgentPickerModal components (AC: 7)

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { AgentSummary } from '@/types/api';

/**
 * Agent picker modal for selecting agent when creating new conversation.
 *
 * Features:
 * - Fetches available agents from /api/agents endpoint (AC-10.4-7)
 * - Displays agent list with icons, names, titles (AC-10.4-7)
 * - Keyboard navigation: arrow keys, Enter to select, Escape to close (AC-10.4-7)
 * - Loading state with skeleton loaders
 * - Accessible modal using Headless UI Dialog
 *
 * Design System:
 * - Modal backdrop: semi-transparent black/30
 * - Modal panel: bg-white rounded-lg shadow-xl
 * - Selected item: bg-blue-50 border-2 border-cyan-500 (signature cyan accent)
 * - Hover: bg-slate-100
 * - Focus ring: ring-2 ring-cyan-500
 * - Border radius: rounded-lg (8px geometric design system)
 * - Text: font-semibold text-slate-900 for name, text-sm text-slate-600 for title
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback to close modal
 * @param onSelectAgent - Callback when agent is selected (receives agentId)
 */

interface AgentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
}

export function AgentPickerModal({
  isOpen,
  onClose,
  onSelectAgent,
}: AgentPickerModalProps) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch agents when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAgents();
      setSelectedIndex(0); // Reset selection
    }
  }, [isOpen]);

  async function fetchAgents() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error(`Failed to load agents: ${response.statusText}`);
      }
      const result = await response.json();
      // API returns { success: true, data: AgentMetadata[] }
      setAgents(result.data || []);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(agentId: string) {
    console.log('[AgentPickerModal] Agent selected:', agentId);
    onSelectAgent(agentId);
    onClose();
  }

  // Keyboard navigation (AC-10.4-7: arrow keys + Enter)
  function handleKeyDown(e: React.KeyboardEvent) {
    if (loading || agents.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % agents.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + agents.length) % agents.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(agents[selectedIndex].id);
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="mx-auto max-w-md w-full bg-white rounded-lg p-6 shadow-xl"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Choose an Agent
            </Dialog.Title>
            <button
              onClick={onClose}
              className="
                p-1 rounded hover:bg-slate-100 transition-colors
                focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1
              "
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-3" aria-label="Loading agents">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-sm text-red-600 p-4 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {/* Agent List */}
          {!loading && !error && agents.length > 0 && (
            <div
              className="space-y-2 max-h-96 overflow-y-auto"
              role="listbox"
              aria-label="Available agents"
            >
              {agents.map((agent, index) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelect(agent.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-colors
                    ${
                      selectedIndex === index
                        ? 'bg-blue-50 border-2 border-cyan-500'
                        : 'hover:bg-slate-100 border-2 border-transparent'
                    }
                  `}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex items-center gap-3">
                    {/* Agent Icon */}
                    {agent.icon && <span className="text-2xl">{agent.icon}</span>}

                    {/* Agent Info */}
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">
                        {agent.name}
                      </div>
                      <div className="text-sm text-slate-600">{agent.title}</div>
                      {agent.description && (
                        <div className="text-xs text-slate-500 mt-1">
                          {agent.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && agents.length === 0 && (
            <div className="text-sm text-slate-600 p-4 text-center">
              No agents available
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="
                w-full px-4 py-2 text-sm font-medium text-slate-700
                bg-white border border-slate-300 rounded-lg
                hover:bg-slate-50 transition-colors
                focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1
              "
            >
              Cancel
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
