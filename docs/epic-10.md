# Epic 10: Conversation Persistence & Multi-Session Management

**Author:** Bryan (via Sarah - Product Owner)
**Date:** 2025-10-12
**Status:** Planning
**Related Documents:**
- `/docs/epics.md` (Epic breakdown)
- `/docs/backlog.md` (Line 14 - High Priority bug this epic resolves)

---

## Executive Summary

Epic 10 implements server-side conversation persistence with browser-based user identification, enabling users to maintain conversation continuity across browser sessions. Users can manage multiple concurrent conversations organized in a Slack-style sidebar grouped by agent.

**Goal**: Allow users to close the browser and return to find their conversation history intact, with the ability to resume conversations and manage multiple concurrent workflows.

**Impact**:
- Fixes critical bug: in-memory conversation storage lost on server restart/hot-reload
- Enables multi-session workflow management (users can pause one conversation and start another)
- Provides foundation for future enhancements (workflow resumption, conversation search, export)
- Improves user experience with familiar conversation sidebar UI

---

## Problem Statement

Currently, conversations are stored in-memory (`lib/utils/conversations.ts`) and are lost whenever:
1. The Next.js server restarts (intentional or crash)
2. Hot-reload occurs during development
3. The user closes their browser (no way to retrieve conversation)

This creates a **poor user experience** for complex agent workflows that may take hours or days to complete:
- Users cannot pause and resume long-running workflows
- No way to reference previous conversations
- Each server restart creates new session folders (session proliferation bug)
- Users cannot manage multiple concurrent conversations

**Business Impact**: Users are hesitant to start complex workflows knowing they cannot pause/resume.

---

## Proposed Solution

### Core Capabilities

1. **Server-Side Persistence**: Save conversation state to disk in `data/conversations/` folder
2. **Browser Identification**: Use HTTP-only cookies to track browsers (no authentication required for MVP)
3. **Conversation Sidebar**: Slack-style UI organizing conversations by agent
4. **Multi-Session Support**: Users can start and switch between multiple conversations
5. **Context Restoration**: Full message history and session folder context restored on resume

### MVP Boundaries

**What's Included:**
- Full conversation history persistence (messages, agent context, session folders)
- Browser-based identity (cookie tracking)
- Conversation list API and sidebar UI
- Conversation switching with context restoration
- Conversation deletion

**What's NOT Included (Future Enhancements):**
- Workflow mid-execution state preservation (acceptable limitation documented)
- User authentication (cookie-based only)
- Conversation search
- Conversation export
- Cloud sync across devices

---

## Story Breakdown

### Story 10.1: Server-Side Conversation Persistence

**As a** user
**I want** my conversations saved to disk
**So that** they survive server restarts and I can return later

**Prerequisites:** None (foundational story)

**Acceptance Criteria:**
1. Create `data/conversations/` directory for persisted conversations
2. Save conversation to `{conversationId}.json` file on every message
3. Load conversations from disk on server startup
4. Maintain backward compatibility with existing in-memory Map
5. Handle concurrent writes safely (atomic writes)
6. Serialize/deserialize dates correctly (ISO strings)

**Technical Notes:**
- Extend `Conversation` type to include `browserId` field
- Use atomic writes (write to temp file, then rename)
- Debounce writes (500ms) to avoid excessive disk I/O

**Files Affected:**
- `lib/utils/conversations.ts` - Add persistence layer
- `types/index.ts` - Add `browserId` to Conversation type
- `data/conversations/` - New directory for conversation files

---

### Story 10.2: Browser Identity & Session Tracking

**As a** user
**I want** my browser identified without logging in
**So that** my conversations are available when I return

**Prerequisites:** Story 10.1 (persistence layer)

**Acceptance Criteria:**
1. Generate unique browser ID (UUID) on first visit
2. Store browser ID in HTTP-only cookie (`agent_orchestrator_browser_id`)
3. Cookie expiration: 1 year
4. Associate each conversation with browser ID
5. Cookie deletion = data loss (acceptable, documented)
6. No PII stored (GDPR-friendly)

