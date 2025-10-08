# Story 6.5: Context-Aware File Naming Validation

Status: Complete

## Story

As an agent builder,
I want agents to use descriptive file names,
so that users can identify files without opening them.

## Acceptance Criteria

1. Backend validates filenames in `write_file()` tool call
2. Generic patterns rejected: `output.md`, `output-2.md`, `result.txt`, `file.txt`, `untitled.md`
3. Error message returned to agent: "Generic filename not allowed. Use descriptive name (e.g., 'procurement-request.md')"
4. System prompt updated with filename guidelines (examples of good/bad names)
5. Validation allows descriptive names: `procurement-request.md`, `budget-analysis-q3.csv`, `approval-checklist.md`
6. Path traversal prevention (no `../`, special chars)
7. Filename sanitization (kebab-case recommended but not enforced)

## Tasks / Subtasks

- [x] Task 1: Implement filename validation utility (AC: #1, #2, #5, #6, #7)
  - [x] Create `lib/files/filenameValidator.ts` module
  - [x] Define regex patterns for generic filenames: `/^output(-\d+)?\.md$/`, `/^result\./`, `/^file\d*\./`, `/^untitled/`, `/^document\d*\./`
  - [x] Implement `validateFilename(filename: string)` function
  - [x] Check against generic patterns - throw error with helpful message if matched
  - [x] Check for path traversal (`../`, `/`, `\`) - throw error if found
  - [x] Check for special characters (`<>:"|?*`) - throw error with list of invalid chars
  - [x] Allow descriptive names (any string not matching generic patterns or security issues)
  - [x] Return validated filename (no modifications needed for MVP)
  - [x] Write unit tests covering all validation rules and edge cases

- [x] Task 2: Integrate validation into write_file tool (AC: #1, #3)
  - [x] Modify `lib/tools/fileOperations.ts` -> `save_output` function
  - [x] Call `validateFilename()` before writing file
  - [x] Catch validation errors and format as tool error response
  - [x] Error response format: `{ success: false, error: "Generic filename 'output.md' not allowed. Use descriptive name (e.g., 'procurement-request.md')" }`
  - [x] Ensure error message is returned to OpenAI (agent sees it and can retry)
  - [x] Write integration tests for save_output with invalid filenames

- [x] Task 3: Update system prompt with filename guidelines (AC: #4)
  - [x] Modify `lib/agents/systemPromptBuilder.ts`
  - [x] Add FILE_NAMING_GUIDELINES constant with rules and examples
  - [x] Include in system prompt for all agents
  - [x] Guidelines should be clear, concise, with ✅/❌ examples
  - [x] Emphasize: Use kebab-case, include purpose/context, standard extensions
  - [x] Test that agents receive and follow guidelines in practice

- [x] Task 4: Add descriptive error messages (AC: #3)
  - [x] Ensure each validation error provides helpful guidance
  - [x] Generic filename error: Show examples of good alternatives
  - [x] Path traversal error: Explain filename cannot contain path separators
  - [x] Special chars error: List which characters are not allowed
  - [x] Format errors consistently for agent parsing

- [x] Task 5: Testing and validation (All ACs)
  - [x] Unit tests for validateFilename() covering all patterns
  - [x] Integration tests for save_output with validation
  - [x] E2E test: Agent tries generic filename → receives error → retries with descriptive name (covered in integration tests)
  - [x] Test that descriptive names pass validation
  - [x] Test path traversal prevention (security)
  - [x] Test special character blocking
  - [x] Verify error messages are helpful and actionable

## Dev Notes

### Validation Strategy

**Extension Pattern (Not Replacement):**
- Adds validation layer to existing write_file tool
- Does not change tool signature or behavior (only adds validation)
- Backward compatible: Existing descriptive filenames continue to work
- Forward compatible: Can add more sophisticated validation later

**Generic Filename Patterns:**
```typescript
const GENERIC_PATTERNS = [
  /^output(-\d+)?\.md$/i,      // output.md, output-1.md, output-2.md
  /^result(-\d+)?\.txt$/i,      // result.txt, result-1.txt
  /^file\d*\./i,                // file.txt, file1.md, file2.csv
  /^untitled/i,                 // untitled.md, untitled-document.txt
  /^document\d*\./i             // document.md, document1.txt
];
```

**Validation Rules Priority:**
1. **Security first:** Path traversal and special chars (hard block)
2. **Generic patterns:** Block obviously meaningless names
3. **Descriptive names:** Allow everything else (permissive approach)

**Error Message Format:**
```typescript
// Generic filename error
{
  success: false,
  error: "Generic filename 'output.md' not allowed. Use descriptive name (e.g., 'procurement-request.md')"
}

// Path traversal error
{
  success: false,
  error: "Filename cannot contain path separators or '..'"
}

// Special chars error
{
  success: false,
  error: "Filename contains invalid characters: < > : \" | ? *"
}
```

### System Prompt Guidelines

**FILE_NAMING_GUIDELINES (to be added to system prompt):**
```
CRITICAL: When writing files, use descriptive filenames based on content/purpose.

Rules:
- Use kebab-case (lowercase with hyphens)
- Include purpose or content type
- Add context if helpful (dates, departments, etc.)
- Keep under 50 characters
- Use standard extensions (.md, .csv, .txt, .json)

Examples:
✅ GOOD:
  - procurement-request.md (describes what it is)
  - budget-analysis-q3.csv (purpose + context)
  - approval-checklist.md (function-based)
  - software-license-quote.md

❌ BAD (will be rejected):
  - output.md (too generic)
  - file.txt (meaningless)
  - result-2.md (numbered generic)
  - untitled.md (lazy naming)
```

### Source Tree Components

**New Files:**
- `lib/files/filenameValidator.ts` - Validation logic and regex patterns
- `lib/files/__tests__/filenameValidator.test.ts` - Unit tests for validation

**Modified Files:**
- `lib/tools/fileOperations.ts` - Integrate validateFilename() into write_file tool
- `lib/agents/systemPromptBuilder.ts` - Add FILE_NAMING_GUIDELINES to system prompt

**No Changes Needed:**
- read_file tool - no validation needed for reading
- list_files tool - only lists existing files
- API routes - validation happens at tool level

### Testing Standards

**Unit Tests (filenameValidator.test.ts):**
- Test each generic pattern rejects correctly
- Test descriptive names pass validation
- Test path traversal prevention (../etc/passwd, ..\\windows\\system32)
- Test special character blocking
- Test edge cases (empty string, very long names, unicode)

**Integration Tests (fileOperations.test.ts):**
- write_file with generic filename → error returned
- write_file with descriptive filename → success
- Error message format verification
- Agent receives error and can retry

**E2E Tests:**
- Agent workflow attempts to write generic filename
- Agent receives error with examples
- Agent retries with descriptive filename
- File written successfully with good name

### Project Structure Notes

**Alignment with Epic 6:**
- Follows tech-spec-epic-6.md Section 3: "Context-Aware File Naming"
- Implements validation at tool level (before file system write)
- Error messages guide agents to better naming (educational approach)
- Permissive validation (only blocks obviously bad names)

**Dependencies:**
- Epic 4 complete (write_file tool exists and functional)
- Story 4.5 (File operation tools refactored for agentic loop)
- No frontend changes needed (backend validation only)

**Security Considerations:**
- Path traversal prevention is security-critical (blocks ../, /, \)
- Special character blocking prevents OS-level issues
- Validation happens before any file system interaction
- Errors don't leak sensitive path information

### References

**Primary Sources:**
- [Source: docs/tech-spec-epic-6.md#3. Context-Aware File Naming] - Validation logic and patterns
- [Source: docs/epics.md#Story 6.5] - Acceptance criteria
- [Source: lib/tools/fileOperations.ts] - Existing write_file implementation to extend

**Technical References:**
- [Source: docs/tech-spec-epic-6.md:604-690] - Complete validation implementation
- [Source: docs/tech-spec-epic-6.md:647-680] - System prompt guidelines

**Related Stories:**
- Story 4.5 (File Operation Tools) - write_file tool to enhance
- Story 5.0 (Session-Based Output Management) - File writing context
- Story 6.6 (File Reference Attachments) - Files created with good names are easier to reference

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-08 | 0.1     | Initial draft | Bryan  |

## Dev Agent Record

### Context Reference

- [Story Context 6.5](/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-6.5.xml) - Generated 2025-10-08

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

**Implementation Summary:**

All acceptance criteria successfully implemented with comprehensive test coverage (77 tests, all passing).

**Key Deliverables:**

1. **Filename Validator Module** (`lib/files/filenameValidator.ts`)
   - Validates filenames against generic patterns (output.md, result.txt, file.txt, untitled.md, document.md)
   - Prevents path traversal attempts (../, /, \)
   - Blocks special characters (<>:"|?*)
   - Educational error messages with ✅/❌ examples
   - Permissive approach: only blocks obviously bad names
   - Helper functions: `validateFilename()`, `isValidFilename()`, `getValidationError()`

2. **Integration with save_output Tool** (`lib/tools/fileOperations.ts`)
   - Validation happens before path resolution (early detection)
   - Extracts filename using `basename()` for validation
   - Returns ToolResult with helpful error messages
   - Agent receives error and can retry with better filename

3. **System Prompt Enhancement** (`lib/agents/systemPromptBuilder.ts`)
   - Added FILE_NAMING_REQUIREMENTS section with clear rules
   - Examples of good (✅) and bad (❌) filenames
   - Proactive guidance to reduce error/retry cycles
   - Emphasizes kebab-case but doesn't enforce (AC #7)

4. **Test Coverage**
   - **Unit tests** (56 tests): `lib/files/__tests__/filenameValidator.test.ts`
     - All generic patterns tested and rejected
     - Descriptive names accepted
     - Security validations (path traversal, special chars)
     - Edge cases (empty, whitespace, long names, unicode)
   - **Integration tests** (21 tests): `lib/tools/__tests__/fileOperations.test.ts`
     - save_output with generic filenames rejected
     - save_output with descriptive filenames succeed
     - Error message quality validation
     - ToolResult format verification

**Validation Strategy:**

Security-first validation order:
1. Path traversal check (../, /, \) - hard block
2. Special characters (<>:"|?*) - hard block
3. Generic patterns (output.md, result.txt) - block with examples
4. Allow everything else (permissive)

**Test Results:**
- ✅ 56 unit tests passed
- ✅ 21 integration tests passed
- ✅ All 7 acceptance criteria verified
- ✅ No existing tests broken

**Architecture Notes:**
- Validation at tool level (before file system interaction)
- Pure functions (no side effects, easily testable)
- Modular design (validator can be reused by other tools)
- Educational error messages guide agents to better naming
- Two-pronged approach: proactive (system prompt) + reactive (validation errors)

### File List

**New Files:**
- `lib/files/filenameValidator.ts` - Core validation logic
- `lib/files/__tests__/filenameValidator.test.ts` - Unit tests (56 tests)
- `lib/tools/__tests__/fileOperations.test.ts` - Integration tests (21 tests)

**Modified Files:**
- `lib/tools/fileOperations.ts` - Added filename validation to save_output tool (lines 19, 147-156)
- `lib/agents/systemPromptBuilder.ts` - Added FILE_NAMING_REQUIREMENTS to system prompt (lines 134-157)
