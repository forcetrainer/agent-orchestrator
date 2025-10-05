# SPRINT CHANGE PROPOSAL
## Agent Orchestrator - Agent Execution Architecture Correction

**Date:** 2025-10-05
**Prepared by:** Winston (Architect)
**Change Scope:** MODERATE (Requires backlog reorganization and sprint replan)
**Estimated Impact:** +1.5-2 sprints
**Status:** APPROVED

---

## EXECUTIVE SUMMARY

**Issue:** Story 3.10 validation revealed that agent execution via OpenAI API does not match BMAD agent behavior standards (Claude Code). Agents fail to reliably load files, exhibit slow performance, and lack the pause-load-continue pattern required for proper BMAD agent execution.

**Root Cause:** Current OpenAI integration (Epic 2) treats agent instructions as text rather than implementing an agentic execution loop with function calling. Path variables ({bundle-root}, {core-root}, {project-root}) are not resolved, preventing BMAD core file reuse.

**Solution:** Create new Epic 4 "Agent Execution Architecture & Bundle System" to implement correct architecture per AGENT-EXECUTION-SPEC.md and BUNDLE-SPEC.md.

**Impact:**
- Epic 2 deprecated (learning preserved)
- Epic 3 partially complete (UI works, agent logic needs rework)
- +12 stories, +1.5-2 sprints
- MVP scope unchanged
- Epic 4-6 renumbered to Epic 5-7

**Next Steps:** PO/SM creates Epic 4 in backlog, deprecates superseded stories, updates sprint plan, communicates timeline impact.

---

## 1. ISSUE SUMMARY

### Problem Statement

During Story 3.10 validation testing, agent execution via OpenAI API failed to match expected BMAD agent behavior standards (Claude Code). Agents are slow, fail to load instruction files reliably, and do not follow the pause-load-continue pattern that BMAD agents require.

### Root Cause

The current OpenAI integration (Epic 2) does not implement an agentic execution loop with proper function calling. Instead, it treats agent instructions as text that OpenAI processes, rather than forcing tool execution before continuation. Additionally, BMAD-specific path variables (`{bundle-root}`, `{core-root}`, `{project-root}`) are not being resolved, preventing use of core BMAD files and causing directory navigation failures.

### Context of Discovery

- **Story 3.9** completed with concerns about agent behavior
- **Story 3.10** created as validation story to test complex BMAD agent workflows
- Testing revealed:
  - File loading failures (instructions to load files not always executed)
  - Slow performance with multiple retry attempts
  - Agents continuing execution without loaded files (unlike Claude Code which pauses)
- Consultation with architect confirmed execution pattern mismatch
- Two architectural specifications created to define correct approach:
  - **AGENT-EXECUTION-SPEC.md** - Defines agentic execution loop pattern
  - **BUNDLE-SPEC.md** - Defines proper agent bundling structure

### Impact

- Epic 2 (OpenAI Integration) implementation is fundamentally flawed
- Epic 3 Stories 3.9 and 3.10 cannot be completed with current architecture
- Agents cannot be deployed successfully without fixing core execution pattern
- MVP is blocked until this architectural issue is resolved

---

## 2. IMPACT ANALYSIS

### 2.1 Epic Impact

**Completed Epics Affected:**

**Epic 2: OpenAI Integration with File Operations**
- **Status:** Complete but DEPRECATED
- **Impact:** Core implementation needs complete replacement
- **Deprecated Stories:**
  - Story 2.6 (Function Calling Loop) - Simple loop doesn't implement agentic pattern
  - Story 2.7 (Agent Loading) - Doesn't support bundle structure or critical actions
  - Story 2.8 (Path Security) - Missing path variable resolution
- **Required:**
  - Agentic execution loop (pause-load-continue)
  - Path variable resolution system
  - Critical actions processor
  - Bundle structure support

**Epic 3: Chat Interface and Agent Selection**
- **Status:** PARTIALLY COMPLETE
- **Complete:** Stories 3.1-3.8 (UI infrastructure) ✅
- **Blocked:**
  - Story 3.4 (Agent Discovery) - Needs bundle-aware implementation
  - Story 3.9 (Lazy-loading Validation) - Needs re-testing with new architecture
  - Story 3.10 (Agent Initialization) - Needs complete re-implementation

**New Epic Required:**