**Technical Notes:**
- Use Next.js cookies API (`cookies()` from `next/headers`)
- Secure flag enabled in production (HTTPS)
- SameSite=Strict for CSRF protection

**Files Affected:**
- `lib/utils/browserIdentity.ts` - New module for browser ID management
- `app/api/chat/route.ts` - Read/set browser cookie
- `types/index.ts` - Update Conversation type with browserId

---

### Story 10.3: Conversation List API

**As a** developer
**I want** API endpoints to retrieve and manage conversations
**So that** the frontend can display conversation history

**Prerequisites:** Story 10.2 (browser identity)

**Acceptance Criteria:**
1. `GET /api/conversations` - List all conversations for current browser
2. Response includes metadata: conversationId, agentId, agentName, lastMessage, timestamp, messageCount
3. Conversations sorted by `updatedAt` (most recent first)
4. Grouped by agentId for frontend consumption
5. `DELETE /api/conversations/:id` - Delete conversation and session folder
6. Verify browser ID matches before returning data (security)

**Technical Notes:**
- Lightweight endpoint (metadata only, not full message history)
- Use `GET /api/conversations/:id/messages` for full conversation load
- Return 404 if conversation doesn't belong to browser

**Files Affected:**
- `app/api/conversations/route.ts` - New endpoint (GET)
- `app/api/conversations/[id]/route.ts` - New endpoint (DELETE)
- `app/api/conversations/[id]/messages/route.ts` - New endpoint (GET)
- `types/api.ts` - Add ConversationMetadata, ConversationListResponse types

---

### Story 10.4: Conversation Sidebar UI

**As a** user
**I want** a sidebar showing my past conversations organized by agent
**So that** I can easily browse and switch between conversations

**Prerequisites:** Story 10.3 (API endpoints)

**Acceptance Criteria:**
1. Left sidebar component showing agent-grouped conversations
2. Structure: Agent (with icon) → Conversations (with preview)
3. Show last message preview (truncated to 40 chars)
4. Show last updated timestamp (relative: "2 hours ago")
5. Highlight active conversation
6. Click conversation → load full history
7. Collapsible agent sections (expand/collapse)
8. "New conversation" button per agent
9. Delete button per conversation (with confirmation modal)

**Design Notes:**
- Similar to Claude.ai sidebar but grouped by agents (Slack-style)
- Fixed position, scrollable conversation list
- Responsive: collapsible on mobile

**Files Affected:**
- `components/ConversationSidebar.tsx` - New component
- `components/AgentConversationGroup.tsx` - New component
- `components/ConversationListItem.tsx` - New component
- `app/page.tsx` - Integrate sidebar into layout
- `app/globals.css` - Sidebar styles

---

### Story 10.5: Conversation Switching & Context Restoration

**As a** user
**I want** to switch between conversations seamlessly
**So that** I can manage multiple workflows simultaneously

**Prerequisites:** Story 10.4 (sidebar UI)

**Acceptance Criteria:**
1. Clicking a conversation loads its full message history
2. Chat input switches to conversation's agent
3. Session folder context restored for file references
4. Scroll to bottom of conversation on load
5. Show loading state during conversation switch
6. Previously attached files remain accessible (via session folder)
7. Cached context (system prompt, critical actions) restored or rebuilt

**Technical Notes:**
- Frontend calls `GET /api/conversations/:id/messages` on click
- Backend returns full `Conversation` object with messages array
- Frontend replaces current conversation state in useStreamingChat

**Files Affected:**
- `components/chat/ChatPanel.tsx` - Handle conversation switching
- `components/chat/useStreamingChat.ts` - Reset state on switch
- `app/api/conversations/[id]/messages/route.ts` - Return full conversation

---

### Story 10.6: Workflow State Limitation Documentation

**As a** user
**I want** clear documentation about workflow limitations
**So that** I understand what happens if I leave during a workflow

**Prerequisites:** Story 10.5 (context restoration)

