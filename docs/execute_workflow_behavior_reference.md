# execute_workflow Tool Behavior Reference

**Purpose**: This document captures the behavior and functionality of the `executeWorkflow` function before its removal in Story 9.1. This reference supports migration to the new LLM-orchestrated workflow architecture (Stories 9.2-9.5).

**Status**: Archived reference - `executeWorkflow` removed from codebase
**Created**: 2025-10-11
**Epic 9 Story 9.1**: Remove execute_workflow Tool

---

## Function Signature

```typescript
export async function executeWorkflow(
  params: ExecuteWorkflowParams,
  context: PathContext
): Promise<ToolResult>
```

### Parameters

**ExecuteWorkflowParams**:
```typescript
interface ExecuteWorkflowParams {
  workflow_path: string;      // Path to workflow.yaml file
  user_input?: Record<string, any>;  // Optional user input data
}
```

**PathContext**:
```typescript
interface PathContext {
  bundleRoot: string;
  coreRoot: string;
  projectRoot: string;
  bundleConfig: Record<string, any> | null;
  toolCallCount: number;
  sessionFolder?: string;
}
```

**Return Value**:
```typescript
interface ToolResult {
  success: boolean;
  path?: string;
  workflow_name?: string;
  description?: string;
  config?: Record<string, any>;
  user_input?: Record<string, any>;
  session_id?: string;
  session_folder?: string;
  error?: string;
  [key: string]: any;  // Dynamically loaded files (instructions, template, etc.)
}
```

---

## Core Functionality

The `executeWorkflow` function performed the following operations:

### 1. Workflow Loading and Parsing
- **Line 309**: Resolves `workflow_path` using path resolver (handles variables like `{bundle-root}`)
- **Line 313**: Reads workflow.yaml file content
- **Line 315**: Parses YAML into configuration object using `js-yaml`
- **Line 318-320**: Extracts metadata: `name`, `description`

### 2. Session Management (Story 5.0)
- **Line 323**: Generates UUID v4 session ID using `uuidv4()`
- **Line 327**: Injects `session_id` into workflow config for variable resolution
- **Line 414-432**: Determines session folder path:
  - If `session_folder` defined in workflow → resolve it
  - Replaces `{{session_id}}` and `{session_id}` placeholders
  - Auto-generates if not defined: `{project-root}/data/agent-outputs/{session_id}`
- **Line 435-443**: **Security validation** - validates session folder is within `/data/agent-outputs` only
- **Line 446**: Creates session directory with `mkdir({ recursive: true })`
- **Line 454**: Creates initial `manifest.json` with agent, workflow, execution metadata

### 3. Multi-Pass Variable Resolution (5 passes maximum)
- **Line 336-346**: Resolves workflow config variables in **2 initial passes**
  - First pass: Basic variable resolution
  - Second pass: Resolves `session_folder` after `session_id` injection
- **Function `resolveWorkflowVariables` (lines 530-639)**: Implements recursive resolution
  - **Max 5 passes** to handle nested variable dependencies
  - **Line 562-570**: Replaces workflow-defined variables (e.g., `{installed_path}`)
  - **Line 566-568**: Supports both `{variable}` and `{{variable}}` (mustache) syntax
  - **Line 573-575**: Resolves path variables (`{bundle-root}`, `{core-root}`, `{project-root}`)
  - **Line 595-620**: Handles arrays recursively
  - **Line 621-623**: Handles nested objects recursively

### 4. Dynamic File Loading
- **Line 349-409**: Automatically loads files referenced in workflow config
- **Line 353-356**: Skips non-string values and metadata keys (`name`, `description`, `author`, etc.)
- **Line 359-362**: Skips values with unresolved variables
- **Line 365-368**: Skips variable references (e.g., `"config.yaml:project_name"`)
- **Line 371**: Detects file extensions: `.md`, `.yaml`, `.yml`, `.json`, `.txt`, `.csv`, `.js`, `.ts`, `.xml`, `.html`, `.css`
- **Line 376-380**: Reads file content and stores in `loadedFiles` object
- **Line 383-394**: **Special handling for config files**:
  - Parses YAML/YML config files
  - Merges into `bundleConfig`
  - **Re-resolves workflow variables** after config update (enables config-driven variable resolution)

