# Story 9.3: Update System Prompt with Workflow Orchestration Instructions

Status: Draft

## Story

As a **developer**,
I want to **add workflow orchestration instructions to the system prompt**,
so that **LLM knows how to load workflows, resolve variables, and manage sessions**.

## Context

This is the third story of Epic 9 "Simplify Workflow Execution Architecture". After removing execute_workflow (Story 9.1) and simplifying the path resolver (Story 9.2), we now need to teach the LLM how to orchestrate workflows explicitly through system prompt instructions.

**Problem Statement**: With execute_workflow removed, the LLM needs explicit guidance on how to:
- Load workflow configuration files (workflow.yaml)
- Load referenced files (instructions, templates, config)
- Load core workflow engine (bmad/core/tasks/workflow.md)
- Manage session folders and output files
- Resolve path variables and config references

**Solution**: Add a comprehensive "Running Workflows" section (~80 lines) to the system prompt that provides step-by-step instructions for workflow execution. This section acts as the replacement for execute_workflow's hidden orchestration logic, but makes all actions explicit and visible to the LLM.

**Why This is Critical**: Without these instructions, the LLM will not know how to execute workflows. The system prompt is the new orchestration engine - it replaces 640 lines of hidden tool code with explicit, visible instructions that give the LLM full agency.

## Acceptance Criteria

1. Add new section to `lib/agents/prompts/system-prompt.md`: "Running Workflows"
2. Section includes (~80 lines):
   - **Step 1: Load Workflow Configuration** - Call read_file with workflow.yaml path, parse YAML structure
   - **Step 2: Load Referenced Files** - Load instructions, template, config files based on workflow.yaml
   - **Step 3: Load Core Workflow Engine** - Read bmad/core/tasks/workflow.md for execution rules
   - **Step 4: Execute Workflow Instructions** - Follow steps in exact order from instructions.md
   - **Step 5: Session and Output Management** - Generate UUID, create session folder, save files with explicit paths
   - **Variable Resolution Rules** - How to resolve {bundle-root}, {project-root}, {core-root}, {date}, {config_source}:variable_name
3. System prompt emphasizes: "You are in control. Read what you need, when you need it."
4. Examples provided for each step (workflow path resolution, config variable extraction, session folder creation)
5. System prompt tested with sample workflow to verify LLM follows instructions
6. Instructions are clear enough for GPT-4 to follow without confusion
7. Backward compatibility: BMAD agent commands (run-workflow attribute) still trigger workflow execution

## Tasks / Subtasks

- [ ] **Task 1**: Analyze current system prompt structure and identify insertion point (AC: 1)
  - [ ] Subtask 1.1: Read current `lib/agents/prompts/system-prompt.md` file
  - [ ] Subtask 1.2: Identify logical location for "Running Workflows" section (after tool usage instructions)
  - [ ] Subtask 1.3: Document current system prompt structure and version

- [ ] **Task 2**: Draft "Running Workflows" section Step 1-3 (AC: 2)
  - [ ] Subtask 2.1: Write Step 1: Load Workflow Configuration (~15 lines)
    - Explain how to call read_file with {bundle-root}/workflows/{name}/workflow.yaml
    - Explain how to parse YAML structure to extract instructions, template, config paths
    - Include example workflow.yaml structure
  - [ ] Subtask 2.2: Write Step 2: Load Referenced Files (~15 lines)
    - Explain how to extract file paths from workflow.yaml
    - Explain how to call read_file for each referenced file (instructions, template, config)
    - Emphasize: "Load files in order - you need them for execution"
  - [ ] Subtask 2.3: Write Step 3: Load Core Workflow Engine (~10 lines)
    - Explain: "CRITICAL: Always load {core-root}/tasks/workflow.md before executing any workflow"
    - Explain: "This file contains execution engine rules (step ordering, template-output tags, elicitation)"
    - Emphasize: "Read and understand workflow.md completely before proceeding"

