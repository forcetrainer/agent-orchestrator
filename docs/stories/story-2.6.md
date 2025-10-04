# Story 2.6: Conversation State Management

Status: Ready for Review

## Story

As an end user,
I want my conversation history to be maintained across multiple messages,
so that the agent has context from previous exchanges and can build on prior interactions.

## Acceptance Criteria

1. ✅ Conversations stored in memory with unique IDs (AC-E2-12)
2. ✅ Conversation history maintained across multiple messages
3. ✅ File operation errors captured and logged (AC-E2-15)
4. ✅ Input validation for agentId, message, conversationId (AC-E2-19)
5. ✅ Logging for all operations (AC-E2-20)
6. ✅ Conversation state lost on server restart (documented limitation)

## Tasks / Subtasks

- [x] Create Conversation Manager (AC: 1, 2)
  - [x] Create `lib/utils/conversations.ts`
  - [x] Implement `getConversation()` function with conversationId handling
  - [x] Implement `addMessage()` function to append to conversation history
  - [x] Implement `getConversationHistory()` function to retrieve messages
  - [x] Implement in-memory Map for conversation storage
  - [x] Generate unique conversation IDs using crypto.randomUUID()
  - [x] Track createdAt and updatedAt timestamps
  - [x] Add `clearAllConversations()` utility for testing

- [x] Implement Input Validation (AC: 4)
  - [x] Create `lib/utils/validation.ts`
  - [x] Implement `validateAgentId()` function
  - [x] Implement `validateMessage()` function
  - [x] Implement `validateConversationId()` function
  - [x] Add regex patterns for validation (UUID, agent ID format)
  - [x] Set maximum message length (10,000 characters)
  - [x] Return ValidationError for invalid inputs

- [x] Update Chat API Route (AC: 1, 2, 4)
  - [x] Update `app/api/chat/route.ts` to use conversation manager
  - [x] Import and use validation functions
  - [x] Call `getConversation()` to retrieve or create conversation
  - [x] Call `addMessage()` for user message
  - [x] Pass full conversation history to `executeChatCompletion()`
  - [x] Call `addMessage()` for assistant message
  - [x] Return conversationId in response

- [x] Enhance Logging (AC: 3, 5)
  - [x] Create `lib/utils/logger.ts` utility
  - [x] Implement structured logging with log levels (INFO, ERROR, DEBUG)
  - [x] Add logging to conversation manager operations
  - [x] Add logging to validation failures
  - [x] Add logging for file operation errors (already in place, ensure captured)
  - [x] Ensure all logs include timestamps and operation context
  - [x] Log detailed errors server-side only

- [x] Testing and Validation (AC: 1-6)
  - [x] Test multi-turn conversation maintains context
  - [x] Test conversation creation with new conversationId
  - [x] Test conversation retrieval with existing conversationId
  - [x] Test input validation for all fields
  - [x] Test error logging and capture
  - [x] Verify conversation state clears on server restart
  - [x] Test conversation history passed correctly to OpenAI

## Dev Notes

### Purpose and Context

**Core Functionality:**
This story implements the conversation state management layer that enables multi-turn conversations with agents. It builds on Story 2.5's basic chat functionality by adding persistent conversation history, comprehensive input validation, and structured logging for production readiness.

**Why Conversation State Matters:**
- Enables agents to reference previous messages in the conversation
- Creates natural multi-turn dialogue experiences similar to ChatGPT/Claude
- Foundation for conversation persistence (future enhancement)
- Enables conversation-specific context and state tracking
- Critical for complex agent workflows that span multiple interactions

**Dependency Context:**
- Builds directly on Story 2.5 (Chat API Route with Function Calling Loop)
- Requires all previous Epic 2 stories (2.1-2.5) to be complete
- Enables Epic 3 (Chat Interface) to have stateful conversations
- Foundation for future conversation persistence (database storage)

### Implementation Guidance

From tech-spec-epic-2.md Story 2.6 section (lines 1222-1410):

**Core Components:**

1. **Conversation Manager (`lib/utils/conversations.ts`):**
   - In-memory Map stores conversations by ID
   - `getConversation()` retrieves existing or creates new conversation
   - `addMessage()` appends message to conversation and updates timestamp
   - `getConversationHistory()` returns message array for a conversation
   - `clearAllConversations()` utility for testing/cache clearing

