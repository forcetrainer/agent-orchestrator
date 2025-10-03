# Scripts

This directory contains test and utility scripts for the Agent Orchestrator project.

## OpenAI Integration Smoke Test

**File:** `test-openai-smoke.ts`

### Purpose

Validates end-to-end integration of OpenAI SDK with file operation tools (Stories 2.1-2.3). This test ensures that:
- OpenAI client initializes correctly
- Function tool schemas are accepted by the OpenAI API
- Function calling loop executes end-to-end
- File operations integrate properly with OpenAI responses

**This is a critical validation checkpoint before proceeding to Story 2.4 (Agent Discovery).**

### Prerequisites

1. **Environment Variable:** `OPENAI_API_KEY` must be set in `.env.local`
   ```bash
   OPENAI_API_KEY=sk-...your-key...
   ```

2. **Test Data:** The test file `agents/smoke-test/test.md` must exist (created automatically during Story 2.3.5 implementation)

3. **Dependencies:** All project dependencies must be installed (`npm install`)

### Usage

Run the smoke test:
```bash
npm run test:smoke
```

### Expected Output (Success)

```
[smoke-test] Starting OpenAI integration smoke test...

[1/4] Testing OpenAI client initialization...
✓ OpenAI client initialized

[2/4] Testing function tool schema validation...
✓ Function tools accepted by OpenAI API

[3/4] Testing function call execution...
✓ OpenAI requested function: read_file
  Arguments: {"path":"smoke-test/test.md"}
✓ File read successfully (XXX bytes)

[4/4] Testing function execution and result handling...
✓ Function result sent back to OpenAI successfully

[PERFORMANCE] Total test time: X.XXs
✓ Performance target met (< 5s)

[FINAL RESPONSE]
<OpenAI's response about the file content>

============================================================
✅ SMOKE TEST PASSED
============================================================

Stories 2.1-2.3 validated:
  ✓ Story 2.1: OpenAI SDK integration
  ✓ Story 2.2: File operations (read_file)
  ✓ Story 2.3: Path security (validated in file read)

Ready to proceed to Story 2.4 (Agent Discovery)
```

**Exit Code:** 0

### Expected Output (Failure)

```
============================================================
❌ SMOKE TEST FAILED
============================================================

Error: <specific error message>

<stack trace if available>

[PERFORMANCE] Test duration before failure: X.XXs

⚠️  DO NOT PROCEED to Story 2.4 until this smoke test passes

Action items:
  1. Review error message above
  2. Verify OPENAI_API_KEY is set in .env.local
  3. Check that Stories 2.1-2.3 are implemented correctly
  4. Fix issues and re-run: npm run test:smoke
```

**Exit Code:** 1

### What the Test Validates

1. **OpenAI Client Initialization (AC-E2-21)**
   - Validates that `getOpenAIClient()` returns a valid OpenAI instance
   - Confirms OPENAI_API_KEY is set and valid

2. **Function Tool Schema Validation (AC-E2-22)**
   - Sends function tool definitions to OpenAI API
   - Confirms OpenAI accepts the schema format without validation errors

3. **Function Call Execution (AC-E2-23)**
   - Verifies OpenAI requests the `read_file` function
   - Executes `readFileContent()` with the requested path
   - Confirms file read succeeds

4. **Function Result Handling (AC-E2-24)**
   - Sends function execution result back to OpenAI
   - Verifies OpenAI processes the result and returns a final response
   - Confirms final response contains relevant file content

5. **Performance (AC-E2-25)**
   - Measures total execution time from start to finish
   - Validates completion in < 5 seconds
   - Warns if performance target not met (even if test passes)

### Regression Testing

This smoke test should be run:
- **After any changes to Stories 2.1-2.3 implementations**
- **Before proceeding to Story 2.4 and beyond**
- **As part of CI/CD pipeline (recommended)**
- **When debugging OpenAI integration issues**

### Troubleshooting

**Error: "OPENAI_API_KEY environment variable is not set"**
- Solution: Add `OPENAI_API_KEY=sk-...` to `.env.local` file

**Error: "File not found: smoke-test/test.md"**
- Solution: Ensure `agents/smoke-test/test.md` exists or re-run Story 2.3.5 implementation

**Error: "OpenAI did not request any function calls"**
- Possible causes:
  - Function tool schemas malformed (check `lib/openai/function-tools.ts`)
  - OpenAI API changed function calling format
  - Model does not support function calling (should use gpt-3.5-turbo or gpt-4)

**Performance > 5 seconds**
- Possible causes:
  - Slow internet connection
  - OpenAI API latency
  - File I/O issues (unlikely for small test file)
- Note: Test will still pass but performance warning shown

### Cost Considerations

This test uses `gpt-3.5-turbo` to minimize API costs. Each test run makes 2 API calls:
1. Initial request with function tools
2. Follow-up with function result

**Estimated cost per test run:** < $0.01 USD
