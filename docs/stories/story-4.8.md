# Story 4.8: Implement System Prompt Builder with Tool Usage Instructions

Status: ContextReadyDraft

## Story

As a **developer**,
I want **to build system prompts that instruct OpenAI to actively use tools**,
So that **file load instructions trigger actual tool calls instead of being acknowledged as text**.

## Acceptance Criteria

**AC-4.8.1:** System prompt includes agent persona, role, identity, principles

**AC-4.8.2:** System prompt explicitly instructs: "When you see instructions to load files, use the read_file tool"

**AC-4.8.3:** System prompt lists available tools and their purpose

**AC-4.8.4:** System prompt explains workflow execution pattern

**AC-4.8.5:** System prompt emphasizes: "DO NOT just acknowledge file load instructions - actually call the tools"

**AC-4.8.6:** Available commands from agent's `<cmds>` section included in prompt

**AC-4.8.7:** System prompt tested to verify it triggers tool calls (not just text acknowledgment)

## Tasks / Subtasks

- [ ] **Task 1: Create System Prompt Builder Module** (AC: 4.8.1, 4.8.2, 4.8.3, 4.8.4, 4.8.5, 4.8.6)
  - [ ] Subtask 1.1: Create `/lib/agents/systemPromptBuilder.ts` file
  - [ ] Subtask 1.2: Parse agent XML to extract persona, role, identity, principles
  - [ ] Subtask 1.3: Extract available commands from `<cmds>` section
  - [ ] Subtask 1.4: Build tool list section with read_file, write_file, list_files descriptions
  - [ ] Subtask 1.5: Add explicit tool usage instructions emphasizing actual calls vs acknowledgment
  - [ ] Subtask 1.6: Add workflow execution pattern explanation
  - [ ] Subtask 1.7: Assemble complete system prompt from all sections

- [ ] **Task 2: Integrate with Agentic Loop** (AC: 4.8.1, 4.8.7)
  - [ ] Subtask 2.1: Import buildSystemPrompt into agenticLoop.ts
  - [ ] Subtask 2.2: Call buildSystemPrompt() in executeAgent() before OpenAI call
  - [ ] Subtask 2.3: Pass agent definition and available tools to builder
  - [ ] Subtask 2.4: Use generated system prompt as first message in conversation
  - [ ] Subtask 2.5: Update initialization route to use system prompt builder

- [ ] **Task 3: Testing and Validation** (AC: 4.8.7)
  - [ ] Subtask 3.1: Unit test buildSystemPrompt() with sample agent definition
  - [ ] Subtask 3.2: Verify system prompt includes all required sections
  - [ ] Subtask 3.3: Test with agent that has critical-actions requiring file loads
  - [ ] Subtask 3.4: Verify OpenAI calls read_file tool (not just acknowledges)
  - [ ] Subtask 3.5: Test with different agent types (with/without commands section)
  - [ ] Subtask 3.6: Validate prompt format is compatible with OpenAI API

## Dev Notes

### Architecture Patterns and Constraints

**Purpose and Context:**
This story addresses a critical issue discovered during Epic 4 development: OpenAI tends to acknowledge file load instructions as text rather than actually calling the read_file tool. The system prompt builder creates explicit, emphatic instructions that force OpenAI to execute tools instead of describing them.

**AGENT-EXECUTION-SPEC.md Section 6 Reference:**
Per the architectural specification, the system prompt must:
1. Include agent persona to establish role and capabilities
2. List all available tools with clear descriptions
3. Emphasize tool execution over acknowledgment
4. Provide workflow execution context
5. Make tool usage instructions impossible to misinterpret

**Integration with Story 4.1 (Agentic Loop):**
- System prompt becomes the first message in the conversation array
- Sets context for all subsequent tool calls
- Establishes execution expectations before agent processes user input

**Integration with Story 4.3 (Critical Actions):**
- Critical actions output appended after system prompt
- Config variables already resolved when building prompt
- Agent commands extracted from parsed XML

### Component Locations and File Paths

**New Component:**
- `/lib/agents/systemPromptBuilder.ts` - System prompt builder module (NEW)

**Modified Components:**
- `lib/agents/agenticLoop.ts` - Import and use buildSystemPrompt() in executeAgent()
- `app/api/agent/initialize/route.ts` - Potentially use system prompt during initialization

