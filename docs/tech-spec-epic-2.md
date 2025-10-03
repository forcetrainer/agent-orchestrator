# Tech Spec: Epic 2 - OpenAI Integration with File Operations

**Epic:** OpenAI Integration with File Operations
**Stories:** 2.1 - 2.6 (7 stories: 2.1, 2.2, 2.3, 2.3.5, 2.4, 2.5, 2.6)
**Dependencies:** Epic 1 (Backend Foundation)
**Estimated Effort:** 2-3 days (includes 1hr smoke test in 2.3.5)

---

## Epic Overview

Implement the core OpenAI integration layer that enables BMAD agents to execute via OpenAI's API using function calling patterns. This epic validates the fundamental hypothesis: BMAD's file-based, lazy-loading agent architecture can work seamlessly with OpenAI's function calling mechanism.

**Success Criteria:**
- OpenAI SDK integrated and function calling working
- File operation tools (read_file, write_file, list_files) implemented
- Path security prevents directory traversal attacks
- Agents load from file system with lazy-loading pattern
- Chat API route executes function calling loop
- Conversation state maintained in memory

---

## Architecture Extract

### Technology Stack (for this Epic)

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| AI SDK | openai | ^4.28.0 | OpenAI API client with function calling |
| Framework | Next.js | 14.2.0 | API routes (from Epic 1) |
| Language | TypeScript | ^5 | Type safety |
| File I/O | Node.js fs/promises | Built-in | Async file operations |
| Security | Node.js path | Built-in | Path validation |
| IDs | Node.js crypto | Built-in | UUID generation |

### Relevant Components

**File Structure for Epic 2:**
```
/lib/
  ├── openai/
  │   ├── client.ts           # OpenAI SDK client
  │   ├── chat.ts             # Chat service with function calling
  │   └── function-tools.ts   # Tool definitions
  ├── files/
  │   ├── reader.ts           # read_file implementation
  │   ├── writer.ts           # write_file implementation
  │   ├── lister.ts           # list_files implementation
  │   └── security.ts         # Path validation
  ├── agents/
  │   ├── loader.ts           # Agent discovery
  │   └── parser.ts           # Agent.md parsing
  └── utils/
      └── conversations.ts    # Conversation state
/types/
  └── index.ts                # Add OpenAI-specific types
```

**Key Data Models:**

```typescript
interface Agent {
  id: string
  name: string
  description: string
  path: string
  mainFile: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  functionCalls?: FunctionCall[]
}

interface Conversation {
  id: string
  agentId: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: FileNode[]
}
```

---

## Story-by-Story Implementation Guide

### Story 2.1: OpenAI SDK Integration & Function Tool Definitions

**Acceptance Criteria:**
1. ✅ OpenAI SDK installed and imported (AC-E2-01)
2. ✅ OpenAI client initialized with API key from environment
3. ✅ Function tool definitions created for read_file, write_file, list_files (AC-E2-02)
4. ✅ Tool schemas match OpenAI function calling specification
5. ✅ Client can be imported and used in chat service
6. ✅ Error thrown if OPENAI_API_KEY missing

**Implementation Steps:**

1. **Install OpenAI SDK:**
```bash
npm install openai@^4.28.0
```

2. **Create OpenAI Client (`lib/openai/client.ts`):**
```typescript
import OpenAI from 'openai'
import { env } from '@/lib/utils'

let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  }

  return openaiClient
}

// Export for testing
export function resetOpenAIClient() {
  openaiClient = null
}
```

3. **Create Function Tools (`lib/openai/function-tools.ts`):**
```typescript
import { ChatCompletionTool } from 'openai/resources/chat/completions'

export const READ_FILE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'read_file',
    description: 'Read a file from the agent\'s instruction folder or output directory. Use this to load agent instructions, workflows, templates, or previously generated outputs.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative file path (e.g., \'workflows/process.md\' or \'output/report.txt\')',
        },
      },
      required: ['path'],
    },
  },
}

export const WRITE_FILE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'write_file',
    description: 'Write content to a file in the output directory. Parent directories are created automatically if they don\'t exist. Use this to generate documents, reports, or any agent outputs.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative file path in output directory (e.g., \'reports/summary.md\')',
        },
        content: {
          type: 'string',
          description: 'File contents to write',
        },
      },
      required: ['path', 'content'],
    },
  },
}

export const LIST_FILES_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'list_files',
    description: 'List files and directories in a given path. Use this to discover available agent instructions or check what outputs exist.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list (e.g., \'workflows\' or \'output\')',
        },
        recursive: {
          type: 'boolean',
          description: 'Include subdirectories recursively (default: false)',
        },
      },
      required: ['path'],
    },
  },
}

export const FUNCTION_TOOLS = [
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  LIST_FILES_TOOL,
]
```

4. **Add OpenAI Types to Types (`types/index.ts`):**
```typescript
// Add to existing types
export interface FunctionCall {
  name: 'read_file' | 'write_file' | 'list_files'
  arguments: Record<string, any>
  result?: any
  error?: string
}
```

