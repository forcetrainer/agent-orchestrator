# Story 9.4: Implement Smart Workflow Pre-loading

**Epic:** 9 - Simplify Workflow Execution Architecture
**Status:** Not Started
**Priority:** High
**Estimated Effort:** 8 points (1-2 days)
**Version:** 1.0.0
**Date Created:** 2025-10-12

---

## Story

**As a** developer
**I want** a smart workflow pre-loading system
**So that** LLM receives all workflow files in a single tool call instead of making 4-6 sequential read_file calls

---

## Context

**Problem:**
- Current Epic 9.3 approach requires LLM to make multiple sequential read_file calls
- Each call requires full API round-trip (~20-50 seconds per call)
- Total workflow initialization: ~110 seconds for 4 files
- High token costs from multiple iterations
- Rate limit pressure (just hit 10K TPM limit during testing)

**Solution:**
- Create `preload_workflow` tool that loads all files at once
- Parser detects what files are needed (workflow.yaml → instructions, template, config)
- Single tool call returns all content
- LLM receives clear contract: "Files already loaded, don't reload them"

**Benefits:**
- 3-5x faster workflow initialization (~10-20 seconds instead of ~110 seconds)
- 50-70% token cost reduction
- Eliminates rate limit pressure
- LLM still orchestrates (maintains Epic 9 flexibility)
- Avoids updating 15 workflow instruction files (old Story 9.5)

---

## Prerequisites

- ✅ Story 9.1 Complete (execute_workflow removed)
- ✅ Story 9.2 Complete (path resolver simplified)
- ✅ Story 9.3 Complete (system prompt updated with orchestration instructions v2.4.4)

---

## Acceptance Criteria

### AC1: Workflow Pre-loader Module Created
- [ ] `lib/workflows/workflowPreloader.ts` created
- [ ] `preloadWorkflowFiles()` function implemented
- [ ] Function accepts: `workflowPath: string`, `pathContext: PathContext`
- [ ] Function returns: `PreloadResult` interface

### AC2: Core Files Pre-loaded
- [ ] workflow.yaml loaded and parsed
- [ ] YAML-internal variables resolved (e.g., `{installed_path}`)
- [ ] config.yaml loaded (from workflow.yaml `config_source`)
- [ ] instructions.md loaded (from workflow.yaml `instructions`)
- [ ] template file loaded if specified (from workflow.yaml `template`)
- [ ] workflow.md engine loaded (`{project-root}/bmad/core/tasks/workflow.md`)

### AC3: Conditional File Loading
- [ ] Parser detects `<elicit-required>` tag in instructions
- [ ] If found, loads `{project-root}/bmad/core/tasks/adv-elicit.md`
- [ ] Parser detects `<invoke-workflow>` tag in instructions (future extensibility)
- [ ] Graceful handling if conditional files not needed

### AC4: Tool Definition Added
- [ ] `preload_workflow` tool added to `lib/tools/toolDefinitions.ts`
- [ ] Tool schema defines `workflow_path` parameter
- [ ] Tool description explains when to use it
- [ ] Tool integrated into agenticLoop.ts and app/api/chat/route.ts

### AC5: Tool Executor Integration
- [ ] `executePreloadWorkflow()` function in `lib/tools/toolExecutor.ts`
- [ ] Calls `preloadWorkflowFiles()` with path context
- [ ] Returns structured result with all file contents
- [ ] Error handling for missing/invalid files

### AC6: Clear LLM Contract
- [ ] PreloadResult includes `filesLoaded: string[]` array
- [ ] PreloadResult includes `message: string` with instructions for LLM
- [ ] Message clearly states: "Files pre-loaded above, do NOT call read_file for these paths"
- [ ] File contents organized by role (workflow, config, instructions, template, engine)

### AC7: System Prompt Updated
- [ ] "Running Workflows" section simplified from ~146 lines to ~40 lines
- [ ] New instructions: "Call preload_workflow tool first"
- [ ] Emphasizes: "Files already in context, follow instructions step-by-step"
- [ ] Removes multi-step file loading instructions (parser handles this)
- [ ] Keeps Step 4-5 (Execute Instructions, Session Management)

### AC8: Performance Validation
- [ ] Workflow initialization measured: target <20 seconds (vs ~110s baseline)
- [ ] Token usage measured: target 50-70% reduction vs sequential loading
- [ ] Single API call for pre-loading (not 4-6 calls)
- [ ] Rate limits not triggered during normal workflow execution

### AC9: Testing
- [ ] Unit tests for `preloadWorkflowFiles()` with sample workflow.yaml
- [ ] Unit tests for YAML-internal variable resolution
- [ ] Unit tests for conditional file detection (`<elicit-required>`)
- [ ] Integration test: LLM calls preload_workflow, receives all files, executes workflow
- [ ] Error cases tested: missing files, invalid YAML, path security violations

