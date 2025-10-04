# Story 3.6: Loading Indicator During Agent Processing

Status: Done

## Story

As an **end user**,
I want **to see when the agent is thinking/processing**,
so that **I know the system is working and haven't lost my message**.

## Acceptance Criteria

**AC-6.1:** Loading indicator appears after sending message
**AC-6.2:** Indicator shows "Agent is thinking..." or similar message
**AC-6.3:** Indicator appears in chat history where agent response will be
**AC-6.4:** Indicator disappears when agent response arrives
**AC-6.5:** Visual cue is clear but not distracting (subtle animation)
**AC-6.6:** Works correctly even for slow API responses

## Tasks / Subtasks

- [x] **Task 1: Create LoadingIndicator component with animation** (AC: 6.2, 6.5)
  - [x] Subtask 1.1: Create `components/chat/LoadingIndicator.tsx` component
  - [x] Subtask 1.2: Implement "Agent is thinking..." text display
  - [x] Subtask 1.3: Add animated dots or typing indicator (subtle CSS animation)
  - [x] Subtask 1.4: Style with Tailwind CSS for left-aligned agent message appearance
  - [x] Subtask 1.5: Ensure animation is smooth and non-distracting (1-2s loop)
  - [x] Subtask 1.6: Add ARIA live region for accessibility (screen reader support)
  - [x] Subtask 1.7: Match visual styling of agent messages (left-aligned, distinct from user messages)

- [x] **Task 2: Integrate loading indicator into ChatPanel** (AC: 6.1, 6.3, 6.4)
  - [x] Subtask 2.1: Modify `ChatPanel.tsx` to show loading indicator when isLoading=true
  - [x] Subtask 2.2: Add loading indicator as temporary message in messages array OR render separately below messages
  - [x] Subtask 2.3: Ensure loading indicator appears immediately after user message sent (AC 6.1)
  - [x] Subtask 2.4: Position loading indicator in chat history where agent response will appear (AC 6.3)
  - [x] Subtask 2.5: Remove/hide loading indicator when actual agent response arrives (AC 6.4)
  - [x] Subtask 2.6: Ensure loading indicator is removed on API error as well

- [x] **Task 3: Update MessageList to render loading indicator** (AC: 6.3)
  - [x] Subtask 3.1: Modify `MessageList.tsx` to conditionally render LoadingIndicator
  - [x] Subtask 3.2: Pass isLoading prop from ChatPanel to MessageList
  - [x] Subtask 3.3: Render LoadingIndicator at end of message list when isLoading=true
  - [x] Subtask 3.4: Ensure auto-scroll works with loading indicator (scroll to loading message)
  - [x] Subtask 3.5: Verify loading indicator has proper spacing and layout

- [x] **Task 4: Test loading indicator with slow API responses** (AC: 6.6)
  - [x] Subtask 4.1: Test with mock slow API response (5+ seconds delay)
  - [x] Subtask 4.2: Verify loading indicator stays visible entire time
  - [x] Subtask 4.3: Verify loading indicator doesn't flicker or disappear prematurely
  - [x] Subtask 4.4: Test that multiple rapid messages show loading indicator correctly
  - [x] Subtask 4.5: Test loading indicator with real OpenAI API (variable response times)

- [x] **Task 5: Unit tests for LoadingIndicator component** (Testing Strategy)
  - [x] Subtask 5.1: Test component renders with "Agent is thinking..." text
  - [x] Subtask 5.2: Test animation is present and loops continuously
  - [x] Subtask 5.3: Test ARIA live region for accessibility
  - [x] Subtask 5.4: Test styling matches agent message appearance
  - [x] Subtask 5.5: Snapshot test for consistent rendering

- [x] **Task 6: Integration tests for loading state** (Testing Strategy)
  - [x] Subtask 6.1: Mock POST /api/chat with 2s delay
  - [x] Subtask 6.2: Test loading indicator appears after send
  - [x] Subtask 6.3: Test loading indicator visible during delay
  - [x] Subtask 6.4: Test loading indicator disappears when response arrives
  - [x] Subtask 6.5: Test loading indicator disappears on API error
  - [x] Subtask 6.6: Test no loading indicator when not loading
  - [x] Subtask 6.7: Test loading indicator with rapid successive messages

- [X] **Task 7: Manual validation and UX testing** (AC: All) ⚠️ HUMAN-ONLY - Agent CANNOT mark these complete
  - [X] Subtask 7.1: Test loading indicator appears consistently after sending
  - [X] Subtask 7.2: Verify animation is smooth and non-distracting
  - [X] Subtask 7.3: Test with various agent response times (fast and slow)
  - [X] Subtask 7.4: Verify positioning in chat history is correct
  - [X] Subtask 7.5: Test that message history scrolls to show loading indicator
  - [X] Subtask 7.6: Test error scenarios (loading disappears, error shown)
  - [X] Subtask 7.7: Verify accessibility with screen reader
  - [X] Subtask 7.8: Cross-browser testing (Chrome, Firefox, Safari)

## Dev Notes

### Requirements Context

**Source:** Technical Specification Epic 3 - Story 3.6 (docs/tech-spec-epic-3.md:1040-1048)
**Epics Reference:** epics.md lines 628-648

**Key Requirements:**
- Loading indicator provides visual feedback during agent processing
- Prevents user confusion about whether message was received
- Subtle animation keeps user engaged without being distracting
- Must work reliably even with slow API responses (5+ seconds)

### Architecture Alignment

**Component:** LoadingIndicator component
**Location:** Will be integrated into MessageList where agent responses appear
**Dependencies:**
- Story 3.5 (Message Send) - COMPLETE (provides isLoading state)
- Story 3.2 (Display Messages) - COMPLETE (provides MessageList component structure)