**Testing:**
```bash
# Verify import works
node -e "const { getOpenAIClient } = require('./lib/openai/client'); console.log('✓ Client imported')"

# Test with missing API key
unset OPENAI_API_KEY
node -e "const { getOpenAIClient } = require('./lib/openai/client'); getOpenAIClient()"
# Should throw error

# Test with valid API key
export OPENAI_API_KEY=sk-test...
node -e "const { getOpenAIClient } = require('./lib/openai/client'); const client = getOpenAIClient(); console.log('✓ Client created:', client.constructor.name)"
```

---

### Story 2.2: File Operation Tools Implementation

**Acceptance Criteria:**
1. ✅ read_file() reads files from agents and output folders (AC-E2-04)
2. ✅ write_file() writes files to output folder with auto-mkdir (AC-E2-05)
3. ✅ list_files() returns directory contents as FileNode array (AC-E2-06)
4. ✅ All operations complete in < 100ms for files under 1MB
5. ✅ Errors handled gracefully (ENOENT, EACCES, ENOSPC)
6. ✅ File operations use async/await with fs/promises

**Implementation Steps:**

1. **Create File Reader (`lib/files/reader.ts`):**
```typescript
import { readFile } from 'fs/promises'
import { join } from 'path'
import { validatePath } from './security'
import { env } from '@/lib/utils'

export async function readFileContent(relativePath: string): Promise<string> {
  try {
    // Try agents folder first
    const agentsPath = validatePath(relativePath, env.AGENTS_PATH)
    try {
      const content = await readFile(agentsPath, 'utf-8')
      console.log(`[read_file] Read from agents: ${relativePath} (${content.length} bytes)`)
      return content
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }

    // Try output folder
    const outputPath = validatePath(relativePath, env.OUTPUT_PATH)
    const content = await readFile(outputPath, 'utf-8')
    console.log(`[read_file] Read from output: ${relativePath} (${content.length} bytes)`)
    return content
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${relativePath}`)
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied: ${relativePath}`)
    } else {
      throw new Error(`Failed to read file: ${error.message}`)
    }
  }
}
```

2. **Create File Writer (`lib/files/writer.ts`):**
```typescript
import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { validatePath } from './security'
import { env } from '@/lib/utils'

export async function writeFileContent(
  relativePath: string,
  content: string
): Promise<void> {
  try {
    // Validate path is in output folder
    const fullPath = validatePath(relativePath, env.OUTPUT_PATH)

    // Create parent directories if needed
    const dir = dirname(fullPath)
    await mkdir(dir, { recursive: true })

    // Write file
    await writeFile(fullPath, content, 'utf-8')
    console.log(`[write_file] Wrote to output: ${relativePath} (${content.length} bytes)`)
  } catch (error: any) {
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: ${relativePath}`)
    } else if (error.code === 'ENOSPC') {
      throw new Error(`Disk full: Cannot write ${relativePath}`)
    } else {
      throw new Error(`Failed to write file: ${error.message}`)
    }
  }
}
```

3. **Create File Lister (`lib/files/lister.ts`):**
```typescript
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { validatePath } from './security'
import { env } from '@/lib/utils'
import type { FileNode } from '@/types'

export async function listFiles(
  relativePath: string,
  recursive: boolean = false
): Promise<FileNode[]> {
  try {
    // Try agents folder first, then output
    let basePath: string
    try {
      basePath = validatePath(relativePath, env.AGENTS_PATH)
    } catch {
      basePath = validatePath(relativePath, env.OUTPUT_PATH)
    }

    const entries = await readdir(basePath)
    const nodes: FileNode[] = []

    for (const entry of entries) {
      const fullPath = join(basePath, entry)
      const stats = await stat(fullPath)
      const node: FileNode = {
        name: entry,
        path: join(relativePath, entry),
        type: stats.isDirectory() ? 'directory' : 'file',
      }

      if (stats.isFile()) {
        node.size = stats.size
      }

      if (recursive && stats.isDirectory()) {
        node.children = await listFiles(node.path, true)
      }

      nodes.push(node)
    }

    console.log(`[list_files] Listed ${relativePath}: ${nodes.length} entries`)
    return nodes
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${relativePath}`)
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied: ${relativePath}`)
    } else {
      throw new Error(`Failed to list files: ${error.message}`)
    }
  }
}
```

4. **Update Environment Config (`lib/utils/env.ts`):**
```typescript
// Add to existing env object
export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  AGENTS_PATH: process.env.AGENTS_PATH || './agents',
  OUTPUT_PATH: process.env.OUTPUT_PATH || './output',
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const
```

**Testing:**
```bash
# Create test files
mkdir -p agents/test-agent
echo "# Test Agent" > agents/test-agent/agent.md
mkdir -p output
echo "Test output" > output/test.txt

# Test read_file
node -e "
const { readFileContent } = require('./lib/files/reader');
readFileContent('test-agent/agent.md').then(console.log);
"

# Test write_file
node -e "
const { writeFileContent } = require('./lib/files/writer');
writeFileContent('test-folder/test.md', '# Test').then(() => console.log('✓ Written'));
"

# Test list_files
node -e "
const { listFiles } = require('./lib/files/lister');
listFiles('test-agent').then(files => console.log('✓ Files:', files.length));
"
```

---

### Story 2.3: Path Security & Validation

**Acceptance Criteria:**
1. ✅ Directory traversal attacks prevented (../, absolute paths) (AC-E2-07)
2. ✅ Writes to agents folder rejected with 403 (AC-E2-08)
3. ✅ Writes to output folder allowed (AC-E2-09)
4. ✅ Symbolic links resolved and validated
5. ✅ Path normalization handles Windows and Unix paths
6. ✅ Security violations logged with details

**Implementation Steps:**

1. **Create Path Security (`lib/files/security.ts`):**
```typescript
import { resolve, normalize, isAbsolute } from 'path'

