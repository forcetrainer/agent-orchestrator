# Story 5.5: Refresh File List

Status: Ready for Implementation

## Story

As an end user,
I want the file list to update when agent creates new files,
so that I see newly created files without manual refresh.

## Acceptance Criteria

1. File list refreshes automatically after agent completes response
2. Manual refresh button available in file viewer UI
3. New files highlighted or indicated as new (optional visual cue)
4. Refresh preserves currently selected file if it still exists
5. Refresh doesn't interrupt user if actively viewing file
6. Auto-refresh frequency is reasonable (debounced to avoid excessive calls)

## Tasks / Subtasks

- [ ] Task 1: Implement Auto-Refresh After Agent Response (AC: 1, 6)
  - [ ] Hook into agent completion event from chat interface (Epic 3)
  - [ ] Detect when agent finishes executing and returns response
  - [ ] Trigger file tree refresh by re-calling GET /api/files/tree
  - [ ] Debounce refresh calls to prevent excessive API requests (max 1 refresh per 2 seconds)
  - [ ] Preserve selected file state during refresh (if file still exists)
  - [ ] Update tree data with new file structure
  - [ ] Write unit tests for auto-refresh trigger logic

- [ ] Task 2: Add Manual Refresh Button (AC: 2)
  - [ ] Add refresh button to file viewer panel header
  - [ ] Style button with icon (circular arrow) and/or text label
  - [ ] Button click handler calls GET /api/files/tree
  - [ ] Show loading indicator during manual refresh
  - [ ] Preserve selected file after manual refresh
  - [ ] Disable button during refresh to prevent double-clicks
  - [ ] Add aria-label for accessibility
  - [ ] Write component tests for manual refresh button

- [ ] Task 3: Implement Selected File Preservation Logic (AC: 4)
  - [ ] Store currently selected file path before refresh
  - [ ] After tree refresh, check if selected file still exists in new tree
  - [ ] If file exists: preserve selection and keep content displayed
  - [ ] If file deleted: clear selection and show empty state
  - [ ] Handle edge case: selected file moved to different directory
  - [ ] Write unit tests for file preservation logic

- [ ] Task 4: Add New File Visual Indicator (AC: 3, Optional)
  - [ ] Compare old tree structure with new tree structure after refresh
  - [ ] Identify newly added files (files in new tree not in old tree)
  - [ ] Apply visual indicator to new files (green dot, "NEW" badge, or subtle highlight)
  - [ ] Indicator appears for 5-10 seconds or until user interacts with file
  - [ ] Indicator persists across expand/collapse but fades on next refresh
  - [ ] Ensure indicator doesn't distract or clutter UI
  - [ ] Write component tests for new file indicator

- [ ] Task 5: Implement Refresh Debouncing (AC: 6)
  - [ ] Create debounce utility function if not already exists
  - [ ] Debounce auto-refresh calls: wait 2 seconds after last agent response
  - [ ] Cancel pending debounced refresh if user manually refreshes
  - [ ] Prevent refresh spam if agent generates multiple rapid responses
  - [ ] Log refresh operations for debugging (console.log)
  - [ ] Write unit tests for debounce logic

- [ ] Task 6: Handle Refresh During Active File Viewing (AC: 5)
  - [ ] Detect if user is actively viewing file (not just selected, but scrolling or reading)
  - [ ] Option A: Always refresh tree but preserve scroll position
  - [ ] Option B: Delay refresh if user actively interacting, queue for later
  - [ ] Ensure file content doesn't disappear mid-reading during refresh
  - [ ] Test scenario: User viewing file, agent creates new file → tree updates but view stable
  - [ ] Write integration tests for this scenario

- [ ] Task 7: Update FileViewerPanel State Management (AC: 1-6)
  - [ ] Extend FileViewerPanel state to track lastRefreshTimestamp
  - [ ] Track isRefreshing state for loading indicators
  - [ ] Track newFiles array for visual indicators
  - [ ] Create refreshFileTree() function encapsulating refresh logic
  - [ ] Handle API errors gracefully (show error, allow retry)
  - [ ] Ensure refresh doesn't conflict with initial tree load

- [ ] Task 8: Write Comprehensive Tests (Testing Requirements)
  - [ ] Unit tests: Auto-refresh trigger on agent completion event
  - [ ] Unit tests: Manual refresh button click calls API
  - [ ] Unit tests: Debounce logic prevents excessive calls
  - [ ] Unit tests: Selected file preservation after refresh
  - [ ] Component tests: Refresh button renders and is clickable
  - [ ] Component tests: Loading indicator shows during refresh
  - [ ] Component tests: New file indicator displays correctly
  - [ ] Integration tests: Full workflow (agent creates file → auto-refresh → file appears in tree)
  - [ ] Integration tests: Manual refresh while file selected → selection preserved
  - [ ] Edge case tests: Refresh during file load, refresh when tree empty, refresh with deleted selected file

