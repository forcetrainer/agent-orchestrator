# Workflow Execution Migration Guide

**Epic 9: Simplify Workflow Execution Architecture**
**Version:** 1.0
**Date:** 2025-10-12
**Status:** Complete

---

## Overview

Epic 9 refactored the workflow execution system from a **tool-orchestrated pattern** to an **LLM-orchestrated pattern**. The previous `execute_workflow` tool (640 lines) performed too much "magic" behind the scenes—creating sessions, resolving variables, and auto-loading files without LLM awareness. This created cognitive overhead and reduced LLM agency.

**The new architecture gives the LLM full control** over workflow execution through explicit file operations (`read_file`, `save_output`, `preload_workflow`) guided by system prompt instructions.

---

## What Changed

### Before Epic 9 (Tool-Orchestrated)

#### execute_workflow Tool (640 lines - REMOVED)
```typescript
// OLD: Single tool did everything
const result = await execute_workflow({
  workflow_name: "intake-integration",
  bundle_name: "requirements-workflow"
});

// Result: Complex 10+ field nested object
{
  success: true,
  workflow_name: "intake-integration",
  description: "...",
  config: { /* 20+ resolved variables */ },
  session_id: "uuid-here",
  session_folder: "path/here",
  instructions: "... 189 lines ...",
  template: "... 50 lines ...",
  config_source: "... yaml content ..."
}
```