**Acceptance Criteria:**
1. Document limitation: "Workflows cannot be resumed mid-execution in v1"
2. User can view conversation transcript showing where they left off
3. Starting new message after returning continues as normal chat
4. Optional: Warning banner if user tries to leave during active workflow
5. Documentation includes future enhancement plan (Epic 11: workflow checkpointing)
6. FAQ entry explaining the limitation

**Technical Notes:**
- This is a known MVP limitation, not a bug
- Provides foundation for future workflow resumption feature
- Acceptable trade-off for v1 scope

**Files Affected:**
- `docs/conversation-persistence.md` - New feature documentation
- `docs/FAQ.md` - Add workflow limitation entry
- `components/chat/ChatPanel.tsx` - Optional: workflow exit warning

---

### Story 10.7: Testing & Edge Cases

**As a** developer
**I want** comprehensive tests covering edge cases
**So that** conversation persistence is robust and reliable

**Prerequisites:** All stories 10.1-10.6 complete

**Acceptance Criteria:**
1. Test: Server restart → conversations restored correctly
2. Test: Multiple browsers → separate conversation lists
3. Test: Cookie deletion → new browser ID, fresh start
4. Test: Concurrent conversations → no cross-talk
5. Test: Deleting conversation → session folder also deleted
6. Test: Large conversation (100+ messages) → performance acceptable
7. Test: Invalid conversation ID → 404 error handling
8. Integration tests for persistence layer

**Files Affected:**
- `lib/__tests__/conversations.persistence.test.ts` - New test suite
- `lib/__tests__/browserIdentity.test.ts` - New test suite
- `app/api/conversations/__tests__/route.test.ts` - New test suite

---

## Technical Architecture

### Data Models

