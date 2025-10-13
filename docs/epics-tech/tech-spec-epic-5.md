# Technical Specification: File Management and Viewer

Date: 2025-10-05
Author: Bryan
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 delivers a read-only file viewer and navigation system that enables users to browse and view agent-generated outputs. This epic builds on Epic 4's agent execution architecture to provide transparency into agent outputs, building user trust through visibility of generated files. The file viewer integrates into the existing chat UI layout (Epic 3) and leverages Epic 4's path resolution system and file operation tools to provide secure, bounded access to the output directory.

## Objectives and Scope

**In Scope:**
- File viewer UI component integrated into chat interface layout
- Directory tree navigation for output folder structure
- File content display with markdown rendering
- Read-only file access (no editing, no downloads in MVP)
- Manual and automatic file list refresh
- Navigation polish (keyboard shortcuts, breadcrumbs)
- Security validation ensuring read-only access to output directory only

**Out of Scope (Deferred to Phase 2):**
- File editing capabilities
- File download functionality
- File versioning or history
- Search/filter capabilities
- Real-time file update notifications
- Access to agent source files or bundle directories
- File upload or deletion

## System Architecture Alignment

Epic 5 builds upon Epic 4's completed agent execution architecture by:

1. **Leveraging Path Resolution System** (Epic 4 Story 4.2): Reuses path validation logic to ensure file viewer only accesses output directory
2. **Using Existing File Operations** (Epic 4 Story 4.5): Extends read_file and list_files tools for viewer functionality
3. **Integrating with Chat UI** (Epic 3 Stories 3.1-3.8): File viewer panel coexists with chat interface in unified layout
4. **Respecting Security Model** (Epic 4 BUNDLE-SPEC.md): Enforces read-only access boundaries established in bundle architecture

The file viewer operates as a complementary output verification system, providing transparency into agent-generated artifacts without interfering with the core agentic execution loop.

---

## Story 5.0: Session-Based Output Management (Foundation)

**Priority:** Critical - Must complete before Stories 5.1-5.7
**Story Points:** 8
**Dependencies:** Epic 4 (Path Resolution, Workflow Engine)

### Purpose

Story 5.0 establishes the foundational output management infrastructure that all subsequent Epic 5 stories depend on. Without this foundation, the file viewer (Stories 5.1-5.7) would have no predictable directory structure to display.

**Problem Addressed:**
- Current agents use inconsistent output paths with undefined variables
- No standardized way for agents to discover outputs from other agents
- Security risk: agents could potentially write to source code directories
- File viewer needs reliable directory structure to display

**Solution:**
- Isolated `/data/agent-outputs/` directory for all agent writes
- UUID-based session folders provide unique, collision-free namespacing
- Manifest.json enables cross-agent discovery and human navigation
- Security boundary: agents can ONLY write to `/data`, never to source code

### Architecture Impact

**New Directory Structure:**
```
{project-root}/
├── app/, lib/, agents/, bmad/  # Source code (READ-ONLY for agents)
├── docs/                         # Version-controlled documentation
├── data/                         # NEW: Runtime data (git-ignored)
│   └── agent-outputs/            # Agent write zone - isolated
│       ├── {uuid-1}/
│       │   ├── manifest.json
│       │   └── [agent files...]
│       └── {uuid-2}/
│           └── ...
```

**Security Model:**
- Path validator enforces: agents can ONLY write to `/data/agent-outputs/`
- Attempts to write to `/agents`, `/bmad`, `/lib`, `/app` throw security errors
- Clear separation: "Code is in `/`, runtime data is in `/data`"
- File viewer (Stories 5.1-5.7) has read-only access to `/data/agent-outputs` only

**Session Management:**
- Each workflow execution gets unique UUID v4 session ID
- Session folder: `/data/agent-outputs/{session-uuid}/`
- Manifest file: `{session-folder}/manifest.json`
- Variables available to agents: `{{session_id}}`, `{session_folder}`

**Manifest Schema (v1.0.0):**
```json
{
  "version": "1.0.0",
  "session_id": "a3f2c9d1-4b5e-6789-01ab-cdef12345678",
  "agent": {
    "name": "alex",
    "title": "Alex the Facilitator",
    "bundle": "bmad/bmm"
  },
  "workflow": {
    "name": "intake-app",
    "description": "Initial requirements gathering"
  },
  "execution": {
    "started_at": "2025-10-05T23:01:45.123Z",
    "completed_at": "2025-10-05T23:05:22.456Z",
    "status": "completed",
    "user": "Bryan"
  },
  "outputs": [
    {
      "file": "requirements.md",
      "type": "document",
      "description": "Initial requirements document",
      "created_at": "2025-10-05T23:05:20.789Z"
    }
  ],
  "inputs": {},
  "related_sessions": [],
  "metadata": {}
}
```

### Implementation Components

**Workflow Engine Updates (lib/agents/workflowExecution.ts):**
- Generate UUID v4 session ID on workflow start
- Create session folder: `/data/agent-outputs/{uuid}/`
- Create manifest.json with initial metadata
- Inject `session_id` and `session_folder` into workflow context
- Finalize manifest on workflow completion (add `completed_at`, update `status`)

**Session Discovery API (lib/agents/sessionDiscovery.ts):**
```typescript
findSessions({
  agent?: string,              // Filter by agent name
  workflow?: string | RegExp,  // Filter by workflow name/pattern
  status?: "running" | "completed" | "failed",
  limit?: number               // Default: 10
}): SessionManifest[]
```

**Configuration Updates:**
```yaml
# bmad/bmm/config.yaml
output_folder: '{project-root}/data/agent-outputs'
agent_outputs_folder: '{output_folder}'
```

