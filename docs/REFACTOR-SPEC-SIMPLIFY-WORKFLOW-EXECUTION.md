# Epic: Simplify Workflow Execution Architecture

**Created**: 2025-10-11
**Status**: Proposed
**Priority**: High
**Effort Estimate**: Medium (3-5 days)

---

## Executive Summary

The current workflow execution system is **over-engineered** with too many layers of abstraction between the LLM and file operations. This complexity:

1. **Reduces LLM agency** - The system does work the LLM should orchestrate
2. **Creates cognitive overhead** - Complex tool results confuse the LLM (especially GPT-4)
3. **Makes debugging difficult** - Too many layers (system prompt → workflow.md → execute_workflow → path resolver)
4. **Differs from Claude Code** - Claude Code uses simple file operations, not workflow orchestration engines

**Goal**: Refactor to a **Claude Code-like architecture** where the LLM orchestrates workflows using simple file operations (`read_file`, `save_output`) rather than a specialized `execute_workflow` tool.

---

## Current Architecture (Problems)

### Current Flow
```
User: /run-workflow intake-integration

↓

System: Calls execute_workflow tool (640 lines of code!)
  ↓
  → Reads workflow.yaml
  → Parses YAML
  → Generates UUID session_id
  → Creates session folder
  → Generates manifest.json
  → Resolves variables (5-pass nested resolution)
  → Auto-loads ALL files based on file extensions
  → Updates bundleConfig from loaded files
  → Injects session_folder into context
  → Returns massive object: {
      success, path, workflow_name, description, config,
      user_input, session_id, session_folder,
      instructions, template, config_source, ...
    }

↓

LLM: Receives complex structured object
  → Must parse JSON structure
  → Must understand session management
  → Must figure out which fields are files vs metadata
  → Often confused about what to do next
```

### Key Problems