### 5. Manifest Generation
- **Function `createInitialManifest` (lines 249-287)**: Creates initial session manifest
- **Line 259**: Extracts agent name from author (e.g., "Alex the Facilitator" → "alex")
- **Line 261-282**: Manifest structure:
  ```json
  {
    "version": "1.0.0",
    "session_id": "{uuid}",
    "agent": { "name": "alex", "title": "Alex the Facilitator", "bundle": "bmm" },
    "workflow": { "name": "workflow-name", "description": "..." },
    "execution": { "started_at": "ISO-8601", "status": "running", "user": "Bryan" },
    "outputs": [],
    "inputs": {},
    "related_sessions": [],
    "metadata": {}
  }
  ```
- **Line 284-286**: Writes manifest.json to session folder

### 6. Result Construction
- **Line 465-475**: Constructs complex ToolResult object:
  - `success: true`
  - `path`: Resolved workflow.yaml path
  - `workflow_name`, `description`: Workflow metadata
  - `config`: Fully resolved workflow configuration
  - `user_input`: User-provided input (or empty object)
  - `session_id`: Generated UUID
  - `session_folder`: Absolute path to session folder
  - **Spread operator (`...loadedFiles`)**: All dynamically loaded files (instructions, template, etc.)

### 7. Error Handling
- **Line 490-493**: File not found (`ENOENT`)
- **Line 496-501**: Security violations
- **Line 502-507**: YAML parsing errors (`YAMLException`)
- **Line 508-514**: Generic failures

---

## Security Features (MUST PRESERVE)

### Write Path Validation
**Location**: Lines 435-443 in `executeWorkflow`, Lines 175-184 in `executeSaveOutput`

```typescript
validateWritePath(sessionFolder, enhancedContext);
```

**Purpose**: Ensures all write operations (session folder creation, file saves) are restricted to `/data/agent-outputs` only.

**Security Checks** (implemented in `lib/pathResolver.ts`):
1. Path traversal prevention (no `..` in resolved paths)
2. Symlink validation (no symbolic links allowed)
3. Write restrictions (only `/data/agent-outputs` directory writable)

**Migration Note**: This security logic MUST be preserved and reused in:
- Session initialization at conversation start (Story 9.1, Task 7)
- Simplified path resolver (Story 9.2)
- `save_output` tool validation (already implemented, lines 175-184)

---

## Key Behavioral Patterns

### Automatic Session Creation
Every `execute_workflow` call created a new session:
- **UUID generation**: Automatic, not visible to LLM until result returned
- **Folder creation**: Hidden from LLM awareness
- **Manifest initialization**: LLM never saw the manifest creation logic

**Problem**: LLM had no control or visibility into session management.

**Solution (Story 9.1, AC7)**: Move to conversation initialization where LLM receives `{{SESSION_ID}}` and `{{SESSION_FOLDER}}` explicitly.

### Complex Result Object (10+ fields)
The tool returned a large object with dynamically loaded files spread into top-level keys:

```typescript
{
  success: true,
  path: "/path/to/workflow.yaml",
  workflow_name: "example-workflow",
  description: "Workflow description",
  config: { /* full resolved config */ },
  user_input: {},
  session_id: "uuid-v4",
  session_folder: "/data/agent-outputs/{uuid}",
  instructions: "# Instructions content...",  // Dynamically loaded
  template: "# Template content...",          // Dynamically loaded
  config_source: "config: yaml content..."    // Dynamically loaded
}
```

**Problem**: Confusing for LLMs (especially GPT-4), unclear which fields to use.

**Solution (Stories 9.2-9.5)**: Simple `read_file` returns only `{ success, path, content, size }`.

### Five-Pass Variable Resolution
The function performed up to 5 passes to resolve nested variables:
- Pass 1: Basic variable resolution
- Pass 2: Session folder after session_id injection
- Passes 3-5: Nested workflow variables that reference other variables

**Example**:
```yaml
installed_path: "{bundle-root}/workflows/intake"
instructions: "{installed_path}/instructions.md"
template: "{installed_path}/template.md"
```

**Problem**: LLM never saw this logic, couldn't debug variable resolution failures.

**Solution (Stories 9.2-9.5)**: LLM explicitly reads files and resolves variables through system prompt instructions.

---

## Dependencies to Extract/Preserve

### UUID Generation
```typescript
import { v4 as uuidv4 } from 'uuid';
const sessionId = uuidv4();
```

**Preserve for**: Story 9.1 Task 7 (conversation initialization)

### Manifest Creation Logic
**Function**: `createInitialManifest` (lines 249-287)

