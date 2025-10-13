# Technical Specification: Conversation Persistence & Multi-Session Management

Date: 2025-10-12
Author: Bryan (via Winston - System Architect)
Epic ID: 10
Status: Draft

---

## Overview

Epic 10 implements server-side conversation persistence with browser-based user identification, enabling users to maintain conversation continuity across browser sessions and server restarts. Currently, conversations are stored in-memory and lost on server restart or hot-reload, creating a poor user experience for complex agent workflows. This epic resolves the critical bug by persisting conversations to disk in a unified `data/conversations/` directory structure, introducing browser cookie-based identity tracking, and providing a Slack-style conversation sidebar UI for multi-session management.

The implementation follows a **unified architecture approach** (Story 10.0) that consolidates session folders and conversation persistence into a single location, eliminating the fragmentation of having conversation messages in one place and agent outputs in another. This technical specification details the architecture, data models, APIs, security considerations, and implementation sequence for delivering conversation persistence across 8 stories over 3-4 weeks.

## Objectives and Scope

**In Scope:**
- Server-side persistence of full conversation history (messages, metadata, timestamps)
- Browser identification via HTTP-only cookies (no authentication required for MVP)
- Unified directory structure: `data/conversations/{conversationId}/` containing both conversation.json and agent outputs
- Conversation list REST API (`GET /api/conversations`, `DELETE /api/conversations/:id`)
- Slack-style conversation sidebar UI grouped by agent
- Conversation switching with full context restoration
- Session folder cleanup on conversation deletion
- Migration tooling for existing sessions
- Atomic writes with debouncing to prevent data corruption

**Out of Scope (Post-MVP):**
- Workflow mid-execution state preservation (Epic 11)
- User authentication and multi-user support (cookie-based identity only)
- Conversation search and full-text indexing
- Conversation export (JSON/Markdown)
- Cloud sync across devices
- Conversation analytics and reporting

**Success Criteria:**
- Conversations survive server restarts and hot-reload
- Users can close browser and return to find conversation history intact
- Multiple concurrent conversations can be managed seamlessly
- No security vulnerabilities introduced (browser ID verified on all requests)
- Performance acceptable for conversations up to 100 messages
- All files related to a conversation co-located in single folder

## System Architecture Alignment

**Alignment with Current Architecture:**

Epic 10 extends the existing session management system (Story 6.3) by adding persistence and unifying the directory structure. The current architecture already includes:
- Session folders at `data/agent-outputs/{sessionId}/` with `manifest.json` (created by `lib/sessions/chatSessions.ts`)
- In-memory conversation storage via `lib/utils/conversations.ts` (Map-based)
- Path validation security layer via `lib/pathResolver.ts`
- File writing utilities via `lib/files/writer.ts`

**Architectural Changes:**

1. **Directory Unification (Story 10.0):** Rename `data/agent-outputs/` → `data/conversations/` and enforce `conversationId === sessionId` (1:1 relationship)
2. **Type System Consolidation:** Merge `Conversation` type and `SessionManifest` type into unified `PersistedConversation` interface
3. **Persistence Layer:** Extend `lib/utils/conversations.ts` with disk I/O (atomic writes, debouncing, read-through cache)
4. **Browser Identity Module:** New `lib/utils/browserIdentity.ts` for cookie-based tracking
5. **REST API Layer:** New API routes for conversation listing, retrieval, and deletion
6. **Frontend Integration:** New React components for conversation sidebar and switching

**Design Principles:**
- **Single Source of Truth:** All conversation data in one folder (`conversations/{id}/`)
- **Security First:** Path validation prevents writes outside conversations folder; browser ID verified on all API requests
- **Performance:** Read-through caching, debounced writes (500ms), atomic file operations
- **Backward Compatibility:** Migration script preserves existing sessions without data loss
- **User Experience:** Co-located files improve file viewer UX; Slack-style sidebar provides familiar interaction pattern

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner Story |
|--------|---------------|--------|---------|-------------|
| **`lib/utils/conversations.ts`** | Conversation lifecycle management with persistence | conversationId, agentId, browserId, messages | Persisted conversation, cached conversation | Story 10.1 |
| **`lib/utils/browserIdentity.ts`** | Browser identification via cookies | HTTP request/response | browserId (UUID) | Story 10.2 |
| **`lib/sessions/chatSessions.ts`** | Session folder creation (unified with conversations) | agentId, firstMessage, userName | sessionId, sessionFolder path | Story 10.0 |
| **`lib/pathResolver.ts`** | Path validation and security enforcement | file path, context | validated path or SecurityError | Story 10.0 |
| **`app/api/conversations/route.ts`** | Conversation list API endpoint | browserId (from cookie) | ConversationMetadata[] | Story 10.3 |
| **`app/api/conversations/[id]/route.ts`** | Single conversation operations (DELETE) | conversationId, browserId | 204 No Content or 404 | Story 10.3 |
| **`app/api/conversations/[id]/messages/route.ts`** | Full conversation retrieval | conversationId, browserId | PersistedConversation | Story 10.3 |
| **`components/ConversationSidebar.tsx`** | Sidebar UI container | conversations (from API) | User interaction events | Story 10.4 |
| **`components/AgentConversationGroup.tsx`** | Agent grouping logic | conversations grouped by agentId | Collapsible agent sections | Story 10.4 |
| **`components/ConversationListItem.tsx`** | Individual conversation item | ConversationMetadata | Click/delete events | Story 10.4 |
| **`components/chat/useStreamingChat.ts`** | Chat state management hook | conversationId, messages | Chat state, message handlers | Story 10.5 |
| **`scripts/migrate-sessions.js`** | One-time migration utility | data/agent-outputs folder | data/conversations folder | Story 10.0 |

**Module Dependencies:**
- `conversations.ts` depends on `browserIdentity.ts` for browser tracking
- API routes depend on `conversations.ts` for data access
- Frontend components depend on API routes for data fetching
- `chatSessions.ts` depends on `pathResolver.ts` for secure folder creation

