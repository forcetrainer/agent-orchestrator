# Story 3.10: Agent Initialization on Selection

Status: Ready for Review

## Story

As an **end user**,
I want **the agent to initialize and greet me when I select it**,
so that **I understand the agent's capabilities before sending my first message**.

## Acceptance Criteria

**AC-10.1:** When agent is selected, system loads agent definition file
**AC-10.2:** Agent file is sent to LLM with instruction to follow all instructions exactly as written
**AC-10.3:** LLM can request additional files via function calling (lazy-loading pattern)
**AC-10.4:** Agent greeting/welcome message displays automatically before user input
**AC-10.5:** Agent command list displays if defined in agent instructions
**AC-10.6:** Initialization completes before user can send first message
**AC-10.7:** Loading indicator shows during initialization process
**AC-10.8:** Initialization errors display clearly without crashing interface

## Tasks / Subtasks

- [x] **Task 1: Create Agent Initialization API** (AC: 10.1, 10.2, 10.3)
  - [x] Subtask 1.1: Create `POST /api/agent/initialize` endpoint
  - [x] Subtask 1.2: Load agent definition file from disk using existing agent loader
  - [x] Subtask 1.3: Send complete agent file content to LLM as system context
  - [x] Subtask 1.4: Include prompt: "You are this agent. Follow all instructions in this file exactly as written."
  - [x] Subtask 1.5: Use existing Epic 2 function calling infrastructure for file lazy-loading
  - [x] Subtask 1.6: Return LLM's initialization response (greeting, commands, etc.)
  - [x] Subtask 1.7: Handle errors gracefully (agent not found, LLM errors)

- [x] **Task 2: Integrate Initialization into Chat Flow** (AC: 10.4, 10.5, 10.6, 10.7)
  - [x] Subtask 2.1: Modify `ChatPanel.tsx` handleAgentSelect to call initialization API
  - [x] Subtask 2.2: Show loading state during initialization
  - [x] Subtask 2.3: Display LLM's initialization response as first message (system role)
  - [x] Subtask 2.4: Block user input until initialization completes
  - [x] Subtask 2.5: Clear any previous conversation when new agent selected

- [x] **Task 3: System Message Display** (AC: 10.4, 10.5)
  - [x] Subtask 3.1: Verify "system" message role exists in Message type (already implemented)
  - [x] Subtask 3.2: Update MessageBubble to style system messages distinctly (if needed)
  - [x] Subtask 3.3: Ensure system messages render markdown (greeting may include formatting)

- [x] **Task 4: Error Handling** (AC: 10.8)
  - [x] Subtask 4.1: Catch initialization errors gracefully
  - [x] Subtask 4.2: Display initialization errors as error messages in chat
  - [x] Subtask 4.3: Allow user to try selecting agent again after error
  - [x] Subtask 4.4: Log detailed error information for debugging

- [x] **Task 5: Testing** (All ACs)
  - [x] Subtask 5.1: Test initialization with alex-facilitator agent
  - [x] Subtask 5.2: Test initialization with casey-analyst agent
  - [x] Subtask 5.3: Test initialization with pixel-story-developer agent
  - [x] Subtask 5.4: Verify LLM receives complete agent file
  - [x] Subtask 5.5: Verify LLM can request files via function calling
  - [x] Subtask 5.6: Verify greeting and commands display correctly
  - [x] Subtask 5.7: Test error scenarios (agent not found, LLM errors, missing files)

## Dev Notes

### Requirements Context

**Source:** Sprint Change Proposal SCP-2025-10-05-001
**PRD Reference:** FR-2 "Agent Loading and Initialization" (docs/prd.md:112-116)
**User Journey:** Journey 2 - Agent greets Marcus (docs/prd.md:313)

**Key Requirements:**
- PRD FR-2 explicitly requires "Handle agent metadata and configuration from agent definition files"
- Current implementation bypasses agent initialization - loads only basic metadata
- Agent definition files (alex, casey, pixel) all contain `<critical-actions>` requiring execution before user interaction
- Blocks Story 3.9 validation - proper initialization is prerequisite for testing

**From Sprint Change Proposal:**
- Issue: Agent initialization missing from chat flow
- Missing steps: Execute `<critical-actions>`, load config files, set variables, display greeting
- Impact: Story 3.9 blocked, PRD FR-2 unfulfilled, UX Principle #1 violated
- Solution: Direct adjustment - add Story 3.10 within Epic 3

### Architecture Alignment

**Component:** Agent Initialization API + Chat Flow Integration
**New Module:** `app/api/agent/initialize/route.ts`
**Updated Component:** `components/chat/ChatPanel.tsx`

**LLM-Driven Initialization Pattern:**
- Agent definition files contain all instructions (activation, critical-actions, persona, etc.)
- System sends complete agent file to LLM without parsing
- LLM follows all instructions in the file exactly as written
- LLM uses function calling for lazy-loading additional files (Epic 2 infrastructure)
- LLM generates initialization response (greeting, commands, etc.)

**Dependencies:**
- Stories 3.1-3.8 (chat interface foundation) - COMPLETE ✅
- Epic 2 (OpenAI API integration with function calling) - COMPLETE ✅
- `lib/agents/loader.ts` (agent file loading) - COMPLETE ✅
- Message type with 'system' role - COMPLETE ✅

**Integration Points:**
- `AgentSelector.tsx:69` - `onAgentSelect(agentId)` callback triggers initialization
- `ChatPanel.tsx:44` - `handleAgentSelect` function - call new initialization API
- `lib/agents/loader.ts` - Existing agent loading - reuse for getting agent file path
- Epic 2 function calling - LLM can request files during initialization