### AC10: Documentation
- [ ] JSDoc comments on all public functions
- [ ] PreloadResult interface documented
- [ ] README updated with new workflow execution pattern
- [ ] Performance improvements documented (before/after metrics)

---

## Technical Design

### Module: `lib/workflows/workflowPreloader.ts`

```typescript
/**
 * Smart Workflow Pre-loader
 *
 * Loads all files needed for workflow execution in a single operation.
 * Replaces multi-step LLM orchestration with fast parser-based loading.
 */

import { PathContext } from '@/lib/pathResolver';
import { readFileContent } from '@/lib/tools/fileOperations';

export interface PreloadResult {
  // Core files (always loaded)
  workflowYaml: any;
  configYaml: any;
  instructions: string;
  template: string | null;
  workflowEngine: string;

  // Conditionally loaded files
  elicitTask?: string;
  invokedWorkflows?: Record<string, any>;

  // Metadata for LLM
  filesLoaded: string[];
  message: string;
}

/**
 * Pre-loads all files needed for a workflow execution.
 *
 * @param workflowPath - Path to workflow.yaml (e.g., {bundle-root}/workflows/intake-integration/workflow.yaml)
 * @param pathContext - Path resolution context
 * @returns PreloadResult with all file contents and metadata
 */
export async function preloadWorkflowFiles(
  workflowPath: string,
  pathContext: PathContext
): Promise<PreloadResult> {
  const filesLoaded: string[] = [];

  // Step 1: Load workflow.yaml
  const workflowYaml = await readFileContent(workflowPath, pathContext);
  filesLoaded.push(workflowPath);

  // Step 2: Resolve YAML-internal variables (e.g., {installed_path})
  const resolvedPaths = resolveWorkflowInternalVariables(workflowYaml);

  // Step 3: Load core files in parallel
  const [configYaml, instructions, template, workflowEngine] = await Promise.all([
    readFileContent(resolvedPaths.config_source, pathContext),
    readFileContent(resolvedPaths.instructions, pathContext),
    resolvedPaths.template ? readFileContent(resolvedPaths.template, pathContext) : null,
    readFileContent('{project-root}/bmad/core/tasks/workflow.md', pathContext)
  ]);

  filesLoaded.push(
    resolvedPaths.config_source,
    resolvedPaths.instructions,
    '{project-root}/bmad/core/tasks/workflow.md'
  );
  if (resolvedPaths.template) filesLoaded.push(resolvedPaths.template);

  // Step 4: Parse instructions for conditional file loading
  let elicitTask: string | undefined;

  if (instructions.includes('<elicit-required>')) {
    elicitTask = await readFileContent('{project-root}/bmad/core/tasks/adv-elicit.md', pathContext);
    filesLoaded.push('{project-root}/bmad/core/tasks/adv-elicit.md');
  }

  // TODO: Handle <invoke-workflow> tags (parse and load referenced workflows)

  return {
    workflowYaml,
    configYaml,
    instructions,
    template,
    workflowEngine,
    elicitTask,
    filesLoaded,
    message: buildPreloadMessage(filesLoaded)
  };
}

function resolveWorkflowInternalVariables(workflowYaml: any): any {
  // Parse workflow.yaml to find variables like {installed_path}
  // Replace references in other paths
  // Return resolved paths object
}

function buildPreloadMessage(filesLoaded: string[]): string {
  return `
All workflow files have been pre-loaded for you:

${filesLoaded.map((f, i) => `${i + 1}. ${f}`).join('\n')}

**IMPORTANT**:
- You do NOT need to call read_file for these files - their content is already available above
- Follow the workflow instructions step-by-step in exact order
- Use save_output to write files as instructed
- Maintain conversation context with the user throughout execution

Begin by following Step 1 of the instructions.
  `.trim();
}
```

### Tool Definition: `lib/tools/toolDefinitions.ts`

```typescript
export const preloadWorkflowTool = {
  type: 'function' as const,
  function: {
    name: 'preload_workflow',
    description: 'Load all files for a workflow execution in one call. Use this for run-workflow commands. DO NOT use read_file after this - all files are already loaded.',
    parameters: {
      type: 'object',
      properties: {
        workflow_path: {
          type: 'string',
          description: 'Path to workflow.yaml (e.g., {bundle-root}/workflows/intake-integration/workflow.yaml)'
        }
      },
      required: ['workflow_path']
    }
  }
};

// Updated tool list
export const tools = [
  preloadWorkflowTool,  // NEW
  readFileTool,
  saveOutputTool
];
```