### Data Models and Contracts

**Core Type: PersistedConversation**
```typescript
// types/index.ts
export interface PersistedConversation {
  // Identity (conversationId === sessionId, 1:1 relationship)
  id: string;                      // UUID v4
  browserId: string;               // UUID v4, links to browser cookie

  // Agent context
  agentId: string;                 // e.g., "winston-architect"
  agentTitle: string;              // e.g., "System Architect"
  agentBundle: string;             // e.g., "chat", "requirements"

  // Message history (serialized for JSON persistence)
  messages: SerializedMessage[];   // All conversation messages

  // Metadata (from SessionManifest)
  userSummary: string;             // First message truncated to 35 chars
  messageCount: number;            // Total message count
  displayName: string;             // Cached display name (e.g., "4:11p - integration-request")
  displayTimestamp: string;        // Cached timestamp (e.g., "4:11p")

  // Folder reference
  folderPath: string;              // Relative path: "conversations/{id}"

  // Timestamps (ISO 8601 strings for JSON serialization)
  createdAt: string;               // Conversation start time
  updatedAt: string;               // Last message time

  // Status tracking
  status: 'running' | 'completed'; // Conversation lifecycle state
  user: string;                    // User who initiated (from config)
}

export interface SerializedMessage {
  id: string;                      // UUID v4
  role: 'user' | 'assistant' | 'system';
  content: string;                 // Message text content
  timestamp: string;               // ISO 8601 format
}
```

**API Response Types:**
```typescript
// types/api.ts
export interface ConversationMetadata {
  id: string;
  agentId: string;
  agentName: string;
  agentTitle: string;
  agentIcon?: string;              // Optional emoji/icon
  lastMessage: string;             // Truncated to 100 chars
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationListResponse {
  conversations: ConversationMetadata[];
  groupedByAgent: Record<string, ConversationMetadata[]>;
}

export interface ConversationDetailResponse extends PersistedConversation {
  files: FileMetadata[];           // Agent outputs in folder
}

export interface FileMetadata {
  name: string;
  path: string;                    // Relative to project root
  size: number;
  mimeType: string;
}
```

**Browser Cookie Schema:**
```typescript
// HTTP-only cookie
{
  name: "agent_orchestrator_browser_id",
  value: string,                   // UUID v4
  httpOnly: true,                  // Prevents XSS access
  secure: true,                    // HTTPS only (production)
  sameSite: "Strict",              // CSRF protection
  maxAge: 31536000,                // 1 year (seconds)
  path: "/"
}
```

**File System Schema:**
```
data/conversations/{conversationId}/
├── conversation.json              # PersistedConversation (full conversation)
├── output-001-file.md            # Agent-generated outputs
├── output-002-data.json
└── attachments/                   # User uploads (future)
```

### APIs and Interfaces

**REST API Endpoints:**

**1. GET /api/conversations**
- **Purpose:** List all conversations for current browser
- **Authentication:** Browser ID from cookie
- **Request:**
  ```
  GET /api/conversations
  Cookie: agent_orchestrator_browser_id={uuid}
  ```
- **Response (200 OK):**
  ```json
  {
    "conversations": [
      {
        "id": "abc-123",
        "agentId": "winston-architect",
        "agentName": "Winston",
        "agentTitle": "System Architect",
        "agentIcon": "🏗️",
        "lastMessage": "Review the architecture for...",
        "messageCount": 12,
        "createdAt": "2025-10-12T20:11:58.354Z",
        "updatedAt": "2025-10-12T20:14:04.687Z"
      }
    ],
    "groupedByAgent": {
      "winston-architect": [...]
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` - Missing or invalid browser ID cookie
  - `500 Internal Server Error` - File system error

**2. GET /api/conversations/:id/messages**
- **Purpose:** Retrieve full conversation with message history
- **Authentication:** Browser ID verified against conversation.browserId
- **Request:**
  ```
  GET /api/conversations/abc-123/messages
  Cookie: agent_orchestrator_browser_id={uuid}
  ```
- **Response (200 OK):**
  ```json
  {
    "id": "abc-123",
    "browserId": "def-456",
    "agentId": "winston-architect",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "Review the architecture...",
        "timestamp": "2025-10-12T20:11:58.354Z"
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "I'll review the architecture...",
        "timestamp": "2025-10-12T20:12:03.123Z"
      }
    ],
    "files": [
      {
        "name": "architecture.md",
        "path": "conversations/abc-123/architecture.md",
        "size": 12345,
        "mimeType": "text/markdown"
      }
    ],
    ...
  }
  ```
- **Error Responses:**
  - `404 Not Found` - Conversation doesn't exist or doesn't belong to browser
  - `403 Forbidden` - Browser ID doesn't match conversation.browserId

**3. DELETE /api/conversations/:id**
- **Purpose:** Delete conversation and associated session folder
- **Authentication:** Browser ID verified against conversation.browserId
- **Request:**
  ```
  DELETE /api/conversations/abc-123
  Cookie: agent_orchestrator_browser_id={uuid}
  ```
- **Response (204 No Content):** Empty body on success
- **Error Responses:**
  - `404 Not Found` - Conversation doesn't exist or doesn't belong to browser
  - `403 Forbidden` - Browser ID doesn't match

**Internal Module Interfaces:**

```typescript
// lib/utils/conversations.ts
export async function getOrCreateConversation(
  conversationId: string | undefined,
  agentId: string,
  browserId: string
): Promise<PersistedConversation>;

export async function addMessageToConversation(
  conversationId: string,
  message: Omit<SerializedMessage, 'id' | 'timestamp'>
): Promise<SerializedMessage>;

export async function loadConversationsForBrowser(
  browserId: string
): Promise<PersistedConversation[]>;

export async function deleteConversation(
  conversationId: string,
  browserId: string
): Promise<boolean>;

// lib/utils/browserIdentity.ts
export function getBrowserId(
  request: NextRequest
): string | null;

export function setBrowserId(
  response: NextResponse,
  browserId: string
): void;

export function generateBrowserId(): string; // Returns UUID v4
```

