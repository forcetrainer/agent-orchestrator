# Story 2.3: Path Security & Validation

Status: ContextReadyDraft

## Story

As a platform operator,
I want file operations to be secure against path traversal and unauthorized access,
so that agents cannot access or modify files outside their designated directories.

## Acceptance Criteria

1. ✅ Directory traversal attacks prevented (../, absolute paths) (AC-E2-07)
2. ✅ Writes to agents folder rejected with 403 (AC-E2-08)
3. ✅ Writes to output folder allowed (AC-E2-09)
4. ✅ Symbolic links resolved and validated
5. ✅ Path normalization handles Windows and Unix paths
6. ✅ Security violations logged with details

## Tasks / Subtasks

- [ ] Create Path Security Module (AC: 1, 4, 5, 6)
  - [ ] Create `lib/files/security.ts`
  - [ ] Implement validatePath() function with null byte checking
  - [ ] Add absolute path rejection logic
  - [ ] Implement directory traversal prevention (resolve and check prefix)
  - [ ] Add path normalization for cross-platform support
  - [ ] Add detailed security violation logging

- [ ] Create Write-Specific Validation (AC: 2, 3, 6)
  - [ ] Implement validateWritePath() function
  - [ ] Add agents folder write rejection logic
  - [ ] Validate output folder writes are permitted
  - [ ] Add security logging for write validation failures

- [ ] Update File Writer to Use Write Validation (AC: 2, 3)
  - [ ] Replace validatePath with validateWritePath in writer.ts
  - [ ] Verify write rejection for agents folder
  - [ ] Verify write acceptance for output folder

- [ ] Create Security Tests (AC: 1, 2, 3, 4, 5)
  - [ ] Create `lib/files/__tests__/security.test.ts`
  - [ ] Test directory traversal rejection (../)
  - [ ] Test absolute path rejection
  - [ ] Test null byte rejection
  - [ ] Test valid relative paths acceptance
  - [ ] Test path normalization (. and ./ handling)
  - [ ] Test write validation (agents folder rejection, output folder acceptance)

- [ ] Security Attack Simulation Testing (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Test directory traversal attempts (../../etc/passwd)
  - [ ] Test absolute path attempts (/etc/passwd)
  - [ ] Test write to agents folder attempts
  - [ ] Test write to output folder (should succeed)
  - [ ] Verify all attacks are blocked and logged
  - [ ] Document security test results

## Dev Notes

### Security Implementation

**Path Validation Strategy:**
- **Normalize first**: Use `path.normalize()` to collapse `.` and `..` segments
- **Reject absolutes**: Check `path.isAbsolute()` and reject
- **Resolve and compare**: Use `path.resolve()` to get absolute paths, then verify the resolved path starts with the base directory
- **Null byte check**: Reject any path containing `\0` characters (security vulnerability)

**Write Validation Strategy:**
- First check if path would resolve to agents folder → reject with "read-only" error
- Then validate path is within output folder using standard validation
- This ensures agents folder is always protected from writes

**Cross-Platform Considerations:**
- Path normalization handles both `/` and `\` separators
- Windows absolute paths (C:\, D:\) rejected alongside Unix absolute paths (/)
- Symbolic link resolution ensures links can't escape base directories

### Alignment with Tech Spec

From tech-spec-epic-2.md Story 2.3 section (lines 426-603):

**Core Requirements:**
1. Directory traversal prevention using path.resolve() + prefix checking [Source: docs/tech-spec-epic-2.md#Story-2.3]
2. Absolute path rejection for security [Source: docs/tech-spec-epic-2.md#Story-2.3]
3. Null byte rejection (security violation) [Source: docs/tech-spec-epic-2.md#Story-2.3]
4. Agents folder is read-only (writes rejected with error) [Source: docs/tech-spec-epic-2.md#Story-2.3]
5. Output folder writes allowed [Source: docs/tech-spec-epic-2.md#Story-2.3]
6. Security violations logged with context details [Source: docs/tech-spec-epic-2.md#Story-2.3]

**Implementation Files:**
- `lib/files/security.ts` - Core validation functions [Source: docs/tech-spec-epic-2.md#Story-2.3]
- `lib/files/__tests__/security.test.ts` - Unit tests [Source: docs/tech-spec-epic-2.md#Story-2.3]
- Update `lib/files/writer.ts` to use validateWritePath [Source: docs/tech-spec-epic-2.md#Story-2.3]

**Security Testing:**
The tech spec provides comprehensive attack simulation examples (lines 558-602):
- Directory traversal: `../../etc/passwd`, `..\\..\\..\\Windows\\System32`
- Absolute paths: `/etc/passwd`, `C:\\Windows\\System32`
- Null bytes: `file\0.txt`
- Path traversal variations: `.../.../.../`

All attacks must be blocked and logged with security violation details.

### Project Structure Notes

**New Files Created:**
```
/lib/files/
  ├── security.ts          # validatePath(), validateWritePath()
  └── __tests__/
      └── security.test.ts # Security test suite
```

**Modified Files:**
```
/lib/files/
  └── writer.ts           # Update to use validateWritePath()
```

**Alignment with Project Structure:**
- Follows established `/lib/files/` module pattern from Stories 2.1 and 2.2
- Test files in `__tests__/` subdirectory per established convention
- Security module is separate concern, imported by other file operation modules

### Testing Standards Summary

From tech-spec-epic-2.md Testing Strategy section (lines 1185-1296):

**Unit Tests:**
- Target: 70%+ coverage for `/lib` modules
- Focus: Path validation edge cases and security boundary conditions
- Framework: Jest with ts-jest (already configured in project)

**Security Tests:**
- Attack vector testing with known exploit patterns
- Comprehensive logging verification
- Cross-platform path handling verification (Windows and Unix)

**Test Execution:**
```bash
npm test                          # Run all tests
npm test -- lib/files/security    # Run security tests only
```

### References

All technical implementation details and testing approaches extracted from:
- [Source: docs/tech-spec-epic-2.md#Story-2.3 (lines 426-603)]
- [Source: docs/tech-spec-epic-2.md#Testing-Strategy (lines 1185-1296)]

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-03 | 0.1     | Initial draft | Bryan  |

## Dev Agent Record

### Context Reference

- [Story Context 2.3](/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-2.3.xml)

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
