# Test Migration Plan - Epic 2 to Epic 4

**Generated:** 2025-10-05
**Story:** 4.10 - Refactor Epic 2 and Epic 3 Tests

## Executive Summary

Epic 4 introduced a new agentic execution architecture replacing Epic 2's simple function calling loop. This plan documents the audit of existing test files and migration strategy for aligning tests with the new architecture.

## Test Inventory

### Epic 4 Tests (Stories 4.1-4.9) - **KEEP & VERIFY**

These tests were created as part of Epic 4 implementation and align with the new architecture:

| Test File | Story | Module Under Test | Status | Coverage |
|-----------|-------|-------------------|--------|----------|
| `lib/agents/__tests__/agenticLoop.test.ts` | 4.1 | Agentic execution loop | ✅ Created | Unit |
| `lib/agents/__tests__/agenticLoop.integration.test.ts` | 4.1 | Agentic loop integration | ✅ Created | Integration |
| `lib/__tests__/pathResolver.test.ts` | 4.2 | Path variable resolution | ✅ Created | Unit |
| `lib/__tests__/pathResolver.integration.test.ts` | 4.2 | Path resolution integration | ✅ Created | Integration |
| `lib/agents/__tests__/criticalActions.test.ts` | 4.3 | Critical actions processor | ✅ Created | Unit |
| `lib/agents/__tests__/criticalActions.integration.test.ts` | 4.3 | Critical actions integration | ✅ Created | Integration |
| `lib/agents/__tests__/bundleScanner.test.ts` | 4.4 | Bundle discovery | ✅ Created | Unit |
| `lib/agents/__tests__/bundleScanner.integration.test.ts` | 4.4 | Bundle scanning integration | ✅ Created | Integration |
| `lib/tools/__tests__/fileOperations.integration.test.ts` | 4.5 | File operation tools | ✅ Created | Integration |
| `app/api/agents/__tests__/route.test.ts` | 4.4 | Agent discovery API | ✅ Created | API |
| `app/api/agent/initialize/__tests__/route.test.ts` | 4.7 | Agent initialization API | ✅ Created | API Unit |
| `app/api/agent/initialize/__tests__/route.integration.test.ts` | 4.7 | Agent initialization flow | ✅ Created | API Integration |
| `lib/agents/__tests__/systemPromptBuilder.test.ts` | 4.8 | System prompt builder | ✅ Created | Unit |
| `lib/agents/__tests__/systemPromptBuilder.integration.test.ts` | 4.8 | Prompt building integration | ✅ Created | Integration |
| `lib/__tests__/errorMapping.test.ts` | 4.6 | Error mapping | ✅ Created | Unit |

**Action:** Verify all Epic 4 tests exist and pass. Enhance per AC-4.10.1 through AC-4.10.6.

### Epic 2 Tests - **MIGRATE OR MARK LEGACY**

#### Category 1: Migrate to Epic 4 Architecture

| Test File | Epic 2 Module | Migration Target | Reason | Priority |
|-----------|---------------|------------------|--------|----------|
| `app/api/chat/__tests__/route.test.ts` | `executeChatCompletion` | Update to use `executeAgent` | Chat route now uses agentic loop | HIGH |
| `lib/files/__tests__/security.test.ts` | `validatePath`, `validateWritePath` | Migrate to `pathResolver` with `PathContext` | Path security now handled by pathResolver | HIGH |

**Migration Details:**

1. **`app/api/chat/__tests__/route.test.ts`**
   - Current: Mocks `executeChatCompletion` from Epic 2
   - Target: Update to mock `executeAgent` from `lib/agents/agenticLoop.ts`
   - Tests to preserve: Input validation (agentId, message, conversationId format), conversation state management, error handling
   - Tests to update: Function calling tests (replace with tool execution tests)
   - Tests to add: Agentic loop iteration tests, tool injection tests

2. **`lib/files/__tests__/security.test.ts`**
   - Current: Tests `validatePath` and `validateWritePath` from `lib/files/security.ts`
   - Target: Create new tests for `resolvePath` and `validatePathSecurity` in `lib/pathResolver.ts`
   - Tests to preserve: All security attack vectors (traversal, null bytes, symlinks, absolute paths)
   - Tests to update: Use `PathContext` instead of base directory strings
   - Tests to add: Variable resolution security ({bundle-root}, {config_source} injection attempts)

#### Category 2: Mark as Legacy Coverage