**Problems:**
- ❌ Hidden session management (UUIDs generated behind the scenes)
- ❌ Auto-loading files (LLM didn't request them)
- ❌ 5-pass nested variable resolution (LLM never saw the logic)
- ❌ Complex tool results (10+ fields, confusing for GPT-4)
- ❌ Reduced LLM agency (system did work LLM should orchestrate)

#### Path Resolver (471 lines - SIMPLIFIED)
- Multi-pass nested variable resolution
- Config file auto-loading and YAML parsing
- `{config_source}:variable_name` resolution
- `{date}`, `{user_name}`, `{session_id}` generation
- Circular reference detection

---

### After Epic 9 (LLM-Orchestrated)

#### preload_workflow Tool (NEW)
```typescript
// NEW: Smart pre-loading in single call
const result = await preload_workflow({
  workflow_path: "{bundle-root}/workflows/intake-integration/workflow.yaml"
});

// Result: Simple structured object
{
  success: true,
  workflow: { name: "...", description: "...", ... },
  instructions: "... file content ...",
  template: "... file content ...",
  config: { ... }
}
```

**Benefits:**
- ✅ All workflow files loaded in parallel
- ✅ Single API call (vs 4-6 sequential calls)
- ✅ 50-70% token reduction
- ✅ <20s initialization (vs ~110s baseline)
- ✅ LLM still has full control

#### Path Resolver (269 lines - SIMPLIFIED)
```typescript
// Simplified: Only 3 core variables
{
  'bundle-root': '/app/bmad/custom/bundles/my-bundle',
  'core-root': '/app/bmad/core',
  'project-root': '/app'
}
```

**What Was Removed:**
- ❌ `{config_source}:variable_name` → LLM reads config.yaml directly
- ❌ `{date}`, `{user_name}` → LLM generates these values
- ❌ `{session_id}` → LLM manages session IDs explicitly
- ❌ Multi-pass resolution → Single-pass string replacement
- ❌ Config auto-loading → LLM loads config when needed

**What Remains:**
- ✅ Security validation (path traversal, write restrictions)
- ✅ Basic path variables (`{bundle-root}`, `{core-root}`, `{project-root}`)
- ✅ Symlink resolution and validation

---

## New Workflow Execution Pattern

### Step-by-Step Flow

```
1. User: /run-workflow intake-integration

2. LLM: I'll load the workflow configuration
   → Calls preload_workflow tool with workflow path

3. Tool: Returns all workflow files in single response
   {
     workflow: {...},
     instructions: "...",
     template: "...",
     config: {...}
   }

4. LLM: Now I have everything. Let me follow the instructions step-by-step.
   → Parses instructions
   → Generates session ID (uuid)
   → Creates session folder explicitly

5. LLM: Executing workflow steps...
   → May call read_file for additional files
   → May call save_output to write results

6. LLM: Workflow complete! ✅
   → Session folder created at /data/agent-outputs/{uuid}/
   → Output files saved (output.md, manifest.json, etc.)
```

### Key Differences

| Aspect | Before (Tool-Orchestrated) | After (LLM-Orchestrated) |
|--------|---------------------------|-------------------------|
| **File Loading** | Auto-loaded by tool | LLM calls preload_workflow |
| **Session Management** | Hidden (tool generates UUID) | Explicit (LLM generates UUID) |
| **Variable Resolution** | 5-pass nested resolution | LLM reads config, substitutes values |
| **Visibility** | Hidden in tool code | Fully visible in conversation |
| **Token Usage** | High (sequential loading) | Reduced 50-70% (parallel loading) |
| **API Calls** | 4-6 sequential calls | 1 call for initialization |
| **Debugging** | Difficult (hidden layers) | Easy (all actions visible) |

---

## Migration Impact

### For Agent Builders

**Good News:** No changes required to agent bundles! 🎉

- ✅ Workflow YAML files unchanged
- ✅ Instructions markdown unchanged
- ✅ Template files unchanged
- ✅ Config files unchanged
- ✅ Workflows execute identically

**Benefits:**
- 🚀 Faster workflow initialization (<20s vs ~110s)
- 🔍 More transparent execution (visible in conversation)
- 🐛 Easier debugging (explicit tool calls)
- 💾 Lower token usage (50-70% reduction)

### For Developers

**What You Need to Know:**

1. **System Prompt Changes** (`lib/agents/prompts/system-prompt.md`)
   - Lines 59-204: Workflow orchestration instructions
   - LLM now follows explicit steps for workflow execution
   - Session management instructions included

2. **Tool Changes**
   - **REMOVED:** `execute_workflow` tool
   - **KEPT:** `read_file`, `save_output` tools
   - **NEW:** `preload_workflow` tool (Story 9.4)

3. **Path Resolver** (`lib/pathResolver.ts`)
   - Simplified from 471 → 269 lines
   - Security validation maintained
   - Only 3 core variables: `{bundle-root}`, `{core-root}`, `{project-root}`

4. **Testing**
   - All Epic 4-6 tests still pass
   - Workflow outputs identical to baseline
   - No regressions introduced

---

## Troubleshooting

### Common Issues

#### 1. LLM doesn't create session folder

**Symptom:** save_output fails with "session folder required" error

**Solution:**
- Check system-prompt.md lines 59-204 for orchestration instructions
- Verify LLM has been instructed to generate session ID and create folder
- Look for: "Generate a session ID (UUID) and create /data/agent-outputs/{uuid}/"

#### 2. Files not loading / workflow not starting

**Symptom:** LLM doesn't call preload_workflow tool

**Solution:**
- Verify preload_workflow tool registered in `agenticLoop.ts:89`
- Check toolDefinitions.ts exports preloadWorkflowTool
- Ensure system prompt mentions preload_workflow tool

#### 3. Path resolution errors

**Symptom:** "Unknown variable: {some-variable}" error

**Solution:**
- Only 3 variables supported: `{bundle-root}`, `{core-root}`, `{project-root}`
- For other variables (e.g., `{date}`, `{user_name}`), LLM must generate them
- Check if LLM is reading config.yaml to get variable values

#### 4. Workflow behavior different from before Epic 9

**Symptom:** Outputs don't match expected format

**Solution:**
- Review conversation logs to see LLM's orchestration steps
- Compare against system-prompt.md workflow instructions
- Check if all workflow files were loaded by preload_workflow
- Verify session folder structure matches baseline

---

## Technical Details

### System Prompt Instructions (v2.4.4)

Location: `lib/agents/prompts/system-prompt.md` (lines 59-204)

The system prompt now includes explicit instructions for:

1. **Loading Workflow Files**
   ```
   When user requests /run-workflow {name}:
   1. Call preload_workflow tool with workflow path
   2. Receive all files in single response
   3. Parse workflow structure
   ```

2. **Session Management**
   ```
   Create session folder:
   1. Generate UUID or timestamp session ID
   2. Create folder: /data/agent-outputs/{session-id}/
   3. Use this folder for all workflow outputs
   ```

3. **Variable Resolution**
   ```
   Resolve variables:
   - {bundle-root}, {core-root}, {project-root} → System provides
   - {date} → Generate current date (YYYY-MM-DD)
   - {user_name} → Read from config.yaml
   - Config variables → Read config.yaml, extract value
   ```

4. **Workflow Execution**
   ```
   Follow instructions step-by-step:
   1. Execute each step in exact order
   2. Use read_file for additional files
   3. Use save_output for results
   4. Create manifest.json at completion
   ```

### Smart Workflow Pre-loading (Story 9.4)

**Module:** `lib/workflows/workflowPreloader.ts`

**Function:** `preloadWorkflowFiles(workflowPath, pathContext)`

**Features:**
- Parallel file loading (workflow.yaml, instructions.md, template.md, config.yaml)
- Conditional file detection (`<elicit-required>` tags)
- Variable resolution within YAML
- Performance: <100ms for local files
- Token reduction: 50-70% vs sequential loading

**Tool Definition:**
```typescript
{
  type: "function",
  function: {
    name: "preload_workflow",
    description: "Load all workflow files in a single call...",
    parameters: {
      workflow_path: "Path to workflow.yaml file"
    }
  }
}
```

---

## Architecture Comparison

### Sequence Diagram: Before Epic 9

```
User → Agent: /run-workflow intake-integration
Agent → execute_workflow: Call tool
execute_workflow → FileSystem: Read workflow.yaml
execute_workflow → FileSystem: Auto-load instructions, template, config
execute_workflow → PathResolver: 5-pass nested variable resolution
execute_workflow → FileSystem: Create session folder (auto)
execute_workflow → Agent: Return complex object (10+ fields)
Agent → Agent: Parse complex result... what do I do with this?
```

### Sequence Diagram: After Epic 9

```
User → Agent: /run-workflow intake-integration
Agent → preload_workflow: Load workflow files
preload_workflow → FileSystem: Read all files in parallel
preload_workflow → Agent: { workflow, instructions, template, config }
Agent: Parse workflow structure
Agent: Generate session ID (uuid)
Agent → save_output: Create /data/agent-outputs/{uuid}/
Agent: Execute workflow steps
Agent → read_file: Load additional files if needed
Agent → save_output: Save output.md
Agent → save_output: Save manifest.json
Agent → User: Workflow complete! ✅
```

---

## Performance Comparison

| Metric | Before Epic 9 | After Epic 9 | Improvement |
|--------|--------------|--------------|-------------|
| **Init Time** | ~110 seconds | <20 seconds | **5.5x faster** |
| **API Calls** | 4-6 sequential | 1 parallel | **4-6x reduction** |
| **Token Usage** | Baseline | -50% to -70% | **2-3x reduction** |
| **Code Lines** | 640 + 471 = 1,111 | 220 + 269 = 489 | **622 lines removed** |
| **Path Resolution** | ~20ms | ~5ms | **4x faster** |

---

## Code Examples

### Example 1: Loading a Workflow

**Before Epic 9:**
```typescript
// Hidden in execute_workflow tool
const result = await executeWorkflow({
  workflow_name: "intake-integration",
  bundle_name: "requirements-workflow"
});
// Result: 10+ fields, auto-loaded everything
```

**After Epic 9:**
```typescript
// Explicit preload_workflow call
const result = await preloadWorkflowFiles(
  "{bundle-root}/workflows/intake-integration/workflow.yaml",
  pathContext
);

// Result: Simple structured object
// {
//   workflow: { name, description, variables },
//   instructions: "markdown content",
//   template: "markdown content",
//   config: { user_name, project_name, ... }
// }
```

### Example 2: Session Management

**Before Epic 9:**
```typescript
// Hidden in execute_workflow
const sessionId = uuidv4(); // Generated automatically
const sessionFolder = `/data/agent-outputs/${sessionId}`;
// LLM never knew this happened
```

**After Epic 9:**
```typescript
// LLM explicitly creates session
// (From system prompt instructions)
const sessionId = uuidv4(); // LLM generates
const sessionFolder = `/data/agent-outputs/${sessionId}`;
await save_output({
  path: `${sessionFolder}/`,
  content: "" // Create folder
});
```

### Example 3: Variable Resolution

**Before Epic 9:**
```typescript
// Multi-pass nested resolution in tool
let path = "{config_source}:output_folder";
// Pass 1: {config_source} → "/app/bmad/bundles/my-bundle/config.yaml"
// Pass 2: Load config.yaml
// Pass 3: Extract output_folder → "/app/docs"
// Pass 4: Resolve {project-root} in path → "/app"
// Pass 5: Final path → "/app/docs"
```

**After Epic 9:**
```typescript
// LLM handles resolution explicitly
const config = await read_file("{bundle-root}/config.yaml");
const outputFolder = config.output_folder;
// LLM uses the value directly
const path = `${outputFolder}/output.md`;
```

---

## References

### Documentation
- **Tech Spec:** [`docs/tech-spec-epic-9.md`](/docs/tech-spec-epic-9.md)
- **Refactor Spec:** [`docs/REFACTOR-SPEC-SIMPLIFY-WORKFLOW-EXECUTION.md`](/docs/REFACTOR-SPEC-SIMPLIFY-WORKFLOW-EXECUTION.md)
- **Solution Architecture:** [`docs/solution-architecture.md`](/docs/solution-architecture.md)

### Code
- **System Prompt:** [`lib/agents/prompts/system-prompt.md`](/lib/agents/prompts/system-prompt.md) (lines 59-204)
- **Path Resolver:** [`lib/pathResolver.ts`](/lib/pathResolver.ts)
- **Workflow Preloader:** [`lib/workflows/workflowPreloader.ts`](/lib/workflows/workflowPreloader.ts)
- **Tool Definitions:** [`lib/tools/toolDefinitions.ts`](/lib/tools/toolDefinitions.ts)
- **Agentic Loop:** [`lib/agents/agenticLoop.ts`](/lib/agents/agenticLoop.ts)

### Stories
- **Story 9.1:** Remove execute_workflow Tool
- **Story 9.2:** Simplify Path Resolver
- **Story 9.3:** Update System Prompt with Orchestration Instructions
- **Story 9.4:** Smart Workflow Pre-loading
- **Story 9.6:** End-to-End Validation and Documentation

---

## FAQ

### Q: Will my existing agent bundles still work?

**A:** Yes! No changes required. Workflows execute identically with the new architecture.

### Q: How do I know if Epic 9 is deployed in my environment?

**A:** Check if `preload_workflow` tool exists in `lib/tools/toolDefinitions.ts` and `execute_workflow` is removed from codebase (`git grep execute_workflow` should return 0 code references).

### Q: Can I still use the old execute_workflow tool?

**A:** No, it was permanently removed in Story 9.1. The new architecture is more maintainable and performs better.

### Q: What if I find a bug or regression?

**A:** Report it as a new story with:
- Description of expected vs actual behavior
- Workflow that demonstrates the issue
- Comparison to pre-Epic 9 behavior (if applicable)

### Q: How does this affect Claude Code compatibility?

**A:** Epic 9 brings the architecture **closer to Claude Code patterns**:
- Explicit file operations (read, write)
- Simple tool results
- LLM orchestration via system prompt
- This makes the codebase more familiar to developers experienced with Claude Code.

---

## Next Steps

### For Users
1. ✅ Continue using workflows as before
2. ✅ Enjoy faster initialization times
3. ✅ Report any issues or regressions

### For Developers
1. ✅ Review this migration guide
2. ✅ Familiarize yourself with simplified path resolver
3. ✅ Review system-prompt.md workflow orchestration section
4. ✅ Test your changes against Epic 9 architecture
5. ✅ Proceed to Epic 7 (Docker Deployment)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Epic 9 Status:** ✅ Complete
**Next Epic:** Epic 7 - Docker Deployment
