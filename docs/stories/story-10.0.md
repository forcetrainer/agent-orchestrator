# Story 10.0: Directory Unification & Architecture Foundation

**Epic:** Epic 10 - Conversation Persistence & Multi-Session Management
**Author:** Winston (System Architect) + Bryan
**Date:** 2025-10-12
**Status:** Ready for Implementation
**Priority:** Critical - Foundational Refactor
**Estimated Effort:** 1-2 days

---

## User Story

**As a** developer
**I want** to consolidate session folders and conversation persistence into a unified structure
**So that** all conversation artifacts (messages, outputs, files) are stored together in one location

---

## Context & Problem Statement

### Current Architecture Problem

Currently, the system has **two separate tracking mechanisms** for conversations:

1. **In-Memory Conversations** (`lib/utils/conversations.ts`)
   - Stores message history in a `Map<string, Conversation>`
   - Lost on server restart (critical bug)
   - No disk persistence

2. **Session Folders** (`data/agent-outputs/{sessionId}/`)
   - Contains agent-generated output files
   - Has `manifest.json` with session metadata
   - Persists to disk but doesn't track messages

**Epic 10 Original Proposal** would have created a **third location**:
```
data/conversations/{conversationId}.json  ← Conversation messages
data/agent-outputs/{sessionId}/          ← Agent outputs
```

This creates **architectural fragmentation**:
- Conversation data in one place
- Session outputs in another place
- No single source of truth
- Complexity in syncing conversationId ↔ sessionId mapping

### Proposed Solution

**Unify everything under `data/conversations/`:**
```
data/conversations/{conversationId}/
├── conversation.json      ← Full conversation (messages + metadata)
├── output-001.md          ← Agent outputs
└── output-002.json
```

**Key Principle:** `conversationId === sessionId` (1:1 relationship)

---

## Acceptance Criteria

### AC1: Directory Structure Migration
- [ ] Rename `data/agent-outputs/` → `data/conversations/`
- [ ] All existing session folders migrated without data loss
- [ ] File structure remains intact (no files corrupted or lost)
- [ ] Git history preserved (use `git mv` for rename)

### AC2: Type System Unification
- [ ] Create unified `PersistedConversation` type that merges:
  - `Conversation` (from `lib/utils/conversations.ts`)
  - `SessionManifest` (from `lib/agents/sessionDiscovery.ts`)
- [ ] Add `browserId: string` field for Epic 10 browser tracking
- [ ] Add `folderPath: string` field for conversation folder reference
- [ ] Use ISO 8601 strings for all date fields (serialization-safe)

### AC3: Path Validation Security Updates
- [ ] Update `lib/pathResolver.ts` → `validateWritePath()` to allow `data/conversations/`
- [ ] Block writes to old `data/agent-outputs/` path (deprecated)
- [ ] All security tests pass with new path rules
- [ ] No regressions in path traversal protection

### AC4: Environment Configuration
- [ ] Update `lib/utils/env.ts` → `OUTPUT_PATH` constant to `data/conversations`
- [ ] Update all references to `agent-outputs` in codebase
- [ ] Environment variables remain backward compatible

### AC5: Session Creation Updates
- [ ] Update `lib/sessions/chatSessions.ts` → `createChatSession()` to use new path
- [ ] Enforce `conversationId === sessionId` in new sessions
- [ ] Create both `conversation.json` and `manifest.json` initially (migration phase)
- [ ] Later merge into single `conversation.json` (Story 10.1)

### AC6: Migration Script
- [ ] Create `scripts/migrate-sessions.js` script that:
  - Copies all folders from `data/agent-outputs/` → `data/conversations/`
  - Validates all `manifest.json` files are readable
  - Creates initial `conversation.json` stubs (empty messages array)
  - Verifies file integrity (checksums)
  - Generates migration report (success/failure counts)
- [ ] Migration script is idempotent (safe to run multiple times)
- [ ] Dry-run mode available for testing

### AC7: Testing & Verification
- [ ] All existing unit tests pass
- [ ] All existing integration tests pass
- [ ] New path validation tests added
- [ ] Manual verification: Create new session, verify files appear in correct location
- [ ] Manual verification: Load existing session, verify backward compatibility

---

## Technical Implementation Details

### Phase 1: Directory Rename (Safe, Reversible)

```bash
# Step 1: Rename directory
cd data/
mv agent-outputs conversations

# Step 2: Update Git tracking
git mv data/agent-outputs data/conversations
```

### Phase 2: Type System Unification

**New Type Definition** (`types/index.ts`):