- [ ] **Task 3**: Draft "Running Workflows" section Step 4-5 (AC: 2)
  - [ ] Subtask 3.1: Write Step 4: Execute Workflow Instructions (~15 lines)
    - Explain: "Follow instructions.md step by step in exact numerical order"
    - Explain structured XML format: `<step n="X" goal="...">` tags
    - Explain execution tags: `<action>`, `<check>`, `<ask>`, `<template-output>`
    - Emphasize: "Maintain conversation with user as specified in instructions"
  - [ ] Subtask 3.2: Write Step 5: Session and Output Management (~20 lines)
    - Explain how to generate session ID (UUID v4 or timestamp YYYY-MM-DD-HHMMSS)
    - Explain how to create session folder path: `{project-root}/data/agent-outputs/{session-id}/`
    - Explain how to call save_output with full explicit paths
    - Explain manifest.json creation (optional but recommended)
    - Include example session folder structure

- [ ] **Task 4**: Draft Variable Resolution Rules subsection (AC: 2)
  - [ ] Subtask 4.1: Write variable resolution table (~15 lines)
    - {bundle-root} → Provided by system as {{AGENT_PATH}} in system prompt
    - {project-root} → Provided by system as {{PROJECT_ROOT}} in system prompt
    - {core-root} → Resolve as `{{PROJECT_ROOT}}/bmad/core`
    - {date} → Generate current date in YYYY-MM-DD format yourself
    - {config_source}:variable_name → Read config.yaml first, extract variable value from YAML
    - {session_id} → Use the session ID you generated in Step 5.1
  - [ ] Subtask 4.2: Add variable resolution examples
    - Example 1: Resolving {bundle-root}/workflows/intake/workflow.yaml
    - Example 2: Resolving {config_source}:user_name from config.yaml
    - Example 3: Creating session folder path with generated session ID

- [ ] **Task 5**: Add emphasis statements and agency language (AC: 3)
  - [ ] Subtask 5.1: Add opening emphasis: "You are in control. Read what you need, when you need it."
  - [ ] Subtask 5.2: Add emphasis: "You decide when to create folders, what files to load, when to ask for variables"
  - [ ] Subtask 5.3: Add emphasis: "All actions are explicit - create, read, write, save"
  - [ ] Subtask 5.4: Add emphasis: "DO NOT wait for files to be provided - actively call read_file to load them"

- [ ] **Task 6**: Create complete examples for clarity (AC: 4)
  - [ ] Subtask 6.1: Add Example 1: Complete workflow execution flow
    - User: "/run-workflow intake-integration"
    - LLM: Load workflow.yaml → Parse → Load instructions → Load template → Generate session ID → Create session folder → Execute steps → Save output
  - [ ] Subtask 6.2: Add Example 2: Config variable resolution
    - Workflow needs {config_source}:user_name → LLM reads config.yaml → Extracts user_name: "Bryan" → Uses value directly
  - [ ] Subtask 6.3: Add Example 3: Session folder creation and file saving
    - Generate session ID: "2025-10-12-143022" → Create folder: /data/agent-outputs/2025-10-12-143022/ → Save file: /data/agent-outputs/2025-10-12-143022/output.md

- [ ] **Task 7**: Insert section into system-prompt.md and verify formatting (AC: 1, 7)
  - [ ] Subtask 7.1: Insert "Running Workflows" section after tool usage instructions
  - [ ] Subtask 7.2: Verify markdown formatting (headers, code blocks, lists)
  - [ ] Subtask 7.3: Verify section length (~80 lines, ±10 lines acceptable)
  - [ ] Subtask 7.4: Verify backward compatibility: BMAD agent commands with run-workflow attribute still work
  - [ ] Subtask 7.5: Update system prompt version or changelog if tracked

