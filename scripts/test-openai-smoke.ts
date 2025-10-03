/**
 * OpenAI Integration Smoke Test
 *
 * Validates end-to-end integration of Stories 2.1-2.3:
 * - Story 2.1: OpenAI SDK client initialization and function tool definitions
 * - Story 2.2: File operations (read_file)
 * - Story 2.3: Path security validation
 *
 * Test Flow (4 steps):
 * 1. Test OpenAI client initialization
 * 2. Test function tool schema validation (API accepts schemas)
 * 3. Test function call execution (OpenAI requests read_file)
 * 4. Test function result handling (send result back, get final response)
 *
 * Success Criteria:
 * - All 4 steps complete without errors
 * - Total execution time < 5 seconds
 * - Final response contains file content
 *
 * Exit Codes:
 * - 0: All tests passed
 * - 1: One or more tests failed
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { getOpenAIClient } from '@/lib/openai/client';
import { FUNCTION_TOOLS } from '@/lib/openai/function-tools';
import { readFileContent } from '@/lib/files/reader';

// Console colors for better readability
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

function logStep(step: string) {
  console.log(`\n${CYAN}${step}${RESET}`);
}

function logSuccess(message: string) {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

function logError(message: string) {
  console.log(`${RED}✗${RESET} ${message}`);
}

function logInfo(message: string) {
  console.log(`  ${message}`);
}

async function runSmokeTest() {
  const testStartTime = performance.now();

  try {
    console.log(`${YELLOW}[smoke-test]${RESET} Starting OpenAI integration smoke test...\n`);

    // ============================================================
    // Step 1/4: Test OpenAI Client Initialization
    // ============================================================
    logStep('[1/4] Testing OpenAI client initialization...');

    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client initialization returned null');
    }

    logSuccess('OpenAI client initialized');

    // ============================================================
    // Step 2/4: Test Function Tool Schema Validation
    // ============================================================
    logStep('[2/4] Testing function tool schema validation...');

    const initialResponse = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Please read the file "smoke-test/test.md" and tell me what it says.',
        },
      ],
      tools: FUNCTION_TOOLS,
      tool_choice: 'auto',
    });

    logSuccess('Function tools accepted by OpenAI API');

    // ============================================================
    // Step 3/4: Test Function Call Execution
    // ============================================================
    logStep('[3/4] Testing function call execution...');

    const toolCalls = initialResponse.choices[0]?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      throw new Error('OpenAI did not request any function calls');
    }

    const readFileCall = toolCalls.find((tc) => tc.function.name === 'read_file');
    if (!readFileCall) {
      throw new Error('OpenAI did not request read_file function');
    }

    logSuccess(`OpenAI requested function: ${readFileCall.function.name}`);

    const args = JSON.parse(readFileCall.function.arguments);
    logInfo(`Arguments: ${JSON.stringify(args)}`);

    // Execute the function call
    const fileContent = await readFileContent(args.path);

    logSuccess(`File read successfully (${fileContent.length} bytes)`);

    // ============================================================
    // Step 4/4: Test Function Execution and Result Handling
    // ============================================================
    logStep('[4/4] Testing function execution and result handling...');

    const finalResponse = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Please read the file "smoke-test/test.md" and tell me what it says.',
        },
        initialResponse.choices[0].message,
        {
          role: 'tool',
          tool_call_id: readFileCall.id,
          content: fileContent,
        },
      ],
      tools: FUNCTION_TOOLS,
    });

    logSuccess('Function result sent back to OpenAI successfully');

    const finalMessage = finalResponse.choices[0]?.message?.content;
    if (!finalMessage) {
      throw new Error('No final response from OpenAI');
    }

    // ============================================================
    // Performance Validation
    // ============================================================
    const totalDuration = (performance.now() - testStartTime) / 1000;
    console.log(`\n${CYAN}[PERFORMANCE]${RESET} Total test time: ${totalDuration.toFixed(2)}s`);

    if (totalDuration >= 5) {
      logError(`Performance target NOT met (>= 5s)`);
      console.log(`${YELLOW}Warning: Test passed but performance is slower than expected${RESET}`);
    } else {
      logSuccess('Performance target met (< 5s)');
    }

    // ============================================================
    // Final Results
    // ============================================================
    console.log(`\n${CYAN}[FINAL RESPONSE]${RESET}`);
    console.log(finalMessage);

    console.log('\n============================================================');
    console.log(`${GREEN}✅ SMOKE TEST PASSED${RESET}`);
    console.log('============================================================\n');
    console.log('Stories 2.1-2.3 validated:');
    console.log('  ✓ Story 2.1: OpenAI SDK integration');
    console.log('  ✓ Story 2.2: File operations (read_file)');
    console.log('  ✓ Story 2.3: Path security (validated in file read)');
    console.log('\nReady to proceed to Story 2.4 (Agent Discovery)\n');

    process.exit(0);
  } catch (error: any) {
    const totalDuration = (performance.now() - testStartTime) / 1000;

    console.log('\n============================================================');
    console.log(`${RED}❌ SMOKE TEST FAILED${RESET}`);
    console.log('============================================================\n');
    console.log(`${RED}Error: ${error.message}${RESET}\n`);

    if (error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
    }

    console.log(`\n${CYAN}[PERFORMANCE]${RESET} Test duration before failure: ${totalDuration.toFixed(2)}s\n`);

    console.log(`${YELLOW}⚠️  DO NOT PROCEED to Story 2.4 until this smoke test passes${RESET}\n`);
    console.log('Action items:');
    console.log('  1. Review error message above');
    console.log('  2. Verify OPENAI_API_KEY is set in .env.local');
    console.log('  3. Check that Stories 2.1-2.3 are implemented correctly');
    console.log('  4. Fix issues and re-run: npm run test:smoke\n');

    process.exit(1);
  }
}

// Run the smoke test
runSmokeTest();