**Dependencies:**
- Story 4.1 (Agentic Loop) - executeAgent() function modified to use system prompt
- Story 4.3 (Critical Actions) - Agent XML parsing patterns reused
- Story 4.7 (Agent Initialization) - Initialization flow updated with system prompt

**Data Flow:**
1. Agent XML loaded from bundle
2. Parse persona, role, identity, principles from `<persona>` section
3. Parse available commands from `<cmds>` section
4. Build tool list (read_file, write_file, list_files)
5. Assemble complete system prompt with all sections
6. Pass system prompt as first message to OpenAI
7. OpenAI uses prompt context for all subsequent interactions

### Testing Requirements

**Unit Testing:**
1. Test buildSystemPrompt() returns complete prompt structure
2. Verify persona section extracted correctly from agent XML
3. Verify commands section parsed and formatted correctly
4. Verify tool list includes all required tools with descriptions
5. Verify emphasis statements present ("DO NOT just acknowledge...")
6. Test with agent XML variations (with/without commands, different personas)

**Integration Testing:**
1. Test full agentic loop with generated system prompt
2. Verify OpenAI actually calls read_file when instructed
3. Verify agent personality reflects persona from prompt
4. Test with multiple agents to ensure consistent behavior
5. Compare tool calling rate before/after system prompt implementation

**Validation Testing (AC-4.8.7):**
1. Create test agent with critical-actions requiring file load
2. Initialize agent with system prompt
3. Monitor OpenAI API calls to verify tool execution
4. Confirm file loads execute (not just acknowledged)
5. Document tool calling improvement metrics

### References

**Specification Sources:**
- [Source: docs/epics.md#Story-4.8] - Acceptance criteria (lines 1001-1022)
- [Source: docs/AGENT-EXECUTION-SPEC.md#Section-6] - System prompt builder specification
- [Source: docs/PRD.md#FR-5-OpenAI-Integration] - Agentic execution loop requirements

**Architecture Context:**
- Story 4.1 (Agentic Loop) - Integration point for system prompt
- Story 4.3 (Critical Actions) - XML parsing patterns
- Story 4.7 (Agent Initialization) - Initialization flow context

**Technical Implementation Pattern:**

From AGENT-EXECUTION-SPEC.md Section 6:
```
System Prompt Structure:
1. Agent Identity (from <persona> section)
   - Role, identity, communication style, principles
2. Tool Usage Instructions (CRITICAL)
   - "When you see instructions to load files, use the read_file tool"
   - "DO NOT just acknowledge - actually call the tools"
   - List all available tools with descriptions
3. Workflow Execution Pattern
   - Explain pause-load-continue pattern
   - Describe how tool results feed back into conversation
4. Available Commands (from <cmds> section)
   - User-facing commands agent can execute
```

**Key Technical Mandate:**
The prompt must be explicit and emphatic about tool usage. OpenAI's default behavior is to acknowledge instructions politely rather than execute them. The system prompt must override this tendency through clear, repeated emphasis on actual execution.

### Project Structure Notes

**Alignment with Epic 4 Architecture:**
This story completes the agent execution infrastructure:
- Story 4.1 (Agentic Loop) ✅ → Provides execution engine
- Story 4.2 (Path Resolution) ✅ → Resolves file paths for tools
- Story 4.3 (Critical Actions) ✅ → Handles initialization
- Story 4.6 (Bundle Discovery) ✅ → Provides agent metadata
- Story 4.7 (Agent Initialization) ✅ → Orchestrates startup
- **Story 4.8 (this story):** Ensures OpenAI understands how to execute

**Completion Enables:**
- Story 4.9 (End-to-End Validation) - System prompt ensures proper tool execution during validation
- Improved tool calling reliability across all agent interactions
- Foundation for complex multi-step agent workflows

**No Structural Conflicts:**
- New systemPromptBuilder.ts follows established `/lib/agents/` pattern
- Integration points already exist in agenticLoop.ts
- No changes to API surface or component interfaces

**Learning from Story 4.7:**
Story 4.7 review identified TypeScript type safety issue. Apply learning:
- Use strict TypeScript types for function signatures
- Ensure parameter names match across function calls
- Run `npx tsc --noEmit` before committing

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-05 | 0.1     | Initial draft | Bryan  |

## Dev Agent Record

### Context Reference

- /Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-4.8.xml

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