### Workflows and Sequencing

**Workflow 1: First-Time User Visit**
```
1. User → Browser: Opens application
2. Browser → API (/api/chat): GET request (no cookie)
3. API → browserIdentity.ts: generateBrowserId()
4. browserIdentity.ts → API: Returns new UUID
5. API → Browser: Set-Cookie header with browser ID
6. Browser: Stores cookie (HttpOnly, Secure)
7. API → conversations.ts: getOrCreateConversation(undefined, agentId, browserId)
8. conversations.ts → File System: Create data/conversations/{id}/ folder
9. conversations.ts → File System: Write conversation.json
10. conversations.ts → API: Return PersistedConversation
11. API → Browser: Initial conversation state
```

**Workflow 2: Returning User - Load Conversation List**
```
1. User → Browser: Opens application
2. Browser → API (/api/conversations): GET request with browser ID cookie
3. API → browserIdentity.ts: getBrowserId(request)
4. API → conversations.ts: loadConversationsForBrowser(browserId)
5. conversations.ts → File System: Read all conversation.json files
6. conversations.ts: Filter by browserId
7. conversations.ts: Sort by updatedAt (descending)
8. conversations.ts: Map to ConversationMetadata[]
9. conversations.ts → API: Return conversation list
10. API → Browser: ConversationListResponse
11. Browser → ConversationSidebar: Render grouped conversations
```

**Workflow 3: Send Message (Persistence)**
```
1. User → Browser: Types message, clicks Send
2. Browser → API (/api/chat): POST with message + conversationId
3. API → conversations.ts: addMessageToConversation(conversationId, message)
4. conversations.ts: Add message to in-memory cache
5. conversations.ts: Trigger debounced write (500ms timer)
6. [After 500ms debounce] conversations.ts → File System: Atomic write
   a. Write to conversation.json.tmp
   b. fs.rename(tmp, conversation.json) - atomic operation
7. conversations.ts → API: Return updated conversation
8. API → OpenAI: Stream assistant response
9. API → conversations.ts: addMessageToConversation(conversationId, assistantMessage)
10. [Repeat steps 5-6 for assistant message]
11. API → Browser: Stream response chunks
12. Browser: Display assistant response in real-time
```

**Workflow 4: Switch Conversation**
```
1. User → ConversationSidebar: Clicks different conversation
2. ConversationSidebar → API (/api/conversations/:id/messages): GET request
3. API → conversations.ts: Load conversation from cache or disk
4. API → File System: Read files in conversation folder
5. API → Browser: ConversationDetailResponse (messages + files)
6. Browser → useStreamingChat: Replace conversation state
7. Browser → ChatPanel: Render message history
8. Browser: Scroll to bottom of conversation
9. Browser: Update file viewer with conversation files
```

**Workflow 5: Delete Conversation**
```
1. User → ConversationListItem: Clicks delete button
2. Browser: Show confirmation modal
3. User: Confirms deletion
4. Browser → API (/api/conversations/:id): DELETE request
5. API → conversations.ts: deleteConversation(conversationId, browserId)
6. conversations.ts: Verify browserId matches
7. conversations.ts → File System: rm -rf conversations/{id}/ (recursive delete)
8. conversations.ts: Remove from in-memory cache
9. conversations.ts → API: Return success
10. API → Browser: 204 No Content
11. Browser: Remove conversation from sidebar
12. Browser: If active conversation, switch to empty state
```

**Workflow 6: Server Restart Recovery**
```
1. Server: Restarts (intentional or crash)
2. Server → conversations.ts: Module initialization
3. conversations.ts → File System: Read data/conversations/ directory
4. conversations.ts: For each folder, read conversation.json
5. conversations.ts: Build in-memory cache (read-through)
6. conversations.ts: Log recovery stats (X conversations loaded)
7. User → Browser: Refreshes page
8. [Follow Workflow 2: Load Conversation List]
9. User: Sees all conversations intact
```

## Non-Functional Requirements

### Performance

**Target Metrics:**

| Metric | Target | Measurement Method | Source |
|--------|--------|-------------------|--------|
| **Conversation Load Time** | < 500ms for conversations with ≤100 messages | Time from API request to first render | Epic 10 line 367, 447 |
| **Message Persist Time** | < 50ms (debounced 500ms) | Time from addMessage() to disk write completion | Epic 10 line 346 |
| **Conversation List Load** | < 300ms for ≤50 conversations | Time from API request to sidebar render | Derived from UX requirements |
| **File I/O Overhead** | < 5% CPU utilization during active chat | Server metrics during message streaming | Epic 10 risk mitigation |
| **Memory Usage** | < 50MB for cached conversations (≤100 active) | Process memory monitoring | Derived from read-through cache |

**Performance Optimizations:**

1. **Debounced Writes (500ms):** Reduce disk I/O by batching rapid message exchanges
   - Implementation: Use `lodash.debounce` or custom timer
   - Trade-off: Up to 500ms data loss window on crash (acceptable for MVP)

2. **Read-Through Cache:** In-memory Map for active conversations
   - Cache invalidation: On file system changes or memory pressure
   - Cache size limit: 100 most recent conversations
   - Eviction strategy: LRU (Least Recently Used)

3. **Atomic File Operations:** Use fs.rename for atomic writes
   - Write to `.tmp` file first, then rename (atomic on most filesystems)
   - Prevents corruption during concurrent writes or crashes

4. **Lazy Loading:** Load full message history only when conversation is opened
   - Conversation list API returns metadata only (no messages)
   - Full messages loaded via `/api/conversations/:id/messages`

