# Story 4.1: Implement Agentic Execution Loop

Status: Ready

## Story

As a **developer**,
I want **to implement an agentic execution loop with function calling**,
so that **agents pause execution, load files via tools, and continue only after files are available**.

## Acceptance Criteria

**AC-4.1.1:** Implement while loop that continues until LLM returns response without tool calls

**AC-4.1.2:** Each iteration follows pattern: call OpenAI → check for tool calls → execute tools → inject results → loop back to LLM

**AC-4.1.3:** Conversation messages array grows with each tool call and result, maintaining full context

**AC-4.1.4:** Tool results injected as 'tool' role messages with tool_call_id matching the tool call

**AC-4.1.5:** Loop has safety limit (MAX_ITERATIONS = 50) to prevent infinite loops

**AC-4.1.6:** Each iteration logged for debugging with iteration count and tool call information

**AC-4.1.7:** Loop maintains conversation context across all iterations (messages array preserved)

**AC-4.1.8:** Agent cannot continue without tool results - execution blocks on tool calls (no premature continuation)

## Tasks / Subtasks

- [ ] **Task 1: Create Agentic Loop Module** (AC: 4.1.1, 4.1.2, 4.1.5)
  - [ ] Subtask 1.1: Create `lib/agents/agenticLoop.ts` file
  - [ ] Subtask 1.2: Define ExecutionResult interface (success, response, iterations, messages)
  - [ ] Subtask 1.3: Implement executeAgent function signature with agentId, userMessage, conversationHistory parameters
  - [ ] Subtask 1.4: Set MAX_ITERATIONS constant to 50
  - [ ] Subtask 1.5: Implement while loop structure with iterations counter
  - [ ] Subtask 1.6: Add loop termination conditions (no tool calls OR max iterations reached)

- [ ] **Task 2: Message Context Building** (AC: 4.1.3, 4.1.7)
  - [ ] Subtask 2.1: Initialize messages array with system prompt from buildSystemPrompt(agent)
  - [ ] Subtask 2.2: Add critical context messages from processCriticalActions(agent)
  - [ ] Subtask 2.3: Append conversation history from previous turns
  - [ ] Subtask 2.4: Add current user message to messages array
  - [ ] Subtask 2.5: Preserve messages array across all loop iterations

- [ ] **Task 3: OpenAI Integration** (AC: 4.1.2)
  - [ ] Subtask 3.1: Call openai.chat.completions.create with messages, tools, and model parameters
  - [ ] Subtask 3.2: Extract assistant message from response.choices[0].message
  - [ ] Subtask 3.3: Append assistant message to messages array
  - [ ] Subtask 3.4: Check for presence of tool_calls in assistant message
  - [ ] Subtask 3.5: Set tool_choice to 'auto' to allow LLM to choose when to call tools

- [ ] **Task 4: Tool Execution and Result Injection** (AC: 4.1.2, 4.1.4, 4.1.8)
  - [ ] Subtask 4.1: Iterate through each tool call in assistantMessage.tool_calls array
  - [ ] Subtask 4.2: Execute each tool call via executeToolCall(toolCall, bundleName) function
  - [ ] Subtask 4.3: Create tool result message with role: 'tool', tool_call_id, and content
  - [ ] Subtask 4.4: Append tool result message to messages array
  - [ ] Subtask 4.5: Continue loop only after ALL tool results injected (blocking behavior)

- [ ] **Task 5: Iteration Logging and Debugging** (AC: 4.1.6)
  - [ ] Subtask 5.1: Log iteration number at start of each loop iteration
  - [ ] Subtask 5.2: Log tool call names and parameters when tools are invoked
  - [ ] Subtask 5.3: Log tool result success/failure status
  - [ ] Subtask 5.4: Log final response when loop completes
  - [ ] Subtask 5.5: Include timestamp in log entries for performance tracking

- [ ] **Task 6: Loop Completion and Error Handling** (AC: 4.1.1, 4.1.5, 4.1.8)
  - [ ] Subtask 6.1: Return ExecutionResult with success=true when assistant message has no tool calls
  - [ ] Subtask 6.2: Include final assistant response content in result
  - [ ] Subtask 6.3: Include total iteration count in result
  - [ ] Subtask 6.4: Include final messages array in result for conversation history
  - [ ] Subtask 6.5: Throw error with clear message when MAX_ITERATIONS exceeded
  - [ ] Subtask 6.6: Log error details when max iterations limit hit

- [ ] **Task 7: Integration with Existing Systems** (AC: 4.1.7)
  - [ ] Subtask 7.1: Import and use existing loadAgent function to get agent metadata
  - [ ] Subtask 7.2: Import and use processCriticalActions for agent initialization (from Story 4.3)
  - [ ] Subtask 7.3: Import and use buildSystemPrompt for system message creation (from Story 4.8)
  - [ ] Subtask 7.4: Import and use executeToolCall for tool execution (from Story 4.5)
  - [ ] Subtask 7.5: Import and use getToolDefinitions for OpenAI tools parameter (from Story 4.5)