## Dev Notes

### Architecture Patterns and Constraints

**Event-Driven Refresh (Epic 3 Integration):**
- Story 5.5 must integrate with Epic 3 chat interface to detect agent completion events
- Agent completion typically occurs when OpenAI API returns final response (no more function calls)
- Hook into existing chat state management to trigger file viewer refresh
- Consider using React context or callback prop to communicate chat → file viewer
- Reference Epic 3 chat completion handling for event source

**State Management Patterns:**
- FileViewerPanel component manages refresh logic (existing component from Story 5.1)
- State additions: `isRefreshing: boolean`, `lastRefreshTimestamp: number`, `newFiles: string[]`
- Refresh function should be reusable for both auto-refresh and manual refresh
- Consider extracting refresh logic to custom hook: `useFileTreeRefresh()`

**Debouncing Strategy (Performance Consideration):**
- Use lodash debounce or custom debounce utility
- Debounce window: 2 seconds (from Tech Spec NFR line 574)
- Rationale: Prevents excessive API calls if agent generates multiple files rapidly
- Cancel debounce on manual refresh (user intent overrides auto-refresh)
- Log all refresh operations for debugging: `[FileViewerPanel] Auto-refresh triggered, debounce timer started`

**Selected File Preservation Algorithm:**
```typescript
// Before refresh
const selectedFilePath = selectedFile; // e.g., "requirements/prd.md"

// After refresh (new tree data received)
const fileStillExists = findFileInTree(newTreeData, selectedFilePath);

if (fileStillExists) {
  // Keep selection, preserve scroll position
  setSelectedFile(selectedFilePath);
} else {
  // File deleted or moved
  setSelectedFile(null);
  setFileContent(null);
  // Show message: "Previously selected file no longer exists"
}
```

**New File Detection Logic (Optional Feature):**
```typescript
// Compare old tree paths with new tree paths
const oldFilePaths = extractAllPaths(oldTreeData); // Set<string>
const newFilePaths = extractAllPaths(newTreeData); // Set<string>

const newFiles = [...newFilePaths].filter(path => !oldFilePaths.has(path));
// newFiles = ["requirements/new-doc.md", "output/report.txt"]

// Apply visual indicator, auto-remove after 10 seconds or user interaction
setNewFiles(newFiles);
setTimeout(() => setNewFiles([]), 10000);
```

**Security and Error Handling:**
- Refresh uses same GET /api/files/tree endpoint (Story 5.2)
- Same path security validation applies (Story 5.7 path validator)
- Handle API errors: show error message, allow manual retry
- Network timeout: show "Refresh failed, click to retry" message
- Never crash UI if refresh fails (degradation: user can still manually refresh)

### Source Tree Components to Touch

**Modified Files:**
- `components/FileViewerPanel.tsx` - Primary file for refresh logic
  - Add refresh state management (isRefreshing, lastRefreshTimestamp, newFiles)
  - Add auto-refresh trigger logic (hook into chat completion event)
  - Add manual refresh button UI
  - Implement refreshFileTree() function
  - Implement selected file preservation logic
  - Implement debounce logic for auto-refresh
  - Add error handling for refresh failures

- `components/DirectoryTree.tsx` - Visual indicator for new files
  - Accept `newFiles: string[]` prop from parent
  - Apply visual indicator styling to nodes in newFiles array
  - Handle indicator removal on user interaction (optional)

- `components/__tests__/FileViewerPanel.test.tsx` - Tests for refresh logic
  - Test auto-refresh triggers on agent completion
  - Test manual refresh button click
  - Test debounce logic
  - Test selected file preservation
  - Test error handling

- `components/__tests__/DirectoryTree.test.tsx` - Tests for new file indicator
  - Test new file indicator renders with correct styling
  - Test indicator appears only for files in newFiles array

**Potential New Files:**
- `lib/utils/debounce.ts` - Debounce utility (if not already exists)
  - Simple debounce function for refresh calls
  - Cancel functionality for manual refresh override

**Integration Points (Epic 3):**
- Need to identify chat completion event source
- Options:
  - Option A: Chat component passes `onAgentComplete` callback to FileViewerPanel
  - Option B: Use React Context to share agent completion state
  - Option C: Listen to custom event via EventEmitter or window.dispatchEvent
- Decision: Choose simplest integration that doesn't couple components tightly

### Testing Standards Summary

**Unit Testing (Jest):**
- Debounce utility: verify 2-second wait, verify cancel on manual refresh
- Selected file preservation: verify file exists → preserved, verify file deleted → cleared
- New file detection: verify comparison logic identifies new files correctly
- Refresh state management: verify isRefreshing toggles correctly