5. **Efficient Serialization:** Use native JSON.stringify/parse
   - ISO 8601 date strings (no Date object serialization overhead)
   - Avoid unnecessary field duplication

**Performance Testing:**
- Load test: 50 concurrent users, 10 messages/minute each
- Stress test: 100 conversations with 100 messages each
- Baseline: Measure current system performance before implementation
- Target: <10% performance degradation from baseline

### Security

**Authentication & Authorization:**

| Security Control | Implementation | Enforcement Point | Source |
|-----------------|----------------|-------------------|--------|
| **Browser Identity** | HTTP-only cookie with UUID v4 | Middleware: `lib/utils/browserIdentity.ts` | Epic 10 Story 10.2 |
| **Browser ID Verification** | Verify cookie matches conversation.browserId | API routes: `/api/conversations/*` | Epic 10 line 363, Story 10.3 |
| **Path Traversal Protection** | Block writes outside `data/conversations/` | `lib/pathResolver.ts`: validateWritePath() | Epic 10 Story 10.0, Sprint Change Proposal |
| **Cookie Security Flags** | HttpOnly, Secure (prod), SameSite=Strict | `setBrowserId()` function | Epic 10 line 178-182 |

**Security Requirements:**

1. **Cookie-Based Identity (MVP)**
   - **No PII stored:** Browser ID is opaque UUID with no personal data
   - **GDPR-Friendly:** Cookie deletion = data loss (documented trade-off)
   - **Cookie Attributes:**
     - `httpOnly: true` - Prevents XSS attacks from accessing cookie
     - `secure: true` - HTTPS only in production (prevents MITM)
     - `sameSite: 'Strict'` - CSRF protection
     - `maxAge: 31536000` - 1 year expiration

2. **Path Validation** (Critical Security Control)
   ```typescript
   // lib/pathResolver.ts
   validateWritePath(path, context) {
     const conversationsRoot = resolve(PROJECT_ROOT, 'data/conversations');
     if (!path.startsWith(conversationsRoot)) {
       throw new SecurityError('Write blocked outside conversations/');
     }
     if (path.includes('..')) {
       throw new SecurityError('Path traversal blocked');
     }
   }
   ```

3. **Browser ID Verification** (Authorization)
   - Every API request verifies `cookie.browserId === conversation.browserId`
   - Prevents users from accessing other browsers' conversations
   - Returns `403 Forbidden` if mismatch, `404 Not Found` if not exists

4. **Input Validation**
   - UUIDs: Validate format using regex `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`
   - File paths: Validate no directory traversal (`..`, absolute paths)
   - Content: Sanitize user input before storage (prevent XSS in stored messages)

5. **File System Permissions**
   - `data/conversations/` folder: Owner read/write only (chmod 700)
   - Conversation files: Owner read/write (chmod 600)
   - Prevents unauthorized access by other system users

**Threat Model:**
- **XSS (Cross-Site Scripting):** Mitigated by HttpOnly cookies, content sanitization
- **CSRF (Cross-Site Request Forgery):** Mitigated by SameSite=Strict cookie attribute
- **MITM (Man-in-the-Middle):** Mitigated by Secure flag in production (HTTPS only)
- **Path Traversal:** Mitigated by path validation layer
- **Unauthorized Access:** Mitigated by browser ID verification on all requests

**Security Testing:**
- Penetration testing: Attempt to access other browsers' conversations
- Path traversal testing: Attempt writes to `/etc/passwd`, `../../sensitive-file`
- XSS testing: Inject `<script>alert('XSS')</script>` in messages
- Cookie manipulation testing: Tamper with browser ID cookie value

### Reliability/Availability

**Availability Targets:**

| Metric | Target | Measurement | Source |
|--------|--------|-------------|--------|
| **System Uptime** | 99.9% (MVP acceptable) | Server monitoring | Standard web app target |
| **Data Durability** | 99.99% (no data loss on normal shutdown) | Verify conversations persist across restarts | Epic 10 line 445 |
| **Recovery Time** | < 10s after server restart | Time to load all conversations into cache | Epic 10 Workflow 6 |
| **Crash Recovery** | Graceful degradation (≤500ms data loss) | Verify conversations recover with minimal loss | Debounce trade-off |

**Reliability Mechanisms:**

1. **Atomic Writes** (Data Corruption Prevention)
   - Write-to-temp-then-rename pattern
   - Prevents partial writes on crash or power loss
   - Filesystem-level atomic operation guarantee

2. **Debounced Writes** (Performance vs. Durability Trade-Off)
   - 500ms debounce reduces I/O load
   - Trade-off: Up to 500ms of messages lost on crash
   - **Mitigation:** Acceptable for MVP (documented limitation)
   - **Future:** Configurable debounce or WAL (Write-Ahead Log)

3. **Read-Through Cache** (Fast Recovery)
   - Conversations loaded into memory on server start
   - Cache miss: Load from disk transparently
   - No user-visible errors on cache miss

4. **Error Handling**
   - Disk full: Return `507 Insufficient Storage`, keep in-memory fallback
   - File permission errors: Log error, alert user, retry
   - Corrupt conversation file: Skip file, log error, continue loading others

5. **Graceful Degradation**
   - If persistence fails: Continue with in-memory (log warning)
   - If cookie rejected: Single-session mode (no persistence across browser close)
   - If API errors: Show error message, allow retry

**Failure Scenarios:**

| Failure | Impact | Recovery | Mitigation |
|---------|--------|----------|------------|
| **Server Crash** | ≤500ms message loss | Auto-restart, load from disk | Debounced writes trade-off |
| **Disk Full** | Cannot save new messages | Alert user, in-memory fallback | Monitor disk space |
| **File Corruption** | Single conversation affected | Skip corrupted file, load others | Atomic writes |
| **Hot-Reload (Dev)** | In-memory cache cleared | Reload from disk | Transparent to user |