```typescript
// Extended Conversation type for persistence
export interface PersistedConversation {
  id: string;
  agentId: string;
  browserId: string; // NEW: Links conversation to browser
  messages: SerializedMessage[]; // Dates as ISO strings
  createdAt: string;
  updatedAt: string;
  sessionId: string;
  sessionFolder: string;
  // cachedContext excluded from persistence (rebuild on load)
}

// Conversation list metadata (lightweight)
export interface ConversationMetadata {
  id: string;
  agentId: string;
  agentName: string;
  agentTitle: string;
  agentIcon?: string;
  lastMessage: string; // First 100 chars
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### File Structure

```
data/
├── agent-outputs/          # Existing session folders
│   ├── {sessionId-1}/
│   └── {sessionId-2}/
├── conversations/          # NEW: Persisted conversations
│   ├── {conversationId-1}.json
│   └── {conversationId-2}.json
└── browser-index.json      # NEW: Browser → Conversations mapping
```

### API Endpoints

```
GET    /api/conversations              → List all conversations for browser
GET    /api/conversations/:id/messages → Full conversation with messages
DELETE /api/conversations/:id          → Delete conversation + session folder
```

---

## Dependencies & Risks

### Dependencies

| Dependency | Status | Impact |
|------------|--------|--------|
| Session manifest system (Story 6.3) | ✅ Complete | High - Foundation for conversation metadata |
| Session folder structure | ✅ Complete | High - 1:1 mapping with conversations |
| In-memory conversation storage | ✅ Exists | Medium - Need to extend with persistence |

**Blocking Dependencies:** None - All infrastructure exists

**Conflicting Work:** Backlog item (line 14) - This epic **IS** the solution. Mark as "Resolved by Epic 10" when starting.

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **File I/O Performance** - Writing on every message | High | High | Debounced writes (500ms), atomic operations, write queue for concurrency |
| **Concurrent Write Conflicts** - Multiple requests updating same conversation | Medium | High | File locking (`proper-lockfile`), retry logic, conversation versioning |
| **Data Loss on Write Failure** - Disk full, permissions | Low | Critical | In-memory fallback, prominent logging, retry failed writes, user alert |
| **Storage Growth** - Unlimited conversations | High | Medium | **MVP**: Document no limit. **Post-MVP**: 90-day retention, compression |
| **Cookie Rejection** - Strict privacy settings | Medium | Medium | Graceful fallback (single-session mode), localStorage secondary fallback, banner prompt |
| **Large Conversation Performance** - Loading 200+ messages | Low | Medium | Message pagination (load last 50), conversation size limits (warn at 500) |

---

## Success Criteria

### Must Have
1. Conversations persist across server restarts
2. Users can close browser and return to find conversation history
3. Sidebar displays conversations organized by agent
4. Users can switch between conversations seamlessly
5. Session folders correctly linked to conversations
6. No security vulnerabilities introduced

### Should Have
1. Performance acceptable for conversations up to 100 messages
2. Debounced writes reduce disk I/O overhead
3. Clear error handling for edge cases
4. Intuitive sidebar UX matching Claude.ai quality

### Nice to Have
1. Conversation deletion includes cascade to session folder
2. Loading states smooth and professional
3. Mobile-responsive sidebar
4. Relative timestamps ("2 hours ago")

---

## Post-MVP Enhancements (Epic 11 - Future)

- Workflow state checkpointing & resumption
- Conversation search (full-text search across messages)
- Conversation export (JSON/Markdown formats)
- User authentication & cloud sync across devices
- Conversation sharing (generate shareable links)
- Advanced management (archive, star, tags, folders)
- Conversation analytics (message count, duration, token usage)

---

## Files Affected Summary

### New Files
- `lib/utils/browserIdentity.ts` - Browser ID management
- `lib/__tests__/conversations.persistence.test.ts` - Persistence tests
- `lib/__tests__/browserIdentity.test.ts` - Browser identity tests
- `app/api/conversations/route.ts` - Conversation list API
- `app/api/conversations/[id]/route.ts` - Conversation delete API
- `app/api/conversations/[id]/messages/route.ts` - Full conversation API
- `components/ConversationSidebar.tsx` - Sidebar component
- `components/AgentConversationGroup.tsx` - Agent grouping component
- `components/ConversationListItem.tsx` - Conversation item component
- `docs/conversation-persistence.md` - Feature documentation

### Modified Files
- `lib/utils/conversations.ts` - Add persistence layer
- `types/index.ts` - Add browserId to Conversation type
- `types/api.ts` - Add ConversationMetadata, ConversationListResponse
- `app/api/chat/route.ts` - Read/set browser cookie
- `components/chat/ChatPanel.tsx` - Handle conversation switching
- `components/chat/useStreamingChat.ts` - Reset state on switch
- `app/page.tsx` - Integrate sidebar into layout

---

## Estimated Effort

**Total Stories:** 7 stories

**Estimated Timeline (Solo Developer):** 3-4 weeks
- Story 10.1 (Persistence): 3-4 days
- Story 10.2 (Browser Identity): 1-2 days
- Story 10.3 (API Endpoints): 2-3 days
- Story 10.4 (Sidebar UI): 4-5 days
- Story 10.5 (Context Restoration): 2-3 days
- Story 10.6 (Documentation): 1 day
- Story 10.7 (Testing): 3-4 days

**Complexity:** Medium-High
- File I/O requires careful error handling
- Concurrent writes need proper locking
- UI complexity (sidebar, switching, state management)

---

## Acceptance Criteria (Epic-Level)

1. ✅ Conversations persist to disk in `data/conversations/` folder
2. ✅ Browser identified via HTTP-only cookie (no authentication)
3. ✅ Sidebar displays conversations grouped by agent
4. ✅ Users can switch between conversations with full context restoration
5. ✅ Conversations survive server restart/hot-reload
6. ✅ Session folders correctly linked to conversations (1:1 mapping)
7. ✅ Conversation deletion includes session folder cleanup
8. ✅ No security vulnerabilities (browser ID verified on all requests)
9. ✅ Performance acceptable for conversations up to 100 messages
10. ✅ Documentation explains workflow limitation (no mid-execution resumption)

---

_This epic resolves the high-priority bug in backlog (line 14) and provides foundation for future workflow resumption capabilities._
