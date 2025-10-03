# Story 2.1: OpenAI SDK Integration & Function Tool Definitions

Status: Done

## Story

As a developer,
I want to integrate the OpenAI SDK and define function tool definitions,
so that agents can execute with OpenAI as the LLM provider using function calling patterns.

## Acceptance Criteria

1. ✅ OpenAI SDK installed and imported (AC-E2-01)
2. ✅ OpenAI client initialized with API key from environment
3. ✅ Function tool definitions created for read_file, write_file, list_files (AC-E2-02)
4. ✅ Tool schemas match OpenAI function calling specification
5. ✅ Client can be imported and used in chat service
6. ✅ Error thrown if OPENAI_API_KEY missing

## Tasks / Subtasks

- [x] Install OpenAI SDK (AC: 1)
  - [x] Run `npm install openai@^4.28.0`
  - [x] Verify package.json updated
- [x] Create OpenAI Client module (AC: 1, 2, 5, 6)
  - [x] Create `lib/openai/client.ts`
  - [x] Implement getOpenAIClient() singleton
  - [x] Add API key validation from environment
  - [x] Add resetOpenAIClient() for testing
  - [x] Export client functions
- [x] Create Function Tool Definitions (AC: 3, 4)
  - [x] Create `lib/openai/function-tools.ts`
  - [x] Define READ_FILE_TOOL schema
  - [x] Define WRITE_FILE_TOOL schema
  - [x] Define LIST_FILES_TOOL schema
  - [x] Export FUNCTION_TOOLS array
- [x] Add OpenAI Types (AC: 4)
  - [x] Add FunctionCall interface to `types/index.ts`
  - [x] Define function call result types
- [x] Update Environment Configuration (AC: 2, 6)
  - [x] Add OPENAI_API_KEY to env validation
  - [x] Add AGENTS_PATH with default './agents'
  - [x] Add OUTPUT_PATH with default './output'
  - [x] Update .env.example
- [x] Write Tests (AC: 1-6)
  - [x] Test OpenAI client initialization
  - [x] Test error when API key missing
  - [x] Test function tool schema validity
  - [x] Verify all tools exported correctly

## Dev Notes

### Architecture Patterns

**OpenAI Integration Design:**
- Singleton pattern for OpenAI client to avoid multiple instances
- Client lazy-initialized on first request
- Environment variable validation at client creation
- Function tools defined as constants following OpenAI specification