**Monitoring & Alerts:**
- Disk space monitoring: Alert at 90% capacity
- File write errors: Log and increment error counter
- Conversation load failures: Log corrupt files for investigation
- Recovery metrics: Track conversations loaded on restart

### Observability

**Logging Requirements:**

| Log Event | Level | Fields | Purpose |
|-----------|-------|--------|---------|
| **Conversation Created** | INFO | conversationId, browserId, agentId, timestamp | Track new conversations |
| **Message Added** | DEBUG | conversationId, messageId, role, timestamp | Track message flow |
| **Conversation Loaded** | INFO | conversationId, source (cache/disk), loadTime | Performance monitoring |
| **Conversation Deleted** | INFO | conversationId, browserId, deletedFileCount | Track deletions |
| **Persistence Error** | ERROR | conversationId, error, stack trace | Debugging failures |
| **Server Restart Recovery** | INFO | conversationsLoaded, loadTime, errorCount | Monitor recovery |
| **Cookie Set/Get** | DEBUG | browserId, operation | Track browser identity |
| **API Request** | INFO | endpoint, method, statusCode, responseTime | API monitoring |

**Structured Logging Format:**
```json
{
  "timestamp": "2025-10-12T20:14:04.687Z",
  "level": "INFO",
  "module": "conversations",
  "event": "conversation:created",
  "conversationId": "abc-123",
  "browserId": "def-456",
  "agentId": "winston-architect",
  "metadata": {...}
}
```

**Metrics to Track:**

1. **Performance Metrics:**
   - `conversation.load.time` (histogram) - Time to load conversation
   - `conversation.persist.time` (histogram) - Time to write to disk
   - `api.request.duration` (histogram) - API response time by endpoint
   - `cache.hit.rate` (gauge) - Cache hit percentage

2. **Business Metrics:**
   - `conversations.total` (counter) - Total conversations created
   - `conversations.active` (gauge) - Conversations in memory
   - `messages.total` (counter) - Total messages persisted
   - `browsers.unique` (gauge) - Unique browser IDs

3. **Error Metrics:**
   - `persistence.errors` (counter) - Failed disk writes
   - `api.errors` (counter) - API errors by endpoint and status code
   - `conversation.load.errors` (counter) - Failed conversation loads

**Tracing:**
- Trace conversation lifecycle: Create → Add Messages → Persist → Load → Delete
- Trace API requests: Request → Auth → Data Access → Response
- Use correlation IDs (conversationId) to trace across logs

**Dashboards:**
- **Health Dashboard:** Uptime, error rate, API response times
- **Performance Dashboard:** Load times, persist times, cache hit rate
- **Business Dashboard:** Total conversations, messages per day, active users

**Alerting:**
- Critical: Persistence error rate > 1% (5min window)
- Warning: API response time > 1s (95th percentile)
- Info: Disk space < 10% free

## Dependencies and Integrations

**Runtime Dependencies** (from package.json):

| Dependency | Version | Purpose | Integration Point |
|------------|---------|---------|-------------------|
| **next** | 14.2.0 | Framework + API routes | Core platform for API endpoints and SSR |
| **react** | ^18 | UI framework | Frontend conversation sidebar components |
| **react-dom** | ^18 | React DOM rendering | Rendering conversation UI |
| **openai** | ^4.104.0 | AI agent responses | Streaming chat responses (existing) |
| **uuid** | ^13.0.0 | UUID generation | Browser ID and conversation ID generation |
| **js-yaml** | ^4.1.0 | YAML parsing | Workflow configuration (existing) |
| **framer-motion** | ^10.16.4 | Animations | Sidebar animations (optional) |
| **react-markdown** | ^10.1.0 | Markdown rendering | Message content rendering (existing) |

**Development Dependencies:**

| Dependency | Version | Purpose |
|------------|---------|---------|
| **@testing-library/react** | ^16.3.0 | Component testing |
| **@testing-library/jest-dom** | ^6.9.1 | Jest DOM matchers |
| **@types/node** | ^20 | Node.js type definitions |
| **@types/uuid** | ^10.0.0 | UUID type definitions |
| **@types/js-yaml** | ^4.0.9 | YAML type definitions |

**New Dependencies (Story 10.0+):**

| Dependency | Version | Purpose | Story |
|------------|---------|---------|-------|
| **proper-lockfile** (optional) | ^4.1.2 | File locking for concurrent writes | Story 10.1 (if needed) |
| **lodash.debounce** (optional) | ^4.0.8 | Debounced write implementation | Story 10.1 (if custom not used) |

**System Dependencies:**

- **Node.js**: v18+ (for fs/promises async APIs)
- **File System**: POSIX-compliant (for atomic fs.rename operations)
- **Operating System**: macOS, Linux, Windows (cross-platform support)

**Internal Module Dependencies:**

| Module | Depends On | Reason |
|--------|-----------|--------|
| `lib/utils/conversations.ts` | `lib/utils/browserIdentity.ts` | Browser ID for conversation association |
| `lib/utils/conversations.ts` | `lib/sessions/chatSessions.ts` | Unified session/conversation creation |
| `lib/sessions/chatSessions.ts` | `lib/pathResolver.ts` | Secure folder creation |
| `lib/files/writer.ts` | `lib/pathResolver.ts` | Path validation for file writes |
| `app/api/conversations/route.ts` | `lib/utils/conversations.ts` | Data access layer |
| `app/api/chat/route.ts` | `lib/utils/browserIdentity.ts` | Cookie management |
| `components/ConversationSidebar.tsx` | `app/api/conversations/route.ts` | Fetch conversation list |

**External Integrations:**

| Integration | Type | Purpose | Epic 10 Impact |
|-------------|------|---------|----------------|
| **OpenAI API** | External HTTP | AI responses | No change (existing) |
| **Browser Cookies** | Browser API | Browser identification | New integration (Story 10.2) |
| **File System** | Node.js FS API | Conversation persistence | New integration (Story 10.1) |
| **Next.js API Routes** | Internal | REST API endpoints | New routes (Story 10.3) |