**Git Ignore:**
```gitignore
# Agent runtime data
/data/
```

### Acceptance Criteria

**AC 5.0.1: Isolated Output Directory**
- [ ] `/data/agent-outputs/` directory structure exists
- [ ] `/data` added to `.gitignore`
- [ ] Path validator blocks writes outside `/data/agent-outputs`

**AC 5.0.2: Session ID Generation**
- [ ] UUID v4 generated for each workflow execution
- [ ] Session folder created at `/data/agent-outputs/{uuid}/`
- [ ] `{{session_id}}` variable available to agents

**AC 5.0.3: Manifest Auto-Generation**
- [ ] Manifest created on workflow start with `status: "running"`
- [ ] Manifest finalized on completion with `completed_at` and final status
- [ ] Schema matches SESSION-OUTPUT-SPEC.md v1.0.0

**AC 5.0.4: Configuration Updates**
- [ ] `bmad/bmm/config.yaml` updated with `agent_outputs_folder`
- [ ] Variables resolve correctly via path resolver

**AC 5.0.5: Agent Workflow Migration**
- [ ] **IMPORTANT: This is one of the LAST steps before testing**
- [ ] All Alex workflows updated (6 workflows)
- [ ] All Casey workflows updated (6 workflows)
- [ ] All Pixel workflows updated (3 workflows)
- [ ] Updated fields: `session_id`, `session_folder`, `manifest_file`, `default_output_file`
- [ ] **DO NOT UPDATE until workflow engine changes are complete and tested**

**AC 5.0.6: Session Discovery API**
- [ ] `findSessions()` function implemented
- [ ] Filters by agent, workflow, status work correctly
- [ ] Returns sorted results (newest first)

**AC 5.0.7: Output Registration**
- [ ] `registerOutput()` utility available
- [ ] Appends to `manifest.outputs[]` array
- [ ] Auto-populates `created_at` timestamp

**AC 5.0.8: Documentation**
- [ ] SESSION-OUTPUT-SPEC.md finalized in `/docs`
- [ ] BUNDLE-SPEC.md updated with session management section

### Implementation Order

1. **Phase 1: Infrastructure Setup**
   - Create `/data/agent-outputs/` directory
   - Add `/data` to `.gitignore`
   - Update `bmad/bmm/config.yaml`
   - Update SESSION-OUTPUT-SPEC.md and BUNDLE-SPEC.md

2. **Phase 2: Workflow Engine Changes**
   - Implement UUID generation
   - Implement session folder creation
   - Implement manifest auto-generation
   - Implement manifest finalization

3. **Phase 3: Session Discovery**
   - Implement `findSessions()` API
   - Implement `registerOutput()` utility
   - Add unit tests for discovery API

4. **Phase 4: Security Validation**
   - Update path validator to enforce `/data` boundary
   - Test path traversal attempts
   - Verify writes outside `/data` are blocked

5. **Phase 5: Agent Migration (LAST STEP)**
   - Update Alex workflow.yaml files (6 files)
   - Update Casey workflow.yaml files (6 files)
   - Update Pixel workflow.yaml files (3 files)
   - Test each agent workflow end-to-end

6. **Phase 6: Integration Testing**
   - Run Alex → Casey → Pixel workflow chain
   - Verify session discovery works cross-agent
   - Verify all manifests created correctly
   - Verify no regression in Epic 4 functionality

### Testing Requirements

**Unit Tests:**
- Session ID generation (UUID v4 format, uniqueness)
- Session folder creation
- Manifest auto-generation and schema validation
- Manifest finalization on success/failure
- Path security (blocks outside `/data`, allows within)
- Session discovery filtering and sorting
- Output registration