export function validatePath(relativePath: string, baseDir: string): string {
  // Reject null bytes
  if (relativePath.includes('\0')) {
    const error = new Error('Path contains null bytes (security violation)')
    console.error('[security] Path validation failed:', { relativePath, reason: 'null bytes' })
    throw error
  }

  // Normalize path (handles .., ., //)
  const normalizedPath = normalize(relativePath)

  // Reject absolute paths
  if (isAbsolute(normalizedPath)) {
    const error = new Error('Absolute paths not allowed (security violation)')
    console.error('[security] Path validation failed:', { relativePath, reason: 'absolute path' })
    throw error
  }

  // Resolve to absolute path
  const fullPath = resolve(baseDir, normalizedPath)
  const resolvedBase = resolve(baseDir)

  // Ensure resolved path is within base directory
  if (!fullPath.startsWith(resolvedBase + '/') && fullPath !== resolvedBase) {
    const error = new Error('Path escapes base directory (security violation)')
    console.error('[security] Path validation failed:', {
      relativePath,
      fullPath,
      baseDir: resolvedBase,
      reason: 'directory traversal'
    })
    throw error
  }

  return fullPath
}

export function validateWritePath(relativePath: string): string {
  const { env } = require('@/lib/utils')

  // Check if attempting to write to agents folder
  try {
    const agentsPath = validatePath(relativePath, env.AGENTS_PATH)
    // If we got here, path is in agents folder - reject
    const error = new Error('Cannot write to agents folder (read-only)')
    console.error('[security] Write validation failed:', {
      relativePath,
      reason: 'agents folder is read-only'
    })
    throw error
  } catch (error: any) {
    // If it's not in agents folder, that's good - continue
    if (!error.message.includes('read-only')) {
      // Some other validation error - propagate it
      throw error
    }
  }

  // Validate path is in output folder
  return validatePath(relativePath, env.OUTPUT_PATH)
}
```

2. **Update File Writer to Use Write Validation:**
```typescript
// In lib/files/writer.ts, replace validatePath call:
import { validateWritePath } from './security'

export async function writeFileContent(
  relativePath: string,
  content: string
): Promise<void> {
  try {
    // Validate path is in output folder and not agents folder
    const fullPath = validateWritePath(relativePath)

    // ... rest of implementation
  }
}
```

3. **Create Security Tests (`lib/files/__tests__/security.test.ts`):**
```typescript
import { validatePath } from '../security'

describe('Path Security', () => {
  const baseDir = '/base'

  test('rejects directory traversal with ../', () => {
    expect(() => validatePath('../etc/passwd', baseDir))
      .toThrow('Path escapes base directory')
  })

  test('rejects absolute paths', () => {
    expect(() => validatePath('/etc/passwd', baseDir))
      .toThrow('Absolute paths not allowed')
  })

  test('rejects null bytes', () => {
    expect(() => validatePath('file\0.txt', baseDir))
      .toThrow('Path contains null bytes')
  })

  test('allows valid relative paths', () => {
    const result = validatePath('folder/file.txt', baseDir)
    expect(result).toBe('/base/folder/file.txt')
  })

  test('normalizes paths with .', () => {
    const result = validatePath('./folder/./file.txt', baseDir)
    expect(result).toBe('/base/folder/file.txt')
  })
})
```

**Testing (Security Attack Simulation):**
```bash
# Test directory traversal
node -e "
const { validatePath } = require('./lib/files/security');
try {
  validatePath('../../etc/passwd', './agents');
  console.log('✗ SECURITY FAIL: Traversal allowed');
} catch (e) {
  console.log('✓ SECURITY PASS:', e.message);
}
"

# Test absolute path
node -e "
const { validatePath } = require('./lib/files/security');
try {
  validatePath('/etc/passwd', './agents');
  console.log('✗ SECURITY FAIL: Absolute path allowed');
} catch (e) {
  console.log('✓ SECURITY PASS:', e.message);
}
"

# Test write to agents folder
node -e "
const { validateWritePath } = require('./lib/files/security');
try {
  validateWritePath('test-agent/malicious.md');
  console.log('✗ SECURITY FAIL: Write to agents allowed');
} catch (e) {
  console.log('✓ SECURITY PASS:', e.message);
}
"