**Integration Testing Points:**

1. **File System Integration**: Test atomic writes, concurrent access, recovery scenarios
2. **Cookie Integration**: Test cookie setting, retrieval, expiration, security flags
3. **API Integration**: Test all endpoints with valid/invalid browser IDs
4. **OpenAI Integration**: Verify persistence works during streaming responses

## Acceptance Criteria (Authoritative)

**Epic-Level Acceptance Criteria** (from Epic 10 documentation):

1. **AC-E10-1:** Conversations persist to disk in `data/conversations/` folder structure
   - Verified by: Server restart test - conversations remain accessible

2. **AC-E10-2:** Browser identified via HTTP-only cookie (no authentication required)
   - Verified by: Cookie inspection, multi-browser test

3. **AC-E10-3:** Sidebar displays conversations grouped by agent
   - Verified by: Visual UI test, grouped conversations render correctly

4. **AC-E10-4:** Users can switch between conversations with full context restoration
   - Verified by: Switch conversation, verify message history loads

5. **AC-E10-5:** Conversations survive server restart and hot-reload
   - Verified by: Restart server, verify conversations intact

6. **AC-E10-6:** Session folders correctly linked to conversations (1:1 mapping)
   - Verified by: conversationId === sessionId, folder exists

7. **AC-E10-7:** Conversation deletion includes session folder cleanup
   - Verified by: Delete conversation, verify folder removed

8. **AC-E10-8:** No security vulnerabilities (browser ID verified on all requests)
   - Verified by: Security test suite, penetration testing

9. **AC-E10-9:** Performance acceptable for conversations up to 100 messages
   - Verified by: Load test with 100-message conversation < 500ms

10. **AC-E10-10:** Documentation explains workflow limitation (no mid-execution resumption)
    - Verified by: Documentation review, FAQ entry exists

**Story-Level Acceptance Criteria:**

### Story 10.0 - Directory Unification

- **AC-10.0-1:** `data/agent-outputs/` renamed to `data/conversations/`
- **AC-10.0-2:** `conversationId === sessionId` enforced (1:1 relationship)
- **AC-10.0-3:** `PersistedConversation` type defined merging Conversation + SessionManifest
- **AC-10.0-4:** Path validation allows `data/conversations/`, blocks `data/agent-outputs/`
- **AC-10.0-5:** `env.OUTPUT_PATH` points to `data/conversations`
- **AC-10.0-6:** Migration script migrates existing sessions without data loss
- **AC-10.0-7:** All existing tests pass after migration

### Story 10.1 - Server-Side Persistence

- **AC-10.1-1:** Conversations saved to `conversations/{id}/conversation.json` on every message
- **AC-10.1-2:** Conversations loaded from disk on server startup
- **AC-10.1-3:** Read-through cache (in-memory Map) implemented for performance
- **AC-10.1-4:** Atomic writes with temp files prevent corruption
- **AC-10.1-5:** Dates serialized as ISO 8601 strings
- **AC-10.1-6:** Debounced writes (500ms) reduce disk I/O

### Story 10.2 - Browser Identity

- **AC-10.2-1:** Unique browser ID (UUID) generated on first visit
- **AC-10.2-2:** Browser ID stored in HTTP-only cookie (`agent_orchestrator_browser_id`)
- **AC-10.2-3:** Cookie expiration: 1 year
- **AC-10.2-4:** Each conversation associated with browser ID
- **AC-10.2-5:** Cookie deletion = data loss (documented)
- **AC-10.2-6:** No PII stored (GDPR-friendly)

### Story 10.3 - Conversation List API

- **AC-10.3-1:** `GET /api/conversations` returns all conversations for current browser
- **AC-10.3-2:** Response includes metadata (conversationId, agentId, lastMessage, timestamp, messageCount)
- **AC-10.3-3:** Conversations sorted by updatedAt (most recent first)
- **AC-10.3-4:** Conversations grouped by agentId in response
- **AC-10.3-5:** `DELETE /api/conversations/:id` deletes conversation and session folder
- **AC-10.3-6:** Browser ID verified before returning data (403 if mismatch)

### Story 10.4 - Conversation Sidebar UI

- **AC-10.4-1:** Left sidebar component shows agent-grouped conversations
- **AC-10.4-2:** Show last message preview (truncated to 40 chars)
- **AC-10.4-3:** Show last updated timestamp (relative: "2 hours ago")
- **AC-10.4-4:** Highlight active conversation
- **AC-10.4-5:** Click conversation → load full history
- **AC-10.4-6:** Collapsible agent sections (expand/collapse)
- **AC-10.4-7:** "New conversation" button per agent
- **AC-10.4-8:** Delete button per conversation (with confirmation modal)

### Story 10.5 - Conversation Switching

- **AC-10.5-1:** Clicking conversation loads full message history
- **AC-10.5-2:** Chat input switches to conversation's agent
- **AC-10.5-3:** Session folder context restored for file references
- **AC-10.5-4:** Scroll to bottom of conversation on load
- **AC-10.5-5:** Show loading state during conversation switch
- **AC-10.5-6:** Previously attached files remain accessible (via session folder)
- **AC-10.5-7:** Cached context (system prompt, critical actions) restored or rebuilt

### Story 10.6 - Documentation

- **AC-10.6-1:** Document limitation: "Workflows cannot be resumed mid-execution in v1"
- **AC-10.6-2:** User can view conversation transcript showing where they left off
- **AC-10.6-3:** Starting new message after returning continues as normal chat
- **AC-10.6-4:** Optional: Warning banner if user tries to leave during active workflow
- **AC-10.6-5:** Documentation includes future enhancement plan (Epic 11: workflow checkpointing)
- **AC-10.6-6:** FAQ entry explaining the limitation

### Story 10.7 - Testing