```typescript
/**
 * Unified conversation type for Epic 10 persistence
 * Merges Conversation (messages) + SessionManifest (metadata)
 */
export interface PersistedConversation {
  // Identity (conversationId === sessionId)
  id: string;
  browserId: string; // Epic 10: browser tracking

  // Agent context
  agentId: string;
  agentTitle: string;
  agentBundle: string;

  // Message history (Epic 10 persistence)
  messages: SerializedMessage[]; // ISO date strings

  // Metadata (from SessionManifest)
  userSummary: string; // First message preview (truncated)
  messageCount: number;
  displayName: string; // Cached UI display
  displayTimestamp: string; // Cached timestamp

  // Folder reference
  folderPath: string; // Relative: "conversations/{id}"

  // Timestamps (ISO 8601 strings)
  createdAt: string;
  updatedAt: string;

  // Execution metadata
  status: 'running' | 'completed';
  user: string; // User who initiated conversation
}

export interface SerializedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO 8601
}
```

### Phase 3: Path Validation Updates

**Update `lib/pathResolver.ts`:**

```typescript
export function validateWritePath(path: string, context: PathContext): void {
  const conversationsRoot = resolve(env.PROJECT_ROOT, 'data/conversations');

  // ONLY allow writes to conversations folder
  if (!path.startsWith(conversationsRoot)) {
    throw new SecurityError(
      `Write blocked: ${path}\n` +
      `Only writes to data/conversations/ are allowed.\n` +
      `This protects agent definitions and project files from modification.`
    );
  }

  // Path traversal protection (existing logic)
  if (path.includes('..')) {
    throw new SecurityError(`Path traversal blocked: ${path}`);
  }
}
```

### Phase 4: Environment Configuration

**Update `lib/utils/env.ts`:**

```typescript
export const env = {
  PROJECT_ROOT: resolve(__dirname, '../..'),
  OUTPUT_PATH: resolve(__dirname, '../../data/conversations'), // UPDATED
  AGENTS_PATH: resolve(__dirname, '../../agents'),
  // ... other paths
};
```

### Phase 5: Migration Script

**Create `scripts/migrate-sessions.js`:**

```javascript
const fs = require('fs/promises');
const path = require('path');

async function migrateToUnifiedStructure(dryRun = false) {
  const oldPath = path.resolve(__dirname, '../data/agent-outputs');
  const newPath = path.resolve(__dirname, '../data/conversations');

  console.log('[Migration] Starting session directory unification...');
  console.log(`[Migration] Dry run: ${dryRun}`);

  // Check if old directory exists
  try {
    await fs.access(oldPath);
  } catch (error) {
    console.log('[Migration] No agent-outputs directory found. Migration not needed.');
    return { success: 0, failed: 0, skipped: 0 };
  }

  // Create new directory if needed
  if (!dryRun) {
    await fs.mkdir(newPath, { recursive: true });
  }

  // Read all session folders
  const sessionDirs = await fs.readdir(oldPath);
  const stats = { success: 0, failed: 0, skipped: 0 };

  for (const sessionId of sessionDirs) {
    const oldSessionPath = path.join(oldPath, sessionId);
    const newSessionPath = path.join(newPath, sessionId);

    try {
      // Check if already migrated
      try {
        await fs.access(newSessionPath);
        console.log(`[Migration] Skipping ${sessionId} (already exists in conversations/)`);
        stats.skipped++;
        continue;
      } catch {
        // Doesn't exist, proceed with migration
      }

      // Verify manifest exists and is valid
      const manifestPath = path.join(oldSessionPath, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      if (!dryRun) {
        // Copy entire folder
        await fs.cp(oldSessionPath, newSessionPath, { recursive: true });

        // Create initial conversation.json stub
        const conversationStub = {
          id: sessionId,
          browserId: null, // Will be set in Story 10.2
          agentId: manifest.agent.name,
          agentTitle: manifest.agent.title,
          agentBundle: manifest.agent.bundle || 'chat',
          messages: [], // Will be populated in Story 10.1
          userSummary: manifest.userSummary || '',
          messageCount: manifest.messageCount || 0,
          displayName: manifest.displayName || '',
          displayTimestamp: manifest.displayTimestamp || '',
          folderPath: `conversations/${sessionId}`,
          createdAt: manifest.execution.started_at,
          updatedAt: manifest.execution.completed_at || manifest.execution.started_at,
          status: manifest.execution.status,
          user: manifest.execution.user,
        };

        const conversationPath = path.join(newSessionPath, 'conversation.json');
        await fs.writeFile(conversationPath, JSON.stringify(conversationStub, null, 2));
      }

      stats.success++;
      console.log(`[Migration] ✓ Migrated ${sessionId}`);
    } catch (error) {
      stats.failed++;
      console.error(`[Migration] ✗ Failed to migrate ${sessionId}:`, error.message);
    }
  }

  console.log('\n[Migration] Summary:');
  console.log(`  Success: ${stats.success}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Skipped: ${stats.skipped}`);

  return stats;
}

// Run migration
const isDryRun = process.argv.includes('--dry-run');
migrateToUnifiedStructure(isDryRun)
  .then((stats) => {
    if (stats.failed > 0) {
      console.error('\n[Migration] Migration completed with errors');
      process.exit(1);
    }
    console.log('\n[Migration] Migration completed successfully');
  })
  .catch((error) => {
    console.error('\n[Migration] Fatal error:', error);
    process.exit(1);
  });
```