# Test write to output folder
node -e "
const { validateWritePath } = require('./lib/files/security');
try {
  const path = validateWritePath('reports/test.md');
  console.log('✓ SECURITY PASS: Write to output allowed:', path);
} catch (e) {
  console.log('✗ SECURITY FAIL:', e.message);
}
"
```

---

### Story 2.3.5: OpenAI Integration Smoke Test

**Purpose:** Risk mitigation story to validate that Stories 2.1-2.3 integrate correctly with OpenAI's API before building additional layers (agent discovery, conversation state). This prevents costly rework if function tool schemas or SDK integration have issues.

**Acceptance Criteria:**
1. ✅ OpenAI API connection succeeds with valid API key (AC-E2-21)
2. ✅ Function tool schemas accepted by OpenAI (no validation errors) (AC-E2-22)
3. ✅ At least one function call executes successfully (read_file) (AC-E2-23)
4. ✅ Function execution result returns to OpenAI correctly (AC-E2-24)
5. ✅ Test completes in < 5 seconds (validates performance) (AC-E2-25)
6. ✅ Test script documented for future regression testing (AC-E2-26)

**Implementation Steps:**

1. **Create Test Data:**
```bash
# Create test file for read_file function
mkdir -p agents/smoke-test
cat > agents/smoke-test/test.md << 'EOF'
# Smoke Test File

This file is used to validate OpenAI integration.
EOF
```

2. **Create Smoke Test Script (`scripts/test-openai-smoke.ts`):**
```typescript
import { getOpenAIClient } from '@/lib/openai/client'
import { FUNCTION_TOOLS } from '@/lib/openai/function-tools'
import { readFileContent } from '@/lib/files/reader'

/**
 * Smoke test to validate OpenAI integration (Stories 2.1-2.3)
 *
 * This test validates:
 * - OpenAI SDK connection works
 * - Function tool schemas are accepted
 * - Function calling executes correctly
 * - Results return to OpenAI properly
 */
async function smokeTest() {
  console.log('[smoke-test] Starting OpenAI integration smoke test...\n')
  const startTime = performance.now()

  try {
    // Step 1: Validate client connection
    console.log('[1/4] Testing OpenAI client initialization...')
    const client = getOpenAIClient()
    console.log('✓ OpenAI client initialized\n')

    // Step 2: Make initial API call with function tools
    console.log('[2/4] Testing function tool schema validation...')
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use cheaper model for testing
      messages: [
        {
          role: 'user',
          content: 'Please use the read_file function to read the file "smoke-test/test.md" and tell me what it says.'
        }
      ],
      tools: FUNCTION_TOOLS,
      tool_choice: 'auto',
    })

    const choice = response.choices[0]
    if (!choice) {
      throw new Error('No response from OpenAI')
    }

    console.log('✓ Function tools accepted by OpenAI API\n')

    // Step 3: Validate function call was requested
    console.log('[3/4] Testing function call execution...')
    const message = choice.message

    if (!message.tool_calls || message.tool_calls.length === 0) {
      throw new Error('OpenAI did not request any tool calls (expected read_file)')
    }

    const toolCall = message.tool_calls[0]
    console.log(`✓ OpenAI requested function: ${toolCall.function.name}`)

    // Step 4: Execute function and validate result
    const functionArgs = JSON.parse(toolCall.function.arguments)
    console.log(`  Arguments: ${JSON.stringify(functionArgs)}\n`)

    if (toolCall.function.name !== 'read_file') {
      throw new Error(`Expected read_file, got ${toolCall.function.name}`)
    }

    console.log('[4/4] Testing function execution and result handling...')
    const fileContent = await readFileContent(functionArgs.path)
    console.log(`✓ File read successfully (${fileContent.length} bytes)`)

    // Send result back to OpenAI to complete the loop
    const finalResponse = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Please read smoke-test/test.md' },
        message,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: fileContent,
        }
      ],
      tools: FUNCTION_TOOLS,
    })

    console.log('✓ Function result sent back to OpenAI successfully\n')

    // Performance validation
    const duration = performance.now() - startTime
    console.log(`[PERFORMANCE] Total test time: ${(duration / 1000).toFixed(2)}s`)

    if (duration > 5000) {
      console.warn('⚠ WARNING: Test exceeded 5 second target')
    } else {
      console.log('✓ Performance target met (< 5s)\n')
    }

    // Final response
    const finalChoice = finalResponse.choices[0]
    console.log('[FINAL RESPONSE]')
    console.log(finalChoice.message.content)
    console.log('\n' + '='.repeat(60))
    console.log('✅ SMOKE TEST PASSED')
    console.log('='.repeat(60))
    console.log('\nStories 2.1-2.3 validated:')
    console.log('  ✓ Story 2.1: OpenAI SDK integration')
    console.log('  ✓ Story 2.2: File operations (read_file)')
    console.log('  ✓ Story 2.3: Path security (validated in file read)')
    console.log('\nReady to proceed to Story 2.4 (Agent Discovery)\n')

  } catch (error: any) {
    const duration = performance.now() - startTime
    console.error('\n' + '='.repeat(60))
    console.error('❌ SMOKE TEST FAILED')
    console.error('='.repeat(60))
    console.error(`\nError: ${error.message}`)
    console.error(`\nTest duration: ${(duration / 1000).toFixed(2)}s`)
    console.error('\n⚠ DO NOT PROCEED to Story 2.4 until this test passes')
    console.error('Review Stories 2.1-2.3 implementation\n')
    process.exit(1)
  }
}

// Run smoke test
smokeTest()
```

3. **Add Test Script to package.json:**
```json
{
  "scripts": {
    "test:smoke": "tsx scripts/test-openai-smoke.ts"
  }
}
```

4. **Create Test Documentation (`scripts/README.md`):**
```markdown
# OpenAI Integration Smoke Test

## Purpose
Validates that the OpenAI integration foundation (Stories 2.1-2.3) works correctly before building additional features.