2. **Input Validation (`lib/utils/validation.ts`):**
   - `validateAgentId()` - checks lowercase alphanumeric with hyphens format
   - `validateMessage()` - checks non-empty and under 10,000 character limit
   - `validateConversationId()` - checks valid UUID format if provided
   - Throws ValidationError with clear messages for invalid inputs

3. **Structured Logging (`lib/utils/logger.ts`):**
   - `log()` function with levels: INFO, ERROR, DEBUG
   - Includes timestamps and operation context
   - DEBUG only logs in development environment
   - Errors include full details server-side only

**Key Implementation Details:**

- **Conversation Storage:** Use Map<string, Conversation> for in-memory storage
- **Conversation ID:** Generate with `crypto.randomUUID()` from Node.js crypto module
- **Message ID:** Each message also gets unique UUID
- **Timestamps:** Track `createdAt` and `updatedAt` for conversations, `timestamp` for messages
- **Validation Patterns:**
  - Agent ID: `/^[a-z0-9-]+$/` (lowercase alphanumeric with hyphens)
  - Message: Non-empty string, max 10,000 characters
  - Conversation ID: UUID v4 format `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

**Chat API Route Integration:**
```typescript
// Updated flow in app/api/chat/route.ts:
1. Validate inputs (agentId, message, conversationId)
2. Load agent using getAgentById()
3. Get or create conversation using getConversation()
4. Add user message to conversation
5. Execute chat completion with full conversation history
6. Add assistant message to conversation
7. Return response with conversationId
```

**Error Handling:**
- Validation errors → ValidationError with specific field and reason
- Conversation not found → Create new conversation (graceful recovery)
- Message append failures → Log error and throw with context
- All errors logged with full stack traces server-side

### Project Structure Notes

**New Files:**
```
/lib/utils/
  ├── conversations.ts        # Conversation state management
  ├── validation.ts          # Input validation utilities
  └── logger.ts              # Structured logging utility
```

**Modified Files:**
```
/app/api/chat/route.ts         # Updated to use conversation manager and validation
/types/index.ts                # Conversation and Message interfaces already exist
```

**Alignment with Unified Project Structure:**
- `/lib/utils/` follows convention for shared utility modules
- Conversation management separate from chat service (separation of concerns)
- Validation utilities centralized for reuse across API routes
- Type definitions in `/types/` maintain centralized type management

**Architecture Patterns:**
- State management pattern (conversation storage and retrieval)
- Validation layer pattern (input sanitization before processing)
- Logging facade pattern (consistent logging interface)
- In-memory cache pattern (Map for conversation storage)

### Testing Standards Summary

From tech-spec-epic-2.md Story 2.6 section (lines 1382-1410):

**Manual Testing Commands:**
```bash
# Test multi-turn conversation
CONV_ID=""