**Integration Tests:**
- End-to-end workflow execution creates session
- Cross-agent discovery (Pixel finds Casey's output)
- Concurrent workflow sessions (no UUID collision)

**Security Tests:**
- Attempt write to `/agents` → blocked
- Attempt write to `/bmad` → blocked
- Attempt write to `/lib` → blocked
- Attempt path traversal `../../etc/passwd` → blocked
- Valid write to `/data/agent-outputs/{uuid}/file.md` → allowed

### Definition of Done

- [ ] All acceptance criteria passing
- [ ] All unit tests passing (80%+ coverage)
- [ ] All integration tests passing
- [ ] All security tests passing
- [ ] Documentation updated (SESSION-OUTPUT-SPEC.md, BUNDLE-SPEC.md)
- [ ] Agent workflows migrated and tested
- [ ] No regression in Epic 4 functionality
- [ ] Code reviewed and merged to main

### References

- **SESSION-OUTPUT-SPEC.md** - Full specification document
- **Epic 4 Story 4.2** - Path Resolution System (reused here)
- **Epic 4 Story 4.9** - Workflow Execution Engine (extended here)
- **BUNDLE-SPEC.md** - Bundle configuration standards

---

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner/Location |
|--------|---------------|--------|---------|----------------|
| **FileTreeAPI** | Provides directory tree structure for output folder with metadata-enhanced display names | `GET /api/files/tree` → output directory path | JSON tree structure with file/folder nodes, session metadata, human-readable names | `app/api/files/tree/route.ts` |
| **FileContentAPI** | Retrieves file contents for display | `GET /api/files/content?path={relative_path}` → file path | File contents as text, mime type, metadata | `app/api/files/content/route.ts` |
| **FileViewerPanel** | React component rendering file browser UI | Selected agent context, output directory path | File tree navigation, selected file display | `components/FileViewerPanel.tsx` |
| **DirectoryTree** | Tree view component with expand/collapse | Tree data structure from API | Interactive tree UI with selection | `components/DirectoryTree.tsx` |
| **FileContentDisplay** | Renders file contents with formatting | File content, mime type | Formatted display (markdown, text, code) | `components/FileContentDisplay.tsx` |
| **PathSecurityValidator** | Validates file paths are within output directory | Requested file path | Validated absolute path or security error | `lib/files/pathValidator.ts` (reuses Epic 4 logic) |
| **ManifestReader** | Parses manifest.json and generates display names for sessions | Session folder path | SessionMetadata object, human-readable display name | `lib/files/manifestReader.ts` |
| **RefreshManager** | Handles manual/automatic file list updates | User trigger or agent completion event | Updated tree data, refresh state | Integrated in `FileViewerPanel.tsx` |

### Data Models and Contracts

**FileTreeNode:**
```typescript
interface FileTreeNode {
  name: string;              // Technical file/folder name (UUID for sessions)
  path: string;              // Relative path from output root (technical path)
  type: 'file' | 'directory';
  children?: FileTreeNode[]; // Present if type === 'directory'
  size?: number;             // File size in bytes (for files only)
  modified?: string;         // ISO 8601 timestamp
  displayName?: string;      // Human-readable name for UI display (Story 5.2.1)
  metadata?: SessionMetadata; // Session metadata from manifest.json (Story 5.2.1)
  isInternal?: boolean;      // True for files like manifest.json (hidden from UI)
}

interface SessionMetadata {
  session_id: string;
  agent: {
    name: string;
    title: string;
    bundle: string;
  };
  workflow: {
    name: string;
    description: string;
  };
  execution: {
    started_at: string;      // ISO 8601
    completed_at?: string;   // ISO 8601
    status: 'running' | 'completed' | 'failed';
    user: string;
  };
  outputs?: Array<{
    file: string;
    type: string;
    description: string;
    created_at: string;
  }>;
}
```

**FileTreeResponse:**
```typescript
interface FileTreeResponse {
  success: boolean;
  root: FileTreeNode;
  error?: string;
}
```

**FileContentRequest:**
```typescript
interface FileContentRequest {
  path: string;  // Relative path from output root
}
```

**FileContentResponse:**
```typescript
interface FileContentResponse {
  success: boolean;
  path: string;           // Echoed request path
  content: string;        // File contents
  mimeType: string;       // Detected mime type
  size: number;           // File size in bytes
  modified: string;       // ISO 8601 timestamp
  error?: string;
  isBinary?: boolean;     // True if cannot display as text
}
```

**FileViewerState** (Frontend):
```typescript
interface FileViewerState {
  treeData: FileTreeNode | null;
  selectedFile: string | null;     // Relative path
  fileContent: FileContentResponse | null;
  isLoading: boolean;
  viewMode: 'rendered' | 'raw';     // For markdown toggle
  error: string | null;
}
```

### APIs and Interfaces

**GET /api/files/tree**

*Purpose:* Return directory tree structure for output folder

*Authentication:* None (MVP assumes trusted deployment)

*Request:*
```http
GET /api/files/tree HTTP/1.1
```

*Response (200 OK):*
```json
{
  "success": true,
  "root": {
    "name": "output",
    "path": "",
    "type": "directory",
    "children": [
      {
        "name": "requirements",
        "path": "requirements",
        "type": "directory",
        "children": [
          {
            "name": "prd.md",
            "path": "requirements/prd.md",
            "type": "file",
            "size": 15420,
            "modified": "2025-10-05T10:30:00Z"
          }
        ]
      }
    ]
  }
}
```

*Error Response (500):*
```json
{
  "success": false,
  "error": "Failed to read output directory: [details]"
}
```

---

**GET /api/files/content**

*Purpose:* Retrieve file contents for display

*Authentication:* None (MVP)

*Request:*
```http
GET /api/files/content?path=requirements/prd.md HTTP/1.1
```

*Response (200 OK):*
```json
{
  "success": true,
  "path": "requirements/prd.md",
  "content": "# Product Requirements Document\n\n...",
  "mimeType": "text/markdown",
  "size": 15420,
  "modified": "2025-10-05T10:30:00Z"
}
```

*Binary File Response (200 OK):*
```json
{
  "success": true,
  "path": "assets/image.png",
  "content": "",
  "mimeType": "image/png",
  "isBinary": true,
  "size": 45120,
  "modified": "2025-10-05T11:00:00Z"
}
```

*Security Error Response (403 Forbidden):*
```json
{
  "success": false,
  "error": "Access denied: Path outside output directory"
}
```

*Not Found Response (404):*
```json
{
  "success": false,
  "error": "File not found: requirements/missing.md"
}
```

### Workflows and Sequencing

**Workflow 1: Initial File Viewer Load**
```
1. User opens Agent Orchestrator (chat interface loads)
2. FileViewerPanel component mounts
3. Component calls GET /api/files/tree
4. Backend reads output directory structure
5. Backend builds FileTreeNode hierarchy
6. Response returns to frontend
7. DirectoryTree component renders with root collapsed
8. Empty state shows if no files exist
```

**Workflow 2: File Selection and Display**
```
1. User clicks file in directory tree
2. Frontend sets selectedFile state to file path
3. Component calls GET /api/files/content?path={file.path}
4. Backend validates path is within output directory (PathSecurityValidator)
5. Backend reads file contents (fs.readFile)
6. Backend detects mime type (extension-based)
7. Response returns file content + metadata
8. FileContentDisplay component renders:
   - If markdown: render with react-markdown (reuse Epic 3)
   - If text: render in <pre> tag
   - If binary: show "Cannot preview" message
9. Selected file highlighted in tree
```

**Workflow 3: Directory Navigation**
```
1. User clicks folder in directory tree
2. DirectoryTree toggles expanded state
3. Children nodes render with indentation
4. User can collapse by clicking again
5. Nested folders support recursive expand/collapse
```

**Workflow 4: File Refresh After Agent Output**
```
1. Agent completes response in chat (Epic 3)
2. Agent used save_output tool (Epic 4)
3. Chat completion event triggers
4. FileViewerPanel detects completion
5. Component calls GET /api/files/tree again
6. Tree data updates with new files
7. New files render in tree (optionally highlighted)
8. If previously selected file still exists, selection preserved
```

**Workflow 5: Manual Refresh**
```
1. User clicks "Refresh" button in file viewer
2. Component calls GET /api/files/tree
3. Current tree data replaced with fresh data
4. Selected file state preserved if file still exists
5. Loading indicator shows during fetch
```

**Workflow 6: Markdown Rendered/Raw Toggle**
```
1. User viewing markdown file (rendered by default)
2. User clicks "View Raw" button
3. viewMode state changes to 'raw'
4. FileContentDisplay re-renders with raw text in <pre>
5. Button text changes to "View Rendered"
6. User clicks button again → returns to rendered view
```

## Non-Functional Requirements

### Performance

**Targets (from PRD NFR-1 and Epic 4 learnings):**
- File viewer loads directory tree within **1 second** (PRD requirement)
- File content displays within **1 second** after selection (PRD requirement)
- Directory tree with up to **100 files** loads without performance degradation (PRD NFR-3)
- Refresh operation completes within **2 seconds**
- Tree expand/collapse operations are instant (<100ms)

**Implementation Strategies:**
- Lazy-load directory children (only expand when user clicks folder)
- Limit initial tree depth to 2 levels (expand on demand for deeper nesting)
- Stream large file contents (>1MB) or implement pagination for display
- Debounce refresh operations to prevent excessive API calls
- Use React.memo() for tree nodes to prevent unnecessary re-renders

**Monitoring:**
- Log API response times for /api/files/tree and /api/files/content
- Track frontend render performance for large trees
- Measure time-to-interactive for file viewer panel

### Security

**Requirements (from PRD NFR-4 and Epic 4 BUNDLE-SPEC.md):**

1. **Path Traversal Prevention:**
   - All file paths validated against output directory boundary
   - Reject paths containing `../` or absolute paths
   - Use path.normalize() and path.resolve() for validation
   - Symbolic links resolved and validated (reuse Epic 4 Story 4.2 logic)

2. **Read-Only Access:**
   - No write operations exposed via file viewer APIs
   - No file deletion capabilities
   - No file upload endpoints
   - GET-only endpoints for /api/files/* routes

3. **Directory Scope:**
   - File operations restricted to `OUTPUT_FOLDER_PATH` environment variable
   - No access to bundle directories, core files, or agent sources
   - Error messages sanitized (no path information leakage)

4. **Binary File Handling:**
   - Detect binary files before attempting to read as text
   - Prevent serving binary content that could execute (though MVP has no download)
   - Return `isBinary: true` flag for frontend to handle appropriately

**Implementation:**
```typescript
// Reuse and extend Epic 4 path validation
function validateOutputPath(requestedPath: string): string {
  const outputRoot = process.env.OUTPUT_FOLDER_PATH || path.join(process.cwd(), 'output');
  const resolvedPath = path.resolve(outputRoot, requestedPath);

  // Check if path is within output directory
  if (!resolvedPath.startsWith(path.normalize(outputRoot))) {
    throw new SecurityError('Access denied: Path outside output directory');
  }

  // Prevent traversal
  if (requestedPath.includes('..')) {
    throw new SecurityError('Access denied: Path traversal detected');
  }

  return resolvedPath;
}
```

### Reliability/Availability

**Requirements (from PRD NFR-2):**

1. **Graceful Error Handling:**
   - File read errors don't crash the application
   - Missing files return 404 with clear message
   - Corrupted files handled gracefully (show error, not crash)
   - Directory read failures show error in UI, allow retry

2. **Recovery Mechanisms:**
   - Refresh button allows manual recovery from errors
   - File viewer errors don't affect chat interface functionality
   - Selected file state preserved across refresh operations

3. **Edge Cases:**
   - Empty output directory shows helpful empty state
   - Large files (>1MB) handled with pagination or streaming
   - Deeply nested directories (>10 levels) render without stack overflow
   - Rapid file selection changes don't cause race conditions

**Availability:**
- File viewer is non-critical: chat interface remains functional if viewer fails
- Uptime appropriate for self-hosted local/network deployment (no SLA)
- No persistence layer eliminates database availability concerns

### Observability

**Requirements (from PRD NFR-8):**

1. **Logging:**
   - Console log file tree generation: `[FileTreeAPI] Building tree for output directory`
   - Console log file reads: `[FileContentAPI] Reading file: {path} (size: {size})`
   - Error logging with context: `[FileTreeAPI] Error: Failed to read directory {path}: {error.message}`
   - Security violations logged: `[PathValidator] SECURITY: Path traversal attempt: {requestedPath}`

2. **User Visibility:**
   - Loading indicators during API calls
   - Error messages displayed in file viewer panel
   - File metadata visible (size, modified date)
   - Clear indication when file is binary (cannot preview)

3. **Debug Information:**
   - API response times logged to console
   - Tree structure depth logged for performance monitoring
   - Selected file path visible in breadcrumb UI

**Implementation:**
- Reuse Epic 3's error display patterns for consistency
- Log all file operations at INFO level (not DEBUG - minimal logging for MVP)
- Use structured logging format: `[Component] Action: details`

## Dependencies and Integrations

**Internal Dependencies:**

| Dependency | Version/Source | Usage | Type |
|-----------|----------------|-------|------|
| **Epic 4 Path Resolver** | `lib/pathResolver.ts` | Reuse path validation logic for output directory security | Code Reuse |
| **Epic 4 File Operations** | `lib/tools/fileOperations.ts` | Reference implementation patterns for file reads | Pattern Reuse |
| **Epic 3 Chat UI Layout** | `app/page.tsx`, `components/ChatPanel.tsx` | Integrate file viewer into existing layout | UI Integration |
| **Epic 3 Markdown Renderer** | `react-markdown` + `remark-gfm` | Reuse markdown rendering for file viewer | Component Reuse |
| **Epic 3 Error Display** | `components/ErrorMessage.tsx` | Reuse error display patterns | Component Reuse |

**External Dependencies (from package.json):**

| Package | Version | Usage | Notes |
|---------|---------|-------|-------|
| `react` | ^18 | UI framework | Already installed |
| `react-dom` | ^18 | DOM rendering | Already installed |
| `next` | 14.2.0 | API routes, SSR | Already installed |
| `react-markdown` | ^10.1.0 | Markdown rendering in file viewer | Already installed (Epic 3) |
| `remark-gfm` | ^4.0.1 | GitHub-flavored markdown support | Already installed (Epic 3) |
| `tailwindcss` | ^3.4.0 | Styling for file viewer components | Already installed |

**Optional Dependencies (Tree Component):**

| Option | Evaluation | Decision |
|--------|------------|----------|
| `react-arborist` | Feature-rich tree component with virtualization | Consider if performance issues with large trees |
| `react-folder-tree` | Lightweight file tree component | Evaluate in Story 5.2 |
| **Custom Implementation** | Build tree component using Tailwind + React state | **Recommended for MVP** - Full control, no new deps |

**New API Endpoints (This Epic):**
- `GET /api/files/tree` - Directory tree structure
- `GET /api/files/content` - File contents with metadata

**Environment Variables:**
- `OUTPUT_FOLDER_PATH` - Already exists from Epic 1, reused here
- No new environment variables required

**File System Integration:**
- Node.js `fs` module (promises API) - Already in use
- Node.js `path` module - Already in use
- Mime type detection: Use file extension mapping (no new library)

## Acceptance Criteria (Authoritative)

**Epic Success Criteria (from epics.md):**
1. ✅ Users can browse output directory structure
2. ✅ File contents display correctly in browser
3. ✅ Read-only access prevents accidental modifications
4. ✅ Directory structure is intuitive to navigate

**Story-Level Acceptance Criteria:**

### Story 5.1: File Viewer UI Component
1. File viewer panel appears in UI (sidebar or split-pane layout)
2. Panel clearly labeled "Output Files" or similar
3. Panel toggleable or always visible based on design decision
4. Empty state shows "No files yet" message when output directory is empty
5. UI doesn't interfere with chat interface functionality
6. Responsive layout works on desktop browsers (Chrome, Firefox, Safari, Edge)

### Story 5.2: Display Directory Tree Structure
1. Directory tree displays output folder structure
2. Folders can be expanded/collapsed via click interaction
3. Files are distinguishable from folders (icons or distinct styling)
4. Nested directories display with proper indentation
5. Empty folders show as empty (not hidden from tree)
6. Tree updates when new files are created (auto-refresh after agent response)
7. Clicking file selects it for viewing (triggers content load)

### Story 5.3: Display File Contents
1. Clicking file in tree loads its contents via API
2. Text files display with proper formatting (preserved whitespace)
3. Line breaks and formatting preserved in display
4. Large files (>1MB) load without crashing browser (pagination or truncation)
5. Binary files show "Cannot preview" message (no attempt to render)
6. Currently selected file is highlighted in tree
7. File path shown above content area (breadcrumb or header)

### Story 5.4: Markdown Rendering in File Viewer
1. .md files render with markdown formatting by default
2. Toggle button switches between rendered and raw view
3. Headings, lists, tables all render correctly (match Epic 3 chat rendering)
4. Links are clickable (if safe - same security model as chat)
5. Code blocks display with monospace font and background
6. Markdown rendering matches chat interface styling (consistency)
7. Default view is rendered (not raw text)

### Story 5.5: Refresh File List
1. File list refreshes automatically after agent completes response
2. Manual refresh button available in file viewer UI
3. New files highlighted or indicated as new (optional visual cue)
4. Refresh preserves currently selected file if it still exists
5. Refresh doesn't interrupt user if actively viewing file
6. Auto-refresh frequency is reasonable (debounced to avoid excessive calls)

### Story 5.6: File Viewer Navigation Polish
1. Keyboard shortcuts for navigation implemented (up/down arrows to navigate files)
2. Breadcrumb trail shows current file path
3. "Back" functionality to return to tree view if in full-file mode (if applicable)
4. Loading indicator appears when opening large files
5. Scroll position preserved when switching between files
6. Clear indication when file is empty vs. still loading

### Story 5.7: Security - Read-Only File Access
1. No edit or delete buttons in file viewer UI
2. API endpoints only support GET operations (no POST/PUT/DELETE)
3. Write attempts return 403 error with clear message
4. File tree cannot trigger file deletions
5. File downloads disabled in MVP (view-only)
6. Security tested with manual API calls (path traversal attempts blocked)
7. Only output directory accessible (bundle/core directories blocked)

## Traceability Mapping

| AC # | Acceptance Criteria | Spec Section | Components/APIs | Test Idea |
|------|---------------------|--------------|-----------------|-----------|
| **5.1.1** | File viewer panel appears in UI | Detailed Design > Services and Modules | `FileViewerPanel.tsx`, UI layout | Visual regression test: verify panel renders |
| **5.1.2** | Panel clearly labeled "Output Files" | Detailed Design > Services and Modules | `FileViewerPanel.tsx` header | Assert label text exists in DOM |
| **5.1.3** | Panel toggleable or always visible | Detailed Design > Services and Modules | `FileViewerPanel.tsx` visibility state | Test toggle button shows/hides panel |
| **5.1.4** | Empty state shows when no files | Workflows > Workflow 1 | `FileViewerPanel.tsx` empty state | Mock API return empty tree, verify message |
| **5.1.5** | UI doesn't interfere with chat | System Architecture Alignment | Layout integration | Integration test: chat + viewer both functional |
| **5.1.6** | Responsive layout works on desktop | NFR > Usability (PRD) | CSS responsive design | Test on Chrome, Firefox, Safari, Edge |
| **5.2.1** | Directory tree displays structure | APIs > GET /api/files/tree | `DirectoryTree.tsx`, `/api/files/tree` | Assert nested structure renders correctly |
| **5.2.2** | Folders expand/collapse on click | Workflows > Workflow 3 | `DirectoryTree.tsx` expand state | Test folder click toggles children visibility |
| **5.2.3** | Files distinguishable from folders | Data Models > FileTreeNode | `DirectoryTree.tsx` styling/icons | Assert different icons or styles applied |
| **5.2.4** | Nested directories with indentation | Detailed Design > DirectoryTree | `DirectoryTree.tsx` recursive render | Verify CSS indentation increases with depth |
| **5.2.5** | Empty folders show in tree | APIs > GET /api/files/tree | Backend tree builder | Test with empty directory in output |
| **5.2.6** | Tree updates on new file creation | Workflows > Workflow 4 | Refresh logic in `FileViewerPanel.tsx` | Mock agent completion, verify tree refresh |
| **5.2.7** | Clicking file selects for viewing | Workflows > Workflow 2 | `DirectoryTree.tsx` onClick handler | Test file click triggers content load |
| **5.3.1** | File content loads on click | APIs > GET /api/files/content | `/api/files/content`, `FileContentDisplay.tsx` | Assert API called with correct path |
| **5.3.2** | Text files display with formatting | Data Models > FileContentResponse | `FileContentDisplay.tsx` | Verify <pre> tag preserves formatting |
| **5.3.3** | Line breaks and whitespace preserved | NFR > Usability | CSS white-space: pre-wrap | Test file with intentional whitespace |
| **5.3.4** | Large files load without crash | NFR > Performance | Pagination or truncation logic | Test with 2MB+ file, verify no crash |
| **5.3.5** | Binary files show "Cannot preview" | Security > Binary File Handling | `isBinary` check in `FileContentDisplay.tsx` | Test with .png file, verify message |
| **5.3.6** | Selected file highlighted in tree | Workflows > Workflow 2 | `DirectoryTree.tsx` selected state | Assert CSS class applied to selected node |
| **5.3.7** | File path shown above content | Navigation polish (Story 5.6) | Breadcrumb component | Verify breadcrumb renders correct path |
| **5.4.1** | Markdown files render by default | Workflows > Workflow 6 | `FileContentDisplay.tsx` markdown mode | Test .md file renders formatted |
| **5.4.2** | Toggle between rendered/raw view | Workflows > Workflow 6 | `FileContentDisplay.tsx` viewMode state | Test button click toggles display mode |
| **5.4.3** | Headings, lists, tables render | Markdown rendering (Epic 3 reuse) | `react-markdown` component | Verify markdown features render correctly |
| **5.4.4** | Links are clickable | Security > Read-Only Access | `react-markdown` link handling | Test markdown link click behavior |
| **5.4.5** | Code blocks display correctly | Markdown rendering | `react-markdown` code rendering | Verify monospace font and background |
| **5.4.6** | Styling matches chat interface | Epic 3 integration | Shared Tailwind classes | Visual consistency check |
| **5.4.7** | Default view is rendered | Data Models > FileViewerState | Initial viewMode: 'rendered' | Assert default state is rendered |
| **5.5.1** | Auto-refresh after agent response | Workflows > Workflow 4 | Event listener in `FileViewerPanel.tsx` | Mock agent completion event |
| **5.5.2** | Manual refresh button available | Workflows > Workflow 5 | Refresh button UI | Assert button exists and calls API |
| **5.5.3** | New files highlighted (optional) | Workflows > Workflow 4 | New file indicator logic | Test with new file, verify visual cue |
| **5.5.4** | Refresh preserves selected file | Workflows > Workflow 5 | State preservation logic | Select file, refresh, verify still selected |
| **5.5.5** | Refresh doesn't interrupt viewing | NFR > Reliability | Refresh debouncing | Test rapid refresh clicks |
| **5.5.6** | Reasonable auto-refresh frequency | NFR > Performance | Debounce implementation | Verify max 1 refresh per 2 seconds |
| **5.6.1** | Keyboard shortcuts implemented | Navigation polish | `useEffect` keyboard listener | Test arrow key navigation |
| **5.6.2** | Breadcrumb trail shows path | Workflows > Workflow 2 | Breadcrumb component | Verify path segments displayed |
| **5.6.3** | Back functionality (if applicable) | Navigation polish | Back button (conditional) | Test back button if implemented |
| **5.6.4** | Loading indicator for large files | NFR > Usability | Loading state in `FileContentDisplay.tsx` | Test with large file, verify spinner shows |
| **5.6.5** | Scroll position preserved | Navigation polish | Scroll state management | Test file switch, verify scroll reset |
| **5.6.6** | Empty file vs loading indication | NFR > Observability | Loading state vs empty content | Test both scenarios, verify correct message |
| **5.7.1** | No edit/delete buttons in UI | Security > Read-Only Access | `FileViewerPanel.tsx` UI elements | Assert no write action buttons exist |
| **5.7.2** | API endpoints GET-only | Security > Read-Only Access | `/api/files/*` route handlers | Test POST/PUT/DELETE return 405 |
| **5.7.3** | Write attempts return 403 error | Security > Path Traversal Prevention | `validateOutputPath` function | Test write attempt, verify 403 response |
| **5.7.4** | File tree cannot delete files | Security > Read-Only Access | `DirectoryTree.tsx` action handlers | Assert no delete functionality exists |
| **5.7.5** | File downloads disabled | Security > Read-Only Access | No download endpoints/buttons | Verify no download capability in UI/API |
| **5.7.6** | Path traversal blocked | Security > Path Traversal Prevention | `validateOutputPath` with `../` | Test `?path=../../etc/passwd`, verify 403 |
| **5.7.7** | Only output directory accessible | Security > Directory Scope | Path validation logic | Test bundle/core paths, verify blocked |

## Post-Review Follow-ups

**Story 5.0 Review (2025-10-06):**
1. **[HIGH]** Complete agent metadata extraction from XML `<agent>` element in manifest generation (lib/tools/fileOperations.ts:230)
2. **[MEDIUM]** Add formal unit test suite for session discovery API and path security validation
3. **[MEDIUM]** Connect workflow finalization hook to automatically finalize manifests on completion
4. **[LOW]** Validate concurrent write safety for output registration under high concurrency scenarios
5. **[LOW]** Add end-to-end integration test for cross-agent session discovery (Alex → Casey → Pixel chain)

**Story 5.2.1 Review (2025-10-07):**
1. **[MEDIUM]** Consider timezone-aware timestamp formatting based on user locale (lib/files/manifestReader.ts:138) - Current: hardcoded UTC, Suggested: Intl.DateTimeFormat with user's timezone or make configurable
2. **[MEDIUM]** Complete Task 5: Dedicated metadata panel UI when UX design is finalized - Current: metadata attached to nodes with UUID tooltip, Future: modal/drawer with full session details
3. **[LOW]** Add test for very long agent titles/workflow names (>100 chars) to verify CSS truncation (components/__tests__/DirectoryTree.test.tsx) - Estimated effort: 15 minutes
4. **[LOW]** Add ADR documenting decision to defer Task 5 metadata panel (docs/adrs/adr-005-session-metadata-display.md)

---

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: Tree Component Performance with Large Directories**
- **Severity:** Medium
- **Description:** Custom tree implementation may struggle with 100+ files, causing slow renders or UI freezes
- **Mitigation:**
  - Implement virtualization if performance issues arise
  - Use React.memo() for tree nodes
  - Consider react-arborist library as fallback
- **Validation:** Performance test with 150-file directory during Story 5.2

**RISK-2: Large File Display Crashes Browser**
- **Severity:** Medium
- **Description:** Loading multi-MB files into DOM could freeze browser or consume excessive memory
- **Mitigation:**
  - Implement file size limit (1MB) with pagination for larger files
  - Show first 1000 lines + "Show more" button for large text files
  - Truncate display with download option (deferred to Phase 2)
- **Validation:** Test with 5MB file during Story 5.3

**RISK-3: Path Security Bypass**
- **Severity:** High
- **Description:** Incorrect path validation could expose bundle/core files or system files
- **Mitigation:**
  - Reuse Epic 4's hardened path validation (Story 4.2 with OWASP best practices)
  - Add explicit tests for traversal attacks (Story 5.7 AC 5.7.6)
  - Security review before Epic 5 completion
- **Validation:** Penetration testing during Story 5.7

**RISK-4: UI Layout Conflicts with Chat Interface**
- **Severity:** Low
- **Description:** File viewer panel may interfere with chat UI responsiveness or layout
- **Mitigation:**
  - Design split-pane layout with resizable divider
  - Ensure chat remains functional when viewer is open
  - Integration testing (AC 5.1.5)
- **Validation:** Cross-browser testing during Story 5.1

**RISK-5: Refresh Timing Issues**
- **Severity:** Low
- **Description:** File list may not refresh immediately after agent saves files, causing user confusion
- **Mitigation:**
  - Hook into agent completion event from Epic 4
  - Debounce refresh to avoid race conditions
  - Show "Refreshing..." indicator during update
- **Validation:** Integration test with actual agent execution

### Assumptions

**ASSUMPTION-1: Output Directory Exists**
- Output directory (OUTPUT_FOLDER_PATH) is created during application initialization or first agent execution
- No need to handle missing output directory - Epic 4 creates it on first write

**ASSUMPTION-2: File System Access Patterns**
- Node.js fs module has sufficient performance for directory traversal
- No need for file system caching in MVP (defer to Phase 2 if performance issues arise)
- OS file watchers not required (refresh on demand is sufficient)

**ASSUMPTION-3: Markdown Rendering Compatibility**
- Epic 3's react-markdown configuration works identically in file viewer context
- No BMAD-specific markdown extensions required
- GFM (GitHub Flavored Markdown) coverage is sufficient

**ASSUMPTION-4: Desktop-First Interaction**
- Users primarily interact with file viewer on desktop browsers (per PRD NFR-5)
- Mobile responsiveness is nice-to-have, not required for MVP
- Complex file navigation (keyboard shortcuts) acceptable on desktop only

**ASSUMPTION-5: No Real-Time Collaboration**
- Single-user context assumed (no multi-user file conflicts)
- No need for file locking or concurrent access controls
- Agent execution is synchronous (one agent at a time per session)

### Open Questions

**QUESTION-1: UI Layout Decision - Split Pane vs Tabs vs Sidebar?**
- **Options:**
  - Split pane (chat left, files right) - Always visible, resizable
  - Tab-based (Chat tab, Files tab) - Maximizes space, but switching context
  - Sidebar (collapsible file panel) - Saves space, but requires toggle
- **Decision Needed By:** Story 5.1 start
- **Recommendation:** Split pane for desktop (aligns with "trust through transparency" principle from PRD)

**QUESTION-2: How to Indicate New Files After Agent Output?**
- **Options:**
  - Visual badge (green dot) next to new files
  - Temporary highlight animation on new file entries
  - "New" label that disappears after first view
  - No indication (rely on refresh timestamp)
- **Decision Needed By:** Story 5.5
- **Recommendation:** Temporary highlight (1-2 seconds) - subtle, non-intrusive

**QUESTION-3: Keyboard Navigation Scope?**
- **Options:**
  - Full keyboard navigation (arrow keys, enter, escape, tab)
  - Minimal (just arrow keys for file selection)
  - None (mouse-only for MVP)
- **Decision Needed By:** Story 5.6
- **Recommendation:** Minimal (arrow keys) for MVP, expand in Phase 2

**QUESTION-4: File Size Limit for Display?**
- **Specific Threshold:**
  - 500KB? 1MB? 2MB?
- **Behavior When Exceeded:**
  - Truncate with "Show full file" button?
  - Pagination (show 1000 lines at a time)?
  - Error message "File too large to preview"?
- **Decision Needed By:** Story 5.3
- **Recommendation:** 1MB limit, truncate to first 5000 lines with message

**QUESTION-5: Epic 4 Retrospective - Any File Viewer Prep Needed?**
- Epic 4 retro mentions "PREP-3: Create File Viewer UI Mockup" (2 hours estimated)
- Should this be completed before Epic 5 Story 5.1?
- **Decision:** Coordinate with Epic 4 retrospective action items

## Test Strategy Summary

### Unit Testing

**Backend (Jest + ts-jest):**
- `lib/files/pathValidator.ts` - Path security validation (reuse Epic 4 tests)
  - Valid output paths accepted
  - Path traversal attempts blocked (../, ../../, absolute paths)
  - Symbolic link resolution validated
  - Bundle/core paths rejected
- `/api/files/tree/route.ts` - Directory tree builder
  - Empty directory returns empty tree
  - Nested directories build correct hierarchy
  - File metadata (size, modified) included correctly
  - Error handling for unreadable directories
- `/api/files/content/route.ts` - File content retrieval
  - Text files return content correctly
  - Binary files flagged with isBinary: true
  - Large files handled appropriately
  - Missing files return 404

**Frontend (React Testing Library):**
- `FileViewerPanel.tsx` - Main panel component
  - Renders with empty state when no files
  - Calls /api/files/tree on mount
  - Triggers refresh on agent completion event
  - Handles API errors gracefully
- `DirectoryTree.tsx` - Tree navigation
  - Expands/collapses folders on click
  - Highlights selected file
  - Renders nested structure with indentation
  - Calls file selection handler correctly
- `FileContentDisplay.tsx` - Content rendering
  - Renders text files in <pre> tag
  - Renders markdown with react-markdown
  - Toggles between rendered and raw view
  - Shows "Cannot preview" for binary files

### Integration Testing

**File Viewer + Chat Interface:**
- Test Scenario: Agent saves file → File viewer refreshes
  - Given: Agent execution completes with save_output tool call
  - When: Agent response displayed in chat
  - Then: File viewer tree updates with new file

**File Viewer + API:**
- Test Scenario: Complete file browsing workflow
  - Given: Output directory contains nested files
  - When: User expands folder, clicks file
  - Then: File content loads and displays correctly

**Security Integration:**
- Test Scenario: Path traversal attack blocked
  - Given: Malicious path `?path=../../etc/passwd`
  - When: GET /api/files/content called
  - Then: Returns 403 Forbidden, no file content leaked

### End-to-End Testing (Manual for MVP)

**User Journey: View Agent Output**
1. User interacts with agent to generate document
2. Agent saves file to output directory
3. File viewer automatically refreshes
4. User expands folder, selects file
5. File content displays with markdown rendering
6. User toggles to raw view, verifies content

**Cross-Browser Verification:**
- Chrome 90+ (primary target)
- Firefox 88+
- Safari 14+
- Edge 90+
- Verify: Layout, tree interaction, file display, markdown rendering

**Performance Testing:**
- Load file tree with 100 files (NFR requirement)
- Open 2MB file (large file handling)
- Rapid folder expand/collapse (render performance)
- Measure: API response time, render time, memory usage

### Test Coverage Goals

**Target Coverage:**
- Backend: 80%+ line coverage for new file viewer code
- Frontend: 70%+ component coverage (excluding UI-only components)
- Integration: All critical workflows tested (file load, tree navigation, security)

**Critical Paths (Must Test):**
1. Path security validation (5.7.6, 5.7.7)
2. File content loading (5.3.1)
3. Markdown rendering (5.4.1, 5.4.3)
4. Auto-refresh after agent output (5.5.1)
5. Empty state handling (5.1.4)

### Regression Testing

**Epic 3 Chat Interface:**
- Verify chat functionality unaffected by file viewer
- Confirm markdown rendering still works in chat
- Ensure agent responses display correctly

**Epic 4 Agent Execution:**
- Verify save_output tool still works
- Confirm path resolution unchanged
- Test agent workflows end-to-end

**Test Execution Timeline:**
- Unit tests: Developed alongside each story (TDD approach)
- Integration tests: After Stories 5.3 and 5.5 complete
- E2E tests: After Story 5.7 (epic completion)
- Regression tests: Before Epic 5 sign-off