### System Prompt Update (Simplified)

**Current:** ~146 lines for "Running Workflows" section
**Target:** ~40 lines

```markdown
## Running Workflows

When a command has a `run-workflow` attribute:

### Step 1: Pre-load All Workflow Files

**Action**: Call `preload_workflow` tool with the workflow path.

Example:
```
preload_workflow({ workflow_path: "{bundle-root}/workflows/intake-integration/workflow.yaml" })
```

The tool returns:
- `workflowYaml` - Workflow configuration
- `configYaml` - User variables and settings
- `instructions` - Step-by-step execution plan
- `template` - Template file (if applicable)
- `workflowEngine` - Core execution rules
- `elicitTask` - Enhancement task (if workflow uses elicitation)

**CRITICAL**:
- All files are pre-loaded in the tool result above
- You HAVE the content - do NOT call read_file for these paths again
- When instructions say "load X", that file is ALREADY in the preload_workflow result

### Step 2: Execute Workflow Instructions

Follow the instructions step-by-step in exact numerical order (1, 2, 3...).

Instructions use XML tags:
- `<action>` - Perform the action
- `<ask>` - Prompt user and WAIT for response
- `<check>` - Evaluate condition
- `<template-output>` - Save content checkpoint
- `<goto step="X">` - Jump to specified step

**Follow workflow.md rules:**
- Execute steps in exact order
- Wait for user approval at `<template-output>` tags
- Handle `<ask>` tags by prompting user and WAITING

### Step 3: Session and Output Management

When workflow requires saving outputs:
1. Generate session ID (UUID v4 or timestamp YYYY-MM-DD-HHMMSS)
2. Create session folder: `{project-root}/data/agent-outputs/{session-id}/`
3. Save files with full explicit paths using save_output
4. Replace template variables ({{user_name}}, {{date}}, etc.) with actual values

Example:
```
save_output({
  path: "{project-root}/data/agent-outputs/2025-10-12-143022/output.md",
  content: "..."
})
```

### Variable Resolution

**System-Resolved** (path resolver handles automatically):
- `{bundle-root}` → Agent bundle path
- `{project-root}` → Project root path
- `{core-root}` → BMAD core path

**LLM-Resolved** (you handle):
- `{date}` → Generate current date (YYYY-MM-DD)
- `{config_source}:variable` → Extract from configYaml (already loaded)
- `{session-id}` → Use the session ID you generated
```

---

## Implementation Tasks

### Phase 1: Core Pre-loader (~2-3 hours)
- [ ] Create `lib/workflows/workflowPreloader.ts`
- [ ] Implement `preloadWorkflowFiles()` function
- [ ] Implement `resolveWorkflowInternalVariables()` helper
- [ ] Implement `buildPreloadMessage()` helper
- [ ] Add PreloadResult interface to types

### Phase 2: Tool Integration (~1-2 hours)
- [ ] Add `preloadWorkflowTool` to `lib/tools/toolDefinitions.ts`
- [ ] Add `executePreloadWorkflow()` to `lib/tools/toolExecutor.ts`
- [ ] Update tool list in agenticLoop.ts
- [ ] Update tool list in app/api/chat/route.ts

### Phase 3: System Prompt Simplification (~1 hour)
- [ ] Simplify "Running Workflows" section in system-prompt.md
- [ ] Remove multi-step loading instructions
- [ ] Add preload_workflow usage instructions
- [ ] Update to v2.5.0

### Phase 4: Testing (~2-3 hours)
- [ ] Unit tests for preloadWorkflowFiles
- [ ] Unit tests for YAML variable resolution
- [ ] Unit tests for conditional file detection
- [ ] Integration test with live LLM
- [ ] Performance benchmarking (before/after)

### Phase 5: Documentation (~1 hour)
- [ ] JSDoc comments
- [ ] Update README
- [ ] Performance metrics documented
- [ ] Update tech-spec-epic-9.md

**Total Estimated Effort:** 8-10 hours

---

## Testing Strategy

### Unit Tests