| Test File | Epic 2 Module | Action | Reason |
|-----------|---------------|--------|--------|
| `lib/openai/__tests__/chat.test.ts` | `executeChatCompletion` | Mark with "LEGACY EPIC 2" comment | Provides coverage for deprecated module still in codebase |
| `lib/openai/__tests__/client.test.ts` | OpenAI client | Keep as-is | Still used by Epic 4 (client initialization unchanged) |
| `lib/openai/__tests__/function-tools.test.ts` | Function tool definitions | Keep as-is | Tool schemas still used by Epic 4 |

**Legacy Marking Convention:**
```typescript
/**
 * LEGACY EPIC 2 TEST
 * This test covers the deprecated executeChatCompletion function.
 * Retained for legacy coverage until Epic 2 is fully removed.
 * New tests should use lib/agents/__tests__/agenticLoop.test.ts
 */
```

#### Category 3: Delete as Obsolete

| Test File | Epic 2 Module | Reason for Deletion | Replacement |
|-----------|---------------|---------------------|-------------|
| `scripts/test-openai-smoke.ts` | Epic 2 smoke test | Uses deprecated `executeChatCompletion` and `readFileContent` directly | Integration tests in Epic 4 cover same scenarios |
| `__tests__/integration/api.integration.test.ts` | Epic 2 API integration | Uses old agent loading and chat patterns | New integration tests in `app/api/**/__tests__/*.integration.test.ts` |

**Deletion Rationale:**
- `scripts/test-openai-smoke.ts`: Replaced by comprehensive Epic 4 integration tests that cover agentic loop, tool execution, and file operations
- `__tests__/integration/api.integration.test.ts`: Replaced by route-specific integration tests in Epic 4

### Epic 2 Core Utility Tests - **KEEP AS-IS**

These tests cover utility modules unchanged between Epic 2 and Epic 4:

| Test File | Module | Reason to Keep |
|-----------|--------|----------------|
| `lib/utils/__tests__/errors.test.ts` | Error utilities | Used by both epics |
| `lib/utils/__tests__/index.test.ts` | Utility functions | Used by both epics |
| `lib/utils/__tests__/conversations.test.ts` | Conversation management | Used by both epics |
| `lib/utils/__tests__/logger.test.ts` | Logging | Used by both epics |
| `lib/utils/__tests__/validation.test.ts` | Input validation | Used by both epics |
| `lib/agents/__tests__/parser.test.ts` | Agent XML parsing | Used by both epics |
| `lib/agents/__tests__/loader.test.ts` | Legacy agent loading | Still used for backward compatibility |
| `types/__tests__/index.test.ts` | Type definitions | Used by both epics |

**Action:** Run all tests to verify no regressions from Epic 4 changes.

### Epic 2 File Operation Tests - **EVALUATE**

| Test File | Module | Decision | Reason |
|-----------|--------|----------|--------|
| `lib/files/__tests__/reader.test.ts` | `readFileContent` | Mark Legacy | Story 4.5 uses these as helper functions |
| `lib/files/__tests__/writer.test.ts` | `writeFileContent` | Mark Legacy | Story 4.5 uses these as helper functions |
| `lib/files/__tests__/lister.test.ts` | `listFiles` | Mark Legacy | Story 4.5 uses these as helper functions |

**Note:** Story 4.5 refactored file operations to use `PathContext`, but the underlying reader/writer/lister functions remain. Tests should be marked as legacy and supplemented with new `fileOperations.integration.test.ts` tests.

## Migration Checklist

### Task 1: Audit Existing Test Suite ✅

- [x] Inventory all test files in `app/api/`, `lib/`, `scripts/`
- [x] Identify tests using Epic 2 code
- [x] Categorize tests: Keep (migrate), Keep (legacy), Delete
- [x] Document audit findings in this file
- [x] Create checklist of test files to migrate vs delete

### Task 2-7: Create/Verify Epic 4 Unit & Integration Tests

Per AC-4.10.1 through AC-4.10.6, verify and enhance:

- [ ] AC-4.10.1: Unit tests for agentic execution loop (iterations, tool injection, safety limits)
- [ ] AC-4.10.2: Unit tests for path variable resolution (all variable types)
- [ ] AC-4.10.3: Unit tests for critical actions processor
- [ ] AC-4.10.4: Unit tests for bundle discovery and parsing
- [ ] AC-4.10.5: Integration tests for complete agent initialization flow
- [ ] AC-4.10.6: Integration tests for file loading during agent execution

### Task 8: Migrate Relevant Epic 2 Tests

