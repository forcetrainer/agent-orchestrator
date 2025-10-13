/**
 * Conversation List API Endpoint
 * Story 10.3: Conversation List API
 *
 * GET /api/conversations - Returns all conversations for the current browser
 *
 * Response format:
 * {
 *   conversations: ConversationMetadata[], // Sorted by updatedAt descending
 *   groupedByAgent: Record<string, ConversationMetadata[]> // Grouped by agentId
 * }
 *
 * Security:
 * - Browser ID from HTTP-only cookie (required)
 * - Returns 400 if browser ID not found
 * - Filters conversations by browser ID ownership
 */

import { NextResponse } from 'next/server';
import { getOrCreateBrowserId } from '@/lib/utils/browserIdentity';
import { loadConversationsForBrowser } from '@/lib/utils/conversations';
import type { ConversationListResponse, ConversationMetadata } from '@/types/api';

/**
 * GET /api/conversations
 * AC-10.3-1: Returns all conversations for current browser
 * AC-10.3-2: Response includes metadata (conversationId, agentId, agentName, lastMessage, timestamp, messageCount)
 * AC-10.3-3: Conversations sorted by updatedAt (most recent first)
 * AC-10.3-4: Conversations grouped by agentId for frontend consumption
 */
export async function GET() {
  try {
    // Get browser ID from cookie (required)
    const browserId = getOrCreateBrowserId();

    if (!browserId) {
      return NextResponse.json(
        { error: 'Browser ID not found' },
        { status: 400 }
      );
    }

    // Load all conversations for this browser
    const conversations = await loadConversationsForBrowser(browserId);

    // Map to metadata (exclude full message content for performance)
    const metadata: ConversationMetadata[] = conversations.map((conv) => ({
      id: conv.id,
      agentId: conv.agentId,
      agentName: conv.agentTitle || conv.agentId, // Fallback to agentId
      agentTitle: conv.agentTitle,
      agentIcon: getAgentIcon(conv.agentId), // Helper function
      lastMessage: conv.userSummary || '', // First message preview
      messageCount: conv.messageCount,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    // AC-10.3-3: Sort by updatedAt descending (most recent first)
    metadata.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // AC-10.3-4: Group by agentId for frontend sidebar
    const groupedByAgent = metadata.reduce((acc, conv) => {
      if (!acc[conv.agentId]) {
        acc[conv.agentId] = [];
      }
      acc[conv.agentId].push(conv);
      return acc;
    }, {} as Record<string, ConversationMetadata[]>);

    const response: ConversationListResponse = {
      conversations: metadata,
      groupedByAgent,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error loading conversations:', error);
    return NextResponse.json(
      { error: 'Failed to load conversations' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get agent icon for display
 * Maps agent IDs to emoji icons
 *
 * @param agentId - Agent identifier
 * @returns Emoji string or undefined
 */
function getAgentIcon(agentId: string): string | undefined {
  // Common agent icon mapping
  const iconMap: Record<string, string> = {
    'chat': '💬',
    'architect': '🏗️',
    'spec': '📋',
    'dev': '💻',
    'review': '🔍',
    'test': '🧪',
  };

  // Try exact match first
  if (iconMap[agentId]) {
    return iconMap[agentId];
  }

  // Try partial match (e.g., "bmad/bmm/agents/architect" -> "architect")
  const agentName = agentId.split('/').pop() || agentId;
  return iconMap[agentName];
}
