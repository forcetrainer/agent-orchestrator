# Story 5.2.1: Session Metadata Display Enhancement

Status: Ready for Development

## Story

As an end user,
I want to see human-readable session names instead of UUIDs,
so that I can easily identify which agent created which outputs.

## Acceptance Criteria

1. Session folders display as "{Agent Title} - {Workflow Name} ({Date})" instead of UUID
2. manifest.json files hidden from directory tree (internal metadata only)
3. Clicking session folder shows agent metadata (agent name, workflow, user, timestamps)
4. Internal technical paths (UUIDs) still used for file operations and security validation
5. Empty sessions (no outputs yet) show as "Agent Name - Workflow (In Progress)"
6. Display names update when manifest.json is modified
7. Sessions without manifest.json fall back to showing UUID (graceful degradation)

## Tasks / Subtasks

- [ ] Task 1: Create SessionMetadata interface and manifestReader utility (AC: 1, 7)
  - [ ] Define SessionMetadata TypeScript interface matching Story 5.0 manifest schema
  - [ ] Create `lib/files/manifestReader.ts` module
  - [ ] Implement `parseManifest(sessionPath: string): SessionMetadata | null` function
  - [ ] Implement `generateDisplayName(metadata: SessionMetadata): string` function
  - [ ] Handle missing or malformed manifest.json gracefully (return null)
  - [ ] Add date formatting utility for human-readable timestamps
  - [ ] Write unit tests for manifest parsing and display name generation

- [ ] Task 2: Extend FileTreeNode interface (AC: 1, 4)
  - [ ] Add `displayName?: string` field to FileTreeNode interface
  - [ ] Add `metadata?: SessionMetadata` field to FileTreeNode interface
  - [ ] Add `isInternal?: boolean` field to FileTreeNode interface
  - [ ] Update FileTreeNode type exports in appropriate type definition file
  - [ ] Ensure backward compatibility (all fields optional)

- [ ] Task 3: Update tree builder to load manifests (AC: 1, 2, 5, 7)
  - [ ] Modify `lib/files/treeBuilder.ts` to detect session folders (UUID pattern)
  - [ ] For each session folder, attempt to load manifest.json using manifestReader
  - [ ] If manifest exists, set `displayName` using `generateDisplayName()`
  - [ ] If manifest exists, attach metadata to FileTreeNode
  - [ ] Mark manifest.json files as `isInternal: true` to hide from tree
  - [ ] Handle "running" status sessions (show "In Progress" in display name)
  - [ ] Fallback to UUID name if manifest.json missing or invalid
  - [ ] Write unit tests for tree builder with manifest loading

- [ ] Task 4: Update DirectoryTree component to render display names (AC: 1, 3)
  - [ ] Modify `components/DirectoryTree.tsx` to render `node.displayName || node.name`
  - [ ] Filter out nodes where `isInternal === true` from rendering
  - [ ] Add hover tooltip or metadata panel showing full session details
  - [ ] Ensure selected file highlighting still works with display names
  - [ ] Update component tests to verify displayName rendering

- [ ] Task 5: Add session metadata display (AC: 3)
  - [ ] Create metadata panel or tooltip component for session details
  - [ ] Display agent name, title, workflow description
  - [ ] Display execution timestamps (started, completed)
  - [ ] Display execution status (running, completed, failed)
  - [ ] Display user who initiated the session
  - [ ] Style metadata display clearly but non-intrusively

- [ ] Task 6: Update API endpoint to include metadata (AC: 1, 2)
  - [ ] Modify `app/api/files/tree/route.ts` to use enhanced tree builder
  - [ ] Verify response includes displayName and metadata fields
  - [ ] Ensure technical paths (UUIDs) still present in `path` and `name` fields
  - [ ] Add integration tests for API with metadata-enhanced response

- [ ] Task 7: Write comprehensive tests (Testing Requirements)
  - [ ] Unit tests: manifestReader parsing valid and invalid manifests
  - [ ] Unit tests: Display name generation for various metadata scenarios
  - [ ] Unit tests: Tree builder with session folders (with and without manifests)
  - [ ] Unit tests: File filtering (manifest.json excluded from tree)
  - [ ] Component tests: DirectoryTree renders displayName correctly
  - [ ] Component tests: Internal files hidden from display
  - [ ] Integration tests: Full tree API → component flow with metadata
  - [ ] Edge case tests: Malformed manifest, missing fields, future status values

- [ ] Task 8: Update documentation (AC: all)
  - [ ] Update tech-spec-epic-5.md with SessionMetadata interface (already done)
  - [ ] Update tech-spec-epic-5.md Services table with ManifestReader (already done)
  - [ ] Add usage examples to manifestReader.ts JSDoc comments
  - [ ] Document display name format convention in SESSION-OUTPUT-SPEC.md