# First message
RESPONSE=$(curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test-agent","message":"Hello"}')

CONV_ID=$(echo $RESPONSE | jq -r '.data.conversationId')
echo "Conversation ID: $CONV_ID"

# Second message (should maintain context)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"test-agent\",\"message\":\"What did I just say?\",\"conversationId\":\"$CONV_ID\"}"

# Test input validation
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"INVALID-ID","message":"Test"}'
# Should return 400 validation error

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test-agent","message":""}'
# Should return 400 validation error
```

**Expected Behavior:**
- First message creates new conversation, returns conversationId
- Subsequent messages with same conversationId maintain history
- Agent can reference previous messages in responses
- Invalid agentId format returns 400 with clear error
- Empty message returns 400 with clear error
- Invalid conversationId format returns 400 with clear error
- Logs show conversation creation, message addition, and validation failures

**Performance Validation:**
- Conversation lookup: < 1ms (Map access is O(1))
- Message append: < 1ms (array push is O(1))
- No memory leaks with large conversation histories (acceptable for MVP)
- Server restart clears all conversations (documented limitation)

### References

**Technical Specifications:**
- [Source: docs/tech-spec-epic-2.md#Story-2.6 (lines 1222-1410)]
- [Source: docs/epics.md#Epic-2 Story 2.6 (Conversation State Management)]

**Related Components:**
- [lib/openai/chat.ts](../../../lib/openai/chat.ts) - Chat service that uses conversation history
- [app/api/chat/route.ts](../../../app/api/chat/route.ts) - Chat API route
- [lib/utils/errors.ts](../../../lib/utils/errors.ts) - ValidationError class
- [lib/utils/env.ts](../../../lib/utils/env.ts) - Environment utilities
- [types/index.ts](../../../types/index.ts) - Conversation and Message types

**Dependencies:**
- Story 2.5 (Chat API Route with Function Calling Loop) - Required foundation
- Story 2.1 (OpenAI SDK Integration) - Uses OpenAI for multi-turn conversations
- Story 2.4 (Agent Discovery & Loading) - Agent validation

### Architecture Alignment

**Technology Stack:**
- Node.js crypto module for UUID generation
- TypeScript for type safety
- In-memory Map for conversation storage (MVP)
- Next.js API Routes for HTTP endpoints

**Design Patterns:**
- **State Management:** In-memory Map stores conversation state by ID
- **Validation Layer:** Separate validation module prevents invalid data from entering system
- **Logging Facade:** Centralized logger provides consistent logging interface
- **Graceful Degradation:** Missing conversationId creates new conversation (doesn't fail)
- **Stateful API:** Conversation state maintained across requests (different from Story 2.5's initial stateless approach)

**Data Flow:**
1. Client POSTs to /api/chat with agentId, message, optional conversationId
2. API route validates all inputs (agentId, message, conversationId format)
3. API route calls getConversation(conversationId, agentId)
4. Conversation manager returns existing conversation or creates new one
5. API route calls addMessage() to append user message
6. Chat service receives full conversation.messages array
7. OpenAI API called with complete message history for context
8. API route calls addMessage() to append assistant response
9. API route returns response with conversationId to client
10. Client includes conversationId in subsequent requests

**Integration with Future Stories:**
- Epic 3 Story 3.5: Frontend will include conversationId in requests
- Epic 3 Story 3.7: "New Conversation" button will omit conversationId
- Epic 3 Story 3.2: Message history will display from conversation.messages
- Future: Conversation persistence to database (post-MVP enhancement)

**Documented Limitations (MVP):**
- Conversations stored in memory only (lost on server restart)
- No conversation persistence to database
- No conversation history limits (could grow unbounded)
- No conversation cleanup/expiration
- No multi-server support (single instance only)

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-03 | 0.1     | Initial draft | Bob (Scrum Master) |
| 2025-10-03 | 1.0     | Implementation complete - Conversation state management with validation and logging | Amelia (Dev Agent) |

## Dev Agent Record

### Context Reference

- [Story Context 2.6](/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-2.6.xml)

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

Implementation completed successfully with all acceptance criteria satisfied and comprehensive test coverage.

### Completion Notes List

**Implementation Summary:**
- Created conversation state management system with in-memory Map storage
- Implemented comprehensive input validation for agentId, message, and conversationId
- Added structured logging with INFO/ERROR/DEBUG levels and environment-based filtering
- Updated chat API route to maintain full conversation history across requests
- All 61 unit tests passing (13 conversation, 22 validation, 10 logger, 16 chat route)
- Type checking passes with no errors in Story 2.6 files

**Key Technical Details:**
- Conversation IDs generated using crypto.randomUUID() for proper UUID v4 format
- ValidationError class enhanced with optional field property for better error context
- Logging implements DEBUG mode only in development environment
- Conversation history properly converted to OpenAI ChatCompletionMessageParam format
- Message and conversation timestamps tracked with createdAt/updatedAt

**Testing Coverage:**
- Multi-turn conversation state maintained correctly
- Input validation enforces lowercase alphanumeric agent IDs, 10K char message limit, UUID format
- Conversation clearing utility works for test isolation
- Logger respects NODE_ENV for DEBUG output
- Chat API integration tests verify complete flow

### File List

**New Files:**
- `lib/utils/conversations.ts` - Conversation state manager with Map storage
- `lib/utils/validation.ts` - Input validation utilities with regex patterns
- `lib/utils/logger.ts` - Structured logging with log levels
- `lib/utils/__tests__/conversations.test.ts` - 13 unit tests for conversation manager
- `lib/utils/__tests__/validation.test.ts` - 22 unit tests for validation
- `lib/utils/__tests__/logger.test.ts` - 10 unit tests for logger

**Modified Files:**
- `app/api/chat/route.ts` - Integrated conversation manager and validation
- `app/api/chat/__tests__/route.test.ts` - Updated tests + 6 new Story 2.6 tests
- `lib/utils/errors.ts` - Added field property to ValidationError class
- `types/index.ts` - Added Conversation, Message, FunctionCall interfaces