### Project Structure Notes

**Implementation Approach:**

1. **Agent Initialization API** (`POST /api/agent/initialize`)
   - Load agent definition file from disk (reuse `lib/agents/loader.ts`)
   - Send complete agent file content to OpenAI API
   - Prompt: "You are this agent. Follow all instructions in this file exactly as written."
   - Use existing Epic 2 function calling infrastructure (read_file, write_file, etc.)
   - Return LLM's initialization response as API response
   - Handle errors: agent not found, LLM errors, timeout

2. **Chat Flow Integration** (Update `ChatPanel.tsx:44`)
   ```typescript
   const handleAgentSelect = async (agentId: string) => {
     setSelectedAgentId(agentId);
     setIsLoading(true);
     setMessages([]); // Clear previous conversation

     try {
       const response = await fetch('/api/agent/initialize', {
         method: 'POST',
         body: JSON.stringify({ agentId }),
       });

       const data = await response.json();

       if (data.success && data.greeting) {
         const greetingMessage: Message = {
           id: `system-${Date.now()}`,
           role: 'system',
           content: data.greeting,
           timestamp: new Date(),
         };
         setMessages([greetingMessage]);
       } else {
         // Show error
       }
     } catch (error) {
       // Handle network errors
     } finally {
       setIsLoading(false);
     }
   };
   ```

3. **LLM Handles All Agent Logic**
   - NO XML parsing in application code
   - NO config file parsing in application code
   - NO variable substitution in application code
   - LLM reads the agent file and follows its instructions
   - LLM requests files via function calling when needed
   - LLM generates greeting based on agent instructions

4. **UI Updates**
   - System message styling (may already exist)
   - Loading indicator during initialization
   - Error display for initialization failures
   - Markdown rendering for greeting (already supported)

### Testing Strategy

**Test Agents:**
- `agents/alex/alex-facilitator.md` - Contains activation instructions and critical-actions
- `agents/casey/casey-analyst.md` - Contains persona and command definitions
- `agents/pixel/pixel-story-developer.md` - Contains greeting and command list

**Test Scenarios:**
1. Select agent → verify LLM receives complete agent file
2. Verify LLM generates greeting based on agent instructions
3. Check console logs → verify API call to /api/agent/initialize
4. Verify LLM can request files via function calling (if agent instructions require)
5. Verify user input blocked until initialization completes
6. Verify greeting displays as system message with proper styling
7. Test error: agent not found → verify error message displays
8. Test error: LLM timeout → verify graceful handling

**Success Criteria:**
- Agent greeting displays before user can input message ✅
- Commands visible in greeting if agent defines them ✅
- LLM follows agent file instructions (no client-side interpretation) ✅
- Function calling works for file lazy-loading ✅
- Story 3.9 can proceed with manual validation ✅

### References

- [Source: Sprint Change Proposal SCP-2025-10-05-001]
- [Source: docs/prd.md#FR-2: Agent Loading and Initialization (lines 112-116)]
- [Source: docs/prd.md#User Journey 2: End User - Getting Guided Assistance (line 313)]
- [Source: agents/alex/alex-facilitator.md (critical-actions pattern)]
- [Source: agents/casey/casey-analyst.md (critical-actions pattern)]
- [Source: agents/pixel/pixel-story-developer.md (critical-actions pattern)]

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-05 | 0.1     | Initial draft | Winston (Architect) |
| 2025-10-05 | 1.0     | Implementation complete | Amelia (Dev Agent) |

## File List

### New Files
- `app/api/agent/initialize/route.ts` - Agent initialization API endpoint

### Modified Files
- `components/chat/ChatPanel.tsx` - Updated handleAgentSelect to call initialization API
- `components/chat/MessageBubble.tsx` - Updated system message styling and markdown rendering
- `lib/types.ts` - Added 'error' role to Message interface
- `app/api/chat/route.ts` - Filter error messages when building OpenAI message array

## Dev Agent Record

### Context Reference

- Sprint Change Proposal SCP-2025-10-05-001 (Generated: 2025-10-05)
- Unblocks Story 3.9 manual validation testing
- Story Context: docs/story-context-3.3.10.xml (Generated: 2025-10-05)

### Completion Notes

**Implementation Summary:**
Successfully implemented agent initialization on selection (Story 3.10). All 8 acceptance criteria met.

**Key Achievements:**
- Created `/api/agent/initialize` endpoint that loads agent files and sends to LLM
- LLM-driven initialization: no XML parsing in app code, LLM follows agent instructions
- Integrated initialization into ChatPanel with loading state and error handling
- System messages styled with blue-gray background, border, and markdown support
- Function calling infrastructure works (AC-10.3 verified with casey-analyst test)

**Test Results:**
- alex-facilitator: ✅ Initialized successfully, greeting with 9 commands displayed
- casey-analyst: ✅ Function calling verified (10 iterations, read_file/list_files calls)
- Error handling: ✅ 404 for non-existent agent, graceful error display
- Build: ✅ No TypeScript errors, production build successful

**Files Modified:** 5 files (1 new, 4 modified)

**Technical Notes:**
- System message role used for greetings (distinct from error messages)
- Message type extended with 'error' role for proper typing
- Error messages filtered from OpenAI API calls (not a supported role)
- Loading state blocks user input until initialization completes (AC-10.6)

### Agent Model Used

claude-sonnet-4-5-20250929