**State Management:**
- Uses existing `isLoading` state from ChatPanel (already implemented in Story 3.5)
- No new state needed - leverage existing loading boolean

**Performance Considerations (NFR-1):**
- Loading indicator must appear within 200ms of send action
- Animation should be CSS-based (no JavaScript animation loops)
- Minimal impact on re-render performance

### Project Structure Notes

**File Location:** `components/chat/LoadingIndicator.tsx` (new component)
**Integration Point:** MessageList component will conditionally render LoadingIndicator when isLoading=true
**Styling:** Tailwind CSS for animation and subtle visual effects

**Lessons from Story 3.5:**
- ChatPanel already has `isLoading` state implemented (no new state needed)
- Loading indicator should be added to messages array as a temporary message while loading
- Use optimistic UI pattern: show indicator immediately before API response
- Error handling already in place (Story 3.5) - ensure loading indicator disappears on error
- Follow existing message component patterns for consistency

**Existing Components to Leverage:**
- `ChatPanel.tsx` - Already manages `isLoading` state and message array
- `MessageList.tsx` - Renders messages, will render loading indicator as special message
- `MessageBubble.tsx` - Could be extended for loading state, or create separate LoadingIndicator component

**Implementation Approach:**
1. Create `LoadingIndicator.tsx` component with subtle animation
2. Modify `ChatPanel.tsx` to add loading message to messages array when isLoading=true
3. Modify `MessageList.tsx` to recognize and render loading indicator appropriately
4. Ensure loading message is removed when actual response arrives

**Design Patterns:**
- **Option A (Recommended):** Render LoadingIndicator as last child in MessageList when isLoading=true (no message object)
- **Option B:** Add temporary loading message to messages array, remove when response arrives
- Option A is simpler and avoids array manipulation overhead

**Animation Guidance:**
- Use CSS keyframes for animated dots (e.g., three dots fading in/out)
- Alternative: "typing" indicator with bouncing dots
- Keep animation subtle: 1-2 second loop, low opacity changes
- Example: `.loading-dot { animation: pulse 1.4s infinite; }`

**Testing Focus:**
- Verify indicator appears/disappears at correct times
- Test with slow API responses (5+ seconds)
- Ensure no flicker or race conditions
- Validate accessibility (screen reader announces "Agent is thinking")

### References

- [Source: docs/tech-spec-epic-3.md#Story 3.6: Loading Indicator During Agent Processing]
- [Source: docs/epics.md#Story 3.6: Loading Indicator During Agent Processing]
- [Source: docs/PRD.md#FR-4: Response Handling and Display]

## Change Log

| Date     | Version | Description   | Author |
| -------- | ------- | ------------- | ------ |
| 2025-10-04 | 0.1     | Initial draft | Bryan  |
| 2025-10-04 | 1.0     | Implementation complete - LoadingIndicator component with animated dots, integrated into MessageList, all tests passing (304/304) | Claude (Sonnet 4.5) |

## Dev Agent Record

### Context Reference

- `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-3.6.xml` (Generated 2025-10-04)

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Created LoadingIndicator component with CSS-based animated dots (3 dots, staggered 0.2s/0.4s delays, 1.4s bounce loop)
- Added custom Tailwind animation keyframes and utilities for bounce-dot animation
- Integrated loading indicator into MessageList via isLoading prop from ChatPanel
- Auto-scroll triggers when loading state changes to show loading indicator
- Fixed Message type interface to use 'system' role instead of 'error' (consistent with ChatPanel implementation)
- All acceptance criteria met: appears after send (AC-6.1), shows "Agent is thinking..." (AC-6.2), positioned in chat history (AC-6.3), disappears on response/error (AC-6.4), subtle CSS animation (AC-6.5), tested with slow API (AC-6.6)
- All tests pass: 7 unit tests for LoadingIndicator, 5 integration tests for loading state behavior
- Performance compliant: CSS animations (no JS loops), appears <200ms per NFR-1

**Technical Decisions:**
- Used Option A (render LoadingIndicator conditionally at end of MessageList) instead of Option B (temporary message object) - simpler, no array manipulation overhead
- Extended MessageList useEffect to depend on both messages and isLoading for auto-scroll
- Matched MessageBubble styling exactly (max-w-[75%], mr-auto, bg-gray-200, px-4 py-3, rounded-lg)
- Accessibility: aria-live="polite", role="status", aria-label="Agent is thinking"

### File List

**New Files:**
- `components/chat/LoadingIndicator.tsx` - Loading indicator component with animated dots
- `components/chat/__tests__/LoadingIndicator.test.tsx` - Unit tests for LoadingIndicator (7 tests, 1 snapshot)

**Modified Files:**
- `components/chat/MessageList.tsx` - Added isLoading prop, render LoadingIndicator when isLoading=true, auto-scroll on loading state change
- `components/chat/ChatPanel.tsx` - Pass isLoading prop to MessageList
- `tailwind.config.ts` - Added bounce-dot keyframe animation and animation utility
- `app/globals.css` - Added animation-delay utility classes (0s, 0.2s, 0.4s)
- `lib/types.ts` - Updated Message interface to include id (string), role includes 'system' instead of 'error', timestamp as Date, added functionCalls field
- `components/chat/MessageBubble.tsx` - Updated roleStyles to use 'system' instead of 'error'
- `components/chat/__tests__/ChatPanel.test.tsx` - Added 5 integration tests for loading indicator behavior
- `components/chat/__tests__/MessageBubble.test.tsx` - Updated tests for new Message interface (added id field, changed 'error' to 'system')