## Prerequisites
- OpenAI API key set in `.env` file: `OPENAI_API_KEY=sk-...`
- Stories 2.1, 2.2, 2.3 completed
- Test file exists at `agents/smoke-test/test.md`

## Running the Test

```bash
npm run test:smoke
```

## Expected Output

✅ Pass criteria:
- All 4 test steps complete successfully
- Test completes in < 5 seconds
- Final response from OpenAI contains file content

❌ Fail scenarios:
- OpenAI client initialization fails → Check API key
- Function tools rejected → Review function-tools.ts schema
- Function execution fails → Check file operations implementation
- Performance > 5s → Check API latency / file I/O performance

## What This Test Validates

| Story | Component | Validation |
|-------|-----------|------------|
| 2.1 | OpenAI SDK | Client initializes and connects |
| 2.1 | Function Tools | Schemas accepted by OpenAI API |
| 2.2 | File Reader | read_file executes successfully |
| 2.3 | Path Security | Path validation doesn't block valid reads |

## Regression Testing

Run this test:
- After any changes to `lib/openai/*`
- After any changes to `lib/files/*`
- Before deploying to production
- As part of CI/CD pipeline (future)
```

**Testing:**
```bash
# Run smoke test
npm run test:smoke

# Should see:
# ✅ SMOKE TEST PASSED
# All 4 steps completed
# Performance < 5s
```

**Estimated Effort:** 1 hour

**Notes:**
- This is a **test script**, not production code
- Purpose is risk mitigation, not feature delivery
- Success criteria: All tests pass, ready to proceed to 2.4
- Failure criteria: Fix identified issues before continuing epic

---

### Story 2.4: Agent Discovery & Loading

**Acceptance Criteria:**
1. ✅ Agent loader scans agents folder and discovers all agents (AC-E2-10)
2. ✅ Agent parser extracts metadata from agent.md files (AC-E2-11)
3. ✅ Agent instructions lazy-loaded only when requested (AC-E2-16)
4. ✅ Invalid agents (missing agent.md) are skipped with warning
5. ✅ Agent loading completes in < 500ms for 10 agents
6. ✅ Agents cached in memory after first load

**Implementation Steps:**

1. **Create Agent Parser (`lib/agents/parser.ts`):**
```typescript
import { readFile } from 'fs/promises'
import type { Agent } from '@/types'

export async function parseAgentFile(agentPath: string, agentId: string): Promise<Agent | null> {
  try {
    const agentFilePath = `${agentPath}/agent.md`
    const content = await readFile(agentFilePath, 'utf-8')

    // Simple metadata extraction (could be enhanced with frontmatter parser)
    const nameMatch = content.match(/^#\s+(.+)$/m)
    const descMatch = content.match(/^>\s+(.+)$/m)

    const name = nameMatch ? nameMatch[1].trim() : agentId
    const description = descMatch ? descMatch[1].trim() : 'No description available'

    return {
      id: agentId,
      name,
      description,
      path: agentPath,
      mainFile: agentFilePath,
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`[agent-parser] Skipping ${agentId}: agent.md not found`)
      return null
    }
    throw new Error(`Failed to parse agent ${agentId}: ${error.message}`)
  }
}
```

2. **Create Agent Loader (`lib/agents/loader.ts`):**
```typescript
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { parseAgentFile } from './parser'
import { env } from '@/lib/utils'
import type { Agent } from '@/types'

let cachedAgents: Agent[] | null = null

export async function loadAgents(forceReload: boolean = false): Promise<Agent[]> {
  if (cachedAgents && !forceReload) {
    console.log(`[agent-loader] Returning cached agents (${cachedAgents.length})`)
    return cachedAgents
  }

  const startTime = performance.now()
  const agentsPath = env.AGENTS_PATH
  const agents: Agent[] = []

  try {
    const entries = await readdir(agentsPath)

    for (const entry of entries) {
      const fullPath = join(agentsPath, entry)
      const stats = await stat(fullPath)

      if (stats.isDirectory()) {
        const agent = await parseAgentFile(fullPath, entry)
        if (agent) {
          agents.push(agent)
        }
      }
    }

    cachedAgents = agents
    const duration = performance.now() - startTime
    console.log(`[agent-loader] Loaded ${agents.length} agents in ${duration.toFixed(2)}ms`)

    return agents
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`[agent-loader] Agents folder not found: ${agentsPath}`)
      return []
    }
    throw new Error(`Failed to load agents: ${error.message}`)
  }
}

export async function getAgentById(agentId: string): Promise<Agent | null> {
  const agents = await loadAgents()
  return agents.find(agent => agent.id === agentId) || null
}

// For testing: clear cache
export function clearAgentCache() {
  cachedAgents = null
}
```

3. **Create Sample Agent for Testing:**
```bash
mkdir -p agents/test-agent/workflows
cat > agents/test-agent/agent.md << 'EOF'
# Test Agent

> A test agent for validating the agent loading system

## Instructions

This is a test agent.
EOF

cat > agents/test-agent/workflows/process.md << 'EOF'
# Test Workflow

Step 1: Do something
Step 2: Do something else
EOF
```

**Testing:**
```bash
# Test agent loading
node -e "
const { loadAgents } = require('./lib/agents/loader');
loadAgents().then(agents => {
  console.log('✓ Loaded agents:', agents.length);
  console.log('  Agents:', agents.map(a => a.id).join(', '));
});
"