---

## Files Affected

### Modified Files
- `lib/utils/env.ts` - Update OUTPUT_PATH
- `lib/pathResolver.ts` - Update validateWritePath() security
- `types/index.ts` - Add PersistedConversation type
- `lib/sessions/chatSessions.ts` - Update folder paths
- `lib/files/writer.ts` - Inherits path validation changes
- `.gitignore` - Update to reference conversations/ instead of agent-outputs/

### New Files
- `scripts/migrate-sessions.js` - Migration script
- `docs/stories/story-10.0.md` - This file

### Deleted/Deprecated
- `data/agent-outputs/` directory (replaced by `data/conversations/`)

---

## Testing Strategy

### Unit Tests
```typescript
// lib/__tests__/pathResolver.test.ts
describe('Story 10.0: Path Validation Updates', () => {
  it('should allow writes to data/conversations/', () => {
    const path = '/path/to/data/conversations/abc-123/file.txt';
    expect(() => validateWritePath(path, context)).not.toThrow();
  });

  it('should block writes to old data/agent-outputs/', () => {
    const path = '/path/to/data/agent-outputs/abc-123/file.txt';
    expect(() => validateWritePath(path, context)).toThrow(SecurityError);
  });

  it('should enforce conversationId === sessionId', () => {
    const conv = createConversation('agent-id', 'browser-id');
    expect(conv.id).toBe(conv.folderPath.split('/').pop());
  });
});
```

### Integration Tests
```bash
# Manual verification steps
1. Run migration script in dry-run mode
   $ node scripts/migrate-sessions.js --dry-run

2. Verify migration report shows expected counts

3. Run actual migration
   $ node scripts/migrate-sessions.js

4. Verify all files exist in new location
   $ ls -la data/conversations/

5. Create new chat session
   $ # Start chat, send message, verify folder appears in conversations/

6. Verify file viewer shows correct files
   $ # Check UI file tree
```

---

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate Rollback:**
   ```bash
   cd data/
   mv conversations agent-outputs
   git checkout HEAD -- lib/pathResolver.ts lib/utils/env.ts
   ```

2. **Revert Code Changes:**
   ```bash
   git revert <commit-hash-of-story-10.0>
   npm run build
   npm run dev
   ```

3. **Verify System Operational:**
   - Create new session
   - Verify files appear in `agent-outputs/`
   - Check existing sessions load correctly

---

## Success Criteria

✅ **Story is complete when:**
1. All sessions stored in `data/conversations/` directory
2. `PersistedConversation` type defined and documented
3. Path validation allows `conversations/`, blocks `agent-outputs/`
4. All existing tests pass
5. Migration script successfully migrates all existing sessions
6. No data loss or corruption
7. New sessions create folders in correct location
8. Code review approved by Bryan

---

## Dependencies

**Upstream Dependencies:** None (foundational story)

**Downstream Dependencies:**
- Story 10.1 (Persistence) - Depends on unified type system
- Story 10.2 (Browser Identity) - Depends on `browserId` field
- All other Epic 10 stories - Depend on unified directory structure

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | Critical | Dry-run mode, copy (not move), keep backups |
| Breaking existing sessions | Medium | High | Backward compatibility layer, thorough testing |
| Path validation regression | Low | High | Comprehensive security tests, code review |
| Git history confusion | Low | Low | Use `git mv`, document in commit message |

---

## Notes

- This story is **purely refactoring** - no user-facing changes
- Enables cleaner implementation of Stories 10.1-10.7
- Reduces technical debt by eliminating dual storage systems
- Sets foundation for conversation-centric architecture

---

**Ready for Implementation:** ✅ Yes
**Blocked By:** None
**Blocking:** Stories 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7

---

## Dev Agent Record

### Context Reference

- `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/stories-context/story-context-10.0.xml` (Generated: 2025-10-12)

### Agent Model Used

TBD (Pending implementation)

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD
