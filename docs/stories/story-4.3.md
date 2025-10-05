# Story 4.3: Implement Critical Actions Processor

Status: Done

## Story

As a **developer**,
I want **to execute agent critical-actions during initialization**,
so that **agents can load config files and set up initial context**.

## Acceptance Criteria

**AC-4.3.1:** Parse `<critical-actions>` section from agent.md XML

**AC-4.3.2:** Extract file load instructions: "Load into memory {path} and set variables: var1, var2"

**AC-4.3.3:** Execute file loads via read_file function during initialization

**AC-4.3.4:** Inject loaded file contents as system messages before user input

**AC-4.3.5:** Parse config.yaml files and store variables for resolution

**AC-4.3.6:** Execute non-file instructions as system messages (e.g., "Remember user's name is {user_name}")

**AC-4.3.7:** All critical actions complete before agent accepts first user message

**AC-4.3.8:** Errors in critical actions halt initialization with clear message

## Tasks / Subtasks

- [x] **Task 1: Create Critical Actions Module** (AC: 4.3.1)
  - [x] Subtask 1.1: Create `lib/agents/criticalActions.ts` file
  - [x] Subtask 1.2: Define CriticalContext interface (messages, config)
  - [x] Subtask 1.3: Define Agent interface with criticalActions property
  - [x] Subtask 1.4: Implement processCriticalActions(agent, bundleRoot) function signature
  - [x] Subtask 1.5: Initialize PathContext with bundleRoot, coreRoot, projectRoot

- [x] **Task 2: Parse Critical Actions XML** (AC: 4.3.1)
  - [x] Subtask 2.1: Parse agent.md to extract `<critical-actions>` section
  - [x] Subtask 2.2: Extract individual `<i>` instruction elements
  - [x] Subtask 2.3: Convert XML instructions to string array
  - [x] Subtask 2.4: Handle missing or empty critical-actions gracefully

- [x] **Task 3: File Load Pattern Recognition** (AC: 4.3.2)
  - [x] Subtask 3.1: Create regex pattern to match "Load into memory {path} and set variables..."
  - [x] Subtask 3.2: Extract file path from matched instruction
  - [x] Subtask 3.3: Extract variable list from "set variables: var1, var2" clause
  - [x] Subtask 3.4: Handle variations: "Load into memory {path}" without variables clause

- [x] **Task 4: Execute File Loads** (AC: 4.3.3, 4.3.5)
  - [x] Subtask 4.1: Call resolvePath() to resolve path variables in file path
  - [x] Subtask 4.2: Read file using fs.readFile (async)
  - [x] Subtask 4.3: If file is config.yaml, parse as YAML
  - [x] Subtask 4.4: Store parsed config in context.bundleConfig
  - [x] Subtask 4.5: Update PathContext.bundleConfig for subsequent resolutions

- [x] **Task 5: Inject System Messages** (AC: 4.3.4, 4.3.6)
  - [x] Subtask 5.1: Create system message for loaded file: "[Critical Action] Loaded file: {path}\n\n{content}"
  - [x] Subtask 5.2: Add file content system message to messages array
  - [x] Subtask 5.3: For non-file instructions, create system message: "[Critical Instruction] {instruction}"
  - [x] Subtask 5.4: Preserve order: messages added in critical-actions sequence

- [x] **Task 6: Variable Resolution in Instructions** (AC: 4.3.6)
  - [x] Subtask 6.1: Resolve {user_name} from bundleConfig in non-file instructions
  - [x] Subtask 6.2: Resolve {communication_language} from bundleConfig
  - [x] Subtask 6.3: Resolve {project_name} from bundleConfig
  - [x] Subtask 6.4: Support any config variable in instruction text

- [x] **Task 7: Error Handling** (AC: 4.3.8)
  - [x] Subtask 7.1: Catch file read errors and throw with context
  - [x] Subtask 7.2: Throw error with message: "Critical action failed: {instruction}"
  - [x] Subtask 7.3: Log error details to console for debugging
  - [x] Subtask 7.4: Ensure initialization halts on any critical action failure