- **AC-10.7-1:** Test: Server restart → conversations restored correctly
- **AC-10.7-2:** Test: Multiple browsers → separate conversation lists
- **AC-10.7-3:** Test: Cookie deletion → new browser ID, fresh start
- **AC-10.7-4:** Test: Concurrent conversations → no cross-talk
- **AC-10.7-5:** Test: Deleting conversation → session folder also deleted
- **AC-10.7-6:** Test: Large conversation (100+ messages) → performance acceptable
- **AC-10.7-7:** Test: Invalid conversation ID → 404 error handling
- **AC-10.7-8:** Integration tests for persistence layer

## Traceability Mapping

| Acceptance Criteria | Spec Section | Component/API | Test Idea |
|---------------------|--------------|---------------|-----------|
| AC-E10-1: Disk persistence | Data Models, APIs | `lib/utils/conversations.ts`, `conversation.json` | Restart server, verify files exist and load |
| AC-E10-2: Browser cookie | Security, APIs | `lib/utils/browserIdentity.ts`, cookie middleware | Inspect cookie, verify HttpOnly/Secure flags |
| AC-E10-3: Grouped sidebar | UI Components | `ConversationSidebar.tsx`, `AgentConversationGroup.tsx` | Render sidebar with mock data, verify grouping |
| AC-E10-4: Switch conversations | Workflows, APIs | `useStreamingChat.ts`, `/api/conversations/:id/messages` | Switch conversation, verify message history loads |
| AC-E10-5: Survive restart | Workflows, Reliability | Persistence layer, read-through cache | Kill server, restart, verify conversations intact |
| AC-E10-6: 1:1 mapping | Data Models | `conversationId === sessionId` enforcement | Create conversation, verify IDs match |
| AC-E10-7: Cascade delete | APIs, Workflows | `deleteConversation()`, fs.rm recursive | Delete conversation, verify folder removed |
| AC-E10-8: Security | Security, APIs | Path validation, browser ID verification | Penetration test, path traversal attempts |
| AC-E10-9: Performance | Performance NFRs | Debounced writes, caching | Load test with 100-message conversation |
| AC-E10-10: Documentation | N/A (docs) | `docs/conversation-persistence.md`, FAQ | Review documentation, verify limitation explained |
| AC-10.0-1: Directory rename | System Architecture | Migration script, file system | Run migration, verify new directory exists |
| AC-10.1-1: Persist on message | Detailed Design | `addMessageToConversation()`, debounced write | Send message, wait 500ms, verify file updated |
| AC-10.2-1: Generate browser ID | APIs, Security | `generateBrowserId()`, UUID v4 | First visit, verify cookie set with valid UUID |
| AC-10.3-1: List conversations API | APIs, Data Models | `/api/conversations` GET endpoint | API request, verify response matches schema |
| AC-10.4-1: Sidebar UI | UI Components | `ConversationSidebar.tsx` | Render component, verify agent grouping |
| AC-10.5-1: Switch and load | Workflows, APIs | Conversation switching workflow | Click conversation, verify history loads |
| AC-10.6-1: Document limitation | N/A (docs) | `docs/conversation-persistence.md` | Review docs, verify limitation explained |
| AC-10.7-1: Restart test | Test Strategy | Integration test suite | Automated test: restart, verify recovery |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation | Owner Story |
|------|------------|--------|------------|-------------|
| **File I/O Performance** - Writing on every message causes slowdown | High | High | Debounced writes (500ms), atomic operations, read-through cache | Story 10.1 |
| **Concurrent Write Conflicts** - Multiple requests updating same conversation | Medium | High | Atomic writes (fs.rename), optional file locking (proper-lockfile) | Story 10.1 |
| **Data Loss on Write Failure** - Disk full, permissions, corruption | Low | Critical | In-memory fallback, prominent logging, retry failed writes, user alert | Story 10.1 |
| **Storage Growth** - Unlimited conversations fill disk | High | Medium | **MVP**: Document no limit. **Post-MVP**: 90-day retention, compression | Epic 11 |
| **Cookie Rejection** - Strict privacy settings block cookies | Medium | Medium | Graceful fallback (single-session mode), localStorage secondary fallback, banner prompt | Story 10.2 |
| **Large Conversation Performance** - Loading 200+ messages slow | Low | Medium | Message pagination (load last 50), conversation size limits (warn at 500) | Post-MVP |
| **Migration Data Loss** - Existing sessions corrupted during migration | Low | Critical | Dry-run mode, copy (not move), verify checksums, keep backups | Story 10.0 |
| **Path Validation Regression** - Security vulnerability introduced | Low | Critical | Comprehensive security tests, code review, penetration testing | Story 10.0 |
| **Browser ID Collision** - UUID collision allows unauthorized access | Very Low | High | UUID v4 has 2^122 possible values (effectively impossible), validation | Story 10.2 |

### Assumptions

| Assumption | Validation | Impact if Wrong |
|------------|------------|-----------------|
| **Users accept cookie-based identity** | User testing, cookie acceptance rate monitoring | May need to add localStorage fallback or authentication |
| **500ms debounce acceptable for data loss** | User acceptance testing | May need to reduce debounce or add WAL (Write-Ahead Log) |
| **Conversations stay under 100 messages (MVP)** | Monitor conversation lengths in production | May need pagination or archiving sooner than planned |
| **File system supports atomic fs.rename** | Test on macOS, Linux, Windows | May need alternative atomicity mechanism (e.g., flock) |
| **No concurrent multi-tab editing** | User behavior analysis | May need to add multi-tab sync mechanism |
| **Users comfortable with cookie deletion = data loss** | User documentation, FAQ, banner warnings | May need to add backup/export feature sooner |
| **Disk space sufficient for conversations** | Monitor disk usage, alert at 90% | May need to implement retention policy or compression |

### Open Questions