```typescript
// lib/workflows/__tests__/workflowPreloader.test.ts

describe('preloadWorkflowFiles', () => {
  test('loads all core files for standard workflow', async () => {
    const result = await preloadWorkflowFiles(
      '{bundle-root}/workflows/intake-integration/workflow.yaml',
      mockPathContext
    );

    expect(result.workflowYaml).toBeDefined();
    expect(result.configYaml).toBeDefined();
    expect(result.instructions).toBeDefined();
    expect(result.template).toBeDefined();
    expect(result.workflowEngine).toBeDefined();
    expect(result.filesLoaded).toHaveLength(5);
  });

  test('resolves YAML-internal variables like {installed_path}', async () => {
    const result = await preloadWorkflowFiles(
      '{bundle-root}/workflows/intake-integration/workflow.yaml',
      mockPathContext
    );

    // Verify instructions path was resolved correctly
    expect(result.filesLoaded).toContain(
      '{bundle-root}/workflows/intake-integration/instructions.md'
    );
  });

  test('conditionally loads elicit task when <elicit-required> present', async () => {
    const result = await preloadWorkflowFiles(
      '{bundle-root}/workflows/with-elicit/workflow.yaml',
      mockPathContext
    );

    expect(result.elicitTask).toBeDefined();
    expect(result.filesLoaded).toContain('{project-root}/bmad/core/tasks/adv-elicit.md');
  });

  test('does not load elicit task when not needed', async () => {
    const result = await preloadWorkflowFiles(
      '{bundle-root}/workflows/simple/workflow.yaml',
      mockPathContext
    );

    expect(result.elicitTask).toBeUndefined();
    expect(result.filesLoaded).not.toContain('{project-root}/bmad/core/tasks/adv-elicit.md');
  });
});
```

### Integration Test

```typescript
// Integration test with live LLM
test('LLM executes workflow using preload_workflow', async () => {
  // 1. LLM calls preload_workflow
  const result = await executeAgent(
    'alex',
    '/run-workflow intake-integration',
    []
  );

  // 2. Verify preload_workflow was called
  expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
    expect.objectContaining({
      tools: expect.arrayContaining([
        expect.objectContaining({ function: { name: 'preload_workflow' } })
      ])
    })
  );

  // 3. Verify no subsequent read_file calls for pre-loaded files
  const toolCalls = extractToolCalls(mockOpenAI.calls);
  expect(toolCalls.filter(c => c.name === 'read_file')).toHaveLength(0);

  // 4. Verify workflow executed successfully
  expect(result.success).toBe(true);
});
```

### Performance Benchmarking

```typescript
// Performance test
test('preload_workflow is 3-5x faster than sequential loading', async () => {
  // Baseline: Sequential read_file calls
  const baselineStart = Date.now();
  await sequentialLoadWorkflow('intake-integration');
  const baselineTime = Date.now() - baselineStart;

  // New approach: preload_workflow
  const preloadStart = Date.now();
  await preloadWorkflowFiles('{bundle-root}/workflows/intake-integration/workflow.yaml', pathContext);
  const preloadTime = Date.now() - preloadStart;

  // Verify 3x speedup (allow some variance)
  expect(preloadTime).toBeLessThan(baselineTime / 3);

  console.log(`Baseline: ${baselineTime}ms, Preload: ${preloadTime}ms, Speedup: ${(baselineTime / preloadTime).toFixed(1)}x`);
});
```

---

## Success Metrics

| Metric | Baseline (Story 9.3) | Target (Story 9.4) | Actual |
|--------|---------------------|-------------------|--------|
| Workflow initialization time | ~110 seconds | <20 seconds | TBD |
| API calls for file loading | 4-6 calls | 1 call | TBD |
| Token usage (initialization) | ~5-10K tokens | ~2-5K tokens | TBD |
| Rate limit pressure | High (hit 10K TPM) | Low | TBD |
| System prompt complexity | ~146 lines | ~40 lines | TBD |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Parser misses conditional files | Medium | Thorough testing of tag detection; graceful fallback to read_file if needed |
| YAML-internal variable resolution fails | High | Comprehensive unit tests; clear error messages |
| LLM ignores "files pre-loaded" message | High | Explicit, emphatic system prompt wording; test with GPT-4 |
| Performance not as good as expected | Medium | Benchmark early; parallel file loading ensures speed |
| Breaks existing workflows | Critical | Test all 15 workflows before marking complete; backward compatibility via read_file |

---

## Definition of Done

- [ ] All 10 acceptance criteria verified
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration test with live LLM passing
- [ ] Performance benchmarks meet targets (3-5x speedup)
- [ ] System prompt simplified and tested
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] At least 3 different workflows tested end-to-end
- [ ] No regressions in existing functionality
- [ ] Story 9.3 rate limit issue resolved (no more 429 errors during normal use)

---

## Related Documentation

- **Epic 9 Tech Spec:** `/docs/tech-spec-epic-9.md`
- **Refactor Spec:** `/docs/REFACTOR-SPEC-SIMPLIFY-WORKFLOW-EXECUTION.md`
- **Story 9.3:** `/docs/stories/story-9.3.md` (system prompt orchestration)
- **Architecture:** Conversation summary from 2025-10-12 (Smart Pre-loading design discussion)

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-12 | Initial story creation; replaces old Stories 9.4-9.5 with smart pre-loading approach |