## Dev Notes

### Architecture Patterns and Constraints

**Enhancement Layer (Not Replacement):**
- Story 5.2 implementation remains unchanged - this story extends it
- Technical paths (UUIDs) still used for all file operations and security validation
- Display layer sits on top of existing tree structure (presentation concern)

**Reuse from Story 5.0:**
- manifest.json schema defined in Story 5.0 (Session-Based Output Management)
- Session folder structure: `/data/agent-outputs/{uuid}/manifest.json`
- No changes to manifest generation - purely consumption for display

**Graceful Degradation:**
- Sessions without manifest.json (legacy or corrupted) fall back to UUID display
- Malformed manifest.json logged as warning but doesn't break tree rendering
- Missing metadata fields handled with sensible defaults

**Display Name Format:**
```
{agent.title} - {workflow.name} ({formatted_date})

Examples:
- "Alex the Facilitator - Intake ITSM (Oct 6, 2025 5:09 PM)"
- "Casey - Deep Dive Workflow (Oct 5, 2025 2:30 PM)"
- "Pixel - Build Stories (Oct 6, 2025 9:15 AM - In Progress)"
```

### Source Tree Components to Touch

**New Files:**
- `lib/files/manifestReader.ts` - Manifest parsing and display name generation
- `lib/files/__tests__/manifestReader.test.ts` - Unit tests for manifest reader

**Modified Files:**
- `lib/files/treeBuilder.ts` - Add manifest loading logic
- `components/DirectoryTree.tsx` - Render displayName, filter internal files
- `app/api/files/tree/route.ts` - Use enhanced tree builder (likely no code change)
- `types/files.ts` or similar - Extend FileTreeNode interface

**Test Files:**
- `lib/files/__tests__/treeBuilder.test.ts` - Add tests for manifest loading
- `components/__tests__/DirectoryTree.test.tsx` - Add tests for displayName rendering
- `app/api/files/tree/__tests__/route.test.ts` - Add tests for metadata in response

### Testing Standards Summary

**Unit Testing (Jest):**
- manifestReader: parse valid manifest, handle invalid JSON, handle missing fields
- manifestReader: generate display name for various metadata combinations
- treeBuilder: load manifests from session folders, handle missing manifests
- treeBuilder: filter manifest.json files from tree (isInternal flag)

**Component Testing (React Testing Library):**
- DirectoryTree: renders displayName when present
- DirectoryTree: falls back to name when displayName absent
- DirectoryTree: hides nodes with isInternal=true
- DirectoryTree: displays metadata panel/tooltip on session folder click

**Integration Testing:**
- Full flow: API call → tree with metadata → component rendering
- Real session folders with actual manifest.json files
- Mixed scenarios: some sessions with manifests, some without

**Edge Cases:**
- Empty manifest.json file
- Manifest with missing required fields (agent, workflow, execution)
- Future status values not in current enum
- Very long agent titles or workflow names (truncation/wrapping)
- Sessions created mid-rendering (manifest added after initial load)

### Project Structure Notes

**TypeScript Interfaces:**
```typescript
// SessionMetadata - matches Story 5.0 manifest.json schema
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

// Extended FileTreeNode (from Story 5.2)
interface FileTreeNode {
  name: string;              // Technical name (UUID for sessions)
  path: string;              // Technical path
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
  modified?: string;
  displayName?: string;      // NEW - human-readable name
  metadata?: SessionMetadata; // NEW - session metadata
  isInternal?: boolean;      // NEW - hide from UI
}
```

**manifestReader API:**
```typescript
// Parse manifest.json from session folder
function parseManifest(sessionPath: string): SessionMetadata | null

// Generate human-readable display name from metadata
function generateDisplayName(metadata: SessionMetadata): string

// Helper: Format ISO 8601 timestamp to readable format
function formatTimestamp(isoString: string): string
```

### References

- **Tech Spec:** docs/tech-spec-epic-5.md Section "Data Models and Contracts"
- **Story 5.0:** Session-Based Output Management (defines manifest.json schema)
- **Story 5.2:** Display Directory Tree Structure (foundation for this enhancement)
- **SESSION-OUTPUT-SPEC.md:** Full manifest.json specification
- **PRD:** docs/prd.md FR-8 (File Viewer) and NFR-5 (Usability)

## Change Log

| Date       | Version | Description                  | Author |
| ---------- | ------- | ---------------------------- | ------ |
| 2025-10-06 | 0.1     | Initial story creation       | Winston |

## Dev Agent Record

### Context Reference

- [Story Context 5.2.1](/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-5.2.1.xml) (Generated: 2025-10-06)

### Agent Model Used

To be added during implementation

### Debug Log References

To be added during implementation

### Completion Notes List

To be added during implementation

### File List

To be added during implementation