**Preserve for**: Story 9.1 Task 7 (conversation initialization)

### Security Validation
**Functions**:
- `validateWritePath` from `lib/pathResolver.ts`
- Path resolution security checks

**Preserve for**:
- Story 9.1 Task 7 (session folder validation)
- Story 9.2 (simplified path resolver)
- Already preserved in `executeSaveOutput` (lines 175-184)

---

## Migration Strategy

### What to Remove (Story 9.1)
1. ✅ `executeWorkflow` function (lines 301-516)
2. ✅ `resolveWorkflowVariables` function (lines 530-639)
3. ✅ `ExecuteWorkflowParams` interface (lines 61-66)
4. ✅ Import of `js-yaml` (line 16) - if only used by executeWorkflow
5. ✅ Tool definition exports from `toolDefinitions.ts`
6. ✅ Tool registration in `agenticLoop.ts`

### What to Preserve (Story 9.1, Task 7)
1. ✅ `createInitialManifest` function - move to conversation initialization
2. ✅ UUID generation pattern - move to conversation start
3. ✅ Session folder creation pattern - move to conversation start
4. ✅ Security validation logic - already in `validateWritePath`, `executeSaveOutput`

### What to Replace (Stories 9.2-9.5)
1. ❌ Multi-pass variable resolution → LLM orchestration with system prompt instructions
2. ❌ Dynamic file loading → Explicit `read_file` tool calls
3. ❌ Complex result objects → Simple `{ success, path, content, size }` results
4. ❌ Workflow-scoped sessions → Conversation-scoped sessions (one UUID per chat)

---

## Files Modified by Removal

| File | Lines Removed | Functionality Lost |
|------|---------------|-------------------|
| `lib/tools/fileOperations.ts` | 301-516 (215 lines) | executeWorkflow function |
| `lib/tools/fileOperations.ts` | 530-639 (109 lines) | resolveWorkflowVariables helper |
| `lib/tools/fileOperations.ts` | 61-66 (5 lines) | ExecuteWorkflowParams interface |
| `lib/tools/toolDefinitions.ts` | ~30 lines | executeWorkflowTool export |
| `lib/agents/agenticLoop.ts` | ~5 lines | Tool registration |
| **Total** | **~364 lines removed** | **Workflow orchestration tool** |

---

## Phase 2 Conversation History Foundation

The session management pattern established by `executeWorkflow` now moves to conversation initialization (Story 9.1, AC7), establishing the foundation for Phase 2 conversation history:

**Current Pattern** (executeWorkflow):
- ❌ One UUID per workflow execution
- ❌ Session created when workflow starts
- ❌ LLM doesn't know UUID/folder until result returned

**New Pattern** (Story 9.1, AC7):
- ✅ One UUID per conversation (not per workflow)
- ✅ Session created at conversation start (first user message)
- ✅ LLM receives `{{SESSION_ID}}` and `{{SESSION_FOLDER}}` in system prompt
- ✅ Manifest schema supports future `messages[]` field without breaking changes

**Phase 2 Extension** (Out of scope for Story 9.1):
Simply add to manifest.json:
```json
{
  "messages": [
    {"role": "user", "content": "...", "timestamp": "..."},
    {"role": "assistant", "content": "...", "timestamp": "..."}
  ],
  "lastAccessedAt": "2025-10-11T14:35:00Z"
}
```

---

## References

- **Source**: `lib/tools/fileOperations.ts` (lines 301-639, pre-Story-9.1)
- **Story**: Story 9.1 - Remove execute_workflow Tool
- **Epic**: Epic 9 - Simplify Workflow Execution Architecture
- **Tech Spec**: `docs/tech-spec-epic-9.md`
- **Refactor Spec**: `docs/REFACTOR-SPEC-SIMPLIFY-WORKFLOW-EXECUTION.md`
- **Session Spec**: `docs/SESSION-OUTPUT-SPEC.md`

---

## Conclusion

The `executeWorkflow` function was a 640-line over-engineered abstraction that performed too much "magic" without LLM awareness:
- Hidden UUID generation
- Automatic session folder creation
- 5-pass variable resolution
- Dynamic file loading
- Complex result objects

**Epic 9 Solution**: Remove this tool and replace with explicit LLM orchestration using simple `read_file` and `save_output` tools guided by system prompt instructions. This aligns with Claude Code's proven architecture and increases LLM agency while maintaining security through system-managed sessions.