- [ ] **Task 8: Unit Testing** (AC: All)
  - [ ] Subtask 8.1: Test loop continues until no tool calls (mock assistant response with tool_calls, then without)
  - [ ] Subtask 8.2: Test MAX_ITERATIONS prevents infinite loops (mock assistant always returns tool calls)
  - [ ] Subtask 8.3: Test tool results injected correctly with tool_call_id
  - [ ] Subtask 8.4: Test messages array structure matches OpenAI chat format
  - [ ] Subtask 8.5: Test final ExecutionResult includes all expected fields

- [ ] **Task 9: Integration Testing** (AC: 4.1.2, 4.1.8)
  - [ ] Subtask 9.1: Test full execution with mocked OpenAI responses (2-3 tool call iterations)
  - [ ] Subtask 9.2: Verify execution blocks on tool calls (cannot continue without results)
  - [ ] Subtask 9.3: Verify conversation context maintained across iterations
  - [ ] Subtask 9.4: Test with realistic agent scenario requiring multiple file loads

## Dev Notes

### Architecture Patterns and Constraints

**Core Execution Pattern:**
The agentic loop replaces the deprecated Epic 2 simple function calling implementation. This is the foundational pattern that enables BMAD agents to work with OpenAI API.

**Key Difference from Epic 2:**
- Epic 2: Simple loop with acknowledgments (agents could continue without files)
- Epic 4: Blocking execution loop (agents MUST wait for tool results before continuing)

**Execution Flow:**
```
1. Build initial context (system + critical actions + history + user message)
2. Loop start:
   3. Call OpenAI with messages + tools
   4. Receive assistant response
   5. If tool_calls present:
      6. Execute ALL tools synchronously
      7. Inject results into messages array
      8. Go to step 3 (loop back to OpenAI)
   9. If NO tool_calls:
      10. Return final response (loop complete)
```

**Critical Implementation Notes:**
- Messages array is append-only - never remove or modify previous messages
- Each tool result MUST include matching tool_call_id from assistant's tool_calls
- Tool execution is synchronous within iteration (all tools complete before next LLM call)
- Loop termination has two conditions: (1) no tool calls OR (2) max iterations
- MAX_ITERATIONS = 50 is a safety net - normal workflows should complete in <10 iterations

### Component Locations and File Paths

**Primary Implementation:**
- `lib/agents/agenticLoop.ts` - Main execution loop (create new)

**Dependencies (from other Epic 4 stories):**
- `lib/agents/criticalActions.ts` - Critical actions processor (Story 4.3)
- `lib/agents/systemPromptBuilder.ts` - System prompt builder (Story 4.8)
- `lib/tools/fileOperations.ts` - Tool execution handlers (Story 4.5)
- `lib/pathResolver.ts` - Path variable resolution (Story 4.2)

**Integration Points:**
- Called by: `app/api/chat/route.ts` (Epic 3 Story 3.5 - refactored)
- Calls: OpenAI API via `openai` SDK
- Returns: ExecutionResult to API route for frontend response

### Testing Requirements

**Unit Tests (Required):**
1. Loop iteration logic (continues/terminates correctly)
2. Message array building and preservation
3. Tool call detection and execution triggering
4. Tool result injection format
5. Max iterations safety limit
6. Error handling and logging

**Integration Tests (Required):**
1. Full agent execution with mocked OpenAI (2-3 iterations)
2. Execution blocking behavior (verifies pause-load-continue)
3. Context preservation across iterations
4. Real workflow scenario with multiple file loads

**Test Data Needs:**
- Mock OpenAI responses with tool_calls
- Mock OpenAI responses without tool_calls (final response)
- Mock tool execution results
- Sample agent definition with critical actions

### References

**Technical Specifications:**
- [AGENT-EXECUTION-SPEC.md](../AGENT-EXECUTION-SPEC.md) - Section 3: Agentic Execution Loop (lines 80-140)
- [EPIC4-TECH-SPEC.md](../EPIC4-TECH-SPEC.md) - Section 4.1: Story 4.1 Implementation (lines 232-316)

**Product Requirements:**
- [PRD.md](../PRD.md) - FR-5: OpenAI API with Function Calling (lines 150-158)
- [epics.md](../epics.md) - Epic 4 Story 4.1 (lines 823-846)

**Related Architecture:**
- [solution-architecture.md](../solution-architecture.md) - Section 2: Application Architecture
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling

**Dependencies on Other Stories:**
- Story 4.2: Path Variable Resolution System (needed for tool execution)
- Story 4.3: Critical Actions Processor (needed for agent initialization)
- Story 4.5: File Operation Tools Refactor (needed for tool execution)
- Story 4.8: System Prompt Builder (needed for system message)

**Completion Blockers:**
This story can be implemented in parallel with Stories 4.2 and 4.3 by using placeholder/stub functions initially, then integrating real implementations when available.

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-05 | 0.1     | Initial draft | Bryan  |

## Dev Agent Record

### Context Reference

- [Story Context 4.1](../story-context-4.1.xml) - Generated 2025-10-05

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