**Component Testing (React Testing Library):**
- Manual refresh button: renders, clickable, disabled during refresh
- Loading indicator: shows during refresh, hides after completion
- New file indicator: renders with correct styling for new files
- Error message: displays on refresh failure, "Retry" button works

**Integration Testing:**
- Full auto-refresh workflow:
  1. User sends message to agent
  2. Agent saves file via write_file tool
  3. Agent response completes
  4. File viewer auto-refreshes after 2-second debounce
  5. New file appears in tree with visual indicator
  6. Selected file (if any) preserved
- Full manual refresh workflow:
  1. User clicks refresh button
  2. Loading indicator appears
  3. Tree updates with latest files
  4. Selected file preserved (or cleared if deleted)
  5. Loading indicator disappears

**Edge Case Testing:**
- Rapid agent responses: Debounce prevents excessive refreshes
- Refresh during file load: File content load not interrupted
- Refresh when tree empty: Empty state still shows after refresh
- Selected file deleted between refreshes: Selection cleared gracefully
- API error during refresh: Error message shown, retry button works
- Manual refresh cancels pending auto-refresh debounce

**Performance Testing:**
- Measure refresh time with 100-file tree (should be <2 seconds per NFR)
- Verify debounce prevents >1 refresh per 2 seconds
- Verify no memory leaks from repeated refreshes (cleanup timers)

### Project Structure Notes

**TypeScript Interfaces:**
```typescript
// Extend FileViewerState (in FileViewerPanel.tsx)
interface FileViewerState {
  treeData: FileTreeNode | null;
  selectedFile: string | null;
  fileContent: FileContentResponse | null;
  isLoading: boolean;
  viewMode: 'rendered' | 'raw';
  error: string | null;

  // NEW for Story 5.5
  isRefreshing: boolean;           // True during refresh operation
  lastRefreshTimestamp: number;    // Unix timestamp of last refresh
  newFiles: string[];              // Array of file paths added since last refresh
}

// Debounce utility signature
type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T>;
```

**Refresh Function Signature:**
```typescript
async function refreshFileTree(): Promise<void> {
  // 1. Set isRefreshing = true
  // 2. Store selected file path
  // 3. Call GET /api/files/tree
  // 4. Compare old tree with new tree to detect new files
  // 5. Update treeData state
  // 6. Preserve selected file if exists
  // 7. Set newFiles for visual indicator
  // 8. Set isRefreshing = false
  // 9. Log refresh completion
}
```

**Chat Integration Hook (Option A - Callback Prop):**
```typescript
// In parent component (e.g., app/page.tsx)
<ChatPanel onAgentComplete={() => fileViewerRef.current?.triggerRefresh()} />
<FileViewerPanel ref={fileViewerRef} />

// In FileViewerPanel
const triggerRefresh = () => {
  // Apply debounce, then call refreshFileTree()
  debouncedRefresh();
};
```

**New File Indicator Styling:**
```tsx
// In DirectoryTree.tsx
<div className={cn(
  "flex items-center p-2 hover:bg-gray-100",
  isSelected && "bg-blue-100",
  isNewFile && "relative" // Enable ::after pseudo-element
)}>
  {/* File name */}
  {isNewFile && (
    <span className="ml-2 text-xs text-green-600 font-semibold">NEW</span>
    // OR
    <span className="absolute right-2 w-2 h-2 bg-green-500 rounded-full"></span>
  )}
</div>
```

**Debounce Implementation (if creating new utility):**
```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
  };

  return debounced;
}
```

### References

- **Tech Spec:** docs/tech-spec-epic-5.md Section "Story 5.5: Refresh File List" (Lines 769-775)
- **Tech Spec Workflows:** Workflow 4 "File Refresh After Agent Output" (Lines 527-536), Workflow 5 "Manual Refresh" (Lines 538-545)
- **Epics:** docs/epics.md Story 5.5 (Lines 1375-1395)
- **Story 5.1:** File Viewer UI Component (Foundation for FileViewerPanel)
- **Story 5.2:** Display Directory Tree Structure (Tree data structure)
- **Epic 3 Story 3.5:** Basic Message Send Functionality (Agent completion event source)
- **PRD NFR-1:** Performance requirement: File viewer loads within 1 second
- **PRD NFR-8:** Observability requirement: Console logging for operations

## Change Log

| Date       | Version | Description   | Author             |
| ---------- | ------- | ------------- | ------------------ |
| 2025-10-07 | 0.1     | Initial draft | Bob (Scrum Master) |
| 2025-10-07 | 0.2     | Story context generated, ready for implementation | Bob (Scrum Master) |

## Dev Agent Record

### Context Reference

- [Story Context 5.5](/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-5.5.xml) (Generated: 2025-10-07)

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