**Function Calling Pattern:**
From [tech-spec-epic-2.md#Story 2.1](../tech-spec-epic-2.md):
- Tools define available operations (read_file, write_file, list_files)
- OpenAI decides when to call functions based on conversation
- Backend executes function calls and returns results
- Loop continues until OpenAI generates final text response

**Security Considerations:**
- API key never exposed to frontend
- API key loaded only from environment variables
- Client creation throws error if key missing (fail-fast)

### Project Structure Notes

**New Files Created:**
```
/lib/openai/
  ├── client.ts           # OpenAI SDK client singleton
  └── function-tools.ts   # Tool definitions for function calling
```

**Environment Variables:**
- `OPENAI_API_KEY` (required) - OpenAI API authentication
- `AGENTS_PATH` (default: './agents') - Agent files location
- `OUTPUT_PATH` (default: './output') - Agent output location

**Alignment with Solution Architecture:**
- Follows modular monolith pattern from Section 2.1
- Client module in `/lib/openai` per Section 14 source tree
- Uses Node.js built-in env for configuration per Section 1.1

### Implementation Notes from Tech Spec

From [tech-spec-epic-2.md#Story 2.1: OpenAI SDK Integration & Function Tool Definitions](../tech-spec-epic-2.md):

**OpenAI Client Pattern:**
```typescript
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  }
  return openaiClient
}
```

**Function Tool Schema Structure:**
Each tool follows OpenAI's ChatCompletionTool format:
```typescript
{
  type: 'function',
  function: {
    name: 'tool_name',
    description: 'Clear description for LLM',
    parameters: {
      type: 'object',
      properties: { ... },
      required: [...]
    }
  }
}
```

**Tool Descriptions (from Tech Spec):**
- `read_file`: "Read a file from the agent's instruction folder or output directory"
- `write_file`: "Write content to a file in the output directory"
- `list_files`: "List files and directories in a given path"

### References

- [Source: tech-spec-epic-2.md#Story 2.1](../tech-spec-epic-2.md)
- [Source: epics.md#Story 2.1](../epics.md)
- [Source: solution-architecture.md - Section 1.1: Technology Stack](../solution-architecture.md)
- [Source: solution-architecture.md - Section 4: API Design](../solution-architecture.md)
- [OpenAI Function Calling Documentation](https://platform.openai.com/docs/guides/function-calling)

## Change Log

| Date     | Version | Description   | Author        |
| -------- | ------- | ------------- | ------------- |
| 2025-10-03 | 0.1     | Initial draft | Bryan |
| 2025-10-03 | 1.0     | Implementation complete - OpenAI SDK integration with function tools, all tests passing | Amelia (Dev Agent) |
| 2025-10-03 | 1.1     | Senior Developer Review completed - Approved with advisory recommendations | Amelia (Review Agent) |

## Dev Agent Record

### Context Reference

- [Story Context 2.1](/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-2.1.xml) - Generated 2025-10-03

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

Implementation completed following Story Context and Tech Spec exactly:
- Singleton pattern for OpenAI client with lazy initialization
- Environment validation using existing env.ts pattern
- Function tools follow ChatCompletionTool specification
- Comprehensive test coverage (24 tests, 100% passing)

### Completion Notes List

**Implementation Summary:**
- OpenAI SDK v4.104.0 installed successfully
- Created lib/openai/client.ts with singleton getOpenAIClient() and resetOpenAIClient()
- Created lib/openai/function-tools.ts with READ_FILE_TOOL, WRITE_FILE_TOOL, LIST_FILES_TOOL
- Added FunctionCall and FunctionCallResult interfaces to types/api.ts
- Environment configuration (OPENAI_API_KEY, AGENTS_PATH, OUTPUT_PATH) already present in lib/utils/env.ts
- All 6 acceptance criteria validated and tests passing
- No regressions introduced (all existing unit tests passing)

**Testing:**
- 24 new tests created covering client initialization, singleton behavior, API key validation, and function tool schemas
- All tests passing (lib/openai/__tests__/client.test.ts and function-tools.test.ts)
- Full unit test suite: 40 tests passing, 0 failures

### File List

**Created:**
- lib/openai/client.ts
- lib/openai/function-tools.ts
- lib/openai/index.ts
- lib/openai/__tests__/client.test.ts
- lib/openai/__tests__/function-tools.test.ts

**Modified:**
- package.json (added openai@^4.104.0)
- package-lock.json
- types/api.ts (added FunctionCall, FunctionCallResult interfaces)

---

## Senior Developer Review (AI)

**Reviewer:** Bryan (via Amelia)
**Date:** 2025-10-03
**Model:** claude-sonnet-4-5-20250929
**Outcome:** ✅ **APPROVED**

### Summary

Story 2.1 successfully delivers OpenAI SDK integration with well-defined function tool schemas. Implementation strictly follows the Story Context and Technical Specification, demonstrating disciplined adherence to acceptance criteria. Code quality is high with proper TypeScript usage, comprehensive test coverage (24 tests, 100% passing), and clean architecture using the singleton pattern. No regressions introduced.

**Recommendations provided are advisory** and focus on future-proofing against 2025 OpenAI best practices and security considerations for upcoming stories (2.2-2.3).

### Key Findings

**✅ Strengths:**
- **Architecture:** Singleton pattern correctly implemented with lazy initialization
- **Type Safety:** Full TypeScript with proper OpenAI SDK type imports
- **Error Handling:** Fail-fast validation on missing API key
- **Documentation:** Comprehensive JSDoc comments on all exports
- **Testing:** 24 unit tests covering client initialization, singleton behavior, API key validation, and schema validation
- **Modularity:** Clean separation between client (`client.ts`) and tool definitions (`function-tools.ts`)

**🟡 Medium Priority (Advisory):**
1. **Function Tool Parameter Validation** (`lib/openai/function-tools.ts:17-89`)
   - Tool schemas define string parameters without validation constraints
   - Risk: LLM could generate malformed paths → directory traversal risks in future file executors
   - Recommendation: Add JSON Schema constraints (pattern, maxLength) in Story 2.2/2.3 when implementing file operations

**🟢 Low Priority (Future Considerations):**
2. **OpenAI SDK Version**
   - Installed: `openai@4.104.0` (package.json:15)
   - Tech Spec specified: `^4.28.0`
   - Note: Backward compatible, but consider updating tech spec or using exact spec version

3. **Modern OpenAI Patterns (2025)**
   - Current implementation uses JSON Schema (correct per spec)
   - 2025 best practice: Zod validation for runtime type safety
   - Recommendation: Consider Zod schemas in future stories for function call argument validation

### Acceptance Criteria Coverage

| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| 1 | OpenAI SDK installed and imported | ✅ | `package.json:15`, `client.ts:10` |
| 2 | Client initialized with API key from env | ✅ | `client.ts:27-31` uses `env.OPENAI_API_KEY` |
| 3 | Function tools created (read_file, write_file, list_files) | ✅ | `function-tools.ts:17-89` |
| 4 | Tool schemas match OpenAI spec | ✅ | Correct `ChatCompletionTool` format |
| 5 | Client importable for chat service | ✅ | `lib/openai/index.ts` exports |
| 6 | Error thrown if API key missing | ✅ | Validated in `client.test.ts:41-45` |

**Verdict:** All 6 acceptance criteria fully satisfied ✅

### Test Coverage and Gaps

**Coverage:**
- ✅ **Client Tests** (6 tests in `client.test.ts`):
  - Client instance creation with API key
  - Singleton behavior verification
  - Error handling for missing API key
  - Error handling for empty string API key
  - Reset functionality for test isolation

- ✅ **Function Tool Tests** (18 tests in `function-tools.test.ts`):
  - Schema structure validation for all 3 tools
  - Required parameters verification
  - JSON Schema compliance
  - `FUNCTION_TOOLS` array completeness
  - Type field validation
  - Unique function names

**Test Strategy:**
- Unit tests properly mock environment variables (`process.env.OPENAI_API_KEY`)
- Tests do NOT validate actual OpenAI API connectivity (appropriate for this story scope)
- Proper test isolation with `beforeEach/afterEach` cleanup

**Gaps (Acceptable):**
- No integration tests with live OpenAI API (correctly scoped for Stories 2.2-2.3)
- No validation of function call execution (deferred to function execution engine in Story 2.3)

**Regression Testing:**
- Full unit test suite: 40 tests passing, 0 failures
- No regressions introduced

### Architectural Alignment

**✅ Follows Solution Architecture:**
- Modular monolith pattern: `/lib/openai` module structure (Section 2.1)
- Singleton pattern for OpenAI client (avoids multiple instances)
- Environment configuration using existing `lib/utils/env.ts` pattern
- Lazy initialization pattern (client created on first access)
- Type safety with TypeScript strict mode

**✅ Follows Tech Spec (Epic 2):**
- OpenAI SDK 4.x integrated
- Function tool definitions match specification exactly
- Client initialization pattern from tech spec implemented verbatim
- File structure aligns with planned Epic 2 architecture

**✅ Code Organization:**
```
/lib/openai/
  ├── client.ts           # Singleton OpenAI client
  ├── function-tools.ts   # Tool definitions (read_file, write_file, list_files)
  ├── index.ts            # Clean exports
  └── __tests__/
      ├── client.test.ts
      └── function-tools.test.ts
```

### Security Notes

**✅ Current Implementation:**
1. **API Key Management:**
   - API key never hardcoded ✅
   - Loaded from environment variables only ✅
   - Fail-fast validation at client creation ✅
   - Never exposed in client interface ✅

2. **Test Security:**
   - Test environment properly isolates API key ✅
   - `beforeEach/afterEach` ensures clean state ✅

**⚠️ Future Story Considerations (Not Blocking):**

3. **Path Traversal Protection** (Critical for Stories 2.2-2.3):
   - Function tools accept `path` parameters without validation
   - **Risk:** Directory traversal attacks when file operations are implemented
   - **Action:** Implement path validation in file operation executors (Story 2.2: `lib/files/security.ts`)
   - **Pattern:** Use `path.resolve()` + prefix checking to restrict file access to allowed directories

4. **Input Sanitization** (Story 2.3):
   - Function call arguments will need runtime validation
   - Recommendation: Add Zod schemas for argument parsing

5. **Rate Limiting** (Production):
   - Consider client-side rate limiting for production deployments
   - Not required for MVP

### Best-Practices and References

**2025 OpenAI TypeScript Best Practices:**

1. **OpenAI Agents SDK** (Latest from OpenAI, 2025)
   - New TypeScript-native SDK with built-in guardrails
   - Features: Zod validation, human-in-the-loop approval, automatic schema generation
   - Reference: https://openai.github.io/openai-agents-js/
   - **Note:** Current implementation uses core OpenAI SDK (correct per tech spec). Consider Agents SDK for future epics if advanced features needed.

2. **Function Calling Security**
   - Never blindly execute model-generated function calls (retained control in implementation ✅)
   - Validate all inputs with schemas (partially implemented - schemas defined, runtime validation deferred to Stories 2.2-2.3)
   - Reference: https://platform.openai.com/docs/guides/function-calling

3. **Zod Integration Pattern** (Medium article - Kieron McKenna)
   - GPT can hallucinate bad JSON, wrong types, incorrect field names
   - Zod provides runtime type safety beyond TypeScript compile-time checks
   - Reference: https://kieron-mckenna.medium.com/the-best-way-to-use-open-ai-function-calling-api-in-typescript-5f034b557864

4. **TypeScript + OpenAI SDK 4.x**
   - Current implementation correctly uses `openai/resources/chat/completions` types ✅
   - Singleton pattern appropriate for API client lifecycle ✅
   - Reference: https://github.com/openai/openai-node

### Action Items

**For Story 2.2 (File Operations Implementation):**
1. **[Medium]** Add path validation constraints to function tool schemas
   - File: `lib/openai/function-tools.ts`
   - Add JSON Schema: `pattern: '^[a-zA-Z0-9_./\\-]+$'`, `maxLength: 255`
   - Related ACs: Story 2.2 security requirements

2. **[High]** Implement path security validation in file operation executors
   - File: `lib/files/security.ts` (per tech spec)
   - Use `path.resolve()` + prefix checking
   - Block directory traversal (../, absolute paths outside allowed dirs)
   - Related: Story 2.2 AC on path security

**For Story 2.3 (Function Execution Engine):**
3. **[Medium]** Add Zod schemas for function call argument validation
   - Files: `lib/openai/function-tools.ts` (or new validation module)
   - Validate arguments at runtime before executing file operations
   - Reference: 2025 best practices (Zod integration pattern)

**Epic-Level (Optional):**
4. **[Low]** Align OpenAI SDK version with tech spec
   - Current: `openai@4.104.0`
   - Tech Spec: `openai@^4.28.0`
   - Action: Update tech spec to document actual version OR downgrade to spec version
   - Impact: None (backward compatible)

5. **[Low]** Consider rate limiting for production
   - Add client-side rate limiting wrapper
   - Not required for MVP, but recommended for production deployment

---

**Review Approved:** Implementation is production-ready for Story 2.1 scope. Action items are advisory recommendations for subsequent stories and do not block approval.