**Epic 4: Agent Execution Architecture & Bundle System (NEW)**
- Implement agentic execution loop per AGENT-EXECUTION-SPEC
- Implement bundle structure support per BUNDLE-SPEC
- Refactor existing tools to work with new architecture
- Update agent discovery for bundle-aware loading
- Implement path variable resolution system
- Refactor tests for new architecture
- Validate bundled agents end-to-end
- **Estimated:** 12 stories, 1.5-2 sprints

**Epic Renumbering:**
- Current Epic 4 (File Viewer) → Epic 5
- Current Epic 5 (Docker) → Epic 6 (minor updates for bundle structure)
- Current Epic 6 (Polish) → Epic 7 (documentation updates for bundles)

### 2.2 Artifact Impact

**PRD (prd.md) - 5 Updates Required:**

1. **FR-2 (Agent Loading):** Add agentic execution loop specification and critical actions support
2. **FR-5 (OpenAI API):** Clarify pause-load-continue pattern requirement
3. **FR-6 (File Operations):** Add path variable resolution system
4. **FR-13 (NEW):** Add bundle structure support requirement
5. **Context Section:** Add note about architectural pivot and learning

**Architecture - New Specs Replace Implementation:**

1. **AGENT-EXECUTION-SPEC.md** is now official architecture (replaces Epic 2 implementation)
2. **BUNDLE-SPEC.md** is now official structure (defines agent organization)
3. Epic documentation updated with deprecation notes

**UI/UX - Minor Updates:**

1. **Agent selector:** Display agents from bundles (simple flat list for MVP)
2. **Agent initialization:** Show proper greeting after critical actions execute

**Other Artifacts:**

1. **epics.md:** Major revision - add Epic 4, deprecate stories, renumber epics, update summary
2. **Tests:** Refactor Epic 2 and Epic 3 tests for new architecture
3. **Docker:** Update volume mounts for `/bmad/custom/bundles/` and `/bmad/core/`
4. **Documentation:** Update README and Agent Builder Guide for bundle structure

---

## 3. RECOMMENDED APPROACH

### Selected Path: Create New Epic 4

**Approach:** Create new Epic 4 "Agent Execution Architecture & Bundle System" with stories that replace deprecated Epic 2 implementation while preserving working Epic 3 UI.

### Justification

**Implementation Effort & Timeline:**
- **HIGH effort:** 12 new stories estimated
- **Timeline impact:** +1.5-2 sprints beyond original plan
- **Unavoidable:** Current implementation doesn't work, must be fixed
- **Better now than later:** Fixing broken foundation prevents compounding technical debt