- [x] **Task 8: Return CriticalContext** (AC: 4.3.4, 4.3.7)
  - [x] Subtask 8.1: Return CriticalContext with messages array
  - [x] Subtask 8.2: Return bundleConfig object for later use
  - [x] Subtask 8.3: Document that messages inject before user's first message
  - [x] Subtask 8.4: Ensure function completes before agent accepts user input

- [x] **Task 9: Unit Testing - Parsing** (AC: 4.3.1, 4.3.2)
  - [x] Subtask 9.1: Test parsing valid critical-actions XML section
  - [x] Subtask 9.2: Test extracting file load instructions
  - [x] Subtask 9.3: Test extracting non-file instructions
  - [x] Subtask 9.4: Test handling missing critical-actions section

- [x] **Task 10: Unit Testing - File Loading** (AC: 4.3.3, 4.3.5)
  - [x] Subtask 10.1: Test file load via fs.readFile with resolved path
  - [x] Subtask 10.2: Test config.yaml parsing and storage
  - [x] Subtask 10.3: Test updating PathContext.bundleConfig after load
  - [x] Subtask 10.4: Test file not found error handling

- [x] **Task 11: Unit Testing - System Messages** (AC: 4.3.4, 4.3.6)
  - [x] Subtask 11.1: Test system messages created for file loads
  - [x] Subtask 11.2: Test system messages created for non-file instructions
  - [x] Subtask 11.3: Test variable resolution in instruction text
  - [x] Subtask 11.4: Test message order preservation

- [x] **Task 12: Integration Testing** (AC: 4.3.7, 4.3.8)
  - [x] Subtask 12.1: Test critical actions execute before first user message
  - [x] Subtask 12.2: Test with real agent.md file and bundle structure
  - [x] Subtask 12.3: Test error halts initialization with clear message
  - [x] Subtask 12.4: Test integration with Story 4.1 (agentic loop initialization)

## Dev Notes

### Architecture Patterns and Constraints

**Critical Actions Execution Pattern:**
The critical actions processor is an initialization-time component that runs BEFORE the agentic execution loop starts. It's responsible for loading the minimal required configuration and context that agents need to begin operation.

**Execution Flow:**
1. Agent selection triggers initialization
2. Load agent.md from bundle
3. Parse `<critical-actions>` XML section
4. Process each instruction in sequence
5. Load files and create system messages
6. Return CriticalContext to agentic loop
7. Agentic loop begins with system messages pre-injected

**Why Critical Actions Matter:**
- Agents need bundle config.yaml to resolve {config_source}:variable references
- User preferences (name, language) must be loaded before first interaction
- System-level setup (memory loading) must complete before agent processes user input
- Failure during critical actions should halt initialization, not proceed with incomplete context

**Integration with Story 4.2 (Path Resolution):**
Critical actions processor depends heavily on path resolution:
- File paths in critical actions use path variables: `{bundle-root}/config.yaml`
- resolvePath() called before loading each file
- After loading config.yaml, bundleConfig passed to PathContext for {config_source}:variable resolution
- This creates a two-phase initialization: (1) load config, (2) use config to resolve other paths

**Integration with Story 4.1 (Agentic Loop):**
Critical actions processor runs BEFORE the agentic loop:
```typescript
// In executeAgent() from Story 4.1
const agent = await loadAgent(agentId);
const criticalContext = await processCriticalActions(agent, bundleRoot); // Story 4.3

// Build initial message context
let messages = [
  { role: 'system', content: buildSystemPrompt(agent) },
  ...criticalContext.messages,  // <-- Injected here
  { role: 'user', content: userMessage }
];

// Then start agentic loop...
```