- [ ] **Task 8**: Test system prompt with sample workflow (AC: 5, 6)
  - [ ] Subtask 8.1: Load agent with updated system prompt
  - [ ] Subtask 8.2: Test command: "/run-workflow intake-integration" (if Alex agent) or equivalent simple workflow
  - [ ] Subtask 8.3: Verify LLM behavior:
    - ✓ LLM calls read_file for workflow.yaml
    - ✓ LLM parses YAML and identifies instructions/template files
    - ✓ LLM calls read_file for instructions.md and template.md
    - ✓ LLM calls read_file for bmad/core/tasks/workflow.md
    - ✓ LLM generates session ID
    - ✓ LLM creates session folder path correctly
    - ✓ LLM calls save_output with full explicit paths
  - [ ] Subtask 8.4: If LLM fails any step, refine instructions for clarity and re-test
  - [ ] Subtask 8.5: Document test results and any instruction refinements needed

- [ ] **Task 9**: Verify system prompt clarity and completeness (AC: 6)
  - [ ] Subtask 9.1: Review system prompt for GPT-4 clarity (avoid ambiguity, use explicit language)
  - [ ] Subtask 9.2: Verify all variable types covered ({bundle-root}, {core-root}, {project-root}, {date}, {config_source}:var, {session_id})
  - [ ] Subtask 9.3: Verify all workflow steps covered (load config → load files → load engine → execute → save outputs)
  - [ ] Subtask 9.4: Verify session management instructions complete (UUID generation, folder creation, manifest.json)
  - [ ] Subtask 9.5: Add any missing clarifications discovered during testing

- [ ] **Task 10**: Final validation and documentation (AC: 5, 6, 7)
  - [ ] Subtask 10.1: Run comprehensive test with at least 2 different workflows (verify instructions work for multiple workflow types)
  - [ ] Subtask 10.2: Verify no regressions: Agent commands with run-workflow attribute still trigger workflow execution
  - [ ] Subtask 10.3: Update tech-spec-epic-9.md with actual system prompt line count and changes
  - [ ] Subtask 10.4: Document any deviations from original spec (expected ~80 lines, document actual)
  - [ ] Subtask 10.5: Create completion notes with test results and examples

## Dev Notes

### Architectural Context

**Epic 9 Goal**: Refactor workflow execution to LLM-orchestrated pattern by removing over-engineered tool abstractions.

**This Story's Role**: Add comprehensive workflow orchestration instructions to system prompt, replacing the 640-line execute_workflow tool's hidden logic with explicit, visible guidance. This is the critical bridge - without these instructions, the LLM will not know how to execute workflows after execute_workflow was removed in Story 9.1.

**Dependencies**:
- **Prerequisites**: Story 9.1 complete (execute_workflow removed), Story 9.2 complete (path resolver simplified)
- **Blocks**: Story 9.4 (save_output simplification needs these instructions in place)
- **Enables**: Story 9.5 (workflow instruction file updates will reference these system prompt instructions)

### System Prompt Architecture

**Current System Prompt Structure** (lib/agents/prompts/system-prompt.md):
1. Agent Identity and Role
2. Available Tools
3. Tool Usage Instructions (read_file, save_output)
4. **[NEW]** Running Workflows ← Insert here
5. General Guidelines and Best Practices

**New Section Structure** (Running Workflows, ~80 lines):
```markdown
## Running Workflows

When a user runs a workflow command (identified by `run-workflow` attribute in command listing):

### Step 1: Load Workflow Configuration (15 lines)
- How to call read_file with workflow.yaml path
- How to parse YAML structure
- Example workflow.yaml structure

### Step 2: Load Referenced Files (15 lines)
- How to extract file paths from workflow.yaml
- How to load instructions, template, config
- Emphasis on loading in order

### Step 3: Load Core Workflow Engine (10 lines)
- CRITICAL: Always load bmad/core/tasks/workflow.md
- Explains execution engine rules
- Emphasizes understanding before proceeding

### Step 4: Execute Workflow Instructions (15 lines)
- Follow instructions.md step by step
- Structured XML format explanation
- Execution tags: action, check, ask, template-output

### Step 5: Session and Output Management (20 lines)
- Generate session ID (UUID v4 or timestamp)
- Create session folder path
- Save files with explicit paths
- Manifest.json creation (optional)

### Variable Resolution Rules (15 lines)
- Table of variable types and how to resolve each
- Examples for each variable type
```

### Writing Style for System Prompt

**Principles for LLM Instruction Writing**:
1. **Be Explicit**: Avoid ambiguity. Use concrete examples.
2. **Be Prescriptive**: "Do this" not "You could do this"
3. **Be Sequential**: Number steps clearly (1, 2, 3...)
4. **Emphasize Critical Points**: Use bold, "CRITICAL:", "IMPORTANT:", "NOTE:"
5. **Provide Examples**: Show don't just tell
6. **Use Active Voice**: "Call read_file" not "read_file should be called"
7. **Test with GPT-4**: This is written for GPT-4, not Claude

**Example of Good vs Bad Instructions**:

❌ **Bad** (Ambiguous):
```markdown
You might want to load the workflow configuration first.
```

✅ **Good** (Explicit and Prescriptive):
```markdown
### Step 1: Load Workflow Configuration

Call `read_file` with path: `{bundle-root}/workflows/{workflow-name}/workflow.yaml`

Example:
- User command: `/run-workflow intake-integration`
- Your action: `read_file({ path: "{bundle-root}/workflows/intake-integration/workflow.yaml" })`
```

### Variable Resolution Design

**Key Design Decision**: System prompt explains WHICH variables the LLM resolves vs WHICH variables are resolved by the system (path resolver).

**System-Resolved** (Path Resolver handles these):
- `{bundle-root}` → Replaced with agent bundle path by path resolver
- `{core-root}` → Replaced with bmad/core/ by path resolver
- `{project-root}` → Replaced with app root by path resolver

**LLM-Resolved** (LLM handles these explicitly):
- `{date}` → LLM generates current date (e.g., "2025-10-12")
- `{config_source}:variable_name` → LLM reads config.yaml, extracts variable value
- `{session_id}` → LLM generates UUID or timestamp, uses throughout workflow

**System Prompt Must Clarify This Division**:
```markdown
### Variable Resolution Rules

When you encounter variables in paths:

**System-Resolved Variables** (path resolver handles automatically):
- `{bundle-root}` → Use {{AGENT_PATH}} (provided in system prompt)
- `{project-root}` → Use {{PROJECT_ROOT}} (provided in system prompt)
- `{core-root}` → Use {{PROJECT_ROOT}}/bmad/core

**LLM-Resolved Variables** (you handle explicitly):
- `{date}` → Generate current date in YYYY-MM-DD format
- `{config_source}:variable_name` → Read config.yaml first, extract variable value
- `{session_id}` → Use the session ID you generated in Step 5.1
```

### Testing Strategy

**Manual Testing Approach** (Required for AC 5, 6):

1. **Setup**:
   - Use existing agent with simple workflow (e.g., Alex with intake-integration)
   - Ensure Stories 9.1 and 9.2 are complete (execute_workflow removed, path resolver simplified)

2. **Test Scenario 1: Complete Workflow Execution**:
   - User: "/run-workflow intake-integration"
   - **Expected LLM Behavior**:
     - Call read_file for workflow.yaml
     - Parse YAML, identify instructions/template paths
     - Call read_file for instructions.md
     - Call read_file for template.md (if specified)
     - Call read_file for bmad/core/tasks/workflow.md
     - Generate session ID (UUID or timestamp)
     - Create session folder path: /data/agent-outputs/{session-id}/
     - Execute workflow steps from instructions.md
     - Call save_output with full paths to session folder
   - **Verification**: All files saved correctly, session folder exists, no errors