#### 1. **Removes LLM Agency**
The `execute_workflow` tool does too much "magic":
- Creates session folders (LLM doesn't know where)
- Generates UUIDs (LLM doesn't know when/why)
- Auto-loads files (LLM doesn't request them)
- Resolves variables in 5 passes (LLM never sees the logic)

**Claude Code approach**: LLM decides when to create folders, what files to load, when to ask for variables.

#### 2. **Complex Tool Results**
The tool returns a 10+ field object with mixed concerns:
```json
{
  "success": true,
  "workflow_name": "intake-integration",
  "description": "...",
  "config": { /* 20+ resolved variables */ },
  "session_id": "uuid-here",
  "session_folder": "path/here",
  "instructions": "... 189 lines ...",
  "template": "... 50 lines ...",
  "config_source": "... yaml content ..."
}
```

GPT-4 struggles to parse this. Claude Code just gets: `"file content here"`.

#### 3. **Hidden Session Management**
- Session folders created automatically
- UUIDs generated behind the scenes
- Manifest files written without LLM awareness
- `save_output` uses session_folder context variable

**Result**: When LLM calls `save_output("output.md")`, it magically goes to a session folder the LLM never explicitly created.

#### 4. **Over-Complex Path Resolution**
The path resolver has 471 lines handling:
- 5-pass nested variable resolution
- Config variable references `{config_source}:variable_name`
- System variables `{date}`, `{user_name}`
- Path variables `{bundle-root}`, `{core-root}`, `{project-root}`
- Circular reference detection
- Security validation
- Symlink resolution

**Most of this complexity isn't needed** if the LLM orchestrates variable resolution.

---

## Proposed Architecture (Simple)

### New Flow
```
User: /run-workflow intake-integration

↓

System Prompt instructs LLM:
  "When running a workflow:
   1. Read the workflow.yaml file at {bundle-root}/workflows/{name}/workflow.yaml
   2. Parse it to understand structure
   3. Load any referenced files (instructions, template, config)
   4. Execute the workflow step by step
   5. When saving output, create appropriate folders and files"

↓

LLM: I need to load the workflow configuration
  [Calls read_file with workflow.yaml path]
  [Gets raw YAML content]

LLM: Let me parse this...I see instructions at {bundle-root}/workflows/intake-integration/instructions.md
  [Calls read_file with instructions path]
  [Gets instructions content]

LLM: I also need the template file
  [Calls read_file with template path]
  [Gets template content]

LLM: Now I'll follow the workflow instructions...
  [Executes workflow according to instructions.md]

LLM: Step 8 says to save the final document. Let me create a session folder first.
  [Calls save_output to create session folder and files]
  [Explicit, visible action]
```

### Key Improvements

#### 1. **LLM Has Full Agency**
- LLM decides when to read files
- LLM decides when to create folders
- LLM decides what to name output files
- LLM sees and controls all actions

#### 2. **Simple Tool Results**
```
read_file result:
{
  "success": true,
  "content": "file content here"
}
```

That's it. No complex nested objects.

#### 3. **Explicit Session Management**
System prompt tells LLM:
```markdown
When creating workflow outputs:
1. Generate a session ID (uuid or timestamp)
2. Create folder: /data/agent-outputs/{session-id}/
3. Save files to that folder
4. Create a manifest.json with workflow metadata
```

Everything is explicit and visible in conversation.

#### 4. **Simpler Path Resolution**
Variables resolve in system prompt or by LLM:
- `{bundle-root}` → System prompt provides this as environment variable
- `{config_source}:variable_name` → LLM reads config.yaml first, then uses values
- `{date}` → LLM generates this (or system prompt provides "current date")

---

## Technical Implementation

### Phase 1: Remove execute_workflow Tool

**Files to modify**:
- `lib/tools/fileOperations.ts` - Remove `executeWorkflow` function (lines 289-516)
- `lib/tools/toolDefinitions.ts` - Remove `executeWorkflowTool` export
- `lib/agents/agenticLoop.ts` - Remove from tool definitions list

**Result**: Only two tools remain:
1. `read_file` - Read any file
2. `save_output` - Write any file

### Phase 2: Update System Prompt for Workflow Orchestration

**File**: `lib/agents/prompts/system-prompt.md`

**Add section**:
```markdown
## Running Workflows

When a user runs a workflow command (identified by `run-workflow` attribute in command listing):

### Step 1: Load Workflow Configuration
1. Call `read_file` with path: `{bundle-root}/workflows/{workflow-name}/workflow.yaml`
2. Parse the YAML to understand the workflow structure

### Step 2: Load Referenced Files
The workflow.yaml will reference files like:
- `instructions: "{bundle-root}/workflows/{name}/instructions.md"` - The step-by-step workflow logic
- `template: "{bundle-root}/templates/template-name.md"` - Optional template for output
- `config_source: "{bundle-root}/config.yaml"` - Configuration with variables

For each referenced file:
1. Resolve the path (replace {bundle-root} with {{AGENT_PATH}})
2. Call `read_file` with the resolved path
3. Store the content for use during workflow execution

### Step 3: Load Core Workflow Engine
**CRITICAL**: Before executing any workflow, you MUST load the workflow execution rules:
1. Call `read_file` with path: `{project-root}/bmad/core/tasks/workflow.md`
2. This file contains the execution engine rules that govern how to interpret workflow instructions
3. Read and understand it completely before proceeding

### Step 4: Execute Workflow Instructions
1. Follow the instructions.md file step by step
2. The instructions are structured as `<step n="X" goal="...">` tags
3. Execute steps in exact numerical order
4. Follow all `<action>`, `<check>`, `<ask>`, and `<template-output>` tags
5. Maintain conversation with user as specified in instructions

### Step 5: Session and Output Management
When the workflow requires saving output:

1. **Generate Session ID**: Create a unique identifier (UUID v4 or timestamp: YYYY-MM-DD-HHMMSS)
2. **Create Session Folder**:
   - Path: `{project-root}/data/agent-outputs/{session-id}/`
   - Call `save_output` to create the folder structure
3. **Save Output Files**:
   - Call `save_output` with full path: `{project-root}/data/agent-outputs/{session-id}/filename.md`
4. **Create Manifest** (optional but recommended):
   - Create manifest.json with workflow metadata
   - Include: session_id, workflow_name, started_at, user, status

### Variable Resolution
When you encounter variables in paths:
- `{bundle-root}` → Use {{AGENT_PATH}} (provided in system prompt)
- `{project-root}` → Use {{PROJECT_ROOT}} (provided in system prompt)
- `{core-root}` → Use {{PROJECT_ROOT}}/bmad/core
- `{date}` → Generate current date in YYYY-MM-DD format
- `{config_source}:variable_name` → Read config.yaml first, extract variable value
- `{session_id}` → Use the session ID you generated in Step 5.1

You are in control. Read what you need, when you need it. Create folders and files explicitly.
```

### Phase 3: Simplify Path Resolver

**File**: `lib/pathResolver.ts`

**Keep**:
- Basic path resolution for `{bundle-root}`, `{core-root}`, `{project-root}`
- Security validation (stays within allowed directories)
- Write path validation (restrict to /data/agent-outputs)

**Remove**:
- `{config_source}:variable_name` resolution (let LLM handle this)
- `{date}` and `{user_name}` resolution (let LLM handle this)
- `{session_id}` resolution (let LLM handle this)
- Multi-pass nested variable resolution (no longer needed)
- Config file auto-loading and parsing
- Circular reference detection

**Result**: Path resolver shrinks from 471 lines to ~150 lines (68% reduction).

### Phase 4: Update save_output Tool

**File**: `lib/tools/fileOperations.ts`

**Current behavior**:
```typescript
// If sessionFolder is set and file_path is relative, prepend session folder
if (context.sessionFolder && !params.file_path.startsWith('{') && !params.file_path.startsWith('/')) {
  filePathToResolve = resolve(context.sessionFolder, params.file_path);
}
```

**New behavior**:
```typescript
// LLM provides full paths - just resolve variables and save
resolvedPath = resolvePath(params.file_path, context);
```

Remove session folder auto-prepending. LLM explicitly provides full paths.

### Phase 5: Update Workflow Instructions

**Files**: All `workflows/*/instructions.md` files

**Update Step 0** (initialization):
```markdown
<step n="0" goal="Initialize session and load template">
<action>Generate session ID using uuid v4 or timestamp format YYYY-MM-DD-HHMMSS</action>
<action>Create session folder at {project-root}/data/agent-outputs/{session-id}/</action>
<action>Read template file from {bundle-root}/templates/initial-requirements.md</action>
<action>Save template to {project-root}/data/agent-outputs/{session-id}/output.md</action>
<action>Throughout this workflow, you will read output.md, modify it, and save it back</action>
</step>
```

**Key change**: Make session folder creation explicit in instructions, not hidden in tooling.

### Phase 6: Update Critical Actions Processor

**File**: `lib/agents/criticalActions.ts`

**Current**: Auto-loads config.yaml during initialization

**New**: Add config.yaml content to system prompt as environment variable
```typescript
const configPath = resolve(bundleRoot, 'config.yaml');
const configContent = await readFile(configPath, 'utf-8');
const config = parseYaml(configContent);

// Add to system prompt
criticalContext.messages.push({
  role: 'system',
  content: `Bundle Configuration Variables:
${Object.entries(config).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Use these variables when resolving {config_source}:variable_name references.`
});
```

---

## Migration Strategy

### Approach: Feature Flag

Add environment variable to toggle between old and new behavior:
```
WORKFLOW_EXECUTION_MODE=legacy|simple
```

**Phase 1-2 weeks**: Build new simple system alongside old system
**Phase 3-4 weeks**: Test new system with real workflows
**Phase 5**: Switch default to new system
**Phase 6**: Remove old code after 30 days

### Testing Plan

#### Unit Tests
- `read_file` with various path patterns
- `save_output` with security validation
- Path resolution edge cases

#### Integration Tests
- Run existing workflows with new system
- Compare output files with legacy system
- Verify session folder structure

#### Manual Testing
- Run intake-integration workflow
- Run deep-dive-integration workflow
- Run build-stories workflow
- Test with GPT-4 and Claude (if switching)

---

## Files Affected

### Modified Files
1. `lib/tools/fileOperations.ts` - Remove executeWorkflow, simplify save_output (~300 lines removed)
2. `lib/tools/toolDefinitions.ts` - Remove executeWorkflowTool (~30 lines removed)
3. `lib/agents/agenticLoop.ts` - Remove execute_workflow from tools list (~5 lines)
4. `lib/pathResolver.ts` - Simplify variable resolution (~250 lines removed)
5. `lib/agents/prompts/system-prompt.md` - Add workflow orchestration section (~80 lines added)
6. `lib/agents/criticalActions.ts` - Add config as environment variable (~20 lines modified)

### Files to Update (Workflow Instructions)
All `bmad/custom/bundles/requirements-workflow/workflows/*/instructions.md` files:
- intake-integration
- intake-app
- intake-workflow
- intake-reporting
- intake-portal
- intake-itsm
- deep-dive-* (6 files)
- build-stories
- edit-stories
- review-epic

**Update count**: ~15 instruction files

---

## Expected Benefits

### 1. **Improved LLM Behavior**
- LLM understands what it's doing (explicit actions)
- Better adherence to workflow steps (less confusion)
- Works better with GPT-4 (simpler tool results)

### 2. **Easier Debugging**
- All actions visible in conversation
- Fewer abstraction layers
- Clear cause-and-effect relationships

### 3. **Maintainability**
- ~580 lines of code removed
- Simpler mental model
- Easier onboarding for new developers

### 4. **Flexibility**
- LLM can adapt workflows on the fly
- Easier to handle edge cases
- User can intervene at any step

### 5. **Closer to Claude Code**
- Matches proven architecture
- Easier to understand for users familiar with Claude Code
- Can copy patterns from Claude Code docs

---

## Risks and Mitigations

### Risk 1: LLM Forgets Steps
**Risk**: Without auto-orchestration, LLM might skip workflow initialization steps

**Mitigation**:
- Workflow instructions explicitly list all steps
- System prompt emphasizes "execute steps in exact order"
- workflow.md mandates "follow all steps"

### Risk 2: Session Folder Naming Inconsistency
**Risk**: LLM might create session folders with different naming patterns

**Mitigation**:
- System prompt provides explicit format: `{session-id}`
- Workflow instructions show example format
- Session ID validation in save_output tool

### Risk 3: Variable Resolution Errors
**Risk**: LLM might not resolve variables correctly

**Mitigation**:
- System prompt provides clear variable resolution rules
- Path resolver still handles `{bundle-root}`, `{project-root}`, `{core-root}`
- LLM can ask user if variable is unclear

### Risk 4: Increased Token Usage
**Risk**: Multiple read_file calls increase token usage vs single execute_workflow

**Mitigation**:
- Token cost is negligible compared to improved behavior
- Can optimize by loading files lazily (only when needed)
- Modern models have large context windows

---

## Success Criteria

### Must Have
1. All existing workflows produce identical output files
2. Session folder structure remains consistent
3. No security vulnerabilities introduced
4. All tests pass

### Should Have
1. LLM demonstrates better step adherence (measured by manual testing)
2. Debugging is easier (measured by time to diagnose issues)
3. Code is simpler (measured by line count reduction)

### Nice to Have
1. Works well with Claude API (if switching from GPT-4)
2. Users report improved agent behavior
3. Faster execution time (fewer complex operations)

---

## Open Questions

1. **Model Selection**: Should we switch to Claude API as part of this refactor?
   - Pro: Claude better at following structured instructions
   - Con: Requires API key setup, potentially different pricing

2. **Session ID Format**: UUID v4 or timestamp?
   - UUID: More unique, harder to read
   - Timestamp: Human-readable, potential collisions

3. **Manifest Generation**: Should LLM always create manifest.json?
   - Pro: Consistent metadata for all sessions
   - Con: Extra file write operation

4. **Config Loading**: Should config be in system prompt or loaded by LLM?
   - System prompt: Faster, always available
   - LLM load: More explicit, uses fewer tokens if not needed

---

## Next Steps

1. **Architect Review**: Review this specification, identify issues, propose changes
2. **Epic Creation**: Break down into stories and tasks in project management tool
3. **Prototype**: Build simplified read_file/save_output flow for one workflow
4. **Test Prototype**: Run intake-integration workflow with new system
5. **Iterate**: Refine based on testing results
6. **Full Implementation**: Apply to all workflows
7. **Documentation**: Update developer docs and user guides

---

## Appendix: Code Comparison

### Before: execute_workflow (640 lines)
```typescript
export async function executeWorkflow(
  params: ExecuteWorkflowParams,
  context: PathContext
): Promise<ToolResult> {
  // 1. Resolve workflow path (10 lines)
  // 2. Read and parse YAML (20 lines)
  // 3. Generate UUID session ID (10 lines)
  // 4. Inject session_id into config (15 lines)
  // 5. Create enhanced context (20 lines)
  // 6. Multi-pass variable resolution (80 lines)
  // 7. Dynamic file loading loop (120 lines)
  // 8. Config file special handling (40 lines)
  // 9. Session folder creation (60 lines)
  // 10. Manifest generation (80 lines)
  // 11. Security validation (30 lines)
  // 12. Return massive object (50 lines)
  // 13. Error handling (100 lines)

  return {
    success: true,
    workflow_name, description, config, user_input,
    session_id, session_folder, instructions, template, ...
  };
}
```

### After: System prompt instructs LLM
```markdown
## Running Workflows

1. Call read_file with workflow.yaml
2. Parse YAML
3. Call read_file for each referenced file
4. Execute workflow instructions
5. Create session folder and save outputs
```

LLM orchestrates, tools just read/write files.

---

## References

- Current system prompt: `lib/agents/prompts/system-prompt.md`
- Current executeWorkflow: `lib/tools/fileOperations.ts` lines 289-640
- Path resolver: `lib/pathResolver.ts`
- Workflow engine spec: `bmad/core/tasks/workflow.md`
- Example workflow: `bmad/custom/bundles/requirements-workflow/workflows/intake-integration/`

---

**Document Owner**: Bryan Inagaki
**Technical Lead**: [Architect Name]
**Last Updated**: 2025-10-11