# Test agent lookup
node -e "
const { getAgentById } = require('./lib/agents/loader');
getAgentById('test-agent').then(agent => {
  if (agent) {
    console.log('✓ Found agent:', agent.name);
    console.log('  Description:', agent.description);
  } else {
    console.log('✗ Agent not found');
  }
});
"

# Test lazy loading (should use cache on second call)
node -e "
const { loadAgents } = require('./lib/agents/loader');
(async () => {
  await loadAgents(); // First call
  await loadAgents(); // Second call (should be cached)
})();
"
```

---

### Story 2.5: Chat API Route with Function Calling Loop

**Acceptance Criteria:**
1. ✅ Chat service executes OpenAI API calls with function tools (AC-E2-03)
2. ✅ Function calling loop handles multiple tool calls iteratively (AC-E2-13)
3. ✅ OpenAI API errors handled gracefully (AC-E2-14)
4. ✅ Chat API route returns correct response format (AC-E2-17)
5. ✅ Invalid agent ID returns 404 (AC-E2-18)
6. ✅ Function execution results sent back to OpenAI as tool messages

**Implementation Steps:**

1. **Create Chat Service (`lib/openai/chat.ts`):**
```typescript
import { getOpenAIClient } from './client'
import { FUNCTION_TOOLS } from './function-tools'
import { readFileContent } from '@/lib/files/reader'
import { writeFileContent } from '@/lib/files/writer'
import { listFiles } from '@/lib/files/lister'
import type { Message, Agent } from '@/types'
import type { ChatCompletionMessageParam, ChatCompletionMessage } from 'openai/resources/chat/completions'

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4'
const MAX_ITERATIONS = 10

interface ChatOptions {
  agent: Agent
  messages: Message[]
}

export async function executeChatCompletion(options: ChatOptions): Promise<Message> {
  const { agent, messages } = options
  const client = getOpenAIClient()

  // Build messages for OpenAI
  const openaiMessages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are ${agent.name}. ${agent.description}\n\nYou have access to files in the ${agent.path} directory. Use the read_file, write_file, and list_files tools to interact with files.`,
    },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })),
  ]

  let iterations = 0
  const functionCalls: any[] = []

  while (iterations < MAX_ITERATIONS) {
    iterations++
    console.log(`[chat] Iteration ${iterations}/${MAX_ITERATIONS}`)

    try {
      const response = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: openaiMessages,
        tools: FUNCTION_TOOLS,
        tool_choice: 'auto',
      })

      const choice = response.choices[0]
      if (!choice) {
        throw new Error('No response from OpenAI')
      }

      const message = choice.message

      // If no tool calls, we're done
      if (!message.tool_calls || message.tool_calls.length === 0) {
        console.log(`[chat] Completed in ${iterations} iterations`)
        return {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message.content || '',
          timestamp: new Date(),
          functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
        }
      }

      // Execute tool calls
      console.log(`[chat] Executing ${message.tool_calls.length} tool calls`)
      openaiMessages.push(message as ChatCompletionMessageParam)

      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        console.log(`[chat] Tool: ${functionName}`, functionArgs)

        let result: any
        let error: string | undefined

        try {
          switch (functionName) {
            case 'read_file':
              result = await readFileContent(functionArgs.path)
              break
            case 'write_file':
              await writeFileContent(functionArgs.path, functionArgs.content)
              result = { success: true, path: functionArgs.path }
              break
            case 'list_files':
              result = await listFiles(functionArgs.path, functionArgs.recursive || false)
              break
            default:
              throw new Error(`Unknown function: ${functionName}`)
          }
        } catch (err: any) {
          error = err.message
          result = null
          console.error(`[chat] Tool error: ${functionName}`, err.message)
        }

        functionCalls.push({
          name: functionName,
          arguments: functionArgs,
          result,
          error,
        })

        // Add tool result to messages
        openaiMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: error || JSON.stringify(result),
        })
      }
    } catch (error: any) {
      console.error('[chat] OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error.message}`)
    }
  }

  throw new Error(`Function calling loop exceeded maximum iterations (${MAX_ITERATIONS})`)
}
```

2. **Update Chat API Route (`app/api/chat/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAgentById } from '@/lib/agents/loader'
import { executeChatCompletion } from '@/lib/openai/chat'
import { getConversation, addMessage } from '@/lib/utils/conversations'
import { handleApiError, ValidationError, NotFoundError } from '@/lib/utils/errors'
import type { ApiResponse, ChatRequest, ChatResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()

    // Validation
    if (!body.agentId || !body.message) {
      throw new ValidationError('Missing required fields: agentId, message')
    }

    // Load agent
    const agent = await getAgentById(body.agentId)
    if (!agent) {
      throw new NotFoundError(`Agent not found: ${body.agentId}`)
    }

    // Get or create conversation
    const conversation = getConversation(body.conversationId, body.agentId)

    // Add user message
    const userMessage = addMessage(conversation.id, {
      role: 'user',
      content: body.message,
    })

    // Execute chat completion
    const assistantMessage = await executeChatCompletion({
      agent,
      messages: conversation.messages,
    })

    // Add assistant message to conversation
    addMessage(conversation.id, assistantMessage)

    // Return response
    const response: ChatResponse = {
      conversationId: conversation.id,
      message: assistantMessage,
    }

    return NextResponse.json<ApiResponse<ChatResponse>>({
      success: true,
      data: response,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Testing:**
```bash
# Test chat with function calling
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test-agent",
    "message": "Please read the agent.md file and tell me about yourself"
  }'

# Should see:
# - read_file tool called
# - Agent description returned
# - Function calls logged in response

# Test invalid agent
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "nonexistent",
    "message": "Hello"
  }'
# Should return 404
```

---

### Story 2.6: Conversation State Management

**Acceptance Criteria:**
1. ✅ Conversations stored in memory with unique IDs (AC-E2-12)
2. ✅ Conversation history maintained across multiple messages
3. ✅ File operation errors captured and logged (AC-E2-15)
4. ✅ Input validation for agentId, message, conversationId (AC-E2-19)
5. ✅ Logging for all operations (AC-E2-20)
6. ✅ Conversation state lost on server restart (documented limitation)

**Implementation Steps:**

1. **Create Conversation Manager (`lib/utils/conversations.ts`):**
```typescript
import type { Conversation, Message } from '@/types'

const conversations = new Map<string, Conversation>()

export function getConversation(
  conversationId: string | undefined,
  agentId: string
): Conversation {
  // If conversationId provided, try to find it
  if (conversationId) {
    const existing = conversations.get(conversationId)
    if (existing) {
      console.log(`[conversation] Retrieved conversation: ${conversationId}`)
      return existing
    } else {
      console.warn(`[conversation] Conversation not found: ${conversationId}, creating new`)
    }
  }

  // Create new conversation
  const newConversation: Conversation = {
    id: crypto.randomUUID(),
    agentId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  conversations.set(newConversation.id, newConversation)
  console.log(`[conversation] Created conversation: ${newConversation.id} for agent: ${agentId}`)

  return newConversation
}

export function addMessage(
  conversationId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Message {
  const conversation = conversations.get(conversationId)
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`)
  }

  const fullMessage: Message = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...message,
  }

  conversation.messages.push(fullMessage)
  conversation.updatedAt = new Date()

  console.log(`[conversation] Added ${message.role} message to ${conversationId} (${conversation.messages.length} total)`)

  return fullMessage
}