3. **Test Scenario 2: Config Variable Resolution**:
   - Workflow references {config_source}:user_name
   - **Expected LLM Behavior**:
     - Call read_file for config.yaml
     - Parse YAML, extract user_name value
     - Use value directly in workflow execution (e.g., "Bryan")
   - **Verification**: LLM correctly extracts and uses config variable

4. **Test Scenario 3: Path Variable Resolution**:
   - Workflow uses {bundle-root}, {core-root}, {project-root}
   - **Expected LLM Behavior**:
     - Calls read_file/save_output with variables in paths
     - Path resolver replaces variables automatically
     - LLM receives resolved paths in tool results
   - **Verification**: Files loaded from correct locations

5. **Test Scenario 4: Error Recovery**:
   - LLM forgets to create session folder before saving
   - **Expected LLM Behavior**:
     - Call save_output with incomplete path
     - Receive error: "Invalid path: Must save to /data/agent-outputs/{session-id}/ folder"
     - Recover by creating session folder first
   - **Verification**: LLM self-corrects based on error message

**Refinement Criteria**:
- If LLM skips steps → Add more explicit emphasis (bold, "CRITICAL:", numbered list)
- If LLM confused about variables → Add clearer examples with before/after paths
- If LLM doesn't create session folder → Add explicit checklist or validation step
- If LLM doesn't load workflow.md → Move Step 3 earlier or add more emphasis

### Alignment with unified-project-structure.md

**Expected File Locations**:
- System Prompt: `lib/agents/prompts/system-prompt.md` (✅ matches structure)
- Path Resolver: `lib/pathResolver.ts` (✅ used in variable resolution rules)
- File Operation Tools: `lib/tools/fileOperations.ts` (✅ referenced in examples)

**No structural conflicts detected** - all files align with established project structure.

### Risk Mitigation

**Risk**: System prompt instructions too verbose (>100 lines), causing token bloat
**Mitigation**: Target ~80 lines. Be concise but complete. Use examples sparingly (1-2 per section).

**Risk**: Instructions unclear to GPT-4, causing execution failures
**Mitigation**: Test with GPT-4 during implementation (Task 8). Refine based on actual LLM behavior. Use explicit, prescriptive language.

**Risk**: Backward compatibility broken (BMAD commands with run-workflow attribute)
**Mitigation**: Test agent command flow (Task 7.4, Task 10.2). Ensure run-workflow attribute still triggers workflow execution as before.

**Risk**: Variable resolution ambiguity (LLM vs system)
**Mitigation**: Create clear table dividing responsibilities (Task 4.1). Test with workflows that use all variable types (Task 10.1).

### References

**Source Documents**:
- [Source: docs/epics.md#Epic-9-Story-9.3] - Story definition and acceptance criteria
- [Source: docs/tech-spec-epic-9.md#Story-9.3] - Technical specification and detailed design
- [Source: docs/REFACTOR-SPEC-SIMPLIFY-WORKFLOW-EXECUTION.md#Phase-2] - System prompt update rationale and approach
- [Source: lib/agents/prompts/system-prompt.md] - Current system prompt structure to be updated
- [Source: bmad/core/tasks/workflow.md] - Core workflow engine that LLM will load and follow

**Related Architecture Docs**:
- [Source: docs/solution-architecture.md] - Overall system architecture
- [Source: docs/execute_workflow_behavior_reference.md] - Reference for behavior being replaced by system prompt

**Variable Resolution Reference**:
- [Source: lib/pathResolver.ts] - Simplified path resolver from Story 9.2 (system-resolved variables)
- [Source: docs/tech-spec-epic-9.md#Variable-Resolution-Rules] - Complete variable resolution design

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-12 | 0.1     | Initial draft | Bryan  |

## Dev Agent Record

### Context Reference

- `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-9.9.3.xml` (Generated: 2025-10-12)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