**Technical Risk & Complexity:**
- **MEDIUM risk:** Detailed specs (AGENT-EXECUTION-SPEC, BUNDLE-SPEC) provide clear guidance
- **LOWER risk than Epic 2:** We now know exactly what to build (we didn't before)
- **Complexity managed:** Breaking into clear stories with existing specs as guide
- **Risk mitigation:** Agents already migrated to bundle format at `/bmad/custom/bundles/`

**Team Morale & Momentum:**
- **Positive framing:** This is learning and improvement, not failure
- Epic 2/3 taught us what we needed to know to build correctly
- Working UI and detailed specs mean we're in good position
- Creating new epic shows progress and clarity

**Long-term Sustainability:**
- **CRITICAL:** Correct architecture now prevents technical debt
- Bundle structure makes agent management sustainable
- Proper execution pattern matches Claude Code (BMAD standard)
- Path variable resolution enables BMAD core file reuse

**Business Value:**
- MVP goals unchanged - still delivering same value
- Timeline slip justified by delivering **working** MVP vs broken one
- Stakeholder communication: "Discovered architectural issue during validation, correcting before proceeding to ensure quality"

### Alternatives Considered

**Alternative 1: Add stories to existing Epic 2**
- ❌ Confusing to have "complete" epic with massive rework
- ❌ Makes velocity tracking messy
- ❌ Harder to understand in retrospectives

**Alternative 2: Roll back Epic 2/3 code**
- ❌ No benefit - we're replacing code anyway
- ❌ Breaks working UI temporarily
- ❌ Extra work with no simplification

**Alternative 3: Reduce MVP scope**
- ❌ Not necessary - same MVP achievable with correct implementation
- ❌ Wouldn't save significant time
- ❌ Reduces business value without proportional effort reduction

---

## 4. EPIC 4 STORY BREAKDOWN

### Epic 4: Agent Execution Architecture & Bundle System

**Epic Goal:** Implement correct agent execution architecture with agentic loop and bundle structure support

**Business Value:** Fixes fundamental execution pattern mismatch discovered in Epic 2/3 validation. Enables BMAD agents to function correctly with OpenAI API using the same patterns as Claude Code. Establishes sustainable agent organization through bundle structure.

**Success Criteria:**
- ✅ Agentic execution loop implements pause-load-continue pattern (matches Claude Code)
- ✅ File loading via function calling blocks execution until files are available
- ✅ Path variables ({bundle-root}, {core-root}, {project-root}) resolve correctly
- ✅ Critical actions execute during agent initialization
- ✅ Bundle structure discovered from manifests (bundle.yaml)
- ✅ Bundled agents load and execute successfully end-to-end
- ✅ All Epic 2/3 tests refactored and passing with new architecture

**Dependencies:**
- Epic 1 (Backend foundation) ✅ Complete
- Epic 3 Stories 3.1-3.8 (UI) ✅ Complete
- Replaces deprecated Epic 2 implementation
- Blocks Epic 3 Stories 3.4, 3.9, 3.10 completion
- Must complete before Epic 5-7 can proceed

**Estimated Stories:** 12
**Estimated Effort:** 1.5-2 sprints

---

#### Story 4.1: Implement Agentic Execution Loop

**As a** developer
**I want** to implement an agentic execution loop with function calling
**So that** agents pause execution, load files via tools, and continue only after files are available

**Prerequisites:** Epic 1 complete (API routes), Epic 3 Stories 3.1-3.8 (UI)

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

#### Story 4.2: Implement Path Variable Resolution System

**As a** developer
**I want** to resolve BMAD path variables in file paths
**So that** agents can use {bundle-root}, {core-root}, and {project-root} to navigate files

**Prerequisites:** Story 4.1 (Agentic loop)

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

#### Story 4.3: Implement Critical Actions Processor

**As a** developer
**I want** to execute agent critical-actions during initialization
**So that** agents can load config files and set up initial context

**Prerequisites:** Story 4.2 (Path resolution)

**Acceptance Criteria:**
1. Parse `<critical-actions>` section from agent.md XML
2. Extract file load instructions: "Load into memory {path} and set variables: var1, var2"
3. Execute file loads via read_file function during initialization
4. Inject loaded file contents as system messages before user input
5. Parse config.yaml files and store variables for resolution
6. Execute non-file instructions as system messages (e.g., "Remember user's name is {user_name}")
7. All critical actions complete before agent accepts first user message
8. Errors in critical actions halt initialization with clear message

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 4: "Critical Actions Processor"
- Create `lib/agents/criticalActions.ts`
- Critical actions run BEFORE agentic loop starts
- Typically loads bundle config.yaml and sets user preferences

---

#### Story 4.4: Implement Bundle Structure Discovery and Loading

**As a** developer
**I want** to discover agents from bundle manifests
**So that** the system can load bundled agents with proper metadata

**Prerequisites:** Story 4.2 (Path resolution)

**Acceptance Criteria:**
1. Scan `bmad/custom/bundles/*/bundle.yaml` files
2. Parse bundle.yaml to extract type (bundle vs standalone)
3. Extract agent metadata: id, name, title, description, icon, file, entry_point
4. Filter agents to only show entry_point: true in agent selector
5. Return agent list with bundle context: [{id, name, title, description, icon, bundleName, bundlePath}]
6. Validate bundle structure (required: bundle.yaml, agents/, config.yaml)
7. Handle missing or malformed bundle.yaml gracefully
8. Update `/api/agents` endpoint to return bundled agents

**Technical Notes:**
- Follow BUNDLE-SPEC.md Section "Server Integration > Agent Discovery"
- Replace Epic 3 Story 3.4 agent discovery implementation
- Create `lib/agents/bundleScanner.ts`
- Scan depth 1 only (`bundles/*/bundle.yaml`), not recursive

---

#### Story 4.5: Refactor File Operation Tools for Agentic Loop

**As a** developer
**I want** to refactor existing read_file, write_file, list_files tools
**So that** they work correctly within the agentic execution loop and support path variables

**Prerequisites:** Story 4.1 (Agentic loop), Story 4.2 (Path resolution)

**Acceptance Criteria:**
1. Update read_file to resolve path variables before reading
2. Update write_file to resolve path variables before writing
3. Update list_files to resolve path variables before listing
4. Tools return results in format compatible with agentic loop context injection
5. Tool results include resolved paths for debugging
6. Path security validation works with resolved paths (no traversal attacks)
7. Tools work with bundle structure ({bundle-root}/workflows/*, {core-root}/tasks/*)
8. Existing Epic 2 tool tests refactored to test with path variables

**Technical Notes:**
- Modify existing `lib/fileOperations.ts` from Epic 2
- Add path resolution step before Epic 2 security checks
- Ensure tool results inject cleanly into conversation messages array
- Test with bundled agent paths: `{bundle-root}/workflows/intake/workflow.yaml`

---

#### Story 4.6: Refactor Agent Discovery for Bundle Structure

**As a** developer
**I want** to update agent discovery to load from bundle manifests
**So that** bundled agents display correctly in agent selector

**Prerequisites:** Story 4.4 (Bundle discovery)

**Acceptance Criteria:**
1. Frontend calls `/api/agents` and receives bundled agent list
2. Agent selector dropdown displays agent name and title from bundle.yaml
3. Optional: Display bundle name as subtitle (e.g., "Alex - Requirements Facilitator")
4. Selecting agent loads from bundle structure (bundle.yaml file path)
5. Agent metadata (icon, description) available for UI enhancement (optional for MVP)
6. Empty bundles folder shows "No agents available" message
7. Malformed bundles logged but don't crash agent selector

**Technical Notes:**
- Update frontend agent selector component from Epic 3 Story 3.4
- Keep UI simple: flat list of all entry_point agents (don't group by bundle for MVP)
- Agent ID from bundle.yaml used as unique identifier

---

#### Story 4.7: Re-implement Agent Initialization with Critical Actions

**As a** developer
**I want** to execute agent initialization using critical actions processor
**So that** agents load config and greet users correctly on selection

**Prerequisites:** Story 4.3 (Critical actions), Story 4.6 (Bundle discovery)

**Acceptance Criteria:**
1. When agent selected, load agent.md from bundle
2. Parse and execute `<critical-actions>` section
3. Load bundle config.yaml if specified in critical actions
4. Execute file loads via agentic loop (if agent requests files during initialization)
5. Display agent greeting message after initialization completes
6. Loading indicator shows during initialization
7. Initialization errors display clearly without crashing UI
8. User can send first message after initialization completes

**Technical Notes:**
- Replace Epic 3 Story 3.10 implementation
- Combines critical actions processor (Story 4.3) with agentic loop (Story 4.1)
- Agent greeting typically comes from agent definition or first system response

---

#### Story 4.8: Implement System Prompt Builder with Tool Usage Instructions

**As a** developer
**I want** to build system prompts that instruct OpenAI to actively use tools
**So that** file load instructions trigger actual tool calls instead of being acknowledged as text

**Prerequisites:** Story 4.1 (Agentic loop)

**Acceptance Criteria:**
1. System prompt includes agent persona, role, identity, principles
2. System prompt explicitly instructs: "When you see instructions to load files, use the read_file tool"
3. System prompt lists available tools and their purpose
4. System prompt explains workflow execution pattern
5. System prompt emphasizes: "DO NOT just acknowledge file load instructions - actually call the tools"
6. Available commands from agent's `<cmds>` section included in prompt
7. System prompt tested to verify it triggers tool calls (not just text acknowledgment)

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 6: "System Prompt Builder"
- Create `lib/agents/systemPromptBuilder.ts`
- Critical instruction: Make OpenAI understand it MUST use tools, not describe them

---

#### Story 4.9: Validate Bundled Agents End-to-End

**As a** developer
**I want** to validate that bundled agents work correctly with new architecture
**So that** we confirm agents behave like they do in Claude Code

**Prerequisites:** All Epic 4 stories 4.1-4.8 complete

**Acceptance Criteria:**
1. Load bundled agent from `bmad/custom/bundles/requirements-workflow/`
2. Agent initializes successfully, executes critical actions
3. User sends message that triggers workflow requiring file loads
4. Verify in logs: read_file tool called multiple times for different instruction files
5. Verify execution pauses at each tool call, waits for result, then continues
6. Agent successfully completes workflow using dynamically loaded instructions
7. Path variables ({bundle-root}, {core-root}) resolve correctly in logs
8. Agent behavior matches expected BMAD patterns (similar to Claude Code execution)
9. Document any remaining compatibility issues discovered

**Technical Notes:**
- Use existing bundled agents: Alex, Casey, or Pixel from requirements-workflow bundle
- This is equivalent to Epic 3 Story 3.9 (lazy-loading validation) but with correct architecture
- Monitor console logs to verify tool execution flow
- Compare behavior to same agent running in Claude Code (if possible)

---

#### Story 4.10: Refactor Epic 2 and Epic 3 Tests

**As a** developer
**I want** to refactor existing tests for new architecture
**So that** test suite validates correct agentic execution pattern

**Prerequisites:** All Epic 4 stories 4.1-4.9 complete

**Acceptance Criteria:**
1. Unit tests for agentic execution loop (iterations, tool injection, safety limits)
2. Unit tests for path variable resolution (all variable types)
3. Unit tests for critical actions processor
4. Unit tests for bundle discovery and parsing
5. Integration tests for complete agent initialization flow
6. Integration tests for file loading during agent execution
7. Update Epic 2 tests that are still relevant (file security, error handling)
8. Delete Epic 2 tests that are obsolete (simple function calling loop)
9. All tests passing with new architecture

**Technical Notes:**
- Review existing Epic 2 test suite, identify what to keep vs replace
- Focus on testing the agentic loop, not just individual functions
- Test with realistic agent scenarios (multi-file loads, variable resolution)
- Mock OpenAI responses to test tool call handling

---

#### Story 4.11: Add Core BMAD Files Volume Mount Support

**As a** developer
**I want** to ensure core BMAD files are accessible from bundles
**So that** agents can use {core-root} to load shared workflow files

**Prerequisites:** Story 4.2 (Path resolution)

**Acceptance Criteria:**
1. System can read files from `bmad/core/` directory
2. {core-root} variable resolves to correct path
3. Agents can execute: `read_file({core-root}/tasks/workflow.md)`
4. Core files are read-only (writes to core-root rejected)
5. Path security prevents access outside core directory via traversal
6. Document core dependencies in bundle.yaml are accessible
7. Test with actual core file: load `bmad/core/tasks/workflow.md`

**Technical Notes:**
- Core files already exist in project at `/Users/bryan.inagaki/Documents/development/agent-orchestrator/bmad/core/`
- This story primarily validates path resolution and security with core files
- Prepares for Epic 6 (Docker) where core will be mounted read-only

---

#### Story 4.12: Update Documentation for Epic 4 Architecture

**As a** developer
**I want** to document the new architecture in code comments and README
**So that** future developers understand the agentic execution pattern

**Prerequisites:** All Epic 4 stories complete

**Acceptance Criteria:**
1. README updated with architecture overview (agentic loop + bundle structure)
2. Code comments in agentic loop explain execution flow
3. Code comments in path resolver explain variable resolution order
4. Developer notes explain differences from original Epic 2 approach
5. Link to AGENT-EXECUTION-SPEC.md and BUNDLE-SPEC.md in relevant files
6. Quick troubleshooting guide for common agent execution issues
7. Example of successful agent execution flow in comments or docs

**Technical Notes:**
- Keep concise - detailed specs are in AGENT-EXECUTION-SPEC and BUNDLE-SPEC
- Focus on "why we did it this way" for future maintainers
- Document Epic 2 → Epic 4 transition for historical context

---

## 5. DETAILED CHANGE PROPOSALS

### 5.1 PRD Updates (prd.md)

**Location:** `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/prd.md`

#### Change 5.1.1: Update FR-2 - Agent Loading and Initialization

**Section:** Functional Requirements > Agent Management

**OLD:**
```markdown
**FR-2: Agent Loading and Initialization**
- Selected agent's instruction files load into system on demand
- Support for BMAD's lazy-loading pattern - only load files when agent requests them
- Preserve agent's native directory structure and file organization
- Handle agent metadata and configuration from agent definition files
```

**NEW:**
```markdown
**FR-2: Agent Loading and Initialization**
- System implements agentic execution loop with function calling (pause-load-continue pattern)
- Selected agent's instruction files load via tool calls when agent requests them
- Support for BMAD's lazy-loading pattern - files loaded on-demand through function calling
- Execute agent critical-actions section during initialization
- Parse and process agent bundle.yaml manifest for metadata
- Preserve agent's native directory structure and file organization
- Handle agent metadata and configuration from agent definition files
```

**Rationale:** Explicitly specifies the agentic execution loop pattern required for proper agent behavior, matching Claude Code execution model.

---

#### Change 5.1.2: Update FR-5 - OpenAI API with Function Calling

**Section:** Functional Requirements > OpenAI Integration

**OLD:**
```markdown
**FR-5: OpenAI API with Function Calling**
- Integration with OpenAI API using function calling pattern
- LLM receives user message → generates tool call → backend executes → result returns to LLM → LLM continues
- Support for multiple function calls in sequence as agent works through tasks
- Proper error handling for API failures and rate limits
```

**NEW:**
```markdown
**FR-5: OpenAI API with Function Calling**
- Integration with OpenAI API using agentic execution loop with function calling
- Execution pattern: LLM receives message → generates tool call → backend pauses execution → executes tool → injects result into conversation context → LLM continues with tool result
- Agentic loop continues until LLM returns final response without tool calls
- Support for multiple sequential function calls as agent works through tasks
- Tool execution blocks continuation until results are available (prevents premature continuation)
- Proper error handling for API failures and rate limits
- Safety limit on maximum iterations to prevent infinite loops
```

**Rationale:** Clarifies that function calling must implement agentic execution loop, not just simple API calls. Emphasizes the pause-load-continue pattern essential for BMAD agents.

---

#### Change 5.1.3: Update FR-6 - File Operation Tools

**Section:** Functional Requirements > OpenAI Integration

**OLD:**
```markdown
**FR-6: File Operation Tools**
- `read_file(path)` - Load instruction/workflow files on-demand as agent requests
- `write_file(path, content)` - Create output files preserving directory structure
- `list_files(directory)` - Browse available files and directories
- Auto-create parent directories as needed for file writes
- Restrict file operations to authorized paths (agent folder for reads, output folder for writes)
```

**NEW:**
```markdown
**FR-6: File Operation Tools**
- `read_file(path)` - Load instruction/workflow files on-demand as agent requests
- `write_file(path, content)` - Create output files preserving directory structure
- `list_files(directory)` - Browse available files and directories
- Auto-create parent directories as needed for file writes
- Restrict file operations to authorized paths (bundle folders and core for reads, output folder for writes)
- **Path Variable Resolution System:**
  - Resolve `{bundle-root}` to agent's bundle directory (`bmad/custom/bundles/{bundle-name}/`)
  - Resolve `{core-root}` to BMAD core directory (`bmad/core/`)
  - Resolve `{project-root}` to application root directory
  - Resolve `{config_source}:variable_name` references from bundle config.yaml
  - Support nested variable resolution in workflow configurations
```

**Rationale:** Adds critical path variable resolution system that enables BMAD core file reuse and proper bundle structure navigation.

---

#### Change 5.1.4: Add NEW FR-13 - Agent Bundle Structure Support

**Section:** Functional Requirements > Agent Management (add after FR-12)

**NEW:**
```markdown
**FR-13: Agent Bundle Structure Support**
- System discovers agents by scanning `bmad/custom/bundles/*/bundle.yaml` manifest files
- Parse bundle.yaml to extract agent metadata (id, name, title, description, icon, entry_point)
- Support multi-agent bundles (multiple agents in single bundle sharing resources)
- Support standalone agent bundles (single agent per bundle)
- Filter agent display to only entry_point: true agents in bundle manifests
- Load bundle resources (workflows, templates, config) relative to bundle root
- Validate required bundle structure before loading (bundle.yaml, agents/, config.yaml)
- Handle bundle-scoped path variables in agent instructions and workflows
```

**Rationale:** Defines requirements for bundle structure support per BUNDLE-SPEC.md, ensuring proper agent organization and discovery.

---

#### Change 5.1.5: Add Context Note About Architectural Pivot

**Section:** Context (add after "Why Now:" section)

**NEW:**
```markdown

**Architectural Learning:**

During Epic 2 and Epic 3 implementation (completed October 2025), validation testing revealed that the initial OpenAI integration approach did not match BMAD agent execution patterns. Specifically:
- File loading via function calling was not properly blocking execution (agents continued without loaded files)
- BMAD path variables were not being resolved, preventing core file reuse
- Agent initialization did not execute critical-actions as required

This discovery led to creation of two architectural specifications:
- **AGENT-EXECUTION-SPEC.md** - Defines proper agentic execution loop with pause-load-continue pattern
- **BUNDLE-SPEC.md** - Defines standardized bundle structure for agent organization

Epic 4 was created to implement these specifications, replacing the deprecated Epic 2 implementation with the correct architecture. This represents normal agile learning: build, validate, correct. The MVP scope and goals remain unchanged - only the implementation approach was refined.
```

**Rationale:** Documents the architectural pivot for future reference and demonstrates this is learning/improvement, not failure.

---

### 5.2 Test Refactoring Plan

**Epic 2 Tests:**

**Tests to REFACTOR (keep but modify):**
- Path security tests → Add path variable resolution with security
- File operation error handling → Add path variable resolution errors

**Tests to DELETE (no longer relevant):**
- Simple function calling loop tests → Replaced by agentic execution loop
- Basic agent loading tests → Replaced by bundle-aware loading

**Tests to ADD (new functionality):**
- Agentic execution loop tests (iterations, context injection, safety limits)
- Path variable resolution tests (all variable types)
- Critical actions processor tests
- Bundle discovery tests

**Epic 3 Tests:**

**Tests to KEEP (no changes):**
- Chat UI tests (Stories 3.1-3.8) ✅

**Tests to REFACTOR:**
- Agent discovery tests → Update for bundle manifests

**Tests to ADD:**
- Bundle-aware agent loading tests
- Agent initialization with critical actions tests

---

### 5.3 Docker Configuration Updates

**Volume Mounts (docker-compose.yml):**

**OLD:**
```yaml
volumes:
  - ./agents:/app/agents:ro          # Read-only agents folder
  - ./output:/app/output:rw          # Read-write output folder
```

**NEW:**
```yaml
volumes:
  - ./bmad/custom/bundles:/app/bmad/custom/bundles:ro    # Read-only agent bundles
  - ./bmad/core:/app/bmad/core:ro                        # Read-only BMAD core files
  - ./output:/app/output:rw                              # Read-write output folder
```

**Environment Variables (.env.example):**

**OLD:**
```
OPENAI_API_KEY=your_api_key_here
AGENTS_FOLDER_PATH=/app/agents
OUTPUT_FOLDER_PATH=/app/output
PORT=3000
```

**NEW:**
```
OPENAI_API_KEY=your_api_key_here
BUNDLE_ROOT_PATH=/app/bmad/custom/bundles
CORE_ROOT_PATH=/app/bmad/core
PROJECT_ROOT_PATH=/app
OUTPUT_FOLDER_PATH=/app/output
PORT=3000
```

---

### 5.4 Documentation Updates

**Agent Builder Guide (AGENT_BUILDER_GUIDE.md - to be created in Epic 7):**

Add complete bundle structure section with:
- Required files (bundle.yaml, config.yaml, agents/)
- Path variable usage examples
- Critical actions patterns
- Example bundle structure

**README.md:**

Add architecture overview section with:
- Agentic execution loop explanation
- Path variable resolution overview
- Bundle structure summary
- Links to AGENT-EXECUTION-SPEC and BUNDLE-SPEC

---

## 6. PRD MVP IMPACT

### MVP Scope: UNCHANGED ✅

All original PRD goals remain achievable:
1. ✅ **Validate OpenAI API Compatibility** - Fixing how we do this
2. ✅ **Enable Rapid Agent Deployment** - Bundle structure helps
3. ✅ **Deliver Intuitive End-User Experience** - UI already works
4. ✅ **Establish BMAD Production Viability** - Correct architecture makes it viable
5. ✅ **Build Foundation for Future Growth** - Proper foundation enables growth

**What Changes:** Implementation approach, not product vision

**Timeline Impact:** +1.5-2 sprints
- Original: 6 epics, ~6 sprints
- Revised: 7 epics, ~7-8 sprints

### Success Criteria

**Epic 4 Complete When:**
- ✅ Agents load files via function calling (pause-load-continue pattern)
- ✅ Path variables resolve correctly ({bundle-root}, {core-root}, {project-root})
- ✅ Critical actions execute during agent initialization
- ✅ Bundled agents discovered and loaded from manifest
- ✅ All Epic 2/3 tests passing with new architecture
- ✅ End-to-end agent workflow validation successful

---

## 7. IMPLEMENTATION HANDOFF

### Change Scope Classification: MODERATE

Requires backlog reorganization, epic creation, and sprint replanning.

### Handoff Recipients and Responsibilities

#### 1. Product Owner / Scrum Master (PRIMARY)

**Responsibility:** Backlog management and story creation

**Immediate Tasks (within 1 day):**
- [ ] Create Epic 4 in backlog tool
- [ ] Add 12 stories to Epic 4 (use story breakdown in Section 4)
- [ ] Deprecate Epic 2 Stories 2.6, 2.7, 2.8 (mark "superseded by Epic 4")
- [ ] Mark Epic 3 Story 3.4 as "needs bundle rework in Epic 4"
- [ ] Mark Epic 3 Story 3.9 as "needs re-validation after Epic 4"
- [ ] Mark Epic 3 Story 3.10 as "blocked pending Epic 4"

**Short-term Tasks (within 1 week):**
- [ ] Renumber Epic 4→5, Epic 5→6, Epic 6→7 in backlog
- [ ] Update sprint plan to accommodate +1.5-2 sprints
- [ ] Prioritize Epic 4 stories for next sprint
- [ ] Communicate timeline impact to stakeholders
- [ ] Review Epic 4 story acceptance criteria with Architect

#### 2. Solution Architect (SUPPORTING)

**Responsibility:** Technical specification support

**Tasks:**
- [ ] Ensure AGENT-EXECUTION-SPEC.md is complete and clear
- [ ] Ensure BUNDLE-SPEC.md is complete and clear
- [ ] Answer technical questions during Epic 4 story creation
- [ ] Review story acceptance criteria for technical accuracy
- [ ] Provide guidance on tool refactoring approach
- [ ] Support development team with spec clarifications

#### 3. Development Team (EXECUTION)

**Responsibility:** Implementation (starts after Epic 4 in backlog)

**Tasks:**
- [ ] Implement Epic 4 stories per acceptance criteria
- [ ] Refactor existing tools and handlers from Epic 2
- [ ] Implement tests for new architecture
- [ ] Validate bundled agents work correctly
- [ ] Flag any spec ambiguities back to Architect

**Estimated Effort:** 1.5-2 sprints for Epic 4 completion

#### 4. Documentation Owner (SUPPORTING)

**Responsibility:** Artifact updates

**Immediate Tasks (within 1 week):**
- [ ] Update prd.md with 5 changes (Section 5.1)
- [ ] Update epics.md with Epic 4 details and deprecation notes

**Later Tasks (during Epic 7):**
- [ ] Update README with architecture overview
- [ ] Create Agent Builder Guide with bundle structure section

---

## 8. SUCCESS CRITERIA FOR HANDOFF

Handoff is complete when:

- ✅ Epic 4 exists in backlog with 12 stories
- ✅ Epic 2 deprecated stories marked in backlog
- ✅ Epic 3 blocked stories marked in backlog
- ✅ Sprint plan updated to reflect +1.5-2 sprint timeline
- ✅ Team understands this is architectural correction, not failure
- ✅ Clear communication sent to stakeholders about timeline and justification
- ✅ All handoff recipients acknowledge their responsibilities
- ✅ PRD and epics.md updated with changes

---

## 9. SUPPORTING DOCUMENTATION

**Architectural Specifications:**
- AGENT-EXECUTION-SPEC.md: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/AGENT-EXECUTION-SPEC.md`
- BUNDLE-SPEC.md: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/BUNDLE-SPEC.md`

**Migrated Bundle Location:**
- Requirements Workflow Bundle: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/bmad/custom/bundles/requirements-workflow/`

**Related Documents:**
- PRD: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/prd.md`
- Epics: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/epics.md`

---

## APPROVAL & TIMELINE

**User Approval:** ✅ APPROVED (2025-10-05)

**Immediate Next Steps:**

1. **TODAY:** PO/SM creates Epic 4 in backlog
2. **TODAY:** PO/SM deprecates Epic 2 stories 2.6, 2.7, 2.8
3. **THIS WEEK:** PO/SM completes Epic 4 story breakdown
4. **THIS WEEK:** Architect reviews Epic 4 acceptance criteria
5. **THIS WEEK:** Doc Owner updates PRD and epics.md
6. **NEXT WEEK:** Dev Team begins first Epic 4 sprint

**Change Routing:** MODERATE scope → Product Owner / Scrum Master for backlog reorganization and sprint planning

---

**Document Version:** 1.0
**Last Updated:** 2025-10-05
**Status:** APPROVED - Ready for Implementation

---

**End of Sprint Change Proposal**