export function getConversationHistory(conversationId: string): Message[] {
  const conversation = conversations.get(conversationId)
  return conversation ? conversation.messages : []
}

// For testing: clear all conversations
export function clearAllConversations() {
  conversations.clear()
  console.log('[conversation] Cleared all conversations')
}
```

2. **Add Input Validation Helper (`lib/utils/validation.ts`):**
```typescript
import { ValidationError } from './errors'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const AGENT_ID_REGEX = /^[a-z0-9-]+$/
const MAX_MESSAGE_LENGTH = 10000

export function validateAgentId(agentId: string): void {
  if (!AGENT_ID_REGEX.test(agentId)) {
    throw new ValidationError('Invalid agent ID format (must be lowercase alphanumeric with hyphens)')
  }
}

export function validateMessage(message: string): void {
  if (!message || message.trim().length === 0) {
    throw new ValidationError('Message cannot be empty')
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new ValidationError(`Message exceeds maximum length (${MAX_MESSAGE_LENGTH} characters)`)
  }
}

export function validateConversationId(conversationId: string | undefined): void {
  if (conversationId && !UUID_REGEX.test(conversationId)) {
    throw new ValidationError('Invalid conversation ID format (must be UUID)')
  }
}
```

3. **Update Chat API Route with Validation:**
```typescript
// In app/api/chat/route.ts, add:
import { validateAgentId, validateMessage, validateConversationId } from '@/lib/utils/validation'

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()

    // Validation
    if (!body.agentId) {
      throw new ValidationError('Missing required field: agentId')
    }
    if (!body.message) {
      throw new ValidationError('Missing required field: message')
    }

    validateAgentId(body.agentId)
    validateMessage(body.message)
    validateConversationId(body.conversationId)

    // ... rest of implementation
  }
}
```

4. **Add Comprehensive Logging:**

Create logging utility (`lib/utils/logger.ts`):
```typescript
type LogLevel = 'INFO' | 'ERROR' | 'DEBUG'

export function log(level: LogLevel, operation: string, data: any) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] [${level}] [${operation}]`

  if (level === 'ERROR') {
    console.error(message, data)
  } else if (level === 'DEBUG' && process.env.NODE_ENV === 'development') {
    console.log(message, data)
  } else if (level === 'INFO') {
    console.log(message, data)
  }
}
```

**Testing:**
```bash
# Test multi-turn conversation
CONV_ID=""

# First message
RESPONSE=$(curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test-agent","message":"Hello"}')

CONV_ID=$(echo $RESPONSE | jq -r '.data.conversationId')
echo "Conversation ID: $CONV_ID"

# Second message (should maintain context)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"test-agent\",\"message\":\"What did I just say?\",\"conversationId\":\"$CONV_ID\"}"

# Test input validation
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"INVALID-ID","message":"Test"}'
# Should return 400 validation error

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test-agent","message":""}'
# Should return 400 validation error
```

---

