# Epic 4 Implementation Checklist
## Agent Execution Architecture & Bundle System - PO/SM Execution Guide

**Date Created:** 2025-10-05
**Change Scope:** MODERATE
**Primary Owner:** Product Owner / Scrum Master
**Related Document:** sprint-change-proposal-epic4.md

---

## QUICK SUMMARY

**What Happened:**
- Story 3.10 validation revealed agent execution doesn't match Claude Code behavior
- Epic 2 implementation is fundamentally flawed (agents don't load files reliably)
- Need to create Epic 4 to implement correct architecture

**What We're Doing:**
- Create new Epic 4 with 12 stories to fix agent execution
- Deprecate Epic 2 stories 2.6, 2.7, 2.8 (learning preserved)
- Mark Epic 3 stories 3.4, 3.9, 3.10 as blocked
- Renumber Epic 4-6 to Epic 5-7
- Add 1.5-2 sprints to timeline

**MVP Impact:** NONE - Same scope, correct implementation

---

## PHASE 1: IMMEDIATE ACTIONS (DAY 1)

### Backlog Tool Updates

**Epic Creation:**
- [ ] Create new Epic 4: "Agent Execution Architecture & Bundle System"
- [ ] Set Epic 4 priority: HIGH (blocks Epic 5-7)
- [ ] Set Epic 4 status: In Progress
- [ ] Link Epic 4 to sprint-change-proposal-epic4.md

**Epic 2 Deprecation:**
- [ ] Update Epic 2 title: "OpenAI Integration (DEPRECATED - See Epic 4)"
- [ ] Update Epic 2 status: Complete (Deprecated)
- [ ] Add Epic 2 note: "Implementation replaced by Epic 4 due to execution pattern mismatch"
- [ ] Mark Story 2.6 as: "Superseded by Epic 4 Story 4.1"
- [ ] Mark Story 2.7 as: "Superseded by Epic 4 Stories 4.3, 4.7"
- [ ] Mark Story 2.8 as: "Superseded by Epic 4 Story 4.2"

**Epic 3 Partial Completion:**
- [ ] Update Epic 3 status: Partially Complete
- [ ] Update Epic 3 note: "UI complete (3.1-3.8), agent logic needs Epic 4"
- [ ] Mark Story 3.4 as: "Blocked - needs bundle rework in Epic 4 Story 4.6"
- [ ] Mark Story 3.9 as: "Blocked - needs re-validation after Epic 4 Story 4.9"
- [ ] Mark Story 3.10 as: "Blocked - needs Epic 4 Story 4.7"

---

## PHASE 2: EPIC 4 STORY CREATION (WEEK 1)

### Story Template for Backlog Tool

**Copy this template for each story:**

```
Story ID: [Auto-generated]
Epic: Epic 4 - Agent Execution Architecture & Bundle System
Priority: [See priority list below]
Estimate: [TBD - assign during planning poker]
Status: Pending
Dependencies: [See dependency list below]

Title: [From story list below]

Description:
[Copy "As a..." statement from story list below]

Acceptance Criteria:
[Copy numbered list from story list below]

Technical Notes:
[Copy technical notes from story list below]

Labels: Epic4, Architecture, Refactor
```

---

### Story 4.1: Implement Agentic Execution Loop

**Priority:** CRITICAL (blocking all other stories)
**Dependencies:** None (Epic 1 complete, Epic 3.1-3.8 complete)
**Estimate:** TBD

**Title:** Implement Agentic Execution Loop

**As a** developer
**I want** to implement an agentic execution loop with function calling
**So that** agents pause execution, load files via tools, and continue only after files are available

**Acceptance Criteria:**
1. Implement while loop that continues until LLM returns response without tool calls
2. Each iteration: call OpenAI → check for tool calls → execute tools → inject results → loop
3. Conversation messages array grows with each tool call and result
4. Tool results injected as 'tool' role messages with tool_call_id
5. Loop has safety limit (max 50 iterations) to prevent infinite loops
6. Each iteration logged for debugging
7. Loop maintains conversation context across all iterations
8. Agent cannot continue without tool results (execution blocks on tool calls)

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 3: "Agentic Execution Loop"
- Replace existing simple function calling from Epic 2 Story 2.6
- Messages array structure: system → user → assistant (with tool_calls) → tool → assistant → ...

---

### Story 4.2: Implement Path Variable Resolution System

**Priority:** CRITICAL (blocking stories 4.3-4.12)
**Dependencies:** Story 4.1
**Estimate:** TBD

**Title:** Implement Path Variable Resolution System

**As a** developer
**I want** to resolve BMAD path variables in file paths
**So that** agents can use {bundle-root}, {core-root}, and {project-root} to navigate files

**Acceptance Criteria:**
1. Resolve {bundle-root} to `bmad/custom/bundles/{bundle-name}/`
2. Resolve {core-root} to `bmad/core/`
3. Resolve {project-root} to application root directory
4. Resolve {config_source}:variable_name by loading bundle config.yaml
5. Support nested variable resolution (variables within variables)
6. Resolution happens before executing file operation tools
7. Invalid variable references return clear error messages
8. Path resolution function unit tested with all variable types

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 5: "Path Resolution System"
- Create `lib/pathResolver.ts` utility
- Load bundle config.yaml once per agent session, cache for variable lookups
- Resolve in order: config references → system variables → path variables

---

### Story 4.3: Implement Critical Actions Processor

**Priority:** HIGH
**Dependencies:** Story 4.2
**Estimate:** TBD

**Title:** Implement Critical Actions Processor

**As a** developer
**I want** to execute agent critical-actions during initialization
**So that** agents can load config files and set up initial context

**Acceptance Criteria:**
1. Parse `<critical-actions>` section from agent.md XML
2. Extract file load instructions: "Load into memory {path} and set variables: var1, var2"
3. Execute file loads via read_file function during initialization
4. Inject loaded file contents as system messages before user input
5. Parse config.yaml files and store variables for resolution
6. Execute non-file instructions as system messages
7. All critical actions complete before agent accepts first user message
8. Errors in critical actions halt initialization with clear message

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 4: "Critical Actions Processor"
- Create `lib/agents/criticalActions.ts`
- Critical actions run BEFORE agentic loop starts

---

### Story 4.4: Implement Bundle Structure Discovery and Loading

**Priority:** HIGH
**Dependencies:** Story 4.2
**Estimate:** TBD

**Title:** Implement Bundle Structure Discovery and Loading

**As a** developer
**I want** to discover agents from bundle manifests
**So that** the system can load bundled agents with proper metadata

**Acceptance Criteria:**
1. Scan `bmad/custom/bundles/*/bundle.yaml` files
2. Parse bundle.yaml to extract type (bundle vs standalone)
3. Extract agent metadata: id, name, title, description, icon, file, entry_point
4. Filter agents to only show entry_point: true in agent selector
5. Return agent list with bundle context
6. Validate bundle structure (required: bundle.yaml, agents/, config.yaml)
7. Handle missing or malformed bundle.yaml gracefully
8. Update `/api/agents` endpoint to return bundled agents

**Technical Notes:**
- Follow BUNDLE-SPEC.md Section "Server Integration > Agent Discovery"
- Replace Epic 3 Story 3.4 agent discovery implementation
- Create `lib/agents/bundleScanner.ts`

---

### Story 4.5: Refactor File Operation Tools for Agentic Loop

**Priority:** HIGH
**Dependencies:** Story 4.1, Story 4.2
**Estimate:** TBD

**Title:** Refactor File Operation Tools for Agentic Loop

**As a** developer
**I want** to refactor existing read_file, write_file, list_files tools
**So that** they work correctly within the agentic execution loop and support path variables

**Acceptance Criteria:**
1. Update read_file to resolve path variables before reading
2. Update write_file to resolve path variables before writing
3. Update list_files to resolve path variables before listing
4. Tools return results in format compatible with agentic loop context injection
5. Tool results include resolved paths for debugging
6. Path security validation works with resolved paths
7. Tools work with bundle structure
8. Existing Epic 2 tool tests refactored to test with path variables

**Technical Notes:**
- Modify existing `lib/fileOperations.ts` from Epic 2
- Add path resolution step before Epic 2 security checks
- Ensure tool results inject cleanly into conversation messages array

---

### Story 4.6: Refactor Agent Discovery for Bundle Structure

**Priority:** MEDIUM
**Dependencies:** Story 4.4
**Estimate:** TBD

**Title:** Refactor Agent Discovery for Bundle Structure

**As a** developer
**I want** to update agent discovery to load from bundle manifests
**So that** bundled agents display correctly in agent selector

**Acceptance Criteria:**
1. Frontend calls `/api/agents` and receives bundled agent list
2. Agent selector dropdown displays agent name and title from bundle.yaml
3. Selecting agent loads from bundle structure
4. Agent metadata available for UI enhancement
5. Empty bundles folder shows "No agents available" message
6. Malformed bundles logged but don't crash agent selector

**Technical Notes:**
- Update frontend agent selector component from Epic 3 Story 3.4
- Keep UI simple: flat list of all entry_point agents
- Agent ID from bundle.yaml used as unique identifier

---

### Story 4.7: Re-implement Agent Initialization with Critical Actions

**Priority:** HIGH
**Dependencies:** Story 4.3, Story 4.6
**Estimate:** TBD

**Title:** Re-implement Agent Initialization with Critical Actions

**As a** developer
**I want** to execute agent initialization using critical actions processor
**So that** agents load config and greet users correctly on selection

**Acceptance Criteria:**
1. When agent selected, load agent.md from bundle
2. Parse and execute `<critical-actions>` section
3. Load bundle config.yaml if specified in critical actions
4. Execute file loads via agentic loop
5. Display agent greeting message after initialization completes
6. Loading indicator shows during initialization
7. Initialization errors display clearly without crashing UI
8. User can send first message after initialization completes

**Technical Notes:**
- Replace Epic 3 Story 3.10 implementation
- Combines critical actions processor (Story 4.3) with agentic loop (Story 4.1)

---

### Story 4.8: Implement System Prompt Builder with Tool Usage Instructions

**Priority:** MEDIUM
**Dependencies:** Story 4.1
**Estimate:** TBD

**Title:** Implement System Prompt Builder with Tool Usage Instructions

**As a** developer
**I want** to build system prompts that instruct OpenAI to actively use tools
**So that** file load instructions trigger actual tool calls instead of being acknowledged as text

**Acceptance Criteria:**
1. System prompt includes agent persona, role, identity, principles
2. System prompt explicitly instructs: "When you see instructions to load files, use the read_file tool"
3. System prompt lists available tools and their purpose
4. System prompt explains workflow execution pattern
5. System prompt emphasizes: "DO NOT just acknowledge file load instructions - actually call the tools"
6. Available commands from agent's `<cmds>` section included in prompt
7. System prompt tested to verify it triggers tool calls

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 6: "System Prompt Builder"
- Create `lib/agents/systemPromptBuilder.ts`
- Critical instruction: Make OpenAI understand it MUST use tools, not describe them

---

### Story 4.9: Validate Bundled Agents End-to-End

**Priority:** HIGH (validation story)
**Dependencies:** Stories 4.1-4.8 complete
**Estimate:** TBD

**Title:** Validate Bundled Agents End-to-End

**As a** developer
**I want** to validate that bundled agents work correctly with new architecture
**So that** we confirm agents behave like they do in Claude Code

**Acceptance Criteria:**
1. Load bundled agent from `bmad/custom/bundles/requirements-workflow/`
2. Agent initializes successfully, executes critical actions
3. User sends message that triggers workflow requiring file loads
4. Verify in logs: read_file tool called multiple times for different instruction files
5. Verify execution pauses at each tool call, waits for result, then continues
6. Agent successfully completes workflow using dynamically loaded instructions
7. Path variables ({bundle-root}, {core-root}) resolve correctly in logs
8. Agent behavior matches expected BMAD patterns
9. Document any remaining compatibility issues discovered

**Technical Notes:**
- Use existing bundled agents: Alex, Casey, or Pixel from requirements-workflow bundle
- This replaces Epic 3 Story 3.9 (lazy-loading validation)
- Monitor console logs to verify tool execution flow

---

### Story 4.10: Refactor Epic 2 and Epic 3 Tests

**Priority:** MEDIUM
**Dependencies:** Stories 4.1-4.9 complete
**Estimate:** TBD

**Title:** Refactor Epic 2 and Epic 3 Tests

**As a** developer
**I want** to refactor existing tests for new architecture
**So that** test suite validates correct agentic execution pattern

**Acceptance Criteria:**
1. Unit tests for agentic execution loop
2. Unit tests for path variable resolution
3. Unit tests for critical actions processor
4. Unit tests for bundle discovery and parsing
5. Integration tests for complete agent initialization flow
6. Integration tests for file loading during agent execution
7. Update Epic 2 tests that are still relevant
8. Delete Epic 2 tests that are obsolete
9. All tests passing with new architecture

**Technical Notes:**
- Review existing Epic 2 test suite, identify what to keep vs replace
- Focus on testing the agentic loop, not just individual functions
- Test with realistic agent scenarios

---

### Story 4.11: Add Core BMAD Files Volume Mount Support

**Priority:** LOW
**Dependencies:** Story 4.2
**Estimate:** TBD

**Title:** Add Core BMAD Files Volume Mount Support

**As a** developer
**I want** to ensure core BMAD files are accessible from bundles
**So that** agents can use {core-root} to load shared workflow files

**Acceptance Criteria:**
1. System can read files from `bmad/core/` directory
2. {core-root} variable resolves to correct path
3. Agents can execute: `read_file({core-root}/tasks/workflow.md)`
4. Core files are read-only (writes to core-root rejected)
5. Path security prevents access outside core directory
6. Document core dependencies in bundle.yaml are accessible
7. Test with actual core file: load `bmad/core/tasks/workflow.md`

**Technical Notes:**
- Core files exist at `/Users/bryan.inagaki/Documents/development/agent-orchestrator/bmad/core/`
- Primarily validates path resolution and security with core files
- Prepares for Epic 6 (Docker) where core will be mounted read-only

---

### Story 4.12: Update Documentation for Epic 4 Architecture

**Priority:** LOW
**Dependencies:** All Epic 4 stories complete
**Estimate:** TBD

**Title:** Update Documentation for Epic 4 Architecture

**As a** developer
**I want** to document the new architecture in code comments and README
**So that** future developers understand the agentic execution pattern

**Acceptance Criteria:**
1. README updated with architecture overview
2. Code comments in agentic loop explain execution flow
3. Code comments in path resolver explain variable resolution order
4. Developer notes explain differences from Epic 2 approach
5. Link to AGENT-EXECUTION-SPEC.md and BUNDLE-SPEC.md in relevant files
6. Quick troubleshooting guide for common agent execution issues
7. Example of successful agent execution flow in comments or docs

**Technical Notes:**
- Keep concise - detailed specs are in separate files
- Focus on "why we did it this way" for future maintainers
- Document Epic 2 → Epic 4 transition for historical context

---

## PHASE 3: EPIC RENUMBERING (WEEK 1)

### Update Epic Numbers in Backlog

- [ ] Rename "Epic 4: File Management and Viewer" → "Epic 5: File Management and Viewer"
- [ ] Add Epic 5 note: "Dependencies: Epic 4 COMPLETE (agents must work before file viewer is useful)"

- [ ] Rename "Epic 5: Docker Deployment" → "Epic 6: Docker Deployment"
- [ ] Add Epic 6 note: "Additional requirements: volume mounts for bundles and core files"

- [ ] Rename "Epic 6: Polish, Testing, Documentation" → "Epic 7: Polish, Testing, Documentation"
- [ ] Add Epic 7 note: "Additional requirements: document bundle structure in Agent Builder Guide"

---

## PHASE 4: SPRINT PLANNING (WEEK 1)

### Update Sprint Plan

- [ ] Current sprint count: 6 sprints (Epic 1-6)
- [ ] Add Epic 4: +1.5-2 sprints
- [ ] New sprint count: 7-8 sprints total

### Sprint Allocation

**Completed:**
- Sprint 1: Epic 1 ✅
- Sprint 2: Epic 2 ⚠️ (deprecated)
- Sprint 3: Epic 3 ⚠️ (partially complete)

**Updated Plan:**
- **Sprint 4-5:** Epic 4 (12 stories, 1.5-2 sprints) 🔄 IN PROGRESS
- Sprint 6: Epic 5 (File Viewer)
- Sprint 7: Epic 6 (Docker)
- Sprint 8: Epic 7 (Polish & Docs)

### Story Prioritization for Sprint 4

**Critical Path (must complete in order):**
1. Story 4.1 (Agentic Loop) - FIRST
2. Story 4.2 (Path Resolution) - SECOND
3. Story 4.3 (Critical Actions) - THIRD
4. Story 4.5 (Refactor Tools) - Can run parallel with 4.4 after 4.2

**Can Run Parallel (after 4.2):**
- Story 4.4 (Bundle Discovery)
- Story 4.8 (System Prompt)

**Dependent Stories:**
- Story 4.6 (Agent Discovery UI) - needs 4.4
- Story 4.7 (Agent Init) - needs 4.3, 4.6
- Story 4.9 (Validation) - needs 4.1-4.8
- Story 4.10 (Tests) - needs 4.9
- Story 4.11 (Core Files) - needs 4.2
- Story 4.12 (Docs) - needs all stories

---

## PHASE 5: STAKEHOLDER COMMUNICATION (WEEK 1)

### Draft Communication

**Subject:** Agent Orchestrator - Timeline Update: Architectural Correction in Progress

**To:** [Stakeholders]

**Message:**

During Story 3.10 validation testing, we discovered that our OpenAI integration (Epic 2) does not match the execution pattern required for BMAD agents. Specifically:
- Agents were not reliably loading instruction files
- The pause-load-continue pattern used by Claude Code was not implemented
- Path variables needed for BMAD core file reuse were missing

**What We're Doing:**
We've created Epic 4 to implement the correct architecture based on two new specifications (AGENT-EXECUTION-SPEC and BUNDLE-SPEC). This is normal agile learning: build → validate → correct.

**Impact:**
- Timeline: +1.5-2 sprints (6 sprints → 7-8 sprints total)
- Scope: UNCHANGED - same MVP, correct implementation
- Quality: Ensures agents work properly before proceeding to file viewer and deployment

**Why This Is Good:**
- We discovered the issue during validation (by design)
- We have clear specifications for the correct approach
- Working UI is preserved from Epic 3
- Agents are already migrated to new bundle structure
- Better to fix now than accumulate technical debt

**Next Steps:**
Sprint 4-5 will focus on Epic 4 implementation. We'll validate bundled agents work correctly before proceeding to Epic 5-7.

Questions? Let's discuss.

**Communication Checklist:**
- [ ] Review message with team
- [ ] Send to stakeholders
- [ ] Be prepared to answer questions about timeline
- [ ] Emphasize this is learning, not failure

---

## PHASE 6: ARTIFACT UPDATES (WEEK 1)

### PRD Updates

**File:** `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/prd.md`

- [ ] Update FR-2: Add agentic execution loop specification
- [ ] Update FR-5: Clarify pause-load-continue pattern
- [ ] Update FR-6: Add path variable resolution system
- [ ] Add FR-13: Bundle structure support requirement
- [ ] Add Context note: Document architectural pivot

**Reference:** See Section 5.1 of sprint-change-proposal-epic4.md for detailed before/after

### Epics Document Updates

**File:** `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/epics.md`

- [ ] Update Epic 2 header: Add deprecation note
- [ ] Update Epic 3 header: Add partial completion note
- [ ] Add Epic 4: Complete epic with 12 stories
- [ ] Renumber Epic 4→5, Epic 5→6, Epic 6→7
- [ ] Update summary section: 57 stories / 7 epics, timeline impact

**Reference:** See sprint-change-proposal-epic4.md for complete Epic 4 story text

---

## SUCCESS CRITERIA

Handoff is complete when ALL boxes checked:

**Backlog:**
- [ ] Epic 4 created with 12 stories
- [ ] Epic 2 stories deprecated
- [ ] Epic 3 stories blocked
- [ ] Epic 4-6 renumbered to 5-7

**Planning:**
- [ ] Sprint plan updated (+1.5-2 sprints)
- [ ] Epic 4 stories prioritized
- [ ] Dependencies documented

**Communication:**
- [ ] Stakeholders notified
- [ ] Team understands this is learning, not failure
- [ ] Timeline expectations reset

**Documentation:**
- [ ] PRD updated with 5 changes
- [ ] epics.md updated with Epic 4 and renumbering

**Readiness:**
- [ ] Dev team ready to start Epic 4 next sprint
- [ ] Architect available for questions
- [ ] All handoff recipients acknowledged

---

## SUPPORT RESOURCES

**Primary Contact:** Solution Architect (for technical questions)

**Reference Documents:**
- Sprint Change Proposal: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/sprint-change-proposal-epic4.md`
- AGENT-EXECUTION-SPEC: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/AGENT-EXECUTION-SPEC.md`
- BUNDLE-SPEC: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/BUNDLE-SPEC.md`

**Migrated Agents:**
- Bundle Location: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/bmad/custom/bundles/requirements-workflow/`

---

## NOTES SECTION

Use this space to track progress, questions, or blockers:

**Date:** ________ **Note:** ________________________________________________________________

**Date:** ________ **Note:** ________________________________________________________________

**Date:** ________ **Note:** ________________________________________________________________

**Date:** ________ **Note:** ________________________________________________________________

---

**Checklist Version:** 1.0
**Created:** 2025-10-05
**Status:** Ready for Execution

---

**End of Checklist**
