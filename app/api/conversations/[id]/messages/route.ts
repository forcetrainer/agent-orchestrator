/**
 * Conversation Messages API Endpoint
 * Story 10.3: Conversation List API
 *
 * GET /api/conversations/:id/messages - Returns full conversation with messages and files
 *
 * Response format: ConversationDetailResponse
 * - Full conversation object (PersistedConversation)
 * - Files array with metadata from conversation folder
 *
 * Security:
 * - Browser ID from HTTP-only cookie (required)
 * - Returns 400 if browser ID not found
 * - Returns 403 if conversation.browserId doesn't match cookie
 * - Returns 404 if conversation not found
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateBrowserId } from '@/lib/utils/browserIdentity';
import { getConversationAsync, listConversationFiles } from '@/lib/utils/conversations';
import type { ConversationDetailResponse } from '@/types/api';
import { PersistedConversation } from '@/types';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/conversations/:id/messages
 * AC-10.3-1: Returns full conversation with messages
 * AC-10.3-6: Browser ID verified before returning data (403 if mismatch, 404 if not found)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: conversationId } = params;

    // Get browser ID from cookie
    const browserId = getOrCreateBrowserId();

    if (!browserId) {
      return NextResponse.json(
        { error: 'Browser ID not found' },
        { status: 400 }
      );
    }

    // Load conversation from cache or disk
    // Note: getConversationAsync expects agentId but we don't have it here
    // We need to load directly from disk instead
    const conversation = await loadConversationDirect(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // AC-10.3-6: Security check - Verify browser ID matches
    if (conversation.browserId !== browserId) {
      return NextResponse.json(
        { error: 'Forbidden: Conversation does not belong to this browser' },
        { status: 403 }
      );
    }

    // List files in conversation folder (agent outputs)
    const files = await listConversationFiles(conversationId);

    const response: ConversationDetailResponse = {
      ...conversation,
      files,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error loading conversation:', error);
    return NextResponse.json(
      { error: 'Failed to load conversation' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Load conversation directly from disk
 * Bypasses the getConversationAsync agentId requirement
 *
 * @param conversationId - Conversation ID to load
 * @returns PersistedConversation or null if not found
 */
async function loadConversationDirect(conversationId: string): Promise<PersistedConversation | null> {
  try {
    const fs = require('fs/promises');
    const path = require('path');
    const { env } = require('@/lib/utils/env');

    const filePath = path.join(env.OUTPUT_PATH, conversationId, 'conversation.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const conversation: PersistedConversation = JSON.parse(data);
    return conversation;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