**Security Considerations:**
- File loads must use path resolution and security validation from Story 4.2
- Only files within bundle-root or core-root can be loaded
- Path traversal attacks prevented by validatePathSecurity()
- Errors should provide enough context for debugging but not leak sensitive paths

### Component Locations and File Paths

**Primary Implementation:**
- `lib/agents/criticalActions.ts` - Main critical actions processor (create new)

**Dependencies:**
- `lib/pathResolver.ts` (Story 4.2) - For resolving {path} variables in file load instructions
- `fs/promises` - For async file reading
- `yaml` library - For parsing config.yaml files
- `path` module - For path operations

**Integration Points:**
- Called by: `lib/agents/agenticLoop.ts` (Story 4.1) - during agent initialization phase
- Uses: `lib/pathResolver.ts` (Story 4.2) - to resolve file paths before loading
- Used by: Agent initialization flow in `/api/chat` route handler

**Expected Agent Structure:**
```xml
<agent id="bmad/bmm/agents/alex.md" name="Alex" title="Requirements Facilitator">
  <critical-actions>
    <i>Load into memory {bundle-root}/config.yaml and set variables: project_name, output_folder, user_name, communication_language</i>
    <i>Remember the user's name is {user_name}</i>
    <i>ALWAYS communicate in {communication_language}</i>
  </critical-actions>
  ...
</agent>
```

**Expected config.yaml Structure:**
```yaml
project_name: Agent Orchestrator
output_folder: '{project-root}/docs'
user_name: Bryan
communication_language: English
```

### Testing Requirements

**Unit Tests (Required):**
1. **XML Parsing** - Extract critical-actions section and individual instructions
2. **Pattern Recognition** - Match "Load into memory {path}" patterns correctly
3. **File Loading** - Load files via fs.readFile with path resolution
4. **Config Parsing** - Parse YAML and store in bundleConfig
5. **System Messages** - Create properly formatted system messages
6. **Variable Resolution** - Resolve {user_name}, {communication_language} in instruction text
7. **Error Handling** - Halt with clear message on file load failure
8. **Empty/Missing Handling** - Gracefully handle missing critical-actions section

**Integration Tests (Required):**
1. Real agent.md with critical-actions section
2. Real bundle structure with config.yaml
3. Integration with Story 4.2 path resolution
4. Integration with Story 4.1 agentic loop initialization
5. Error scenarios: missing config, file not found, parse errors

**Test Data:**
- Sample agent.md with valid critical-actions XML
- Sample bundle directory with config.yaml
- Edge cases: missing config, invalid YAML, file permissions

### References