- [ ] Migrate `app/api/chat/__tests__/route.test.ts` to use `executeAgent`
  - [ ] Update mocks from `executeChatCompletion` to `executeAgent`
  - [ ] Update function call tests to tool execution tests
  - [ ] Add agentic loop iteration tests
  - [ ] Preserve input validation tests
  - [ ] Preserve conversation state tests
  - [ ] Preserve error handling tests

- [ ] Migrate `lib/files/__tests__/security.test.ts` to `pathResolver`
  - [ ] Create new tests for `resolvePath` with `PathContext`
  - [ ] Create new tests for `validatePathSecurity`
  - [ ] Port all attack vector tests (traversal, null bytes, symlinks)
  - [ ] Add variable resolution security tests
  - [ ] Add {bundle-root} injection tests
  - [ ] Add {config_source} injection tests

- [ ] Mark Epic 2 file operation tests as legacy
  - [ ] Add "LEGACY EPIC 2" comment to `lib/files/__tests__/reader.test.ts`
  - [ ] Add "LEGACY EPIC 2" comment to `lib/files/__tests__/writer.test.ts`
  - [ ] Add "LEGACY EPIC 2" comment to `lib/files/__tests__/lister.test.ts`

- [ ] Mark `lib/openai/__tests__/chat.test.ts` as legacy
  - [ ] Add "LEGACY EPIC 2" comment header
  - [ ] Add comment pointing to Epic 4 replacement tests

### Task 9: Delete Obsolete Epic 2 Tests

- [ ] Delete `scripts/test-openai-smoke.ts`
  - [ ] Document deletion rationale in this plan
  - [ ] Verify replacement coverage in Epic 4 integration tests

- [ ] Delete `__tests__/integration/api.integration.test.ts`
  - [ ] Document deletion rationale in this plan
  - [ ] Verify replacement coverage in Epic 4 route integration tests

- [ ] Add deprecation warnings to Epic 2 modules
  - [ ] Add deprecation comment to `lib/openai/chat.ts`
  - [ ] Add deprecation comment to `lib/files/security.ts`

### Task 10: Verify All Tests Pass

- [ ] Run full test suite: `npm test`
- [ ] Fix failing tests identified during migration
- [ ] Update test snapshots if needed
- [ ] Verify test coverage meets minimum thresholds:
  - [ ] Agentic loop: 90%+
  - [ ] Path resolver: 95%+
  - [ ] Bundle scanner: 85%+
  - [ ] Critical actions: 85%+
- [ ] Run tests in CI pipeline (if configured)
- [ ] Document any known test gaps or limitations

## Test Coverage Targets

| Module | Target Coverage | Current Status | Notes |
|--------|----------------|----------------|-------|
| Agentic Loop | 90%+ | TBD | Critical execution path |
| Path Resolver | 95%+ | TBD | Security-critical |
| Bundle Scanner | 85%+ | TBD | Discovery logic |
| Critical Actions | 85%+ | TBD | Initialization critical |
| File Operations | 80%+ | TBD | Refactored in Story 4.5 |
| Error Mapping | 85%+ | TBD | Story 4.6 |
| System Prompt Builder | 85%+ | TBD | Story 4.8 |

## Known Test Gaps

(To be documented during Task 10 verification)

- [ ] Gap 1: TBD
- [ ] Gap 2: TBD
- [ ] Gap 3: TBD

## Migration Timeline

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Audit | Task 1 | ✅ Complete |
| Phase 2: Epic 4 Tests | Tasks 2-7 | 🔄 In Progress |
| Phase 3: Migration | Task 8 | ⏳ Pending |
| Phase 4: Cleanup | Task 9 | ⏳ Pending |
| Phase 5: Verification | Task 10 | ⏳ Pending |

## Success Criteria

- [ ] All Epic 4 tests exist and pass
- [ ] All migrated Epic 2 tests pass with new architecture
- [ ] All obsolete tests deleted
- [ ] Legacy tests marked with clear comments
- [ ] Full test suite passes: `npm test`
- [ ] Coverage targets met for all critical modules
- [ ] No regressions in existing functionality

## References

- **Epic 4 Tech Spec:** `docs/EPIC4-TECH-SPEC.md` (Section 8: Testing Strategy)
- **Agent Execution Spec:** `docs/AGENT-EXECUTION-SPEC.md`
- **Bundle Spec:** `docs/BUNDLE-SPEC.md`
- **Story 4.9 Validation:** `docs/validation-report-story-4.9.md`
- **Story 4.10:** `docs/stories/story-4.10.md`