| Question | Impact | Resolution Approach | Deadline |
|----------|--------|---------------------|----------|
| **Should we add file locking (proper-lockfile)?** | Medium - affects concurrent write handling | Test atomic writes under load; add locking if issues | Before Story 10.1 implementation |
| **How to handle conversation archiving/retention?** | Low (Post-MVP) | Document as Epic 11 feature; gather user feedback | N/A (deferred) |
| **Should localStorage be secondary fallback for cookies?** | Medium - affects cookie rejection scenarios | Prototype fallback, test with privacy settings | During Story 10.2 |
| **How to migrate large conversation histories efficiently?** | Low (MVP has few conversations) | Test migration script with synthetic large dataset | Before Story 10.0 implementation |
| **Should we add conversation export (JSON/Markdown)?** | Low (Post-MVP) | Gather user feedback during MVP; plan for Epic 11 | N/A (deferred) |
| **How to handle multi-device sync (future)?** | None (Post-MVP) | Requires authentication system; plan for Epic 12+ | N/A (deferred) |

## Test Strategy Summary

### Test Pyramid

```
        /\
       /  \  E2E Tests (10%)
      /----\
     /      \ Integration Tests (30%)
    /--------\
   /          \ Unit Tests (60%)
  /--------------\
```

### Test Levels

**1. Unit Tests (60% of tests)**

**Coverage Targets:**
- `lib/utils/conversations.ts`: 90% line coverage
- `lib/utils/browserIdentity.ts`: 95% line coverage
- `lib/pathResolver.ts`: 95% line coverage (critical security)
- React components: 80% line coverage

**Test Cases:**
- `conversations.ts`:
  - Create conversation with valid inputs
  - Load conversation from disk
  - Add message to conversation
  - Persist conversation (mock fs operations)
  - Handle file system errors gracefully
  - Debounced write behavior (use fake timers)

- `browserIdentity.ts`:
  - Generate valid UUID v4
  - Get browser ID from cookie
  - Set browser ID cookie with correct attributes
  - Handle missing cookie gracefully

- `pathResolver.ts`:
  - Allow writes to `data/conversations/`
  - Block writes to other paths
  - Block path traversal attempts (`..`)
  - Block absolute paths outside project

**2. Integration Tests (30% of tests)**

**Test Scenarios:**
- **API Integration**:
  - GET /api/conversations returns correct data for browser
  - GET /api/conversations/:id/messages loads full conversation
  - DELETE /api/conversations/:id removes folder and updates cache
  - API returns 403 for mismatched browser ID
  - API returns 404 for non-existent conversation

- **File System Integration**:
  - Atomic writes prevent corruption (simulate crash during write)
  - Concurrent writes handled correctly (parallel message sends)
  - Conversation loads from disk after server restart
  - Migration script migrates existing sessions correctly

- **End-to-End User Flows**:
  - First-time user: No cookie → Generate browser ID → Create conversation
  - Returning user: Load conversation list → Switch conversation
  - Delete conversation: Confirm modal → API call → Folder removed
  - Server restart: Conversations persist and reload correctly

**3. End-to-End Tests (10% of tests)**

**Critical User Journeys:**
- **Journey 1: First-Time User**
  1. Open application
  2. Verify browser ID cookie set
  3. Send first message
  4. Verify conversation created
  5. Restart server
  6. Verify conversation intact

- **Journey 2: Multi-Conversation Management**
  1. Create conversation with Agent A
  2. Create conversation with Agent B
  3. Switch between conversations
  4. Verify sidebar shows both, grouped by agent
  5. Delete one conversation
  6. Verify removed from sidebar and disk

- **Journey 3: Performance Test**
  1. Create conversation with 100 messages
  2. Measure load time < 500ms
  3. Switch to conversation
  4. Verify smooth rendering

### Test Frameworks and Tools

| Test Level | Framework | Purpose |
|------------|-----------|---------|
| **Unit** | Jest | Unit test runner |
| **Unit (React)** | React Testing Library | Component testing |
| **Unit (Hooks)** | @testing-library/react-hooks | Hook testing |
| **Integration** | Jest + Supertest | API endpoint testing |
| **E2E** | Playwright (optional) | Browser automation |
| **Performance** | Apache JMeter or Artillery | Load testing |
| **Security** | OWASP ZAP or Burp Suite | Penetration testing |

### Test Data Strategy

- **Mock Data**: Use factories for PersistedConversation, Message objects
- **Fixtures**: JSON fixtures for conversation.json files
- **Generators**: UUID generators for testing browser IDs
- **Temp Folders**: Use temp directories for file system tests (cleanup after)

### Continuous Integration

- **Pre-commit**: Run unit tests (fast feedback)
- **CI Pipeline**: Run all tests on every PR
- **Coverage Report**: Enforce 80% overall coverage
- **Security Scan**: Run security tests on every merge to main

### Acceptance Testing

- **Manual QA Checklist**: Test all acceptance criteria (Stories 10.0-10.7)
- **Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge
- **Cookie Scenarios**: Test with cookies enabled/disabled, private mode
- **Performance Baseline**: Measure before/after Epic 10 implementation

---

## Post-Review Follow-ups

### Story 10.0 Review Follow-ups (2025-10-12)

Based on Senior Developer Review by Amelia:

**Low Priority:**
- Add JSDoc documentation to `PersistedConversation.browserId` explaining that `null` is intentional during migration phase (set by Story 10.2).
- Clarify test results in story documentation to specify "Story 10.0 security tests: 30/30 passing" to avoid confusion with unrelated test failures.

**Review Outcome:** Approved with Recommendations
**Review Quality Assessment:** High (9/10) - Strong implementation ready for production

**Note:** Legacy sessions predating the new architecture were manually cleaned up. Migration script removed as it's no longer needed.

---

**End of Technical Specification**

**Status:** Draft - Ready for Review
**Next Steps:** Review with Bryan → Approve → Begin Story 10.0 Implementation