**Specification Sources:**
- [Source: docs/epics.md#Story-4.3] - Acceptance criteria and prerequisites
- [Source: docs/EPIC4-TECH-SPEC.md#Story-4.3-Implementation] - Detailed implementation guidance (lines 407-483)
- [Source: docs/AGENT-EXECUTION-SPEC.md#Section-4] - Critical actions processor architecture
- [Source: docs/BUNDLE-SPEC.md#Section-2] - Bundle config.yaml structure
- [Source: docs/prd.md#FR-2] - Agent Loading and Initialization functional requirement

**Architecture Context:**
- Story 4.1 (Agentic Execution Loop) - Calls processCriticalActions during initialization
- Story 4.2 (Path Variable Resolution) - Used to resolve file paths in critical actions
- Story 4.5 (File Operation Tools Refactor) - Uses same path resolution patterns

**Technical Implementation Reference:**
From EPIC4-TECH-SPEC.md (lines 412-472):
```typescript
interface CriticalContext {
  messages: Array<ChatMessage>;
  config: any;
}

async function processCriticalActions(
  agent: Agent,
  bundleRoot: string
): Promise<CriticalContext> {
  const messages: Array<ChatMessage> = [];
  let bundleConfig = null;

  const context: PathContext = {
    bundleRoot,
    coreRoot: 'bmad/core',
    projectRoot: process.cwd(),
    bundleConfig: null
  };

  for (const action of agent.criticalActions) {
    const instruction = action.trim();

    // Pattern: "Load into memory {path} and set variables: var1, var2"
    const loadMatch = instruction.match(/Load into memory (.+?) and set/i);
    if (loadMatch) {
      const filePath = loadMatch[1];
      const resolvedPath = resolvePath(filePath, context);

      const fileContent = await fs.readFile(resolvedPath, 'utf-8');
      messages.push({
        role: 'system',
        content: `[Critical Action] Loaded file: ${resolvedPath}\n\n${fileContent}`
      });

      // If config.yaml, parse and store
      if (filePath.includes('config.yaml')) {
        bundleConfig = YAML.parse(fileContent);
        context.bundleConfig = bundleConfig;
      }
    } else {
      // Other critical instructions
      messages.push({
        role: 'system',
        content: `[Critical Instruction] ${instruction}`
      });
    }
  }

  return { messages, config: bundleConfig };
}
```

### Project Structure Notes

**Alignment with Bundle Architecture:**
This story implements a key component of the bundle architecture defined in BUNDLE-SPEC.md. Critical actions enable agents to initialize with bundle-specific configuration without requiring platform-level configuration changes.

**Directory Structure Context:**
```
bmad/custom/bundles/
  requirements-workflow/
    bundle.yaml              # Bundle manifest
    config.yaml              # <-- Loaded via critical actions
    agents/
      alex.md                # <-- Contains <critical-actions> section
    workflows/
      intake/
        workflow.yaml
        instructions.md

bmad/core/                   # <-- Accessible via {core-root}
  tasks/
    workflow.md
```

**Integration with Existing Code:**
- Story 4.1 already defines agent initialization flow but delegates to this processor
- Story 4.2 provides path resolution used by this processor
- No conflicts detected with Epic 1 backend foundation
- Complements Epic 3 UI by enabling proper agent initialization before user interaction

## Change Log

| Date       | Version | Description                                            | Author |
| ---------- | ------- | ------------------------------------------------------ | ------ |
| 2025-10-05 | 0.1     | Initial draft                                          | Bryan  |
| 2025-10-05 | 1.0     | Implementation complete - all ACs satisfied and tested | Bryan  |

## Dev Agent Record

### Context Reference

- [Story Context XML](/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-4.3.xml) - Generated 2025-10-05

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

**Implementation Completed (2025-10-05):**
- Created `lib/agents/criticalActions.ts` with processCriticalActions function
- Implemented XML parsing for `<critical-actions>` section extraction
- Added file load pattern recognition with regex matching for "Load {path}" instructions
- Integrated with Story 4.2 path resolution (resolvePath) for {bundle-root}, {core-root}, {project-root} variables
- Implemented config.yaml parsing and storage in PathContext.bundleConfig
- Added system message injection for both file loads and non-file instructions
- Implemented variable resolution in instructions ({user_name}, {communication_language}, etc.)
- Comprehensive error handling with initialization halt on failures
- Replaced stub implementation in agenticLoop.ts with real processCriticalActions import
- All 26 unit and integration tests passing (17 unit + 9 integration)
- Build compiles successfully without TypeScript errors

**Key Implementation Notes:**
- Critical actions run BEFORE agentic loop starts (initialization phase)
- Two-phase initialization: (1) load config.yaml, (2) use config for subsequent variable resolution
- Security: all file paths validated through path resolution security checks
- Messages returned in ChatCompletionMessageParam format for seamless agentic loop integration
- Error messages include full instruction context for debugging

### File List

**Created:**
- `lib/agents/criticalActions.ts` - Main critical actions processor module
- `lib/agents/__tests__/criticalActions.test.ts` - Unit tests (17 tests)
- `lib/agents/__tests__/criticalActions.integration.test.ts` - Integration tests (9 tests)

**Modified:**
- `lib/agents/agenticLoop.ts` - Replaced stub with real processCriticalActions import (lines 43-46)
