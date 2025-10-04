# Technical Specification: Chat Interface and Agent Selection

Date: 2025-10-03
Author: Bryan
Epic ID: Epic 3
Status: Draft

---

## Overview

Epic 3 delivers the primary user-facing interface for the Agent Orchestrator platform: a ChatGPT-style chat interface that enables end users to discover, select, and interact with BMAD agents. This epic builds on the backend foundation (Epic 1) and OpenAI integration with file operations (Epic 2) to create the conversational experience that makes agents accessible to non-technical users. The chat interface provides agent discovery through automatic folder scanning, message history with markdown rendering, and basic conversation management capabilities.

## Objectives and Scope

**In Scope:**
- ChatGPT-style chat UI with text input, message history, and send functionality
- Agent discovery system that automatically scans agents folder and populates selection dropdown
- Message display with clear visual distinction between user and agent messages
- Markdown rendering for agent responses (headings, lists, code blocks, links, tables)
- Loading indicators during agent processing
- New conversation / reset functionality
- Error handling and display within chat interface
- Responsive desktop layout compatible with modern browsers

**Out of Scope (Deferred to later phases):**
- Streaming responses (token-by-token display)
- Session persistence across browser refreshes
- Multiple simultaneous conversations
- Conversation history/archive
- Mobile-specific optimizations
- Authentication or user management
- Syntax highlighting for code blocks
- Advanced markdown features (LaTeX, diagrams)

## System Architecture Alignment

Epic 3 implements the **Frontend (Next.js App Router pages + React components)** layer defined in the system architecture, specifically the Chat Interface component. This epic consumes the `/api/chat` and `/api/agents` endpoints established in Epic 1 and depends on the complete OpenAI integration from Epic 2 to provide functional agent responses.

The chat interface aligns with architectural constraints including:
- **Next.js App Router** for page routing and React Server Components
- **Stateless API design** - conversation context maintained in frontend state only
- **File-based agent storage** - no database dependency for agent discovery
- **OpenAI function calling** - backend handles all LLM interactions, frontend only sends/receives messages
- **Security boundaries** - API key and file operations hidden from frontend

## Detailed Design

### Services and Modules

| Module/Component | Responsibility | Inputs | Outputs | Owner |
|-----------------|----------------|--------|---------|-------|
| **ChatPage** (`app/page.tsx`) | Main page component, orchestrates chat UI | User interactions, agent selection | Rendered chat interface | Frontend |
| **ChatInterface** (`components/ChatInterface.tsx`) | Message history display, input field, send handling | Messages array, send callbacks | Chat UI with message bubbles | Frontend |
| **MessageList** (`components/MessageList.tsx`) | Renders scrollable message history | Messages array | Formatted message list with auto-scroll | Frontend |
| **MessageBubble** (`components/MessageBubble.tsx`) | Individual message display with markdown | Message object (role, content) | Styled message with markdown rendering | Frontend |
| **AgentSelector** (`components/AgentSelector.tsx`) | Dropdown for agent discovery/selection | Available agents list | Selected agent ID | Frontend |
| **InputField** (`components/InputField.tsx`) | Text input with send button | User text input | Message submission event | Frontend |
| **LoadingIndicator** (`components/LoadingIndicator.tsx`) | Shows agent processing state | Loading boolean | Animated "thinking" indicator | Frontend |
| **ErrorDisplay** (`components/ErrorDisplay.tsx`) | Shows error messages in chat | Error message string | Formatted error display | Frontend |
| **GET /api/agents** | Scans agents folder, returns available agents | None (reads from file system) | JSON array of agent metadata | Backend |
| **POST /api/chat** | Processes user message via OpenAI | Agent ID, messages array | Agent response message | Backend |

### Data Models and Contracts

**Message Object (Frontend State)**
```typescript
interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp?: number;
}
```

**Agent Metadata (from /api/agents)**
```typescript
interface Agent {
  id: string;              // Unique identifier (file path hash or sanitized name)
  name: string;            // Display name extracted from agent file
  description?: string;    // Optional short description
  path: string;            // Relative path within agents folder (server-side only)
}
```