## Testing Strategy

### Unit Tests

**Coverage Target:** 70% for `/lib` modules

**Key Test Files:**
- `lib/files/__tests__/security.test.ts` - Path validation
- `lib/files/__tests__/reader.test.ts` - File reading
- `lib/files/__tests__/writer.test.ts` - File writing
- `lib/agents/__tests__/parser.test.ts` - Agent parsing
- `lib/utils/__tests__/validation.test.ts` - Input validation

**Example Test Setup:**
```bash
npm install -D jest @types/jest ts-jest
npx ts-jest config:init
```

### Integration Tests

**Coverage Target:** 80% for `/app/api/chat`

**Test Scenarios:**
1. Full chat flow with function calling
2. Multi-turn conversation
3. Error handling (invalid agent, API errors, file errors)
4. Input validation edge cases

**Example Integration Test:**
```typescript
// app/api/chat/__tests__/route.test.ts
import { POST } from '../route'

describe('POST /api/chat', () => {
  it('should return chat response with function calls', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent',
        message: 'Read agent.md'
      })
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data.conversationId).toBeDefined()
    expect(data.data.message.functionCalls).toBeDefined()
  })
})
```

### Performance Tests

**Measurements:**
- File read: < 100ms for files under 1MB
- Agent loading: < 500ms for 10 agents
- Chat API: < 2s to first OpenAI call

**Test Script:**
```bash
# Create large test file
dd if=/dev/zero of=agents/test-agent/large.txt bs=1M count=1

# Measure read performance
node -e "
const { performance } = require('perf_hooks');
const { readFileContent } = require('./lib/files/reader');
const start = performance.now();
readFileContent('test-agent/large.txt').then(() => {
  const duration = performance.now() - start;
  console.log(\`Read 1MB in \${duration.toFixed(2)}ms\`);
  if (duration < 100) console.log('✓ PASS');
  else console.log('✗ FAIL: Exceeds 100ms');
});
"
```

### Security Tests

**Attack Vectors:**
```bash
# Directory traversal tests
node scripts/security-tests.js
```

Create `scripts/security-tests.js`:
```javascript
const { validatePath, validateWritePath } = require('./lib/files/security')

const attacks = [
  '../../../etc/passwd',
  '..\\..\\..\\Windows\\System32',
  '/etc/passwd',
  'C:\\Windows\\System32',
  'file\0.txt',
  '.../.../.../',
]

console.log('Running security tests...\n')

for (const attack of attacks) {
  try {
    validatePath(attack, './agents')
    console.log(`✗ FAIL: ${attack} - Not blocked`)
  } catch (error) {
    console.log(`✓ PASS: ${attack} - Blocked`)
  }
}
```

---

## Completion Checklist

Before marking Epic 2 complete:

- [ ] OpenAI SDK installed and client working
- [ ] Function tools defined (read_file, write_file, list_files)
- [ ] File operations implemented and tested
- [ ] Path security prevents directory traversal
- [ ] Agents load from file system
- [ ] Chat API route handles function calling loop
- [ ] Conversation state maintained in memory
- [ ] All 20 acceptance criteria passing
- [ ] Unit test coverage ≥ 70%
- [ ] Integration tests passing
- [ ] Security tests passing (no successful attacks)
- [ ] Performance targets met
- [ ] Error handling comprehensive
- [ ] Logging in place for all operations

---

## Risks and Mitigations

**RISK-01: OpenAI API Compatibility**
- **Mitigation:** Build Story 2.1 first as proof-of-concept

**RISK-02: Rate Limits**
- **Mitigation:** Use gpt-3.5-turbo for testing

**RISK-03: Path Security Vulnerabilities**
- **Mitigation:** Comprehensive security tests in Story 2.3

**RISK-04: File Performance**
- **Mitigation:** Measure in Story 2.2, optimize if needed

---

## Next Steps

**After Epic 2 Completion:**
→ Proceed to Epic 3: Chat Interface

Epic 3 will build on this foundation by:
- Creating React chat components
- Implementing real-time message streaming
- Adding file operation visibility in UI
- Building agent selector interface

---

## Post-Review Follow-ups

**From Story 2.1 Review (2025-10-03):**

**For Story 2.2 (File Operations Implementation):**
- **[Medium]** Add path validation constraints to function tool schemas (`lib/openai/function-tools.ts`) - Add JSON Schema: `pattern: '^[a-zA-Z0-9_./\\-]+$'`, `maxLength: 255`
- **[High]** Implement path security validation in file operation executors (`lib/files/security.ts` per tech spec) - Use `path.resolve()` + prefix checking to block directory traversal (../, absolute paths outside allowed dirs)

**For Story 2.3 (Function Execution Engine):**
- **[Medium]** Add Zod schemas for function call argument validation (`lib/openai/function-tools.ts` or new validation module) - Validate arguments at runtime before executing file operations (Reference: 2025 best practices)

**Epic-Level (Optional):**
- **[Low]** Align OpenAI SDK version with tech spec (Current: `openai@4.104.0`, Tech Spec: `openai@^4.28.0`) - Update tech spec to document actual version OR downgrade to spec version (Impact: None - backward compatible)
- **[Low]** Consider rate limiting for production - Add client-side rate limiting wrapper (Not required for MVP, but recommended for production deployment)
