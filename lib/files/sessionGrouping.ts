/**
 * Session Grouping Utilities
 * Story 6.3: Session Display Names & Chat Context
 *
 * Groups session folders by agent for the directory tree UI.
 * Transforms flat session list into agent-grouped hierarchy.
 */

import type { FileTreeNode } from './treeBuilder';

/**
 * Group session folders by agent title
 *
 * Story 6.3 AC-8: DirectoryTree groups sessions by agent
 * - Creates virtual agent group folders
 * - Sorts sessions by started_at (newest first) within each group
 * - Preserves non-session directories as-is
 *
 * @param rootNode - Root directory tree node
 * @returns Transformed tree with agent grouping
 */
export function groupSessionsByAgent(rootNode: FileTreeNode): FileTreeNode {
  // If not a directory or no children, return as-is
  if (rootNode.type !== 'directory' || !rootNode.children) {
    return rootNode;
  }

  // Separate session folders from regular folders
  const sessionNodes: FileTreeNode[] = [];
  const regularNodes: FileTreeNode[] = [];

  for (const child of rootNode.children) {
    // Session folders have metadata from manifest.json
    if (child.metadata) {
      sessionNodes.push(child);
    } else {
      regularNodes.push(child);
    }
  }

  // If no sessions, return original tree
  if (sessionNodes.length === 0) {
    return rootNode;
  }

  // Group sessions by agent title
  const agentGroups = new Map<string, FileTreeNode[]>();

  for (const session of sessionNodes) {
    // SessionMetadata is SessionManifest, which has agent.title
    const agentTitle = session.metadata!.agent?.title || 'Unknown Agent';

    if (!agentGroups.has(agentTitle)) {
      agentGroups.set(agentTitle, []);
    }
    agentGroups.get(agentTitle)!.push(session);
  }

  // Sort sessions within each group by started_at (newest first)
  for (const [, sessions] of Array.from(agentGroups.entries())) {
    sessions.sort((a: FileTreeNode, b: FileTreeNode) => {
      const aTime = a.metadata?.execution?.started_at
        ? new Date(a.metadata.execution.started_at).getTime()
        : 0;
      const bTime = b.metadata?.execution?.started_at
        ? new Date(b.metadata.execution.started_at).getTime()
        : 0;
      return bTime - aTime; // Newest first
    });
  }

  // Create virtual agent group nodes
  const agentGroupNodes: FileTreeNode[] = [];

  // Sort agent groups alphabetically by title
  const sortedAgents = Array.from(agentGroups.keys()).sort();

  for (const agentTitle of sortedAgents) {
    const sessions = agentGroups.get(agentTitle)!;

    // Create virtual agent group folder
    const groupNode: FileTreeNode = {
      name: agentTitle,
      path: `agent-groups/${agentTitle}`, // Virtual path
      type: 'directory',
      displayName: `▼ ${agentTitle}`,
      children: sessions,
      // Mark as virtual group (for UI detection)
      metadata: {
        version: '1.0.0',
        session_id: `virtual-group-${agentTitle}`,
        agent: {
          name: agentTitle.toLowerCase().replace(/\s+/g, '-'),
          title: agentTitle,
          bundle: 'virtual-group',
        },
        workflow: {
          name: 'virtual-group',
          description: 'Agent group container',
        },
        execution: {
          started_at: new Date().toISOString(),
          status: 'running',
          user: '',
        },
        outputs: [],
        isVirtualGroup: true,
      } as any,
    };

    agentGroupNodes.push(groupNode);
  }

  // Return new root with agent groups + regular folders
  return {
    ...rootNode,
    children: [...agentGroupNodes, ...regularNodes],
  };
}