**Chat Request (POST /api/chat)**
```typescript
interface ChatRequest {
  agentId: string;
  messages: Message[];
}
```

**Chat Response (POST /api/chat)**
```typescript
interface ChatResponse {
  success: boolean;
  message?: Message;       // Agent's response message
  error?: string;          // Error message if success=false
}
```

**Agents List Response (GET /api/agents)**
```typescript
interface AgentsResponse {
  success: boolean;
  agents?: Agent[];
  error?: string;
}
```

### APIs and Interfaces

**GET /api/agents**
- **Method:** GET
- **Authentication:** None (MVP)
- **Request:** No parameters
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "agents": [
      {
        "id": "procurement-advisor",
        "name": "Procurement Advisor",
        "description": "Guides users through procurement workflows",
        "path": "procurement/advisor.md"
      }
    ]
  }
  ```
- **Response (500 Error):**
  ```json
  {
    "success": false,
    "error": "Failed to read agents folder"
  }
  ```
- **Error Codes:** 500 (server error reading file system)

**POST /api/chat**
- **Method:** POST
- **Authentication:** None (MVP)
- **Request Body:**
  ```json
  {
    "agentId": "procurement-advisor",
    "messages": [
      {"role": "user", "content": "I need help with a procurement request"},
      {"role": "assistant", "content": "I'd be happy to help..."}
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": {
      "role": "assistant",
      "content": "Based on your request..."
    }
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "Agent ID is required"
  }
  ```
- **Response (500 Error):**
  ```json
  {
    "success": false,
    "error": "OpenAI API error: Rate limit exceeded"
  }
  ```
- **Error Codes:** 400 (invalid request), 404 (agent not found), 500 (server/API error)

### Workflows and Sequencing

**Agent Discovery Flow:**
1. User navigates to application root (/)
2. ChatPage component mounts, calls GET /api/agents
3. Backend scans agents folder recursively for .md files
4. Backend parses agent metadata (name, description) from file headers
5. Backend returns agents array to frontend
6. AgentSelector populates dropdown with agent names
7. User selects agent from dropdown
8. Frontend stores selected agentId in state

**Message Send Flow:**
1. User types message in InputField component
2. User clicks send button or presses Enter
3. Frontend validates message (non-empty)
4. Frontend adds user message to messages array
5. Frontend sets isLoading=true, displays LoadingIndicator
6. Frontend POSTs to /api/chat with agentId and full messages history
7. Backend loads agent definition if not cached
8. Backend calls OpenAI API with messages + function definitions
9. **OpenAI Function Calling Loop (Epic 2 dependency):**
   - OpenAI may request function calls (read_file, write_file, list_files)
   - Backend executes functions, returns results to OpenAI
   - Loop continues until OpenAI returns text response
10. Backend returns agent message to frontend
11. Frontend adds assistant message to messages array
12. Frontend sets isLoading=false, hides LoadingIndicator
13. MessageList auto-scrolls to show new message

**New Conversation Flow:**
1. User clicks "New Conversation" button
2. Frontend clears messages array (resets to [])
3. Frontend resets any error states
4. Input field receives focus
5. Agent selection remains unchanged
6. Backend state is stateless, no reset needed

**Error Handling Flow:**
1. API call fails (network error, 400/500 response)
2. Frontend catches error in try/catch
3. Frontend creates error message object {role: 'error', content: errorMessage}
4. Frontend adds error message to messages array
5. ErrorDisplay component renders error with distinct styling
6. Frontend sets isLoading=false
7. User can continue conversation or reset

## Non-Functional Requirements

### Performance

**Target Metrics (from PRD NFR-1):**
- **Initial page load:** < 2 seconds to interactive state
- **Agent selector population:** < 500ms after GET /api/agents response
- **Message send responsiveness:** User message appears in chat immediately (< 100ms)
- **Agent response latency:** Loading indicator appears within 200ms of send action
- **Message rendering:** Markdown content renders within 100ms of receiving response
- **Auto-scroll behavior:** Smooth scroll to new message completes within 300ms

**Performance Constraints:**
- Frontend state management uses React useState (minimal overhead for MVP scale)
- No pagination for message history in MVP (assume conversations < 100 messages)
- Agent metadata caching on frontend after initial load (no repeated /api/agents calls)
- Markdown rendering library must not block UI thread for typical agent responses (< 5000 characters)

**Optimization Priorities:**
1. Perceived performance (immediate user feedback) over actual latency
2. Smooth animations and transitions without jank
3. Efficient re-renders (React.memo on MessageBubble components)

### Security

**Frontend Security (from PRD NFR-4):**
- **No sensitive data in frontend code:** OpenAI API key never sent to browser
- **Input sanitization:** User messages sanitized before display (XSS prevention)
- **Markdown rendering security:** Use trusted markdown library with XSS protection
- **API communication:** All sensitive operations happen server-side via API routes

**API Security:**
- **No authentication in MVP** (assumes trusted local/network deployment)
- **Agent ID validation:** Backend validates agent exists before loading
- **Error message sanitization:** No file system paths or internal details leaked in error messages

**Content Security:**
- Markdown renderer configured to prevent script injection
- External links from agent responses open in new tab with `rel="noopener noreferrer"`
- No `dangerouslySetInnerHTML` usage in React components

### Reliability/Availability

**Error Recovery (from PRD NFR-2):**
- **API failures:** Clear error messages displayed in chat, user can retry
- **Network errors:** Detect offline state, show "Connection lost" message
- **Agent loading failures:** Graceful degradation, error shown in agent selector
- **Markdown rendering errors:** Fall back to plain text display if rendering fails

**State Resilience:**
- Messages array in React state survives component re-renders
- Agent selection persists during conversation
- Error states don't corrupt message history
- Failed API calls don't leave UI in loading state (always reset isLoading)

**Availability:**
- No uptime SLA for MVP (self-hosted deployment)
- Frontend remains functional for viewing existing messages if backend unreachable
- Agent selector gracefully handles empty agents folder (shows helpful message)

### Observability

**Frontend Logging (from PRD NFR-8):**
- Console logging for key user actions:
  - Agent selection events
  - Message send/receive events
  - API call failures with error details
  - Markdown rendering errors
- Error objects logged with full stack traces (development mode)
- Production logging reduces verbosity (errors and critical events only)

**User-Visible Status:**
- Loading indicator shows agent is processing
- Error messages appear inline in chat with actionable guidance
- Agent selector shows "Loading agents..." state during initial fetch
- Empty states clearly communicate when no agents available or conversation is new

**Debug Support:**
- Console logs include timestamps and context (agent ID, message count)
- API response errors logged with full response body
- Frontend state changes logged in development mode

## Dependencies and Integrations

### External Dependencies

**Core Framework Dependencies:**
- **next@14.2.0** - Next.js framework for React with App Router, API routes, and built-in TypeScript support
- **react@^18** - React library for building UI components
- **react-dom@^18** - React DOM rendering

**Additional Frontend Dependencies (to be added for Epic 3):**
- **react-markdown@^9.x** (or similar) - Markdown rendering library for agent responses
  - Must support: headings, lists, code blocks, links, tables, bold/italic
  - Must include XSS protection
  - Alternative: `marked` + sanitization library

**Development Dependencies:**
- **typescript@^5** - TypeScript compiler and type checking
- **@types/react@^18** - TypeScript types for React
- **@types/react-dom@^18** - TypeScript types for React DOM
- **@types/node@^20** - TypeScript types for Node.js
- **eslint@^8** - Linting for code quality
- **eslint-config-next@14.2.0** - Next.js ESLint configuration
- **tailwindcss@^3.4.0** - Utility-first CSS framework for styling
- **autoprefixer@^10.4.17** - PostCSS plugin for CSS vendor prefixing
- **postcss@^8** - CSS transformation tool

**Testing Dependencies:**
- **jest@^30.2.0** - Testing framework
- **@testing-library/react@^16.3.0** - React component testing utilities
- **@testing-library/jest-dom@^6.9.1** - Custom Jest matchers for DOM
- **jest-environment-jsdom@^30.2.0** - JSDOM environment for Jest
- **ts-jest@^29.4.4** - TypeScript preprocessor for Jest

### Internal Integration Points

**Backend API Integration (Epic 1 & Epic 2 dependencies):**
- **GET /api/agents** - Requires Epic 1 (Story 1.2: API Route Structure) complete
  - Backend must implement agent folder scanning logic
  - Backend must parse agent metadata from .md files
- **POST /api/chat** - Requires Epic 2 (ALL stories) complete
  - Backend must implement OpenAI API integration (Story 2.1)
  - Backend must implement function calling loop (Story 2.6)
  - Backend must implement agent loading (Story 2.7)
  - Backend must implement all file operations (Stories 2.3, 2.4, 2.5)

**File System Dependencies:**
- Agents folder path configured via environment variable (from Epic 1)
- No direct file system access from frontend - all via API routes

**State Management:**
- React useState for local component state (messages, selected agent, loading state)
- No global state library in MVP (Redux, Zustand, etc.)
- Conversation context maintained in frontend only (stateless backend)

### External Service Integration

**OpenAI API (Epic 2 dependency):**
- Frontend does not call OpenAI directly
- All OpenAI interactions handled by backend via /api/chat endpoint
- No OpenAI SDK required in frontend dependencies

**No other external services in Epic 3:**
- No analytics
- No authentication providers
- No CDN dependencies (self-hosted deployment)

## Acceptance Criteria (Authoritative)

### Story 3.1: Basic Chat UI Layout

**AC-1.1:** Chat interface displays with text input at bottom
**AC-1.2:** Message history area shows above input field
**AC-1.3:** Send button appears next to input field
**AC-1.4:** Layout resembles ChatGPT/Claude.ai (simple, clean, focused)
**AC-1.5:** Interface is responsive and works on desktop browsers
**AC-1.6:** No functionality required yet - just UI layout

### Story 3.2: Display User and Agent Messages

**AC-2.1:** User messages appear right-aligned with distinct styling
**AC-2.2:** Agent messages appear left-aligned with different styling
**AC-2.3:** Clear visual distinction between user and agent messages
**AC-2.4:** Messages display in chronological order (oldest to newest)
**AC-2.5:** Message history scrolls when conversation grows long
**AC-2.6:** Auto-scroll to latest message when new message arrives

### Story 3.3: Markdown Rendering for Agent Responses

**AC-3.1:** Markdown headings render correctly (h1-h6)
**AC-3.2:** Lists (bulleted and numbered) display properly
**AC-3.3:** Code blocks appear with monospace font and background
**AC-3.4:** Links are clickable and styled appropriately
**AC-3.5:** Bold and italic text render correctly
**AC-3.6:** Line breaks and paragraphs are preserved
**AC-3.7:** Tables render if agent uses markdown tables

### Story 3.4: Agent Discovery and Selection Dropdown

**AC-4.1:** Backend scans agents folder on startup and finds all .md agent files
**AC-4.2:** `/api/agents` endpoint returns list of discovered agents
**AC-4.3:** Dropdown/selector displays list of agents in UI
**AC-4.4:** Agent names extracted from file metadata or filename
**AC-4.5:** Dropdown appears prominently in UI (top of page or sidebar)
**AC-4.6:** Selecting an agent loads it for conversation
**AC-4.7:** System handles empty agents folder gracefully (shows message)
**AC-4.8:** Recursive scanning finds agents in subdirectories

### Story 3.5: Basic Message Send Functionality

**AC-5.1:** Clicking send button submits message to `/api/chat`
**AC-5.2:** Pressing Enter in input field submits message
**AC-5.3:** Input field clears after message is sent
**AC-5.4:** User message immediately appears in chat history
**AC-5.5:** Input is disabled while waiting for agent response
**AC-5.6:** Empty messages are not sent
**AC-5.7:** Long messages are accepted (multi-line support)
**AC-5.8:** Agent response appears when received from backend

### Story 3.6: Loading Indicator During Agent Processing

**AC-6.1:** Loading indicator appears after sending message
**AC-6.2:** Indicator shows "Agent is thinking..." or similar message
**AC-6.3:** Indicator appears in chat history where agent response will be
**AC-6.4:** Indicator disappears when agent response arrives
**AC-6.5:** Visual cue is clear but not distracting (subtle animation)
**AC-6.6:** Works correctly even for slow API responses

### Story 3.7: New Conversation / Reset Functionality

**AC-7.1:** "New Conversation" button visible in UI
**AC-7.2:** Clicking button clears chat history
**AC-7.3:** Agent context resets (doesn't remember previous messages)
**AC-7.4:** Input field remains focused and ready for new message
**AC-7.5:** Confirmation dialog if conversation has significant history (optional for MVP)
**AC-7.6:** Button is clearly labeled and easy to find

### Story 3.8: Basic Error Handling in Chat

**AC-8.1:** API errors display as error messages in chat
**AC-8.2:** Error messages are clearly styled (red/warning color)
**AC-8.3:** Errors explain what went wrong in plain language
**AC-8.4:** Network errors show "Connection failed - please try again"
**AC-8.5:** Agent errors show agent-specific error information
**AC-8.6:** User can still send new messages after error
**AC-8.7:** Errors don't crash the interface

## Traceability Mapping

| AC ID | Requirement Source | Spec Section(s) | Component(s)/API(s) | Test Idea |
|-------|-------------------|-----------------|---------------------|-----------|
| **AC-1.1 - AC-1.6** | Story 3.1, PRD FR-3 | Services and Modules: ChatInterface, MessageList, InputField | ChatPage, ChatInterface components | Visual regression test: screenshot comparison with reference design |
| **AC-2.1 - AC-2.6** | Story 3.2, PRD FR-3, UX Principle 1 | Data Models: Message interface; Workflows: Message Send Flow | MessageList, MessageBubble components | Unit test: message rendering with role='user' vs 'assistant'; Integration test: auto-scroll behavior |
| **AC-3.1 - AC-3.7** | Story 3.3, PRD FR-3, FR-4 | Dependencies: react-markdown; Services: MessageBubble | MessageBubble with markdown renderer | Unit test: markdown parsing for each element type; Security test: XSS prevention |
| **AC-4.1 - AC-4.8** | Story 3.4, PRD FR-1, FR-2 | APIs: GET /api/agents; Data Models: Agent interface | AgentSelector, GET /api/agents endpoint | Integration test: scan test agents folder, verify all discovered; Edge case test: empty folder |
| **AC-5.1 - AC-5.8** | Story 3.5, PRD FR-3, FR-5 | APIs: POST /api/chat; Workflows: Message Send Flow | InputField, ChatInterface, POST /api/chat | Integration test: send message → verify API called with correct payload → response rendered |
| **AC-6.1 - AC-6.6** | Story 3.6, PRD FR-4, NFR-1 | Services: LoadingIndicator; Workflows: Message Send Flow step 5 | LoadingIndicator component | Unit test: loading state toggles correctly; Manual test: verify UX during slow responses |
| **AC-7.1 - AC-7.6** | Story 3.7, PRD FR-12 | Workflows: New Conversation Flow | ChatInterface reset button | Integration test: clear messages array, verify state reset, agent doesn't remember context |
| **AC-8.1 - AC-8.7** | Story 3.8, PRD FR-4, NFR-2, UX Principle 4 | Services: ErrorDisplay; Workflows: Error Handling Flow; NFR: Security (error sanitization) | ErrorDisplay component, error handling in ChatInterface | Unit test: error display styling; Integration test: API failure → error message shown → user can retry |

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: Epic 2 dependency completeness**
- **Description:** Epic 3 functional stories (3.5-3.8) cannot be fully tested without complete Epic 2 implementation
- **Impact:** High - chat interface will appear functional but fail when attempting real conversations
- **Mitigation:**
  - Complete Epic 2 100% before starting Story 3.5
  - Stories 3.1-3.4 can be built with Epic 1 only (UI shell + agent discovery)
  - Create mock /api/chat endpoint for Story 3.5 testing if Epic 2 delayed (NOT RECOMMENDED for solo dev)
- **Status:** Accepted - strict sequential epic completion enforced

**RISK-2: Markdown rendering library selection**
- **Description:** Wrong markdown library choice could introduce XSS vulnerabilities or performance issues
- **Impact:** Medium - security risk or poor user experience
- **Mitigation:**
  - Evaluate react-markdown (most popular, well-maintained)
  - Verify XSS protection built-in or add sanitization layer
  - Test with large markdown content (5000+ characters)
  - Fallback plan: use `marked` + `DOMPurify` if react-markdown has issues
- **Status:** Open - library selection needed in Story 3.3

**RISK-3: Message history scaling**
- **Description:** Long conversations (100+ messages) may cause performance degradation or memory issues
- **Impact:** Low for MVP - unlikely scenario in initial usage
- **Mitigation:**
  - Accept risk for MVP (no pagination)
  - Monitor performance during testing
  - Add virtualization (react-window) in Phase 2 if needed
- **Status:** Accepted - deferred to Phase 2

**RISK-4: Agent selector UI/UX with many agents**
- **Description:** Dropdown may be unwieldy if agent builders deploy 20+ agents
- **Impact:** Low for MVP - early usage will have few agents
- **Mitigation:**
  - Use native select dropdown for simplicity
  - Add search/filter in Phase 2 if needed
  - Consider grouping by folder structure in Phase 2
- **Status:** Accepted - simple dropdown sufficient for MVP

**RISK-5: Browser compatibility**
- **Description:** Markdown rendering or CSS may behave differently across browsers
- **Impact:** Medium - poor experience on some browsers
- **Mitigation:**
  - Test on Chrome, Firefox, Safari, Edge during Story 3.3
  - Use Tailwind CSS (good browser compatibility)
  - Avoid cutting-edge CSS features
  - Document known issues if any found
- **Status:** Mitigated - testing planned in Epic 6 Story 6.3

### Assumptions

**ASSUMPTION-1:** Epic 1 and Epic 2 are 100% complete before starting Story 3.5
- **Validation:** Verify all Epic 1 and Epic 2 acceptance criteria met
- **Impact if wrong:** Chat interface will not function, wasted development effort

**ASSUMPTION-2:** Agents folder contains at least one valid agent file for testing
- **Validation:** Include sample agent in repository for development/testing
- **Impact if wrong:** Cannot test agent selection or conversation flows

**ASSUMPTION-3:** OpenAI responses return within reasonable time (< 30 seconds)
- **Validation:** Monitor OpenAI API latency during Epic 2 testing
- **Impact if wrong:** May need timeout handling or streaming responses (Phase 2)

**ASSUMPTION-4:** Users are comfortable with ChatGPT-style interfaces
- **Validation:** User testing with non-technical users (Journey 2 persona)
- **Impact if wrong:** May need onboarding tooltips or help documentation

**ASSUMPTION-5:** Desktop browsers are primary usage environment
- **Validation:** Confirmed in PRD (mobile optimization deferred)
- **Impact if wrong:** Mobile users will have suboptimal experience (accepted for MVP)

**ASSUMPTION-6:** No real-time collaboration needed (single user per conversation)
- **Validation:** Confirmed by stateless API design
- **Impact if wrong:** Would require significant architecture changes (WebSocket, state sync)

### Open Questions

**QUESTION-1:** Should agent selector persist selection across browser refresh?
- **Context:** Currently stateless - refresh loses agent selection
- **Decision needed by:** Story 3.4 implementation
- **Options:** (a) Accept loss on refresh, (b) Use localStorage, (c) URL query parameter
- **Recommendation:** (a) Accept loss for MVP - simplest, consistent with stateless design

**QUESTION-2:** Multi-line input: Should Enter send or add newline?
- **Context:** Trade-off between convenience (Enter sends) vs multi-line messages (Shift+Enter sends)
- **Decision needed by:** Story 3.5 implementation
- **Options:** (a) Enter sends, Shift+Enter newline (ChatGPT pattern), (b) Always use button to send
- **Recommendation:** (a) Enter sends, Shift+Enter newline - matches user expectations

**QUESTION-3:** Should markdown rendering be toggleable (view raw)?
- **Context:** Some users may want to see raw markdown or copy formatted text
- **Decision needed by:** Story 3.3 implementation
- **Options:** (a) Always render, (b) Add toggle button, (c) Show raw in tooltip/hover
- **Recommendation:** (a) Always render for MVP - simplicity, add toggle in Phase 2 if requested

**QUESTION-4:** Error message detail level - technical vs user-friendly?
- **Context:** Balance between helpful debugging and avoiding technical jargon
- **Decision needed by:** Story 3.8 implementation
- **Options:** (a) Always user-friendly, (b) Detailed in dev mode, friendly in prod, (c) Toggle for advanced users
- **Recommendation:** (b) Detailed in dev, friendly in prod - best of both worlds

**QUESTION-5:** Should we display agent description in selector or just name?
- **Context:** Agent metadata includes optional description field
- **Decision needed by:** Story 3.4 implementation
- **Options:** (a) Name only, (b) Name + description tooltip, (c) Name with description visible
- **Recommendation:** (b) Name with description in tooltip - balances simplicity and discoverability

## Test Strategy Summary

### Test Levels and Coverage

**Unit Tests (Jest + React Testing Library):**
- **Component tests:**
  - MessageBubble: renders user vs assistant styling correctly, markdown parsing works
  - LoadingIndicator: shows/hides based on loading prop
  - ErrorDisplay: renders error messages with proper styling
  - InputField: validates empty messages, handles Enter key
  - AgentSelector: populates from agents list, handles selection change
- **Utility tests:**
  - Message validation logic (non-empty check)
  - Markdown sanitization (XSS prevention)
- **Coverage target:** 80%+ for components and utilities

**Integration Tests (React Testing Library + Mock API):**
- **User flow tests:**
  - Agent discovery: GET /api/agents → populate selector → select agent
  - Message send: type message → click send → message appears → API called → response rendered
  - New conversation: click reset → messages cleared → state reset
  - Error handling: API error → error message shown → can retry
- **State management tests:**
  - Messages array updates correctly
  - Loading state toggles correctly
  - Agent selection persists during conversation
- **Coverage target:** All critical user flows (Stories 3.4-3.8)

**End-to-End Tests (Manual for MVP):**
- **Full user journeys:**
  - Journey 2 (End User): Select agent → have conversation → view responses
  - Journey 3 (Agent Builder): Update agent files → reload → test changes
- **Cross-browser testing (Epic 6 Story 6.3):**
  - Chrome, Firefox, Safari, Edge
  - Focus on markdown rendering and CSS layout
- **Performance testing:**
  - Long conversations (50+ messages)
  - Large markdown responses (5000+ characters)
  - Multiple rapid messages

**Security Tests:**
- **XSS prevention:**
  - Inject script tags in user messages
  - Inject malicious markdown in agent responses
  - Verify sanitization working
- **API security:**
  - Invalid agent IDs
  - Malformed request payloads
  - Error message leakage (no internal paths)

### Test Data and Fixtures

**Test Agents:**
- Sample agent with simple responses (for basic testing)
- Agent with complex markdown responses (headings, lists, code, tables)
- Agent that triggers file operations (tests Epic 2 integration)

**Test Messages:**
- Short messages (1-10 words)
- Long messages (500+ words)
- Messages with special characters
- Empty messages (should be rejected)

**Mock API Responses:**
- Successful chat response
- API error (500)
- Network error (offline)
- Slow response (> 5 seconds)

### Testing Priorities

**Priority 1 (Must pass before story completion):**
- All acceptance criteria for each story
- XSS prevention in markdown rendering
- Error handling doesn't crash UI

**Priority 2 (Should pass before epic completion):**
- All integration tests
- Cross-browser compatibility (Chrome, Firefox)
- Performance acceptable for typical usage

**Priority 3 (Nice to have for MVP):**
- Edge case handling
- Safari and Edge testing
- Performance optimization

### Test Environment

**Local Development:**
- Jest + React Testing Library for unit/integration tests
- Manual testing with sample agents
- Browser DevTools for debugging

**Epic 2 Dependency Testing:**
- Full Epic 2 backend must be running for Stories 3.5-3.8 testing
- Mock /api/chat only acceptable for UI-only tests (Stories 3.1-3.4)

**Test Execution:**
- `npm test` runs all unit/integration tests
- Manual E2E testing checklist for each story
- Final validation during Epic 6 Story 6.8 (MVP Validation Test)
