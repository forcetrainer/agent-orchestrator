/**
 * Conversation Delete API Endpoint
 * Story 10.3: Conversation List API
 *
 * DELETE /api/conversations/:id - Deletes conversation and session folder
 *
 * Security:
 * - Browser ID from HTTP-only cookie (required)
 * - Returns 400 if browser ID not found
 * - Returns 403/404 if conversation doesn't belong to browser
 * - Deletes conversation from cache and disk (folder removed)
 *
 * Response:
 * - 204 No Content on success (no response body)
 * - 404 Not Found if conversation not found or doesn't belong to browser
 * - 403 Forbidden if browser ID mismatch
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateBrowserId } from '@/lib/utils/browserIdentity';
import { deleteConversation } from '@/lib/utils/conversations';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * DELETE /api/conversations/:id
 * AC-10.3-5: Deletes conversation and session folder
 * AC-10.3-6: Browser ID verified before deletion (403 if mismatch, 404 if not found)
 */
export async function DELETE(
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

    // Delete conversation (includes browser ID verification)
    const success = await deleteConversation(conversationId, browserId);

    if (!success) {
      // Don't leak existence - return 404 for both "not found" and "forbidden"
      return NextResponse.json(
        { error: 'Conversation not found or does not belong to this browser' },
        { status: 404 }
      );
    }

    // AC-10.3-5: Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API] Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
